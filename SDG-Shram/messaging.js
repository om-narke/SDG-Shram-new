/**
 * SDG-SHRAM MESSAGING SYSTEM
 * LinkedIn-style Real-time Chat
 */

const MessagingSystem = {
    currentUser: null,
    activeConversation: null,
    conversations: [],
    communities: [],
    socket: null,
    isMessagingPanelOpen: false,
    currentTab: 'messages', // 'messages' or 'communities'

    // Initialize the messaging system
    init() {
        this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (!this.currentUser._id) {
            console.log('User not logged in, messaging disabled');
            return;
        }

        this.renderMessagingUI();
        this.loadConversations();
        this.loadCommunities();
        this.setupEventListeners();
        this.initializeSocket();
    },

    // Initialize WebSocket connection
    initializeSocket() {
        // For demo purposes, we'll use polling-based updates
        // In production, you would use Socket.io or WebSockets
        this.pollForUpdates();
    },

    pollForUpdates() {
        setInterval(() => {
            if (this.activeConversation) {
                this.loadMessages(this.activeConversation.id, this.activeConversation.type);
            }
        }, 5000);
    },

    // Render the messaging UI components
    renderMessagingUI() {
        const messagingHTML = `
            <!-- Chat Toggle Button -->
            <button class="chat-toggle-btn" id="chatToggleBtn" onclick="MessagingSystem.toggleMessagingPanel()">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
                <span class="badge" id="unreadBadge" style="display: none;">0</span>
            </button>

            <!-- Messaging Panel -->
            <div class="messaging-panel" id="messagingPanel">
                <div class="messaging-header">
                    <h3>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        </svg>
                        Messaging
                    </h3>
                    <div class="messaging-header-actions">
                        <button onclick="MessagingSystem.toggleMessagingPanel()" title="Minimize">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 13H5v-2h14v2z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Tabs -->
                <div class="messaging-tabs">
                    <button class="messaging-tab active" id="tabMessages" onclick="MessagingSystem.switchTab('messages')">
                        Messages
                    </button>
                    <button class="messaging-tab" id="tabCommunities" onclick="MessagingSystem.switchTab('communities')">
                        Communities
                    </button>
                </div>

                <!-- Search -->
                <div class="conversations-search">
                    <input type="text" id="conversationSearch" placeholder="Search messages..." oninput="MessagingSystem.filterConversations(this.value)">
                </div>

                <!-- Conversations List -->
                <div class="conversations-container" id="conversationsContainer">
                    <ul class="conversation-list" id="conversationList">
                        <div class="empty-conversations" id="emptyState">
                            <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                            </svg>
                            <h4>No conversations yet</h4>
                            <p>Connect with people to start messaging!</p>
                        </div>
                    </ul>
                </div>
            </div>

            <!-- Chat Window (Single conversation) -->
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div class="chat-header-avatar" id="chatAvatar">U</div>
                    <div class="chat-header-info">
                        <div class="chat-header-name" id="chatName">User Name</div>
                        <div class="chat-header-status" id="chatStatus">Online</div>
                    </div>
                    <div class="chat-header-actions">
                        <button onclick="MessagingSystem.closeChat()" title="Close">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="chat-messages" id="chatMessages">
                    <!-- Messages will be loaded here -->
                </div>

                <div class="chat-input-container">
                    <input type="text" id="messageInput" placeholder="Write a message..." onkeypress="MessagingSystem.handleKeyPress(event)">
                    <button onclick="MessagingSystem.sendMessage()" id="sendBtn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Insert into page
        const container = document.createElement('div');
        container.id = 'messagingContainer';
        container.innerHTML = messagingHTML;
        document.body.appendChild(container);
    },

    // Toggle messaging panel visibility
    toggleMessagingPanel() {
        const panel = document.getElementById('messagingPanel');
        this.isMessagingPanelOpen = !this.isMessagingPanelOpen;
        panel.classList.toggle('active', this.isMessagingPanelOpen);
    },

    // Switch between Messages and Communities tabs
    switchTab(tab) {
        this.currentTab = tab;

        document.getElementById('tabMessages').classList.toggle('active', tab === 'messages');
        document.getElementById('tabCommunities').classList.toggle('active', tab === 'communities');

        if (tab === 'messages') {
            this.renderConversations();
        } else {
            this.renderCommunities();
        }
    },

    // Load user conversations from API
    async loadConversations() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/messages/conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.conversations = data.data || [];
            } else {
                console.error('Failed to load conversations');
                this.conversations = [];
            }

            this.renderConversations();
            this.updateUnreadBadge();
        } catch (error) {
            console.error('Error loading conversations:', error);
            this.conversations = [];
            this.renderConversations();
        }
    },

    // Load joined communities
    async loadCommunities() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/messages/communities', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.communities = data.data || [];
            } else {
                console.error('Failed to load communities');
                this.communities = [];
            }
        } catch (error) {
            console.error('Error loading communities:', error);
            this.communities = [];
        }
    },

    // Demo data removed - using real API


    // Render conversations list
    renderConversations() {
        const list = document.getElementById('conversationList');
        const emptyState = document.getElementById('emptyState');

        if (this.conversations.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        list.innerHTML = this.conversations.map(conv => `
            <li class="conversation-item ${conv.unread > 0 ? 'unread' : ''}" onclick="MessagingSystem.openChat('${conv.id}', 'dm')">
                <div class="conversation-avatar ${conv.online ? 'online' : ''}">
                    ${conv.recipientInitial}
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">${conv.recipientName}</div>
                    <div class="conversation-preview">${conv.lastMessage}</div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${this.formatTime(conv.timestamp)}</div>
                    ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
                </div>
            </li>
        `).join('');
    },

    // Render communities list
    renderCommunities() {
        const list = document.getElementById('conversationList');
        const emptyState = document.getElementById('emptyState');

        if (this.communities.length === 0) {
            emptyState.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <h4>No communities joined</h4>
                <p>Join a community to start group conversations!</p>
            `;
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        list.innerHTML = this.communities.map(comm => `
            <li class="conversation-item" onclick="MessagingSystem.openChat('${comm.id}', 'community')">
                <div class="conversation-avatar community">
                    ${comm.initial}
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">${comm.name}</div>
                    <div class="conversation-preview">${comm.lastMessage}</div>
                </div>
                <div class="conversation-meta">
                    <div class="conversation-time">${this.formatTime(comm.timestamp)}</div>
                    <span class="community-members-btn">${comm.memberCount} members</span>
                </div>
            </li>
        `).join('');
    },

    // Open a chat window
    openChat(id, type) {
        const chatWindow = document.getElementById('chatWindow');
        chatWindow.classList.add('active');

        let chatData;
        if (type === 'dm') {
            chatData = this.conversations.find(c => c.id === id);
            if (chatData) {
                document.getElementById('chatAvatar').textContent = chatData.recipientInitial;
                document.getElementById('chatName').textContent = chatData.recipientName;
                document.getElementById('chatStatus').textContent = chatData.online ? 'Active now' : 'Offline';
                chatWindow.classList.remove('community-chat');
            }
        } else {
            chatData = this.communities.find(c => c.id === id);
            if (chatData) {
                document.getElementById('chatAvatar').textContent = chatData.initial;
                document.getElementById('chatName').textContent = chatData.name;
                document.getElementById('chatStatus').textContent = `${chatData.memberCount} members`;
                chatWindow.classList.add('community-chat');
            }
        }

        this.activeConversation = { id, type, data: chatData };
        this.loadMessages(id, type);

        // Mark as read
        if (type === 'dm') {
            const conv = this.conversations.find(c => c.id === id);
            if (conv) conv.unread = 0;
            this.renderConversations();
            this.updateUnreadBadge();
        }
    },

    // Close chat window
    closeChat() {
        document.getElementById('chatWindow').classList.remove('active');
        this.activeConversation = null;
    },

    // Load messages for a conversation
    async loadMessages(id, type) {
        const messagesContainer = document.getElementById('chatMessages');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/messages/history?conversationId=${id}&type=${type}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                const messages = data.data || [];

                messagesContainer.innerHTML = messages.map(msg => `
                    <div class="message ${msg.isMe ? 'sent' : 'received'}">
                        ${!msg.isMe ? `<div class="message-avatar">${msg.senderInitial}</div>` : ''}
                        <div class="message-content">
                            <div class="message-bubble">${this.escapeHTML(msg.text)}</div>
                            <div class="message-time">${this.formatMessageTime(msg.timestamp)}</div>
                        </div>
                    </div>
                `).join('');

                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    },

    // Get demo messages - REMOVED

    // Send a message
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();

        if (!text || !this.activeConversation) return;

        // Optimistic update
        const messagesContainer = document.getElementById('chatMessages');
        const userInitial = this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U';

        messagesContainer.innerHTML += `
            <div class="message sent">
                <div class="message-content">
                    <div class="message-bubble">${this.escapeHTML(text)}</div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;

        // Clear input and scroll to bottom
        input.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId: this.activeConversation.id,
                    type: this.activeConversation.type,
                    text: text
                })
            });

            if (!response.ok) {
                console.error('Failed to send message');
                // Could retry or show error
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    },

    // Handle Enter key press
    handleKeyPress(event) {
        if (event.key === 'Enter') {
            this.sendMessage();
        }
    },

    // Filter conversations by search
    filterConversations(query) {
        const filtered = this.currentTab === 'messages'
            ? this.conversations.filter(c => c.recipientName.toLowerCase().includes(query.toLowerCase()))
            : this.communities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));

        // Re-render with filtered data
        const list = document.getElementById('conversationList');

        if (this.currentTab === 'messages') {
            list.innerHTML = filtered.map(conv => `
                <li class="conversation-item ${conv.unread > 0 ? 'unread' : ''}" onclick="MessagingSystem.openChat('${conv.id}', 'dm')">
                    <div class="conversation-avatar ${conv.online ? 'online' : ''}">
                        ${conv.recipientInitial}
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-name">${conv.recipientName}</div>
                        <div class="conversation-preview">${conv.lastMessage}</div>
                    </div>
                    <div class="conversation-meta">
                        <div class="conversation-time">${this.formatTime(conv.timestamp)}</div>
                        ${conv.unread > 0 ? `<span class="unread-badge">${conv.unread}</span>` : ''}
                    </div>
                </li>
            `).join('');
        } else {
            list.innerHTML = filtered.map(comm => `
                <li class="conversation-item" onclick="MessagingSystem.openChat('${comm.id}', 'community')">
                    <div class="conversation-avatar community">
                        ${comm.initial}
                    </div>
                    <div class="conversation-info">
                        <div class="conversation-name">${comm.name}</div>
                        <div class="conversation-preview">${comm.lastMessage}</div>
                    </div>
                    <div class="conversation-meta">
                        <div class="conversation-time">${this.formatTime(comm.timestamp)}</div>
                        <span class="community-members-btn">${comm.memberCount} members</span>
                    </div>
                </li>
            `).join('');
        }
    },

    // Update unread badge
    updateUnreadBadge() {
        const totalUnread = this.conversations.reduce((sum, conv) => sum + (conv.unread || 0), 0);
        const badge = document.getElementById('unreadBadge');

        if (totalUnread > 0) {
            badge.textContent = totalUnread > 9 ? '9+' : totalUnread;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },

    // Format timestamp for conversation list
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
        if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    // Format timestamp for message bubbles
    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    },

    // Escape HTML to prevent XSS
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Setup event listeners
    setupEventListeners() {
        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('messagingPanel');
            const chatWindow = document.getElementById('chatWindow');
            const toggleBtn = document.getElementById('chatToggleBtn');

            if (!panel.contains(e.target) &&
                !chatWindow.contains(e.target) &&
                !toggleBtn.contains(e.target) &&
                this.isMessagingPanelOpen) {
                // Keep panel open for now - user can close manually
            }
        });
    },

    // Open chat after successful connection
    startConversation(userId, userName) {
        // Create or find existing conversation
        let conversation = this.conversations.find(c => c.recipientId === userId);

        if (!conversation) {
            conversation = {
                id: `conv_${Date.now()}`,
                recipientId: userId,
                recipientName: userName,
                recipientInitial: userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
                lastMessage: 'Start a conversation...',
                timestamp: new Date(),
                unread: 0,
                online: false
            };
            this.conversations.unshift(conversation);
            this.renderConversations();
        }

        // Open the messaging panel and chat
        this.isMessagingPanelOpen = true;
        document.getElementById('messagingPanel').classList.add('active');
        this.openChat(conversation.id, 'dm');
    },

    // Open community chat when user joins
    openCommunityChat(communityId, communityName) {
        let community = this.communities.find(c => c.id === communityId);

        if (!community) {
            community = {
                id: communityId,
                name: communityName,
                initial: communityName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
                lastMessage: 'Welcome to the community!',
                timestamp: new Date(),
                memberCount: 1,
                sdg: ''
            };
            this.communities.unshift(community);
        }

        // Open the messaging panel with communities tab
        this.isMessagingPanelOpen = true;
        document.getElementById('messagingPanel').classList.add('active');
        this.switchTab('communities');
        this.openChat(communityId, 'community');
    }
};

// Initialize messaging system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        MessagingSystem.init();
    }, 500);
});

// Export for global access
window.MessagingSystem = MessagingSystem;
