import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // 1. CORS Import kiya
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

// 2. CORS ko yahan lagao (Routes se pehle)
app.use(cors({
    origin: "*", // Tumhare frontend ka URL
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api', authroutes);
app.use('/api', useroute);
app.use('/api', chatroutes);
app.use('/api', messageroute); // Check karna path sahi hai na?
app.use('/api/ai', airoutes); // AI routes

const server = http.createServer(app);

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: "*", // Socket ke liye bhi origin specify karna accha hota hai
        methods: ["GET", "POST"],
    },
});

// Socket Events (Baki sab same hai...)
io.on("connection", (socket) => {
    console.log("Connected to socket.io, Someone is online");

    socket.on("setup", (userdata) => {
        if(!userdata?._id) return;
        socket.join(userdata._id);
        console.log("User room created: " + userdata._id);
        socket.emit("connected");
    });

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User joined chat room: " + room);
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