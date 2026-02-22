// Seed realistic renter data (users, listings, bookings, payments, reviews, messages)
// Run: NODE_ENV=development node scripts/seed-renter-data.js
// or:  npm run seed:renter
//
// Safety:
// - Refuses to run when NODE_ENV === 'production'
// - Only touches seed-specific users (by email) and their related docs

require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
    console.error('❌ Refusing to run renter seed in production (NODE_ENV=production).');
    process.exit(1);
}

// Seed identities (emails are used as stable keys)
const OWNER_EMAILS = [
    'seed.owner1@myrental.test',
    'seed.owner2@myrental.test',
    'seed.owner3@myrental.test',
];

const RENTER_EMAILS = [
    'seed.renter1@myrental.test',
    'seed.renter2@myrental.test',
    'seed.renter3@myrental.test',
    'seed.renter4@myrental.test',
    'seed.renter5@myrental.test',
    'seed.renter6@myrental.test',
];

async function upsertUser(userData) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
        // Update non-auth fields only; do not overwrite password hash if present
        Object.assign(existing, {
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            activeRole: userData.activeRole,
            accountType: userData.accountType,
            location: userData.location,
            verified: userData.verified,
            verificationStatus: userData.verificationStatus,
            bio: userData.bio,
            preferences: userData.preferences,
            stats: userData.stats,
            settings: userData.settings,
            subscription: userData.subscription,
        });
        // Only set password if they never logged in / password is missing
        if (!existing.password && userData.password) {
            existing.password = userData.password;
        }
        await existing.save();
        return existing;
    }
    // Create new user (password will be hashed by pre-save hook)
    const created = await User.create(userData);
    return created;
}

async function main() {
    try {
        await connectDB();
        console.log('🔗 Connected to MongoDB');

        console.log('\n🌱 Starting renter data seeding...\n');

        // Clean previous seed data for these renters/owners and their related docs
        console.log('🧹 Cleaning previous renter seed data...');
        const seedUsers = await User.find({
            email: { $in: [...OWNER_EMAILS, ...RENTER_EMAILS] },
        });
        const seedUserIds = seedUsers.map(u => u._id);

        if (seedUserIds.length) {
            const listings = await Listing.find({ owner: { $in: seedUserIds } }, { _id: 1 });
            const listingIds = listings.map(l => l._id);

            const bookings = await Booking.find({
                $or: [{ renter: { $in: seedUserIds } }, { owner: { $in: seedUserIds } }],
            }, { _id: 1 });
            const bookingIds = bookings.map(b => b._id);

            // Remove dependent documents
            await Promise.all([
                Review.deleteMany({
                    $or: [
                        { reviewer: { $in: seedUserIds } },
                        { reviewee: { $in: seedUserIds } },
                    ],
                }),
                Payment.deleteMany({
                    $or: [{ user: { $in: seedUserIds } }, { booking: { $in: bookingIds } }],
                }),
                Conversation.deleteMany({
                    participants: { $in: seedUserIds },
                }),
                Message.deleteMany({
                    $or: [{ sender: { $in: seedUserIds } }, { receiver: { $in: seedUserIds } }],
                }),
                Booking.deleteMany({
                    _id: { $in: bookingIds },
                }),
                Listing.deleteMany({
                    _id: { $in: listingIds },
                }),
            ]);
        }

        await User.deleteMany({ email: { $in: [...OWNER_EMAILS, ...RENTER_EMAILS] } });
        console.log('✅ Previous seed data removed (where present)\n');

        // --- Create owners (hosts) ---
        console.log('👤 Seeding owners (hosts)...');
        const ownerDefs = [
            {
                name: 'Host – DHA Apartments',
                email: OWNER_EMAILS[0],
                phone: '+923001110001',
                password: 'SeedPass123!',
                role: 'owner',
                activeRole: 'owner',
                accountType: 'paid',
                bio: 'Specialized in premium apartments in DHA and Gulberg.',
                location: {
                    address: 'DHA Phase 5',
                    city: 'Lahore',
                    province: 'Punjab',
                    coordinates: { lat: 31.4700, lng: 74.4100 },
                },
                verified: true,
                verificationStatus: {
                    email: true,
                    phone: true,
                    id: true,
                    biometric: true,
                    face: true,
                },
                subscription: {
                    status: 'active',
                    plan: 'monthly_pkr',
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2025-12-31'),
                    paymentMethod: 'card',
                    transactionId: 'SUBS-OWNER1-2025',
                    autoRenew: true,
                },
            },
            {
                name: 'Host – Islamabad Villas',
                email: OWNER_EMAILS[1],
                phone: '+923001110002',
                password: 'SeedPass123!',
                role: 'owner',
                activeRole: 'owner',
                accountType: 'paid',
                bio: 'Modern villas and family-friendly homes in Islamabad.',
                location: {
                    address: 'F-7',
                    city: 'Islamabad',
                    province: 'Islamabad Capital Territory',
                    coordinates: { lat: 33.7200, lng: 73.0600 },
                },
                verified: true,
                verificationStatus: {
                    email: true,
                    phone: true,
                    id: true,
                    biometric: false,
                    face: true,
                },
                subscription: {
                    status: 'active',
                    plan: 'monthly_pkr',
                    startDate: new Date('2025-02-01'),
                    endDate: new Date('2025-08-01'),
                    paymentMethod: 'jazzcash',
                    transactionId: 'SUBS-OWNER2-2025',
                    autoRenew: true,
                },
            },
            {
                name: 'Host – Karachi Penthouses',
                email: OWNER_EMAILS[2],
                phone: '+923001110003',
                password: 'SeedPass123!',
                role: 'owner',
                activeRole: 'owner',
                accountType: 'free',
                bio: 'Luxury penthouses and sea-view apartments in Clifton.',
                location: {
                    address: 'Clifton Block 5',
                    city: 'Karachi',
                    province: 'Sindh',
                    coordinates: { lat: 24.8138, lng: 67.0289 },
                },
                verified: true,
                verificationStatus: {
                    email: true,
                    phone: true,
                    id: true,
                    biometric: false,
                    face: false,
                },
            },
        ];

        const owners = [];
        for (const def of ownerDefs) {
            const u = await upsertUser(def);
            owners.push(u);
        }
        console.log(`✅ Created/updated ${owners.length} owners\n`);

        // --- Create renters ---
        console.log('👥 Seeding renters...');
        const renterDefs = [
            {
                name: 'Renter – Business Traveler',
                email: RENTER_EMAILS[0],
                phone: '+923002220001',
                password: 'SeedPass123!',
                role: 'renter',
                activeRole: 'renter',
                accountType: 'free',
                bio: 'Frequent business traveler between Lahore and Islamabad.',
                location: {
                    address: 'Gulberg III',
                    city: 'Lahore',
                    province: 'Punjab',
                    coordinates: { lat: 31.5204, lng: 74.3587 },
                },
                verified: true,
                verificationStatus: { email: true, phone: true, id: false, biometric: false, face: false },
            },
            {
                name: 'Renter – Family Getaways',
                email: RENTER_EMAILS[1],
                phone: '+923002220002',
                password: 'SeedPass123!',
                role: 'renter',
                activeRole: 'renter',
                accountType: 'paid',
                bio: 'Books family trips and weekend getaways across Pakistan.',
                location: {
                    address: 'Bahria Town',
                    city: 'Rawalpindi',
                    province: 'Punjab',
                    coordinates: { lat: 33.5651, lng: 73.0169 },
                },
                verified: true,
                verificationStatus: { email: true, phone: true, id: true, biometric: true, face: true },
                subscription: {
                    status: 'active',
                    plan: 'monthly_pkr',
                    startDate: new Date('2025-01-10'),
                    endDate: new Date('2025-07-10'),
                    paymentMethod: 'card',
                    transactionId: 'SUBS-RENTER2-2025',
                    autoRenew: true,
                },
            },
            {
                name: 'Renter – Student',
                email: RENTER_EMAILS[2],
                phone: '+923002220003',
                password: 'SeedPass123!',
                role: 'renter',
                activeRole: 'renter',
                accountType: 'free',
                bio: 'Student renting rooms and equipment for projects.',
                location: {
                    address: 'Johar Town',
                    city: 'Lahore',
                    province: 'Punjab',
                    coordinates: { lat: 31.4674, lng: 74.2728 },
                },
                verified: false,
                verificationStatus: { email: true, phone: false, id: false, biometric: false, face: false },
            },
            {
                name: 'Renter – Overseas Pakistani',
                email: RENTER_EMAILS[3],
                phone: '+923002220004',
                password: 'SeedPass123!',
                role: 'renter',
                activeRole: 'renter',
                accountType: 'paid',
                bio: 'Visits Pakistan twice a year, prefers verified hosts.',
                location: {
                    address: 'Phase 8',
                    city: 'DHA Karachi',
                    province: 'Sindh',
                    coordinates: { lat: 24.8122, lng: 67.0670 },
                },
                verified: true,
                verificationStatus: { email: true, phone: true, id: true, biometric: false, face: true },
            },
            {
                name: 'Renter – Event Planner',
                email: RENTER_EMAILS[4],
                phone: '+923002220005',
                password: 'SeedPass123!',
                role: 'renter',
                activeRole: 'renter',
                accountType: 'paid',
                bio: 'Books farmhouses and event spaces for clients.',
                location: {
                    address: 'Cantt',
                    city: 'Lahore',
                    province: 'Punjab',
                    coordinates: { lat: 31.5100, lng: 74.3900 },
                },
                verified: true,
                verificationStatus: { email: true, phone: true, id: true, biometric: true, face: true },
            },
            {
                name: 'Renter – Budget Traveler',
                email: RENTER_EMAILS[5],
                phone: '+923002220006',
                password: 'SeedPass123!',
                role: 'renter',
                activeRole: 'renter',
                accountType: 'free',
                bio: 'Backpacker exploring Pakistan on a budget.',
                location: {
                    address: 'University Road',
                    city: 'Peshawar',
                    province: 'Khyber Pakhtunkhwa',
                    coordinates: { lat: 34.0151, lng: 71.5805 },
                },
                verified: false,
                verificationStatus: { email: true, phone: false, id: false, biometric: false, face: false },
            },
        ];

        const renters = [];
        for (const def of renterDefs) {
            const u = await upsertUser(def);
            renters.push(u);
        }
        console.log(`✅ Created/updated ${renters.length} renters\n`);

        // --- Create sample listings for owners ---
        console.log('🏠 Seeding listings for owners...');
        const listingDefs = [
            {
                owner: owners[0],
                title: 'Luxury 3-Bedroom Apartment in DHA Lahore',
                description:
                    'Spacious 3-bedroom luxury apartment in DHA Phase 5, ideal for business travelers and families. Fully furnished, high-speed Wi-Fi, secure parking, and 24/7 security.',
                category: 'property',
                subCategory: 'apartments',
                location: {
                    address: 'Sector C, DHA Phase 5',
                    city: 'Lahore',
                    province: 'Punjab',
                    postalCode: '54000',
                    coordinates: { lat: 31.4705, lng: 74.4080 },
                    area: 'DHA Phase 5',
                    landmark: 'Near Main Boulevard',
                },
                pricing: { model: 'daily', amount: 25000, currency: 'PKR', deposit: 50000, negotiable: false },
                availability: {
                    instantBooking: true,
                    advanceNotice: 12,
                    minDuration: 1,
                    maxDuration: 14,
                },
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                        caption: 'Living room',
                    },
                ],
                status: 'active',
                verified: true,
                featured: true,
            },
            {
                owner: owners[1],
                title: 'Modern Villa with Pool in Islamabad',
                description:
                    'Beautiful 4-bedroom villa in F-7, Islamabad with private pool and garden. Perfect for family vacations and executive retreats.',
                category: 'property',
                subCategory: 'houses-villas',
                location: {
                    address: 'Street 12, F-7',
                    city: 'Islamabad',
                    province: 'Islamabad Capital Territory',
                    postalCode: '44000',
                    coordinates: { lat: 33.7280, lng: 73.0605 },
                    area: 'F-7',
                    landmark: 'Near Jinnah Super Market',
                },
                pricing: { model: 'daily', amount: 50000, currency: 'PKR', deposit: 100000, negotiable: true },
                availability: {
                    instantBooking: false,
                    advanceNotice: 24,
                    minDuration: 2,
                    maxDuration: 10,
                },
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1560448075-cbc16bb4af90?w=800',
                        caption: 'Villa exterior',
                    },
                ],
                status: 'active',
                verified: true,
                featured: true,
            },
            {
                owner: owners[2],
                title: 'Sea View Penthouse in Clifton Karachi',
                description:
                    'Stunning penthouse with panoramic sea views, large terrace, and modern interiors. Ideal for long weekends and special occasions.',
                category: 'property',
                subCategory: 'apartments',
                location: {
                    address: 'Clifton Block 5',
                    city: 'Karachi',
                    province: 'Sindh',
                    postalCode: '75600',
                    coordinates: { lat: 24.8135, lng: 67.0310 },
                    area: 'Clifton',
                    landmark: 'Near Dolmen Mall Clifton',
                },
                pricing: { model: 'daily', amount: 75000, currency: 'PKR', deposit: 150000, negotiable: true },
                availability: {
                    instantBooking: true,
                    advanceNotice: 24,
                    minDuration: 1,
                    maxDuration: 7,
                },
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800',
                        caption: 'Penthouse terrace',
                    },
                ],
                status: 'active',
                verified: true,
                featured: false,
            },
        ];

        const listings = [];
        for (const def of listingDefs) {
            const listing = await Listing.create({
                title: def.title,
                description: def.description,
                category: def.category,
                subCategory: def.subCategory,
                owner: def.owner._id,
                location: def.location,
                pricing: def.pricing,
                availability: def.availability,
                images: def.images,
                status: def.status,
                verified: def.verified,
                featured: def.featured,
            });
            listings.push(listing);
        }
        console.log(`✅ Created ${listings.length} listings\n`);

        // --- Create bookings, payments, reviews, conversations/messages ---
        console.log('📅 Seeding bookings, payments, reviews, and messages...');

        const now = new Date();
        const daysAgo = d => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
        const daysFromNow = d => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

        const bookingDefs = [
            // Renter 1 – dummy renter with one completed booking (no review yet) and one upcoming
            {
                renter: renters[0],
                listing: listings[0],
                owner: owners[0],
                status: 'completed',
                bookingType: 'instant',
                checkIn: daysAgo(30),
                checkOut: daysAgo(27),
                guests: 2,
                paymentMethod: 'jazzcash',
                baseRate: 25000,
                nights: 3,
                serviceFee: 3750,
                deposit: 50000,
                hasReview: false, // allow manual testing of review flow
            },
            {
                renter: renters[0],
                listing: listings[1],
                owner: owners[1],
                status: 'confirmed',
                bookingType: 'request',
                checkIn: daysFromNow(10),
                checkOut: daysFromNow(13),
                guests: 3,
                paymentMethod: 'card',
                baseRate: 50000,
                nights: 3,
                serviceFee: 6000,
                deposit: 100000,
                hasReview: false,
            },
            // Renter 2 – two completed with reviews
            {
                renter: renters[1],
                listing: listings[0],
                owner: owners[0],
                status: 'completed',
                bookingType: 'instant',
                checkIn: daysAgo(15),
                checkOut: daysAgo(12),
                guests: 4,
                paymentMethod: 'easypaisa',
                baseRate: 25000,
                nights: 3,
                serviceFee: 4500,
                deposit: 50000,
                hasReview: true,
            },
            {
                renter: renters[1],
                listing: listings[2],
                owner: owners[2],
                status: 'completed',
                bookingType: 'request',
                checkIn: daysAgo(60),
                checkOut: daysAgo(56),
                guests: 2,
                paymentMethod: 'card',
                baseRate: 75000,
                nights: 4,
                serviceFee: 9000,
                deposit: 150000,
                hasReview: true,
            },
            // Renter 3 – cancelled booking
            {
                renter: renters[2],
                listing: listings[0],
                owner: owners[0],
                status: 'cancelled',
                bookingType: 'instant',
                checkIn: daysAgo(5),
                checkOut: daysAgo(2),
                guests: 1,
                paymentMethod: 'jazzcash',
                baseRate: 25000,
                nights: 3,
                serviceFee: 3000,
                deposit: 50000,
                hasReview: false,
                cancellation: {
                    cancelledBy: 'renter',
                    cancelledAt: daysAgo(6),
                    reason: 'Change of plans',
                    refundAmount: 60000,
                    refundStatus: 'processed',
                },
            },
            // Renter 4 – upcoming long stay
            {
                renter: renters[3],
                listing: listings[2],
                owner: owners[2],
                status: 'confirmed',
                bookingType: 'instant',
                checkIn: daysFromNow(20),
                checkOut: daysFromNow(27),
                guests: 2,
                paymentMethod: 'card',
                baseRate: 75000,
                nights: 7,
                serviceFee: 12000,
                deposit: 150000,
                hasReview: false,
            },
        ];

        const createdBookings = [];
        const createdPayments = [];
        const createdReviews = [];
        const createdConversations = [];
        const createdMessages = [];

        // Start counters from current counts to keep IDs unique
        let bookingCounter = await Booking.countDocuments();
        let paymentCounter = await Payment.countDocuments();

        for (const def of bookingDefs) {
            const subtotal = def.baseRate * def.nights;
            const total = subtotal + def.serviceFee + def.deposit;

            const booking = await Booking.create({
                bookingNumber: `MRSEED${String(++bookingCounter).padStart(4, '0')}`,
                renter: def.renter._id,
                owner: def.owner._id,
                listing: def.listing._id,
                checkIn: def.checkIn,
                checkOut: def.checkOut,
                duration: def.nights,
                durationUnit: 'days',
                guests: def.guests,
                pricing: {
                    model: 'days',
                    rate: def.baseRate,
                    subtotal,
                    serviceFee: def.serviceFee,
                    deposit: def.deposit,
                    total,
                    currency: 'PKR',
                },
                status: def.status,
                bookingType: def.bookingType,
                payment: {
                    status: ['completed', 'confirmed'].includes(def.status) ? 'paid' : 'pending',
                    method: def.paymentMethod,
                    paidAt: ['completed', 'confirmed'].includes(def.status) ? def.checkIn : null,
                    paidAmount: ['completed', 'confirmed'].includes(def.status) ? total - def.deposit : 0,
                },
                contactInfo: {
                    phone: def.renter.phone,
                    email: def.renter.email,
                },
                cancellation: def.cancellation || undefined,
                confirmedAt: ['confirmed', 'completed'].includes(def.status) ? def.checkIn : null,
                completedAt: def.status === 'completed' ? def.checkOut : null,
            });
            createdBookings.push(booking);

            const payment = await Payment.create({
                paymentId: `PAYSEED${String(++paymentCounter).padStart(6, '0')}`,
                user: def.renter._id,
                booking: booking._id,
                type: 'booking',
                amount: total - def.deposit,
                currency: 'PKR',
                method: def.paymentMethod,
                paymentDetails: {
                    accountNumber: '****-****-****',
                    transactionId: `TXN-${booking.bookingNumber}`,
                    referenceNumber: `REF-${booking.bookingNumber}`,
                    cardLast4: '4242',
                },
                status: ['completed', 'confirmed'].includes(def.status) ? 'completed' : 'pending',
                gatewayResponse: {
                    success: true,
                    message: 'Payment processed (seed data)',
                    transactionId: `GW-${booking.bookingNumber}`,
                },
                completedAt: ['completed', 'confirmed'].includes(def.status) ? def.checkIn : null,
            });
            createdPayments.push(payment);

            // Optional review for completed bookings
            if (def.hasReview && def.status === 'completed') {
                const review = await Review.create({
                    reviewer: def.renter._id,
                    reviewee: def.owner._id,
                    listing: def.listing._id,
                    booking: booking._id,
                    reviewType: 'renter_to_owner',
                    rating: 5,
                    category: 'property',
                    categoryRatings: {
                        cleanliness: 5,
                        communication: 5,
                        value: 4,
                        accuracy: 5,
                        checkIn: 5,
                        location: 4,
                    },
                    comment: 'Amazing stay! Very clean, great host, and smooth check-in.',
                    pros: ['Clean apartment', 'Responsive host', 'Great location'],
                    cons: ['Minor traffic noise in the evening'],
                    status: 'approved',
                });
                createdReviews.push(review);

                // Attach review reference back to booking
                booking.renterReview = review._id;
                await booking.save();
            }

            // Conversation & messages (only for some bookings)
            if (['confirmed', 'completed'].includes(def.status)) {
                const conversation = await Conversation.create({
                    participants: [def.renter._id, def.owner._id],
                    listing: def.listing._id,
                    booking: booking._id,
                    lastMessageAt: def.checkIn,
                    lastMessageText: 'Looking forward to your stay!',
                    unreadCount: new Map([
                        [def.renter._id.toString(), 0],
                        [def.owner._id.toString(), 0],
                    ]),
                });
                createdConversations.push(conversation);

                const msg1 = await Message.create({
                    conversation: conversation._id,
                    sender: def.renter._id,
                    receiver: def.owner._id,
                    message: 'Hi! Just confirming our booking and check-in time.',
                    messageType: 'text',
                    delivered: true,
                    deliveredAt: daysAgo(2),
                    read: true,
                    readAt: daysAgo(2),
                });
                const msg2 = await Message.create({
                    conversation: conversation._id,
                    sender: def.owner._id,
                    receiver: def.renter._id,
                    message: 'Welcome! Check-in is after 2 PM. Let me know if you need airport pickup.',
                    messageType: 'text',
                    delivered: true,
                    deliveredAt: daysAgo(2),
                    read: true,
                    readAt: daysAgo(1),
                });
                createdMessages.push(msg1, msg2);

                conversation.lastMessage = msg2._id;
                conversation.lastMessageAt = msg2.createdAt;
                await conversation.save();
            }
        }

        console.log(`✅ Created ${createdBookings.length} bookings`);
        console.log(`✅ Created ${createdPayments.length} payments`);
        console.log(`✅ Created ${createdReviews.length} reviews`);
        console.log(`✅ Created ${createdConversations.length} conversations with ${createdMessages.length} messages\n`);

        console.log('🎉 Renter seed data ready for QA and development.');
        console.log('   - Renter emails: ', RENTER_EMAILS.join(', '));
        console.log('   - Default password: SeedPass123!');

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Renter seeding failed:', err);
        await mongoose.connection.close();
        process.exit(1);
    }
}

main();


