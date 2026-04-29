import User from "../models/User.js";
import Chat from "../models/Chat.js";



export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.sendStatus(400);

  try {
    // ✅ Block check — dono taraf se
    const currentUser = await User.findById(req.user._id);
    const otherUser = await User.findById(userId);

    if (!otherUser) return res.status(404).json({ message: "User not found" });

    const iBlockedThem = currentUser.blockedList?.map(id => id.toString()).includes(userId.toString());
    const theyBlockedMe = otherUser.blockedList?.map(id => id.toString()).includes(req.user._id.toString());

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

    // Normal chat access
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
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users", "-password"
      );
      res.status(200).json(FullChat);
    }
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

    res.status(200).send(result);
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const deleteChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const deletedChat = await Chat.findByIdAndDelete(chatId);

    if (!deletedChat) {
      return res.status(404).send("Chat not found");
    }

    res.status(200).send("Chat deleted successfully");
  } catch (error) {
    res.status(400).send(error.message);
  }
};


