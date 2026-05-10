import User from "../models/User.js";
import Chat from "../models/Chat.js";

export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.sendStatus(400);

  try {
    const currentUser = await User.findById(req.user._id);
    const otherUser = await User.findById(userId);

    if (!otherUser) return res.status(404).json({ message: "User not found" });

    // ✅ blockedusers — User model ke saath match
    const iBlockedThem = currentUser.blockedusers?.map(id => id.toString()).includes(userId.toString());
    const theyBlockedMe = otherUser.blockedusers?.map(id => id.toString()).includes(req.user._id.toString());

    if (iBlockedThem) {
      return res.status(403).json({
        message: "You have blocked this user. Unblock to chat.",
        blocked: true,
        blockedBy: "me"
      });
    }

    if (theyBlockedMe) {
      return res.status(403).json({
        message: "You are blocked by this user.",
        blocked: true,
        blockedBy: "them"
      });
    }

    // Existing chat dhundo
    var isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("lastmessage");

    isChat = await User.populate(isChat, {
      path: "lastmessage.sender",
      select: "name profilepic email",
    });

    if (isChat.length > 0) {
      // ✅ Duplicate rooms hain toh extra delete karo
      if (isChat.length > 1) {
        const extraChats = isChat.slice(1);
        for (const chat of extraChats) {
          await Chat.findByIdAndDelete(chat._id);
        }
      }
      return res.send(isChat[0]);
    }

    // Naya chat banao
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    const createdChat = await Chat.create(chatData);
    const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users", "-password"
    );
    res.status(200).json(FullChat);

  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const fetchchats = async (req, res) => {
  try {
    const result = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("lastmessage")
      .sort({ updatedAt: -1 });

    // ✅ Duplicate same-user chats remove karo
    const seen = new Set();
    const unique = result.filter((chat) => {
      if (chat.isGroupChat) return true;
      const otherUser = chat.users.find(
        (u) => u._id.toString() !== req.user._id.toString()
      );
      const key = otherUser?._id?.toString();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    res.status(200).send(unique);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const deleteChat = async (req, res) => {
  const { chatId } = req.params;
  try {
    const deletedChat = await Chat.findByIdAndDelete(chatId);
    if (!deletedChat) return res.status(404).send("Chat not found");
    res.status(200).send("Chat deleted successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};