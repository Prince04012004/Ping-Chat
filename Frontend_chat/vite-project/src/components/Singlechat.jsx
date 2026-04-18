import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";
import ProfileModal from "../pages/Profile";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
var socket, selectedchatcompare;

const SingleChat = () => {
    const [messages, setmessages] = useState([]);
    const [newmessage, setnewmessage] = useState("");
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const chatAreaRef = useRef(null);

    const { user, selectedChat, setSelectedChat, notification, setNotification, config, hexToRGBA } = ChatState();
    const accentColor = config?.accent || "#10b981";

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

    // ✅ LIVE MESSAGE RECEIVE
    useEffect(() => {
        socket.on("message received", (newMessageReceived) => {
            if (!selectedchatcompare || selectedchatcompare._id !== newMessageReceived.chat._id) {
                if (!notification.some((n) => n._id === newMessageReceived._id)) {
                    setNotification([newMessageReceived, ...notification]);
                }
            } else {
                setmessages((prevMessages) => [...prevMessages, newMessageReceived]);
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
                setmessages([...messages, data]);
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

    // ✅ BLOCK USER
    const handleBlockUser = async () => {
        if (!window.confirm(`Block ${otherUser?.name}?`)) return;
        try {
            await API.post("/api/blockuser", { userblockid: otherUser._id });
            alert("User Blocked");
            setSelectedChat(null);
        } catch (err) { alert("Failed to block"); }
        setShowMenu(false);
    };

    if (!selectedChat) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full gap-4"
                style={{ background: "linear-gradient(135deg, #050505 0%, #0a0a0f 100%)" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
                    style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`, border: `1px solid ${accentColor}33` }}>
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                        <path d="M8 10h8M8 14h5" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.52 3.66 1.43 5.17L2 22l4.83-1.43A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" stroke={accentColor} strokeWidth="1.5"/>
                    </svg>
                </div>
                <p className="text-white/20 text-xs font-bold uppercase tracking-[4px]">Select a conversation</p>
            </div>
        );
    }

    const otherUser = selectedChat.users?.find(u => u._id !== (user?.user?._id || user?._id));

    const formatTime = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    // Group messages by date
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
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    z-index: 0;
                }

                /* Subtle noise texture */
                .sc-bg::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
                    opacity: 0.4;
                }

                /* Grid */
                .sc-bg::after {
                    content: '';
                    position: absolute;
                    inset: 0;
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
                .sc-messages::-webkit-scrollbar-thumb { 
                    background: rgba(255,255,255,0.08); 
                    border-radius: 4px; 
                }

                @keyframes msgIn {
                    from { opacity: 0; transform: translateY(8px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .msg-bubble {
                    animation: msgIn 0.2s ease forwards;
                }

                @keyframes typingPulse {
                    0%, 100% { opacity: 0.3; transform: translateY(0); }
                    50% { opacity: 1; transform: translateY(-3px); }
                }

                .typing-dot:nth-child(1) { animation: typingPulse 1.2s ease infinite 0s; }
                .typing-dot:nth-child(2) { animation: typingPulse 1.2s ease infinite 0.2s; }
                .typing-dot:nth-child(3) { animation: typingPulse 1.2s ease infinite 0.4s; }

                .menu-item {
                    transition: background 0.15s;
                }
                .menu-item:hover {
                    background: rgba(255,255,255,0.04);
                }
            `}</style>

            {isProfileOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center">
                    <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={otherUser} />
                </div>
            )}

            <div id="sc-container" ref={containerRef}>
                <div className="sc-bg" />

                {/* ═══ HEADER ═══ */}
                <header className="flex-shrink-0 relative z-[150]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    
                    {/* Accent glow top line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />

                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ background: "rgba(6,6,8,0.85)", backdropFilter: "blur(24px)" }}>

                        {/* Left: back + user info */}
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedChat(null)}
                                className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90"
                                style={{ color: accentColor, background: `${accentColor}12` }}>
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                                    <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </button>

                            <button onClick={() => { setIsProfileOpen(true); setShowMenu(false); }}
                                className="flex items-center gap-3 group">
                                {/* Avatar */}
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
                                    {/* Online dot */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#060608]"
                                        style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
                                </div>

                                {/* Name + status */}
                                <div className="text-left">
                                    <h2 className="text-[13px] font-black text-white uppercase tracking-wider leading-none">
                                        {otherUser?.name}
                                    </h2>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: accentColor }} />
                                        <span className="text-[9px] font-bold uppercase tracking-[2px]"
                                            style={{ color: `${accentColor}90` }}>
                                            online
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Right: menu */}
                        <div className="relative">
                            <button onClick={() => setShowMenu(!showMenu)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-white/30 hover:text-white/70 transition-colors"
                                style={{ background: "rgba(255,255,255,0.04)" }}>
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                                </svg>
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-[190]" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl z-[200] overflow-hidden"
                                        style={{
                                            background: "rgba(10,10,14,0.97)",
                                            border: `1px solid ${accentColor}25`,
                                            backdropFilter: "blur(24px)",
                                            boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`
                                        }}>
                                        <button onClick={() => { setIsProfileOpen(true); setShowMenu(false); }}
                                            className="menu-item w-full flex items-center gap-3 px-4 py-3.5 text-left"
                                            style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                style={{ background: `${accentColor}18` }}>
                                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="8" r="4" stroke={accentColor} strokeWidth="1.5"/>
                                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                            <span className="text-[12px] text-white/70 font-semibold">View Profile</span>
                                        </button>
                                        <button onClick={handleBlockUser}
                                            className="menu-item w-full flex items-center gap-3 px-4 py-3.5 text-left">
                                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10">
                                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="1.5"/>
                                                    <path d="M6 6l12 12" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                                                </svg>
                                            </div>
                                            <span className="text-[12px] text-red-400 font-semibold">Block User</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* ═══ MESSAGES ═══ */}
                <main ref={chatAreaRef} className="sc-messages px-4 py-5 relative z-10">
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            {/* Date separator */}
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                                <span className="text-[9px] font-bold uppercase tracking-[3px] text-white/20 px-3 py-1 rounded-full"
                                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                                    {date}
                                </span>
                                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                            </div>

                            <div className="space-y-2">
                                {msgs.map((m, i) => {
                                    const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
                                    const prevMsg = msgs[i - 1];
                                    const isSameSender = prevMsg && (prevMsg.sender?._id || prevMsg.sender) === (m.sender?._id || m.sender);

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

                    {/* Typing indicator */}
                    {istyping && (
                        <div className="flex items-center gap-2.5 mt-4 ml-1">
                            <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
                                style={{
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.07)"
                                }}>
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
                    style={{
                        background: "rgba(6,6,8,0.9)",
                        backdropFilter: "blur(24px)",
                        borderTop: "1px solid rgba(255,255,255,0.05)"
                    }}>
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-[24px] transition-all duration-200"
                        style={{
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid rgba(255,255,255,0.08)`,
                        }}>
                        <input
                            value={newmessage}
                            onChange={typingHandler}
                            onKeyDown={sendMessage}
                            onFocus={() => setTimeout(scrollToBottom, 300)}
                            placeholder={`Message ${otherUser?.name?.split(" ")[0]}...`}
                            className="flex-1 bg-transparent outline-none text-white py-2 placeholder-white/20"
                            style={{ fontSize: "16px", fontFamily: "inherit" }}
                        />
                        <button onClick={sendMessage}
                            disabled={!newmessage.trim()}
                            className="w-10 h-10 flex items-center justify-center rounded-[14px] flex-shrink-0 transition-all active:scale-90 disabled:opacity-30"
                            style={{
                                background: newmessage.trim()
                                    ? `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`
                                    : "rgba(255,255,255,0.06)",
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