const Message = require('../models/Message');
const User = require('../models/User');
const Community = require('../models/Community');

// Get all conversations (DMs) and Communities for the current user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        // 1. Get DM Conversations
        // We find users in the user's connection list
        const user = await User.findById(userId)
            .populate('connections', 'name email individual ngo business institution avatar stakeholderType')
            .lean();

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Fetch last message for each connection
        const dmPromises = user.connections.map(async (connection) => {
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: userId, recipient: connection._id },
                    { sender: connection._id, recipient: userId }
                ]
            })
                .sort({ createdAt: -1 })
                .lean();

            // Determine name and initial based on stakeholder type
            let name = 'User';
            if (connection.individual?.fullName) name = connection.individual.fullName;
            else if (connection.ngo?.ngoName) name = connection.ngo.ngoName;
            else if (connection.business?.companyName) name = connection.business.companyName;
            else if (connection.institution?.institutionName) name = connection.institution.institutionName;

            const initial = name.charAt(0).toUpperCase();

            // Check if user is "online" (demo logic or check socket map if available)
            // For now, simpler to just return data

            // Count unread
            const unreadCount = await Message.countDocuments({
                recipient: userId,
                sender: connection._id,
                readBy: { $ne: userId }
            });

            return {
                id: connection._id,
                recipientId: connection._id,
                recipientName: name,
                recipientInitial: initial,
                lastMessage: lastMsg ? lastMsg.content : 'Start a conversation',
                timestamp: lastMsg ? lastMsg.createdAt : connection.createdAt || new Date(),
                unread: unreadCount,
                online: false, // Will be handled by frontend/socket
                type: 'dm'
            };
        });

        const dms = await Promise.all(dmPromises);

        // Sort DMs by timestamp (most recent first)
        dms.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ success: true, data: dms });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Get joined communities for messaging
exports.getJoinedCommunities = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).lean();

        if (!user || !user.communitiesJoined) {
            return res.json({ success: true, data: [] });
        }

        const communityPromises = user.communitiesJoined.map(async (commId) => {
            const community = await Community.findById(commId).lean();
            if (!community) return null;

            const lastMsg = await Message.findOne({ community: commId })
                .sort({ createdAt: -1 })
                .lean();

            return {
                id: community._id,
                name: community.name,
                initial: community.name.charAt(0).toUpperCase(),
                lastMessage: lastMsg ? lastMsg.content : 'Welcome to the community!',
                timestamp: lastMsg ? lastMsg.createdAt : community.createdAt,
                memberCount: community.members ? community.members.length : 0,
                sdg: community.sdg,
                type: 'community'
            };
        });

        const communities = (await Promise.all(communityPromises)).filter(c => c !== null);

        // Sort by timestamp
        communities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ success: true, data: communities });
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Get messages for a specific conversation
exports.getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId, type } = req.query; // conversationId is userId for DM or communityId

        if (!conversationId || !type) {
            return res.status(400).json({ success: false, error: 'Missing parameters' });
        }

        let query = {};
        if (type === 'dm') {
            query = {
                $or: [
                    { sender: userId, recipient: conversationId },
                    { sender: conversationId, recipient: userId }
                ],
                type: 'dm'
            };
        } else if (type === 'community') {
            // Verify user is in community
            const user = await User.findById(userId);
            if (!user.communitiesJoined.includes(conversationId)) {
                return res.status(403).json({ success: false, error: 'Not a member of this community' });
            }

            query = {
                community: conversationId,
                type: 'community'
            };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: 1 }) // Oldest first
            .populate('sender', 'individual ngo business institution')
            .lean();

        // Format messages
        const formattedMessages = messages.map(msg => formatMessage(msg, userId));

        res.json({ success: true, data: formattedMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { conversationId, type, text } = req.body;

        if (!conversationId || !type || !text) {
            return res.status(400).json({ success: false, error: 'Missing parameters' });
        }

        let newMessage = {
            sender: userId,
            content: text,
            type: type,
            readBy: [userId]
        };

        if (type === 'dm') {
            newMessage.recipient = conversationId;
        } else {
            newMessage.community = conversationId;
        }

        const message = await Message.create(newMessage);

        // Populate sender info for return and socket
        const fullMessage = await Message.findById(message._id).populate('sender', 'individual ngo business institution');

        // Format for socket emit
        let senderName = 'Unknown';
        if (fullMessage.sender.individual?.fullName) senderName = fullMessage.sender.individual.fullName;
        else if (fullMessage.sender.ngo?.ngoName) senderName = fullMessage.sender.ngo.ngoName;
        else if (fullMessage.sender.business?.companyName) senderName = fullMessage.sender.business.companyName;
        else if (fullMessage.sender.institution?.institutionName) senderName = fullMessage.sender.institution.institutionName;

        const socketMsg = {
            id: fullMessage._id,
            senderId: fullMessage.sender._id,
            senderName: senderName,
            senderInitial: senderName.charAt(0).toUpperCase(),
            text: fullMessage.content,
            timestamp: fullMessage.createdAt,
            conversationId: type === 'dm' ? userId : conversationId,
            type: type,
            isMe: false
        };

        // Emit via Socket.io
        const io = req.app.get('io');
        if (io) {
            if (type === 'dm') {
                io.to(conversationId.toString()).emit('newMessage', socketMsg);
            } else {
                io.to(`community_${conversationId}`).emit('newMessage', socketMsg);
            }
        }

        // Return standard formatted message
        res.json({ success: true, data: formatMessage(fullMessage, userId) });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

function formatMessage(msg, currentUserId) {
    let senderName = 'Unknown';
    // Helper to get name from sender object
    if (msg.sender.individual?.fullName) senderName = msg.sender.individual.fullName;
    else if (msg.sender.ngo?.ngoName) senderName = msg.sender.ngo.ngoName;
    else if (msg.sender.business?.companyName) senderName = msg.sender.business.companyName;
    else if (msg.sender.institution?.institutionName) senderName = msg.sender.institution.institutionName;

    return {
        id: msg._id,
        senderId: msg.sender._id,
        senderName: senderName,
        senderInitial: senderName.charAt(0).toUpperCase(),
        text: msg.content,
        timestamp: msg.createdAt,
        isMe: msg.sender._id.toString() === currentUserId.toString()
    };
}
