const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'audio', 'video', 'file'],
        default: 'text'
    },
    content: {
        type: String,
        required: true
    },
    metadata: {
        duration: Number,  // For audio/video
        size: Number,      // For files
        mimeType: String,  // For files
        thumbnail: String  // For video
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
chatSchema.index({ roomId: 1, timestamp: -1 });
chatSchema.index({ userId: 1, timestamp: -1 });

// Methods
chatSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('Chat', chatSchema); 