import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    content: {
        type: String,
        trim: true,
        required: true
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat"
    },
    aisuggestion: {
        type: String,
        default: ""
    },
    readby: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    // ✅ "Delete for me" — sirf un users ke liye hide hoga
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    // ✅ "Delete for everyone" — poora message delete
    deletedForEveryone: {
        type: Boolean,
        default: false
    },
    // ✅ Emoji reaction — DB mein save hoga
    isEmoji: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model("Message", messageSchema);