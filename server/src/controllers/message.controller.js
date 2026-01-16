const Message = require('../models/Message');
const User = require('../models/User');
const Community = require('../models/Community');

// Get list of conversations for the current user
exports.getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        // Aggregate to find unique conversations and the last message
        // This is a simplified approach; for production, a separate Conversation model is recommended
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { recipient: userId }]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$sender", userId] },
                            "$recipient",
                            "$sender"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    id: "$_id", // Conversation ID acts as the other user's ID for DMs in this simple design
                    recipientId: "$userDetails._id",
                    recipientName: {
                        $ifNull: [
                            "$userDetails.individual.fullName",
                            {
                                $ifNull: ["$userDetails.ngo.ngoName",
                                    {
                                        $ifNull: ["$userDetails.business.companyName",
                                            { $ifNull: ["$userDetails.institution.institutionName", "User"] }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    lastMessage: "$lastMessage.text",
                    timestamp: "$lastMessage.createdAt",
                    unread: {
                        $cond: [{ $in: [userId, "$lastMessage.readBy"] }, 0, 1] // Simplified unread count
                    },
                    type: "dm"
                }
            }
        ]);

        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Get messages for a specific conversation (User ID or Community ID)
exports.getMessages = async (req, res) => {
    try {
        const { id, type } = req.params; // id is otherUserId or communityId
        const currentUserId = req.user.id;

        let query = {};
        if (type === 'dm') {
            query = {
                type: 'dm',
                $or: [
                    { sender: currentUserId, recipient: id },
                    { sender: id, recipient: currentUserId }
                ]
            };
        } else if (type === 'community') {
            query = {
                type: 'community',
                community: id
            };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: 1 })
            .populate('sender', 'individual.fullName ngo.ngoName business.companyName institution.institutionName');

        const formattedMessages = messages.map(msg => {
            const user = msg.sender;
            const name = user.individual?.fullName || user.ngo?.ngoName || user.business?.companyName || user.institution?.institutionName || 'User';
            const initial = name.charAt(0).toUpperCase();

            return {
                id: msg._id,
                senderId: msg.sender._id,
                senderInitial: initial,
                senderName: name,
                text: msg.text,
                timestamp: msg.createdAt
            };
        });

        res.status(200).json({ success: true, data: formattedMessages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// Send a message
exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, type, text } = req.body; // conversationId is recipientId or communityId
        const senderId = req.user.id;

        const newMessage = new Message({
            conversationId: conversationId, // For DMs this is redundant if we query by sender/recipient, but useful for grouping
            type,
            sender: senderId,
            text,
            readBy: [senderId]
        });

        if (type === 'dm') {
            newMessage.recipient = conversationId;
        } else if (type === 'community') {
            newMessage.community = conversationId;
        }

        await newMessage.save();

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
