import User from "../models/User.js";
import jwt from "jsonwebtoken";
import sendEmail from "../config/utils.js";

let otpStore = {};

export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expiresAt: Date.now() + 600000 };

    await sendEmail(email, otp);

    res.status(200).json({ message: "OTP sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, otp, profilepic } = req.body;

    if (!otpStore[email] || otpStore[email].otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > otpStore[email].expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP expired" });
    }

    const userexist = await User.findOne({ email });
    if (userexist) return res.status(400).json({ message: "User exists" });

    const newuser = await User.create({
      name,
      email,
      password,
      profilepic: profilepic || "",
    });

    delete otpStore[email];

    const token = jwt.sign({ id: newuser._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      token,
      user: {
        _id: newuser._id,
        name: newuser.name,
        email: newuser.email,
        profilepic: newuser.profilepic,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
      res.status(200).json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          profilepic: user.profilepic,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};