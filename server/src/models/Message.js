const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: { // For One-to-One
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    community: { // For Group Chat
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    content: {
        type: String,
        required: true
    },
    type: { // 'dm' or 'community'
        type: String,
        enum: ['dm', 'community'],
        required: true
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Index for faster queries
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ community: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
