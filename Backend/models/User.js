import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const Userschema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profilepic: {
        type: String,
        default: ""
    },
    // 🔥 Nayi fields OTP ke liye
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: "Hey I am using Ping"
    },
    blockedusers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

// Password match karne ka method
Userschema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Password hashing logic
Userschema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next(); // Yahan se return karna zaroori hai
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model("User", Userschema);