const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const User = require('../models/User');

// POST /api/conversations - get or create conversation for booking or listing
exports.getOrCreateForBooking = async (req, res) => {
    try {
        const { bookingId, listingId } = req.body || {};
        
        if (!bookingId && !listingId) {
            return res.status(400).json({ status: 'error', message: 'bookingId or listingId is required' });
        }

        const userId = String(req.user._id);
        let ownerId, renterId, listing;

        if (bookingId) {
            // Existing booking-based conversation
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                return res.status(404).json({ status: 'error', message: 'Booking not found' });
            }

            renterId = String(booking.renter);
            ownerId = String(booking.owner);
            listing = booking.listing;

            // Ensure requester is renter or owner on this booking
            if (userId !== renterId && userId !== ownerId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Not authorized to open conversation for this booking',
                });
            }

            // Find existing conversation for this booking
            let convo = await Conversation.findOne({
                booking: booking._id,
                participants: { $all: [booking.renter, booking.owner] },
            });

            if (!convo) {
                convo = await Conversation.create({
                    participants: [booking.renter, booking.owner],
                    listing: booking.listing,
                    booking: booking._id,
                    lastMessageAt: null,
                    lastMessageText: '',
                    unreadCount: new Map(),
                });
            }

            return res.status(201).json({
                status: 'success',
                conversation: {
                    id: convo._id,
                    bookingId: booking._id,
                    listingId: booking.listing,
                    participants: convo.participants,
                },
            });
        } else if (listingId) {
            // New listing-based conversation (Contact Host)
            listing = await Listing.findById(listingId).populate('owner', 'name email');
            if (!listing) {
                return res.status(404).json({ status: 'error', message: 'Listing not found' });
            }

            ownerId = String(listing.owner._id);
            
            // Don't allow owner to message themselves
            if (userId === ownerId) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'You cannot message yourself' 
                });
            }

            // Find existing conversation for this listing between these users
            let convo = await Conversation.findOne({
                listing: listing._id,
                participants: { $all: [userId, ownerId] },
                booking: null, // Only listing-based conversations
            });

            if (!convo) {
                convo = await Conversation.create({
                    participants: [userId, ownerId],
                    listing: listing._id,
                    booking: null,
                    lastMessageAt: null,
                    lastMessageText: '',
                    unreadCount: new Map(),
                });
            }

            return res.status(201).json({
                status: 'success',
                conversation: {
                    id: convo._id,
                    listingId: listing._id,
                    participants: convo.participants,
                },
            });
        }
    } catch (err) {
        console.error('getOrCreateForBooking error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to open conversation' });
    }
};

// GET /api/conversations - Get all conversations for current user
exports.listConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all conversations where user is a participant
        // Use lean() for faster queries and only populate essential fields
        const conversations = await Conversation.find({
            participants: userId,
            archived: { $ne: { [userId]: true } } // Exclude archived conversations
        })
        .populate('participants', 'name email avatar')
        .populate('listing', 'title featuredImage') // Only featuredImage, not all images
        .populate('booking', 'bookingNumber checkIn checkOut')
        .select('-__v') // Exclude version key
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .limit(100)
        .lean(); // Use lean() for read-only queries (much faster)

        // Format conversations with other participant info
        const formattedConversations = conversations.map(convo => {
            const otherParticipant = convo.participants.find(
                p => String(p._id) !== String(userId)
            );
            
            const unreadCount = convo.unreadCount?.get(String(userId)) || 0;

            return {
                id: convo._id,
                otherParticipant: {
                    id: otherParticipant?._id,
                    name: otherParticipant?.name || 'Unknown',
                    email: otherParticipant?.email,
                    avatar: otherParticipant?.avatar,
                },
                listing: convo.listing ? {
                    id: convo.listing._id,
                    title: convo.listing.title,
                    image: convo.listing.featuredImage || 
                           (convo.listing.images && Array.isArray(convo.listing.images) && convo.listing.images[0]?.url) ||
                           null, // Only return image URL, not full data
                } : null,
                booking: convo.booking ? {
                    id: convo.booking._id,
                    bookingNumber: convo.booking.bookingNumber,
                } : null,
                lastMessage: convo.lastMessageText,
                lastMessageAt: convo.lastMessageAt,
                unreadCount,
                createdAt: convo.createdAt,
            };
        });

        return res.json({
            status: 'success',
            count: formattedConversations.length,
            conversations: formattedConversations,
        });
    } catch (err) {
        console.error('listConversations error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to load conversations' });
    }
};

