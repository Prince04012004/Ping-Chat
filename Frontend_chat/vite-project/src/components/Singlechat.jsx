import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider"; // 🔥 Import ChatState

const ENDPOINT = "http://localhost:5000";
var socket, selectedchatcompare;

const SingleChat = () => {
    const [messages, setmessages] = useState([]);
    const [newmessage, setnewmessage] = useState("");
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // 🔥 Context se notification states nikalo
    const { user, selectedChat, notification, setNotification } = ChatState();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on("connected", () => console.log("Socket Connected!"));
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
        return () => { socket.disconnect(); };
    }, [user]);

    useEffect(() => {
        if (!selectedChat) return;
        const getmessages = async () => {
            try {
                const { data } = await API.get(`/api/allmessages/${selectedChat._id}`);
                setmessages(data);
                socket.emit("join chat", selectedChat._id);
            } catch (err) { console.log("Message fetch error"); }
        };
        getmessages();
        selectedchatcompare = selectedChat; 
    }, [selectedChat]);

    useEffect(() => {
        socket.on("message received", (newMessageReceived) => {
            // 🔥 Notification Logic
            if (!selectedchatcompare || selectedchatcompare._id !== newMessageReceived.chat._id) {
                // Agar chat select nahi hai ya kisi aur ki chat ka message hai
                if (!notification.some((n) => n._id === newMessageReceived._id)) {
                    setNotification([newMessageReceived, ...notification]);
                }
            } else {
                // Agar wahi chat open hai toh message list update karo
                setmessages((prevMessages) => [...prevMessages, newMessageReceived]);
            }
        });
        return () => socket.off("message received");
    }, [notification, setNotification]); // Dependencies add ki taaki state update sync rahe

    useEffect(() => {
        scrollToBottom();
    }, [messages, istyping]);

    const sendMessage = async (event) => {
        if ((event.key === "Enter" || event.type === "click") && newmessage) {
            socket.emit("stop typing", selectedChat._id);
            try {
                const content = newmessage;
                setnewmessage(""); 
                const { data } = await API.post("/api/sendmessage", {
                    content: content,
                    chatid: selectedChat._id 
                });
                socket.emit("new message", data);
                setmessages([...messages, data]);
            } catch (err) { console.log("Message sending error"); }
        }
    };

    const typingHandler = (e) => {
        setnewmessage(e.target.value);
        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            var timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength);
    };

    if (!selectedChat) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0f172a] text-slate-500 font-bold uppercase tracking-widest text-sm">
                Select a chat to start aura
            </div>
        );
    }

    const otherUser = selectedChat.users.find(u => u._id !== user._id);

    return (
        <div className="flex flex-col h-full bg-[#0f172a] text-white font-sans overflow-hidden">
            
            {/* --- Chat Header --- */}
            <div className="flex items-center justify-between p-4 bg-[#1e293b]/40 backdrop-blur-xl border-b border-[#334155]/50 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#22d3ee] to-[#a855f7] shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                            <div className="w-full h-full rounded-full bg-[#1e293b] flex items-center justify-center text-xs font-bold border border-[#0f172a] overflow-hidden">
                                {otherUser?.profilepic ? (
                                    <img src={otherUser.profilepic} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    otherUser?.name[0]
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] border-2 border-[#0f172a] rounded-full shadow-[0_0_5px_#22c55e]"></div>
                    </div>
                    <div>
                        <h2 className="font-bold text-sm tracking-tight text-slate-100 uppercase">
                            {otherUser?.name}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-[#22d3ee] rounded-full animate-pulse"></span>
                            <p className="text-[10px] text-[#22d3ee]/90 font-bold uppercase tracking-widest">Active Now</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 text-xs">
                   <button className="p-2.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-[#22d3ee] border border-slate-700/50 transition-all">📞</button>
                   <button className="p-2.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-[#a855f7] border border-slate-700/50 transition-all">🎥</button>
                </div>
            </div>

            {/* --- Message Screen --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#0f172a_100%)] scrollbar-hide">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender._id === user._id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-[70%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed transition-all duration-300 shadow-xl ${
                            m.sender._id === user._id 
                            ? 'bg-gradient-to-br from-[#4f46e5] to-[#3b82f6] text-white rounded-tr-none border border-white/10 shadow-[0_4px_20px_rgba(79,70,229,0.3)]' 
                            : 'bg-[#1e293b]/80 border border-slate-700/50 backdrop-blur-md rounded-tl-none text-slate-200'
                        }`}>
                            <p>{m.content}</p>
                            <span className="text-[9px] opacity-40 block mt-1.5 text-right font-mono">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {istyping && (
                    <div className="flex items-center gap-2 ml-2 transition-opacity duration-300">
                        <span className="text-[11px] text-[#22d3ee] italic font-semibold">{otherUser?.name} is typing</span>
                        <div className="flex gap-1 mt-0.5">
                            <div className="w-1 h-1 bg-[#22d3ee] rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-[#22d3ee] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1 h-1 bg-[#22d3ee] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* --- Input Area --- */}
            <div className="p-4 bg-[#0f172a]/90 backdrop-blur-2xl">
                <div className="flex items-center gap-3 bg-[#1e293b]/60 border border-[#334155] rounded-[22px] px-4 py-2 focus-within:border-[#22d3ee]/50 transition-all shadow-inner group">
                    <button className="text-slate-500 hover:text-white text-xl transition-colors">+</button>
                    <input 
                        className="bg-transparent flex-1 outline-none text-[13px] text-slate-100 placeholder:text-slate-500 py-1.5"
                        placeholder={`Message ${otherUser?.name}...`}
                        value={newmessage}
                        onChange={typingHandler}
                        onKeyDown={sendMessage}
                    />
                    <div className="flex items-center gap-2">
                        <button className="text-slate-500 hover:text-[#22d3ee] text-lg transition-colors">🎙️</button>
                        <button 
                            onClick={sendMessage}
                            className="p-2.5 bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] rounded-[14px] hover:scale-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        >
                            <span className="text-white text-sm">🚀</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleChat;