// Messages Page Functionality
// Chat interface and messaging system

(function() {
    'use strict';

    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';

    let conversations = [];
    let currentConversationId = null;
    let messages = {};

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initMessages();
        console.log('✅ Messages page initialized');
    });

    // Initialize messages page
    async function initMessages() {
        // Check authentication first
        const token = localStorage.getItem('mr-token');
        if (!token) {
            console.log('No authentication token, redirecting to login');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        // Get current user
        const currentUser = window.getCurrentUser?.();
        if (!currentUser) {
            // Try to get user from token
            try {
                const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success' && data.user) {
                        window.currentUserId = data.user.id || data.user._id;
                        if (window.setCurrentUser) {
                            window.setCurrentUser(data.user);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        }

        const currentUserId = currentUser?.id || currentUser?._id || window.currentUserId;
        window.currentUserId = currentUserId;
        
        if (window.initRealtimeService && currentUserId) {
            window.initRealtimeService(currentUserId);
        }

        // Get conversation ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const conversationId = urlParams.get('conversationId');

        // Load real conversations from API
        await loadConversations();

        // Open conversation if ID provided (after conversations are loaded)
        if (conversationId) {
            // Small delay to ensure conversations array is populated
            setTimeout(() => {
                openConversation(conversationId);
            }, 100);
        }

        // Setup typing detection
        setupTypingDetection();

        // Refresh conversations every 10 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadConversations();
            }
        }, 10000);
    }

    // Load conversations from API
    async function loadConversations() {
        const token = localStorage.getItem('mr-token');
        if (!token) {
            console.error('No authentication token');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/conversations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                console.error('Error loading conversations:', data);
                displayConversations([]);
                return;
            }

            // Format conversations for display (normalize IDs to strings)
            conversations = data.conversations.map(conv => ({
                id: String(conv.id || conv._id),
                userId: String(conv.otherParticipant?.id || conv.otherParticipant?._id || ''),
                userName: conv.otherParticipant?.name || 'Unknown User',
                userAvatar: conv.otherParticipant?.avatar || null,
                lastMessage: conv.lastMessage || conv.lastMessageText || 'No messages yet',
                lastMessageTime: formatMessageTime(conv.lastMessageAt || conv.createdAt),
                unreadCount: conv.unreadCount || 0,
                online: false, // Will be updated by real-time service
                listingId: conv.listing?.id ? String(conv.listing.id) : null,
                listingTitle: conv.listing?.title || 'Listing',
                listingImage: conv.listing?.image,
                bookingId: conv.booking?.id ? String(conv.booking.id) : null,
                bookingNumber: conv.booking?.bookingNumber,
            }));

            displayConversations(conversations);
        } catch (error) {
            console.error('Error loading conversations:', error);
            displayConversations([]);
        }
    }

    // Display conversations
    function displayConversations(conversationsList) {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        if (conversationsList.length === 0) {
            container.innerHTML = `
                <div class="empty-conversations">
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = conversationsList.map(conv => {
            const convId = String(conv.id);
            const isActive = String(currentConversationId) === convId;
            return `
            <div class="conversation-item ${isActive ? 'active' : ''}" 
                 onclick="window.openConversation && window.openConversation('${convId}')" 
                 data-conversation-id="${convId}"
                 data-user-id="${conv.userId || ''}">
                <div class="conversation-avatar" style="position: relative;">
                    ${conv.userAvatar ? `<img src="${conv.userAvatar}" alt="${conv.userName || 'User'}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                    <i class="bi bi-person-fill" style="${conv.userAvatar ? 'display: none;' : ''}"></i>
                    <span class="realtime-online-indicator ${conv.online ? 'online' : 'offline'}"></span>
                </div>
                <div class="conversation-content">
                    <div class="conversation-header">
                        <span class="conversation-name">${conv.userName || 'Unknown User'}</span>
                        <span class="conversation-time">${conv.lastMessageTime || ''}</span>
                    </div>
                    <div class="conversation-preview">${conv.lastMessage || 'No messages yet'}</div>
                </div>
                ${conv.unreadCount > 0 ? `<div class="conversation-badge">${conv.unreadCount}</div>` : ''}
            </div>
        `;
        }).join('');
    }

    // Open conversation
    window.openConversation = async function(conversationId) {
        if (!conversationId) {
            console.error('No conversation ID provided');
            return;
        }

        // Normalize conversation ID to string
        const convIdStr = String(conversationId);

        // Stop previous polling
        stopMessagePolling();

        currentConversationId = convIdStr;
        window.currentConversationId = convIdStr; // For real-time service

        // Find conversation in array (try both string and number comparison)
        let conversation = conversations.find(c => String(c.id) === convIdStr);
        
        // If conversation not found, reload conversations list
        if (!conversation) {
            console.log('Conversation not found in list, reloading conversations...');
            await loadConversations();
            conversation = conversations.find(c => String(c.id) === convIdStr);
        }

        // Update active conversation in sidebar if present
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-conversation-id="${convIdStr}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Update chat header
        const chatHeader = document.getElementById('chatHeader');
        if (chatHeader) {
            if (conversation) {
                chatHeader.innerHTML = `
                    <div class="chat-header-content">
                        <div class="chat-user-info" data-user-id="${conversation.userId}">
                            <div class="chat-user-avatar" style="position: relative;">
                                ${conversation.userAvatar ? `<img src="${conversation.userAvatar}" alt="${conversation.userName}">` : `<i class="bi bi-person-fill"></i>`}
                                <span class="realtime-online-indicator ${conversation.online ? 'online' : 'offline'}"></span>
                            </div>
                            <div>
                                <h3 class="chat-user-name">${conversation.userName}</h3>
                                <p class="chat-user-status realtime-status-text">
                                    ${conversation.online ? '<span class="status-online">●</span> Online' : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Fallback header when opened directly from profile
                chatHeader.innerHTML = `
                    <div class="chat-header-content">
                        <div class="chat-user-info">
                            <div class="chat-user-avatar">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <div>
                                <h3 class="chat-user-name">Host</h3>
                                <p class="chat-user-status realtime-status-text">Conversation</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        // Show chat input
        const chatInputArea = document.getElementById('chatInputArea');
        if (chatInputArea) {
            chatInputArea.style.display = 'block';
            // Force reflow to ensure layout updates
            chatInputArea.offsetHeight;
        }

        // Load messages from API
        loadMessages(convIdStr).then(() => {
            // Scroll to bottom after loading messages
            setTimeout(() => {
                scrollToBottom(true);
            }, 100);
        });
    };

    // Load messages from backend
    async function loadMessages(conversationId, preserveScroll = false) {
        if (!conversationId) {
            console.error('loadMessages: No conversation ID provided');
            return;
        }

        const token = localStorage.getItem('mr-token');
        if (!token) {
            console.error('loadMessages: No authentication token');
            return;
        }

        // Normalize conversation ID
        const convIdStr = String(conversationId);

        // Store scroll position before loading
        const container = document.getElementById('chatMessages');
        const scrollPosition = container ? container.scrollTop : 0;
        const wasAtBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 50) : false;

        try {
            const response = await fetch(`${API_BASE_URL}/conversations/${convIdStr}/messages`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success' || !Array.isArray(data.messages)) {
                console.error('Error loading messages:', data);
                return;
            }

            // Get current user ID
            const currentUserId = window.getCurrentUser?.()?.id || window.currentUserId;
            const currentUserIdStr = String(currentUserId);

            // Only update if we have new messages or this is the first load
            const newMessages = data.messages.map(msg => {
                const senderIdStr = String(msg.sender?.id || msg.sender);
                const isSent = senderIdStr === currentUserIdStr;

                return {
                    id: msg.id,
                    senderId: senderIdStr,
                    senderName: isSent ? 'You' : (msg.sender?.name || 'Host'),
                    senderAvatar: msg.sender?.avatar || null,
                    text: msg.message,
                    time: msg.createdAt,
                    sent: isSent,
                    edited: msg.edited || false,
                };
            });

            // Check if messages actually changed
            const existingMessages = messages[convIdStr] || [];
            const messagesChanged = existingMessages.length !== newMessages.length || 
                existingMessages.some((msg, idx) => String(msg.id) !== String(newMessages[idx]?.id));

            if (messagesChanged || !messages[convIdStr]) {
                messages[convIdStr] = newMessages;
                displayMessages(messages[convIdStr], wasAtBottom);
            }
            
            // Start polling for new messages
            startMessagePolling(convIdStr);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    // Polling for new messages (real-time alternative)
    let pollingInterval = null;
    let lastMessageCount = {};
    
    function startMessagePolling(conversationId) {
        // Clear existing polling
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }

        // Normalize conversation ID
        const convIdStr = String(conversationId);

        // Store initial message count
        lastMessageCount[convIdStr] = (messages[convIdStr] || []).length;

        // Poll every 3 seconds for new messages
        pollingInterval = setInterval(async () => {
            if (String(currentConversationId) === convIdStr && document.visibilityState === 'visible') {
                const currentCount = (messages[convIdStr] || []).length;
                const wasAtBottom = checkIfAtBottom();
                
                await loadMessages(convIdStr, true);
                
                // Only scroll if new messages were added and user was at bottom
                const newCount = (messages[convIdStr] || []).length;
                if (newCount > currentCount && wasAtBottom) {
                    const container = document.getElementById('chatMessages');
                    if (container) {
                        requestAnimationFrame(() => {
                            container.scrollTo({
                                top: container.scrollHeight,
                                behavior: 'smooth'
                            });
                        });
                    }
                }
            }
        }, 3000);
    }

    // Check if user is at bottom of chat
    function checkIfAtBottom() {
        const container = document.getElementById('chatMessages');
        if (!container) return true;
        const threshold = 100;
        return (container.scrollHeight - container.scrollTop - container.clientHeight) < threshold;
    }

    function stopMessagePolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }

    // Display messages
    function displayMessages(messagesList, scrollToBottom = true) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        if (!messagesList || messagesList.length === 0) {
            container.innerHTML = `
                <div class="empty-chat">
                    <div class="empty-chat-icon">
                        <i class="bi bi-chat-left-dots"></i>
                    </div>
                    <h3 class="empty-chat-title">No messages yet</h3>
                    <p class="empty-chat-description">Start the conversation by sending a message</p>
                </div>
            `;
            return;
        }

        // Group messages by date and sender for better display
        const groupedMessages = groupMessagesByDate(messagesList);

        container.innerHTML = groupedMessages.map((group, groupIndex) => {
            if (group.type === 'date') {
                return `<div class="message-date-divider"><span>${group.date}</span></div>`;
            }
            
            const msg = group;
            // Find previous message in original list
            const msgIndex = messagesList.indexOf(msg);
            const prevMsg = msgIndex > 0 ? messagesList[msgIndex - 1] : null;
            const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId || 
                (new Date(msg.time) - new Date(prevMsg.time)) > 5 * 60 * 1000; // 5 minutes

            return `
                <div class="message ${msg.sent ? 'sent' : 'received'}" data-message-id="${msg.id}">
                    ${showAvatar ? `
                        <div class="message-avatar">
                            ${msg.senderAvatar ? `<img src="${msg.senderAvatar}" alt="${msg.senderName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <i class="bi bi-person-fill" style="display: none;"></i>` : `<i class="bi bi-person-fill"></i>`}
                        </div>
                    ` : '<div class="message-avatar-spacer"></div>'}
                    <div class="message-content">
                        ${showAvatar && !msg.sent ? `<div class="message-sender-name">${msg.senderName}</div>` : ''}
                        <div class="message-bubble">
                            ${escapeHtml(msg.text)}
                            ${msg.edited ? '<span class="message-edited-indicator" title="Edited"><i class="bi bi-pencil"></i></span>' : ''}
                        </div>
                        <div class="message-time">${formatMessageTime(msg.time)}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Force layout recalculation
        if (container) {
            container.offsetHeight; // Trigger reflow
        }

        // Smooth scroll to bottom if needed
        if (scrollToBottom && container) {
            // Multiple scroll attempts to ensure it works
            const scrollToBottomNow = () => {
                if (container) {
                    const maxScroll = container.scrollHeight - container.clientHeight;
                    container.scrollTop = maxScroll > 0 ? maxScroll : container.scrollHeight;
                }
            };
            
            // Immediate scroll
            scrollToBottomNow();
            
            // Scroll after DOM update
            setTimeout(scrollToBottomNow, 0);
            
            // Scroll after layout
            requestAnimationFrame(() => {
                setTimeout(scrollToBottomNow, 10);
            });
            
            // Final scroll with smooth behavior
            setTimeout(() => {
                if (container) {
                    const maxScroll = container.scrollHeight - container.clientHeight;
                    container.scrollTo({
                        top: maxScroll > 0 ? maxScroll : container.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }
    
    // Force scroll to bottom function
    function scrollToBottom(force = false) {
        const container = document.getElementById('chatMessages');
        if (!container) return;
        
        // Force layout recalculation
        container.offsetHeight;
        
        const maxScroll = container.scrollHeight - container.clientHeight;
        const scrollTarget = maxScroll > 0 ? maxScroll : container.scrollHeight;
        
        if (force) {
            container.scrollTop = scrollTarget;
        } else {
            container.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
            });
        }
    }
    
    // Make scrollToBottom available globally
    window.scrollChatToBottom = scrollToBottom;

    // Group messages by date
    function groupMessagesByDate(messagesList) {
        const grouped = [];
        let currentDate = null;

        messagesList.forEach((msg, index) => {
            const msgDate = new Date(msg.time);
            const dateStr = formatMessageDate(msgDate);
            
            if (dateStr !== currentDate) {
                grouped.push({ type: 'date', date: dateStr });
                currentDate = dateStr;
            }
            
            grouped.push(msg);
        });

        return grouped;
    }

    // Format message date for divider
    function formatMessageDate(date) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Send message
    window.sendMessage = async function(event) {
        event.preventDefault();

        const input = document.getElementById('messageInput');
        const messageText = input?.value.trim();

        if (!messageText || !currentConversationId) {
            console.error('Cannot send message: missing text or conversation ID');
            return;
        }

        const convIdStr = String(currentConversationId);

        // Stop typing indicator
        if (window.sendTypingStop) {
            window.sendTypingStop(currentConversationId, 1); // Replace with actual user ID
        }

        // Add message to UI immediately (optimistic update)
        const container = document.getElementById('chatMessages');
        if (container) {
            // Remove empty state if present
            const emptyChat = container.querySelector('.empty-chat');
            if (emptyChat) {
                emptyChat.remove();
            }
            
            const messageHTML = `
                <div class="message sent">
                    <div class="message-avatar">
                        <i class="bi bi-person-fill"></i>
                    </div>
                    <div class="message-content">
                        <div class="message-bubble">${escapeHtml(messageText)}</div>
                        <div class="message-time">Just now</div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', messageHTML);
            
            // Force scroll to bottom immediately
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 0);
        }

        // Clear input
        if (input) input.value = '';

        // Send to backend
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/conversations/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    conversationId: convIdStr,
                    message: messageText,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success') {
                console.error('Error sending message:', data);
                return;
            }

            // Reload messages to include the new one from server
            await loadMessages(convIdStr);
            
            // Ensure scroll to bottom after reload
            setTimeout(() => {
                scrollToBottom(true);
            }, 100);
            
            // Reload conversations to update last message
            await loadConversations();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Create or open conversation for a listing (Contact Host)
    window.createOrOpenListingConversation = async function(listingId, listingTitle) {
        const token = localStorage.getItem('mr-token');
        if (!token) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ listingId }),
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                console.error('Error creating conversation:', data);
                alert('Failed to start conversation. Please try again.');
                return;
            }

            // Get conversation ID (normalize to string)
            const newConvId = String(data.conversation?.id || data.conversation?._id);
            
            // Reload conversations and open the new one
            await loadConversations();
            
            // Navigate to messages page with conversation ID
            window.location.href = `messages.html?conversationId=${newConvId}`;
        } catch (error) {
            console.error('Error creating conversation:', error);
            alert('Failed to start conversation. Please try again.');
        }
    };

    // Format message time
    function formatMessageTime(timeString) {
        const date = new Date(timeString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Search conversations
    window.searchConversations = function(query) {
        if (!query.trim()) {
            displayConversations(conversations);
            return;
        }

        const filtered = conversations.filter(conv => 
            conv.userName.toLowerCase().includes(query.toLowerCase()) ||
            conv.lastMessage.toLowerCase().includes(query.toLowerCase())
        );

        displayConversations(filtered);
    };

    // Start new conversation
    window.startNewConversation = function() {
        alert('New conversation: This will open a dialog to select a user or listing to start a conversation with.\n\nIn production, this will open a modal to select a contact.');
    };

    // Attach file
    window.attachFile = function() {
        alert('Attach file: This will open a file picker to attach images or documents.\n\nIn production, this will open a file input dialog.');
    };

    // Setup typing detection
    function setupTypingDetection() {
        const input = document.getElementById('messageInput');
        if (!input) return;

        let typingTimeout;
        let isTyping = false;

        input.addEventListener('input', function() {
            if (!isTyping && currentConversationId) {
                isTyping = true;
                if (window.sendTypingStart) {
                    window.sendTypingStart(currentConversationId, 1); // Replace with actual user ID
                }
            }

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                if (isTyping && currentConversationId) {
                    isTyping = false;
                    if (window.sendTypingStop) {
                        window.sendTypingStop(currentConversationId, 1); // Replace with actual user ID
                    }
                }
            }, 1000); // Stop typing after 1 second of inactivity
        });

        input.addEventListener('blur', function() {
            if (isTyping && currentConversationId) {
                isTyping = false;
                if (window.sendTypingStop) {
                    window.sendTypingStop(currentConversationId, 1);
                }
            }
        });
    }

    // Store current conversation ID globally for real-time service
    window.currentConversationId = null;

})();