// GET /api/conversations/:id/messages
exports.getMessages = async (req, res) => {
    try {
        const convoId = req.params.id;
        const conversation = await Conversation.findById(convoId)
            .populate('participants', 'name email avatar');
        
        if (!conversation) {
            return res.status(404).json({ status: 'error', message: 'Conversation not found' });
        }

        const userId = String(req.user._id);
        if (!conversation.participants.map(p => String(p._id)).includes(userId)) {
            return res.status(403).json({ status: 'error', message: 'Not a participant in this conversation' });
        }

        // Mark messages as read for this user
        await Message.updateMany(
            { conversation: convoId, receiver: userId, read: false },
            { read: true, readAt: new Date() }
        );

        // Reset unread count for this user
        conversation.unreadCount.set(userId, 0);
        await conversation.save();

        // Use lean() and limit messages for better performance
        const limit = parseInt(req.query.limit) || 100; // Limit to 100 messages by default
        const skip = parseInt(req.query.skip) || 0;

        const messages = await Message.find({ 
            conversation: convoId,
            deleted: { $ne: true },
            deletedFor: { $ne: userId }
        })
        .populate('sender', 'name email avatar')
        .select('-__v') // Exclude version key
        .sort({ createdAt: -1 }) // Get newest first
        .limit(limit)
        .skip(skip)
        .lean(); // Use lean() for faster queries

        // Reverse to show oldest first (chronological order)
        const sortedMessages = messages.reverse();

        return res.json({
            status: 'success',
            count: sortedMessages.length,
            hasMore: sortedMessages.length === limit, // Indicate if there are more messages
            messages: sortedMessages.map(m => ({
                id: m._id,
                message: m.message,
                messageType: m.messageType,
                sender: m.sender ? {
                    id: m.sender._id,
                    name: m.sender.name,
                    email: m.sender.email,
                    avatar: m.sender.avatar,
                } : null,
                receiver: m.receiver,
                createdAt: m.createdAt,
                read: m.read,
                edited: m.edited,
            })),
        });
    } catch (err) {
        console.error('getMessages error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to load messages' });
    }
};

// POST /api/messages - send message in existing conversation
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, message } = req.body || {};
        if (!conversationId || !message) {
            return res.status(400).json({ status: 'error', message: 'conversationId and message are required' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ status: 'error', message: 'Conversation not found' });
        }

        const userId = String(req.user._id);
        const participants = conversation.participants.map(id => String(id));
        if (!participants.includes(userId)) {
            return res.status(403).json({ status: 'error', message: 'Not a participant in this conversation' });
        }

        // Determine receiver: the other participant
        const receiverId = participants.find(id => id !== userId);

        const msg = await Message.create({
            conversation: conversation._id,
            sender: req.user._id,
            receiver: receiverId,
            message: message,
            messageType: 'text',
            delivered: true,
            deliveredAt: new Date(),
        });

        conversation.lastMessage = msg._id;
        conversation.lastMessageAt = msg.createdAt;
        conversation.lastMessageText = msg.message;
        // increment unread count for receiver
        const currentUnread = conversation.unreadCount.get(receiverId) || 0;
        conversation.unreadCount.set(receiverId, currentUnread + 1);
        await conversation.save();

        return res.status(201).json({
            status: 'success',
            message: {
                id: msg._id,
                conversation: msg.conversation,
                sender: msg.sender,
                receiver: msg.receiver,
                message: msg.message,
                createdAt: msg.createdAt,
            },
        });
    } catch (err) {
        console.error('sendMessage error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to send message' });
    }
};


