// Real-time affordances: WebSocket hooks for live status, typing indicators, availability badges
// Usage: Initialize with initRealtimeService() and use status update functions

(function() {
    'use strict';

    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;
    let typingTimeouts = {};
    let onlineStatuses = {};
    let availabilityStatuses = {};

    // WebSocket endpoint (configure in production)
    const WS_ENDPOINT = window.WS_ENDPOINT || 'wss://your-api.com/ws';
    const WS_ENABLED = window.WS_ENABLED !== false; // Set to false to disable WebSocket
    
    // Check if WebSocket URL is a placeholder (not implemented)
    const isPlaceholderUrl = WS_ENDPOINT.includes('your-api.com') || 
                            WS_ENDPOINT.includes('example.com') ||
                            WS_ENDPOINT === 'wss://your-api.com/ws';

    // Initialize real-time service
    window.initRealtimeService = function(userId) {
        // Auto-disable if placeholder URL is detected
        if (!WS_ENABLED || isPlaceholderUrl) {
            if (isPlaceholderUrl) {
                // Silently use simulated updates for placeholder URLs
                simulateRealtimeUpdates();
            } else {
                console.log('⚠️ WebSocket disabled - using simulated real-time updates');
                simulateRealtimeUpdates();
            }
            return;
        }

        try {
            connectWebSocket(userId);
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            simulateRealtimeUpdates();
        }
    };

    // Connect WebSocket
    function connectWebSocket(userId) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            return;
        }

        // Don't attempt connection if placeholder URL
        if (isPlaceholderUrl) {
            simulateRealtimeUpdates();
            return;
        }

        try {
            ws = new WebSocket(`${WS_ENDPOINT}?userId=${userId}`);
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            simulateRealtimeUpdates();
            return;
        }

        ws.onopen = function() {
            console.log('✅ WebSocket connected');
            reconnectAttempts = 0;
            sendMessage({ type: 'auth', userId });
        };

        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleRealtimeMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onerror = function(error) {
            // Only log error if not a placeholder URL (to avoid console spam)
            if (!isPlaceholderUrl) {
                console.error('WebSocket error:', error);
            }
        };

        ws.onclose = function() {
            // Only log if not a placeholder URL
            if (!isPlaceholderUrl) {
                console.log('WebSocket closed');
            }
            
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                // Don't retry if it's a placeholder URL
                if (!isPlaceholderUrl) {
                    setTimeout(() => connectWebSocket(userId), reconnectDelay);
                } else {
                    // Immediately fall back to simulated updates for placeholder URLs
                    simulateRealtimeUpdates();
                }
            } else {
                if (!isPlaceholderUrl) {
                    console.log('Max reconnection attempts reached - falling back to simulated updates');
                }
                simulateRealtimeUpdates();
            }
        };
    }

    // Handle real-time messages
    function handleRealtimeMessage(data) {
        switch (data.type) {
            case 'user_online':
                updateUserOnlineStatus(data.userId, true);
                break;
            case 'user_offline':
                updateUserOnlineStatus(data.userId, false);
                break;
            case 'typing_start':
                showTypingIndicator(data.conversationId, data.userId, data.userName);
                break;
            case 'typing_stop':
                hideTypingIndicator(data.conversationId, data.userId);
                break;
            case 'availability_update':
                updateListingAvailability(data.listingId, data.available);
                break;
            case 'message_received':
                // Handle new message notification
                if (window.onRealtimeMessage) {
                    window.onRealtimeMessage(data.message);
                }
                break;
            default:
                console.log('Unknown message type:', data.type);
        }
    }

    // Send WebSocket message
    function sendMessage(data) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }

    // Update user online status
    function updateUserOnlineStatus(userId, isOnline) {
        onlineStatuses[userId] = isOnline;
        const indicators = document.querySelectorAll(`[data-user-id="${userId}"] .realtime-online-indicator`);
        indicators.forEach(indicator => {
            indicator.classList.toggle('online', isOnline);
            indicator.classList.toggle('offline', !isOnline);
        });

        // Update status text
        const statusTexts = document.querySelectorAll(`[data-user-id="${userId}"] .realtime-status-text`);
        statusTexts.forEach(text => {
            if (isOnline) {
                text.innerHTML = '<span class="status-online">●</span> Online';
            } else {
                const lastSeen = getLastSeenTime(userId);
                text.textContent = `Last seen ${lastSeen}`;
            }
        });
    }

    // Show typing indicator
    function showTypingIndicator(conversationId, userId, userName) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        // Clear existing typing indicator
        const existing = container.querySelector('.typing-indicator');
        if (existing) existing.remove();

        // Add typing indicator
        const typingHTML = `
            <div class="message received typing-indicator" data-typing-user="${userId}">
                <div class="message-avatar">
                    <i class="bi bi-person-fill"></i>
                </div>
                <div class="message-content">
                    <div class="message-bubble typing-bubble">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                    <div class="message-time">${userName} is typing...</div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', typingHTML);
        container.scrollTop = container.scrollHeight;

        // Auto-hide after 3 seconds
        clearTimeout(typingTimeouts[conversationId]);
        typingTimeouts[conversationId] = setTimeout(() => {
            hideTypingIndicator(conversationId, userId);
        }, 3000);
    }

    // Hide typing indicator
    function hideTypingIndicator(conversationId, userId) {
        const container = document.getElementById('chatMessages');
        if (container) {
            const indicator = container.querySelector(`.typing-indicator[data-typing-user="${userId}"]`);
            if (indicator) indicator.remove();
        }
        clearTimeout(typingTimeouts[conversationId]);
    }

    // Update listing availability
    function updateListingAvailability(listingId, available) {
        availabilityStatuses[listingId] = available;
        const badges = document.querySelectorAll(`[data-listing-id="${listingId}"] .availability-badge`);
        badges.forEach(badge => {
            badge.classList.toggle('available', available);
            badge.classList.toggle('unavailable', !available);
            badge.textContent = available ? 'Available Now' : 'Unavailable';
        });
    }

    // Send typing start event
    window.sendTypingStart = function(conversationId, userId) {
        sendMessage({
            type: 'typing_start',
            conversationId,
            userId
        });
    };

    // Send typing stop event
    window.sendTypingStop = function(conversationId, userId) {
        sendMessage({
            type: 'typing_stop',
            conversationId,
            userId
        });
    };

    // Get last seen time (mock - replace with real data)
    function getLastSeenTime(userId) {
        // In production, fetch from API
        return '2 hours ago';
    }

    // Simulate real-time updates when WebSocket is unavailable
    function simulateRealtimeUpdates() {
        // Simulate online status changes
        setInterval(() => {
            const userIds = Object.keys(onlineStatuses);
            if (userIds.length > 0) {
                const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
                // Randomly toggle status for demo
                if (Math.random() > 0.7) {
                    updateUserOnlineStatus(randomUserId, !onlineStatuses[randomUserId]);
                }
            }
        }, 10000); // Every 10 seconds

        // Simulate typing indicators
        setInterval(() => {
            const conversationId = window.currentConversationId;
            if (conversationId && Math.random() > 0.8) {
                showTypingIndicator(conversationId, 2, 'Ahmed Hassan');
                setTimeout(() => hideTypingIndicator(conversationId, 2), 2000);
            }
        }, 15000); // Every 15 seconds
    }

    // Public API
    window.realtimeService = {
        updateUserOnlineStatus,
        showTypingIndicator,
        hideTypingIndicator,
        updateListingAvailability,
        sendTypingStart,
        sendTypingStop,
        isConnected: () => ws && ws.readyState === WebSocket.OPEN
    };

})();

