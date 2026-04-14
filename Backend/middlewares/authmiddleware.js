import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 🛑 CRITICAL CHECK: login/register waqt payload mein kya bheja tha? 
      // Agar { id: user._id } bheja tha toh decoded.id sahi hai.
      // Agar { _id: user._id } bheja tha toh decoded._id likhna padega.
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found in database" });
      }

      next();
    } catch (error) {
      console.error("Auth Error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
};