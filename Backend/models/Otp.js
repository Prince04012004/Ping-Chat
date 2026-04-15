import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // 10 minutes mein apne aap DB se delete ho jayega
    }
});

export default mongoose.model("Otp", OtpSchema);