import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/db.js";
import authroutes from "./routes/authroutes.js";
import useroute from "./routes/useroute.js";
import chatroutes from "./routes/chatroutes.js";
import messageroute from "./routes/messageroute.js";
import airoutes from "./routes/airoutes.js";
import http from "http";
import { Server } from "socket.io";

dotenv.config();
connectDb();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(express.json());

app.use('/api', authroutes);
app.use('/api', useroute);
app.use('/api', chatroutes);
app.use('/api', messageroute);
app.use('/api/ai', airoutes);

const server = http.createServer(app);

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

io.on("connection", (socket) => {
    console.log("Connected to socket.io, Someone is online");

    socket.on("setup", (userdata) => {
        if (!userdata?._id) return;
        socket.join(userdata._id);
        console.log("User room created: " + userdata._id);
        socket.emit("connected");
    });

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User joined chat room: " + room);
    });

    // Typing indicators
    socket.on("typing", (room) => {
        socket.in(room).emit("typing");
    });

    socket.on("stop typing", (room) => {
        socket.in(room).emit("stop typing");
    });

    // 🎨 Mood change — typing ke saath color sync
    socket.on("mood change", ({ chatId, moodIndex }) => {
        if (!chatId) return;
        socket.in(chatId).emit("mood change", { moodIndex });
    });

    // 😂 Emoji reaction — full screen animation dono users ko
    socket.on("emoji reaction", ({ chatId, emoji }) => {
        if (!chatId || !emoji) return;
        // Sender ko bhi bhejo + receiver ko bhi
        io.in(chatId).emit("emoji reaction", { emoji });
    });

    socket.on("new message", (newMessagereceived) => {
        var chat = newMessagereceived.chat;
        if (!chat.users) return console.log("chat.users is not defined");

        chat.users.forEach((user) => {
            if (user._id === newMessagereceived.sender._id) return;
            socket.in(user._id).emit("message received", newMessagereceived);
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

server.listen(PORT, () => {
    console.log("App is running on", PORT);
});