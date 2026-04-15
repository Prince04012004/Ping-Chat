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
    isOnline: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        default: "Hey i am using chatbox"
    },
    blockedusers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

Userschema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

Userschema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model("User", Userschema);