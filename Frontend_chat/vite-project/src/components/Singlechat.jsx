import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
var socket, selectedchatcompare;

const SingleChat = () => {
    const [messages, setmessages] = useState([]);
    const [newmessage, setnewmessage] = useState("");
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

    const { user, selectedChat, setSelectedChat, notification, setNotification, config, hexToRGBA } = ChatState();
    const accentColor = config?.accent || "#10b981";

    // ✅ User ID — context structure handle karo
    const myId = user?.user?._id || user?._id;

    // ✅ KEYBOARD FIX
    useEffect(() => {
        const syncHeight = () => {
            if (window.visualViewport && containerRef.current) {
                containerRef.current.style.height = `${window.visualViewport.height}px`;
                window.scrollTo(0, 0);
            }
        };
        window.visualViewport?.addEventListener("resize", syncHeight);
        syncHeight();
        return () => window.visualViewport?.removeEventListener("resize", syncHeight);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ✅ SOCKET SETUP
    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup", user);
        socket.on("connected", () => console.log("Socket Connected!"));
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
        return () => { socket.disconnect(); };
    }, [user]);

    // ✅ FETCH MESSAGES + JOIN ROOM
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

    // ✅ LIVE MESSAGE RECEIVE — FIXED
    useEffect(() => {
        if (!socket) return;

        socket.on("message received", (newMessageReceived) => {
            if (
                !selectedchatcompare ||
                selectedchatcompare._id !== newMessageReceived.chat._id
            ) {
                // Dusri chat ka message — notification mein daalo
                if (!notification.some((n) => n._id === newMessageReceived._id)) {
                    setNotification([newMessageReceived, ...notification]);
                }
            } else {
                // ✅ Same chat open hai — seedha dikhao, koi check nahi
                setmessages((prev) => [...prev, newMessageReceived]);
            }
        });

        return () => socket.off("message received");
    }, [notification, setNotification]);

    useEffect(() => { scrollToBottom(); }, [messages, istyping]);

    // ✅ SEND MESSAGE
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
                setmessages((prev) => [...prev, data]); // ✅ functional update
            } catch (err) { console.log("Message sending error"); }
        }
    };

    // ✅ TYPING HANDLER
    const typingHandler = (e) => {
        setnewmessage(e.target.value);
        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        setTimeout(() => {
            var timeNow = new Date().getTime();
            if (timeNow - lastTypingTime >= 3000 && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, 3000);
    };

    if (!selectedChat) {
        return (
            <div className="flex items-center justify-center h-full w-full"
                style={{ background: "#060608" }}>
                <p className="text-white/20 text-xs font-bold uppercase tracking-[4px]">Select a conversation</p>
            </div>
        );
    }

    // ✅ FIXED: myId use karo
    const otherUser = selectedChat.users?.find(u => u._id !== myId) || {};

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const groupedMessages = messages.reduce((groups, msg) => {
        const date = new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    return (
        <>
            <style>{`
                html, body {
                    overflow: hidden !important;
                    height: 100%;
                    position: fixed;
                    width: 100%;
                    background: #000;
                }
                #sc-container {
                    position: fixed;
                    top: 0; left: 0;
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    background: #060608;
                }
                .sc-bg {
                    position: absolute; inset: 0;
                    pointer-events: none; z-index: 0;
                }
                .sc-bg::after {
                    content: '';
                    position: absolute; inset: 0;
                    background-image: 
                        linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                .sc-messages {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior-y: contain;
                    min-height: 0;
                }
                .sc-messages::-webkit-scrollbar { width: 2px; }
                .sc-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

                @keyframes msgIn {
                    from { opacity: 0; transform: translateY(6px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .msg-bubble { animation: msgIn 0.18s ease forwards; }

                @keyframes typingPulse {
                    0%, 100% { opacity: 0.3; transform: translateY(0); }
                    50% { opacity: 1; transform: translateY(-3px); }
                }
                .typing-dot:nth-child(1) { animation: typingPulse 1.2s ease infinite 0s; }
                .typing-dot:nth-child(2) { animation: typingPulse 1.2s ease infinite 0.2s; }
                .typing-dot:nth-child(3) { animation: typingPulse 1.2s ease infinite 0.4s; }
            `}</style>

            <div id="sc-container" ref={containerRef}>
                <div className="sc-bg" />

                {/* ═══ HEADER ═══ */}
                <header className="flex-shrink-0 relative z-[150]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ background: "rgba(6,6,8,0.9)", backdropFilter: "blur(24px)" }}>

                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedChat(null)}
                                className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl active:scale-90 transition-all"
                                style={{ color: accentColor, background: `${accentColor}12` }}>
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                    <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center font-black text-sm"
                                        style={{
                                            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                                            border: `1.5px solid ${accentColor}40`,
                                            color: accentColor,
                                            boxShadow: `0 0 16px ${accentColor}20`
                                        }}>
                                        {otherUser?.profilepic
                                            ? <img src={otherUser.profilepic} alt="" className="w-full h-full object-cover" />
                                            : otherUser?.name?.[0]?.toUpperCase()
                                        }
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#060608]"
                                        style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-black text-white uppercase tracking-wider leading-none">
                                        {otherUser?.name}
                                    </h2>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: accentColor }} />
                                        <span className="text-[9px] font-bold uppercase tracking-[2px]"
                                            style={{ color: `${accentColor}90` }}>online</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3 dots menu */}
                        <div className="relative">
                            <button
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-white/30 hover:text-white/70 transition-colors"
                                style={{ background: "rgba(255,255,255,0.04)" }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                {/* ═══ MESSAGES ═══ */}
                <main className="sc-messages px-4 py-5 relative z-10">
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                                <span className="text-[9px] font-bold uppercase tracking-[3px] text-white/20 px-3 py-1 rounded-full"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    {date}
                                </span>
                                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                            </div>

                            <div className="space-y-1.5">
                                {msgs.map((m, i) => {
                                    // ✅ FIXED: myId se compare karo
                                    const isMine = (m.sender?._id || m.sender) === myId;
                                    const prevMsg = msgs[i - 1];
                                    const isSameSender = prevMsg &&
                                        (prevMsg.sender?._id || prevMsg.sender) === (m.sender?._id || m.sender);

                                    return (
                                        <div key={m._id || i}
                                            className={`msg-bubble flex ${isMine ? "justify-end" : "justify-start"} ${isSameSender ? "mt-0.5" : "mt-3"}`}>
                                            <div className="max-w-[78%]">
                                                <div className="px-4 py-2.5 text-[13.5px] leading-relaxed"
                                                    style={{
                                                        borderRadius: isMine
                                                            ? isSameSender ? "18px 4px 4px 18px" : "18px 4px 18px 18px"
                                                            : isSameSender ? "4px 18px 18px 4px" : "4px 18px 18px 18px",
                                                        background: isMine
                                                            ? `linear-gradient(135deg, ${accentColor}35, ${accentColor}18)`
                                                            : "rgba(255,255,255,0.05)",
                                                        border: `1px solid ${isMine ? `${accentColor}40` : "rgba(255,255,255,0.07)"}`,
                                                        color: "#fff",
                                                        backdropFilter: "blur(12px)",
                                                        boxShadow: isMine ? `0 4px 20px ${accentColor}15` : "none"
                                                    }}>
                                                    <p>{m.content}</p>
                                                    <span className="text-[9px] block mt-1 text-right font-mono"
                                                        style={{ color: isMine ? `${accentColor}70` : "rgba(255,255,255,0.2)" }}>
                                                        {formatTime(m.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {istyping && (
                        <div className="flex items-center gap-2.5 mt-4 ml-1">
                            <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                                <div className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                                <div className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                                <div className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                            </div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: `${accentColor}60` }}>
                                {otherUser?.name} typing
                            </span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                {/* ═══ INPUT ═══ */}
                <footer className="flex-shrink-0 px-4 py-3 relative z-20"
                    style={{ background: "rgba(6,6,8,0.9)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-[24px]"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <input
                            value={newmessage}
                            onChange={typingHandler}
                            onKeyDown={sendMessage}
                            onFocus={() => setTimeout(scrollToBottom, 300)}
                            placeholder={`Message ${otherUser?.name?.split(" ")[0]}...`}
                            className="flex-1 bg-transparent outline-none text-white py-2 placeholder-white/20"
                            style={{ fontSize: "16px" }}
                        />
                        <button onClick={sendMessage}
                            disabled={!newmessage.trim()}
                            className="w-10 h-10 flex items-center justify-center rounded-[14px] flex-shrink-0 transition-all active:scale-90 disabled:opacity-30"
                            style={{
                                background: newmessage.trim() ? `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)` : "rgba(255,255,255,0.06)",
                                boxShadow: newmessage.trim() ? `0 4px 16px ${accentColor}40` : "none"
                            }}>
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                                    stroke={newmessage.trim() ? "#000" : "rgba(255,255,255,0.3)"}
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default SingleChat;