import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  try {
    const { name, phonenumber, profilepic } = req.body;

    if (!name || !phonenumber) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const userexist = await User.findOne({ phonenumber });
    if (userexist) {
      return res.status(400).json({
        message: "User already exist",
      });
    }

    const newuser = await User.create({
      name,
      phonenumber,
      profilepic: profilepic || "",
    });

    const token = jwt.sign({ id: newuser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      newuser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phonenumber } = req.body;

    if (!phonenumber) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const user = await User.findOne({ phonenumber });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      message: "Login successfully",
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};