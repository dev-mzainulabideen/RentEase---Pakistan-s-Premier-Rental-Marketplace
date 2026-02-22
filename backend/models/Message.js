const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    conversation: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Conversation', 
        required: [true, 'Conversation is required']
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Sender is required']
    },
    receiver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: [true, 'Receiver is required']
    },
    
    // Content
    message: { 
        type: String, 
        required: [true, 'Message is required'],
        maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text'
    },
    attachments: [{ 
        url: String,
        fileType: String,
        fileName: String,
        fileSize: Number
    }],
    
    // Status
    read: { type: Boolean, default: false },
    readAt: Date,
    delivered: { type: Boolean, default: false },
    deliveredAt: Date,
    
    // Editing
    edited: { type: Boolean, default: false },
    editedAt: Date,
    
    // Deletion
    deleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Timestamps
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: false
});

// Indexes - CRITICAL for query performance
messageSchema.index({ conversation: 1, createdAt: -1 }); // Compound index for conversation messages
messageSchema.index({ conversation: 1, deleted: 1, createdAt: -1 }); // For filtering deleted messages
messageSchema.index({ sender: 1 });
messageSchema.index({ receiver: 1 });
messageSchema.index({ receiver: 1, read: 1 }); // Compound index for unread messages
messageSchema.index({ read: 1 });

module.exports = mongoose.model('Message', messageSchema);

