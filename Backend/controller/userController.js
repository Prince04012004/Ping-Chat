import User from "../models/User.js";
import Chat from "../models/Chat.js";

export const searchuser = async (req, res) => {
  try {
    const searchword = req.query.search;

    if (!searchword) {
      return res.status(400).json({ message: "Search term is required" });
    }

    const user = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: searchword, $options: "i" } },
            { email: { $regex: searchword, $options: "i" } },
          ],
        },
        { _id: { $ne: req.user._id } },
        { _id: { $nin: req.user.blockedusers } },
      ],
    });

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Search result fail" });
  }
};

export const updateprofile = async (req, res) => {
  const { name, profilepic, status } = req.body;

  try {
    const updateduser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          ...(name && { name }),
          ...(profilepic && { profilepic }),
          ...(status && { status }),
        },
      },
      { new: true }
    ).select("-password");

    if (!updateduser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updateduser);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const blockuser = async (req, res) => {
  const { userblockid } = req.body;
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { blockedusers: userblockid }
    });

    await Chat.findOneAndDelete({
      isgroupchat: false,
      users: { $all: [req.user._id, userblockid] }
    });
    res.status(200).send("User blocked");
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const getblockedusers = async (req, res) => {
  try {
    const blockusers = await User.findById(req.user._id).populate(
      "blockedusers",
      "name profilepic email"
    );
    if (!blockusers) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(blockusers.blockedusers);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const unblockuser = async (req, res) => {
  const { userunblockid } = req.body;
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { blockedusers: userunblockid }
    });
    res.status(200).send("User unblocked");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const getprofile = async (req, res) => {
  try {
    const userid = req.params._id;
    const userprofile = await User.findById(userid).select("-password");

    if (!userprofile) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(userprofile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};