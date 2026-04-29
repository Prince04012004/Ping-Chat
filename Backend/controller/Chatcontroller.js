import User from "../models/User.js";
import Chat from "../models/Chat.js";


const accessChat = async (userId) => {
  try {
    setLoading(true);
    const token = user?.token || localStorage.getItem("token");
    const { data } = await API.post(`/api/accesschat`, { userId },
      { headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` } });
    
    setChats((prev) => prev.find((c) => c._id === data._id) ? prev : [data, ...prev]);
    setSelectedChat(data);
    setSearch("");
    setSearchResults([]);
  } catch (error) {
    // ✅ Block error handle karo
    if (error.response?.status === 403) {
      const msg = error.response.data?.blockedBy === "me"
        ? "You have blocked this user. Unblock to chat."
        : "You are blocked by this user.";
      alert(msg);
    }
  } finally {
    setLoading(false);
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


