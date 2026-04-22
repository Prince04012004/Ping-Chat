import User from "../models/User.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

export const sendMessage = async (req, res) => {
    const { content, chatid } = req.body;

    if (!content || !chatid) {
        return res.status(400).json({ message: "Content and Chat id required" });
    }

    var newmessage = {
        sender: req.user._id,
        content: content,
        chat: chatid
    };

    try {
        var message = await Message.create(newmessage);
        message = await message.populate("sender", "name profilepic");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name profilepic phonenumber"
        });
        await Chat.findByIdAndUpdate(req.body.chatid, { lastmessage: message });
        res.json(message);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// All messages with pagination
export const allmessages = async (req, res) => {
    try {
        const { chatid } = req.params;
        if (!chatid) return res.status(400).json({ message: "Chat ID is required" });

        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;

        const messages = await Message.find({
            chat: chatid,
            deletedForEveryone: { $ne: true },
            deletedFor: { $nin: [req.user._id] }
        })
            .populate("sender", "name profilepic email")
            .populate("chat")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalMessages = await Message.countDocuments({
            chat: chatid,
            deletedForEveryone: { $ne: true },
            deletedFor: { $nin: [req.user._id] }
        });

        const hasMore = skip + messages.length < totalMessages;

        res.status(200).json({
            messages: messages && messages.length > 0 ? messages.reverse() : [],
            hasMore,
            totalMessages
        });
    } catch (err) {
        console.error("Backend Error:", err);
        res.status(400).json({ message: err.message, messages: [] });
    }
};

// ✅ Send emoji reaction — DB mein save hoga
export const sendEmojiReaction = async (req, res) => {
    const { chatid, emoji } = req.body;

    if (!chatid || !emoji) {
        return res.status(400).json({ message: "Chat id and emoji required" });
    }

    try {
        var message = await Message.create({
            sender: req.user._id,
            content: emoji,
            chat: chatid,
            isEmoji: true   // Special flag — yeh emoji reaction hai
        });

        message = await message.populate("sender", "name profilepic");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name profilepic phonenumber"
        });

        res.json(message);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete message
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { deleteForEveryone } = req.body;
        const userId = req.user._id;

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (deleteForEveryone) {
            if (message.sender.toString() !== userId.toString()) {
                return res.status(403).json({ message: "Only sender can delete for everyone" });
            }
            message.deletedForEveryone = true;
            message.content = "This message was deleted";
        } else {
            if (!message.deletedFor.includes(userId)) {
                message.deletedFor.push(userId);
            }
        }

        await message.save();
        res.status(200).json({ success: true, messageId, deleteForEveryone });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};