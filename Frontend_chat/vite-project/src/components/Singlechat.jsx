import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
let socketInstance = null;

const SingleChat = () => {
    const [messages, setmessages] = useState([]);
    const [newmessage, setnewmessage] = useState("");
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const selectedChatRef = useRef(null);

    const { user, selectedChat, setSelectedChat, setNotification, config } = ChatState();
    const accentColor = config?.accent || "#10b981";
    const myId = user?.user?._id || user?._id;

    const getAuthHeader = () => {
        const token = user?.token || localStorage.getItem("token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Socket setup — runs once when user is available
    useEffect(() => {
        if (!user) return;
        socketInstance = io(ENDPOINT);
        socketInstance.emit("setup", user);

        socketInstance.on("typing", () => setIsTyping(true));
        socketInstance.on("stop typing", () => setIsTyping(false));

        socketInstance.on("message received", (newMsg) => {
            const currentChat = selectedChatRef.current;
            if (!currentChat || currentChat._id !== newMsg.chat._id) {
                setNotification((prev) => [newMsg, ...prev]);
            } else {
                setmessages((prev) => [...prev, newMsg]);
                setTimeout(scrollToBottom, 100);
            }
        });

        return () => {
            socketInstance.disconnect();
            socketInstance = null;
        };
    }, [user]);

    const getmessages = async (pageNum = 1) => {
        if (!selectedChat?._id) return;
        try {
            const { data } = await API.get(
                `/api/allmessages/${selectedChat._id}?page=${pageNum}`,
                getAuthHeader()
            );

            const newMsgs = Array.isArray(data.messages) ? data.messages : [];

            setmessages((prev) => (pageNum === 1 ? newMsgs : [...newMsgs, ...prev]));
            setHasMore(data.hasMore || false);

            if (pageNum === 1) {
                socketInstance?.emit("join chat", selectedChat._id);
                setTimeout(scrollToBottom, 200);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    // Reset and fetch when chat changes
    useEffect(() => {
        if (!selectedChat?._id) return;
        setmessages([]);
        setPage(1);
        setHasMore(true);
        getmessages(1);
    }, [selectedChat?._id]);

    const handleScroll = async (e) => {
        const { scrollTop, scrollHeight } = e.currentTarget;
        if (scrollTop < 10 && hasMore && !loadingMore) {
            setLoadingMore(true);
            const nextPage = page + 1;
            const prevHeight = scrollHeight;

            await getmessages(nextPage);
            setPage(nextPage);

            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop =
                        containerRef.current.scrollHeight - prevHeight;
                }
            }, 50);
        }
    };

    const sendMessage = async (event) => {
        if ((event.key === "Enter" || event.type === "click") && newmessage.trim()) {
            socketInstance?.emit("stop typing", selectedChat._id);
            try {
                const content = newmessage;
                setnewmessage("");
                const { data } = await API.post(
                    "/api/sendmessage",
                    { content, chatid: selectedChat._id },
                    getAuthHeader()
                );
                socketInstance?.emit("new message", data);
                setmessages((prev) => [...prev, data]);
                setTimeout(scrollToBottom, 50);
            } catch (err) {
                console.error("Send error:", err);
            }
        }
    };

    const typingHandler = (e) => {
        setnewmessage(e.target.value);
        if (!typing) {
            setTyping(true);
            socketInstance?.emit("typing", selectedChat._id);
        }
        const lastTypingTime = new Date().getTime();
        setTimeout(() => {
            if (new Date().getTime() - lastTypingTime >= 3000 && typing) {
                socketInstance?.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, 3000);
    };

    const otherUser =
        selectedChat?.users?.find((u) => (u._id || u) !== myId) || { name: "User" };

    const groupedMessages = (messages || []).reduce((groups, msg) => {
        if (!msg?.createdAt) return groups;
        const date = new Date(msg.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
        });
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    if (!selectedChat) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-[#060608]">
                <p className="text-white/20 text-[10px] font-bold uppercase tracking-[4px]">
                    Select a conversation
                </p>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full w-full bg-[#060608] overflow-hidden"
            style={{ minHeight: 0 }}
        >
            <style>{`
                @keyframes typingPulse {
                    0%, 100% { opacity: 0.3; transform: translateY(0); }
                    50%       { opacity: 1;   transform: translateY(-3px); }
                }
                .typing-dot {
                    width: 4px; height: 4px; border-radius: 50%;
                    animation: typingPulse 1.2s ease infinite;
                }
            `}</style>

            {/* Header */}
            <header className="flex-shrink-0 z-10 px-4 py-3 border-b border-white/5 bg-[#060608]/90 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden p-2 rounded-lg bg-white/5 text-white"
                    >
                        <svg
                            width="18"
                            height="18"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-[11px] font-black text-white uppercase tracking-widest">
                        {otherUser.name}
                    </h2>
                </div>
            </header>

            {/* Messages */}
            <main
                className="flex-1 overflow-y-auto px-4 py-4"
                style={{ minHeight: 0 }}
                ref={containerRef}
                onScroll={handleScroll}
            >
                {loadingMore && (
                    <div className="text-center text-[10px] text-white/30 py-2">
                        Loading older messages...
                    </div>
                )}

                {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[2px]">
                                {date}
                            </span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        <div className="space-y-2">
                            {msgs.map((m, i) => {
                                const isMine = (m.sender?._id || m.sender) === myId;
                                return (
                                    <div
                                        key={m._id || i}
                                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className="max-w-[80%] px-4 py-2 rounded-2xl text-[14px] text-white"
                                            style={{
                                                background: isMine
                                                    ? `${accentColor}20`
                                                    : "rgba(255,255,255,0.05)",
                                                border: `1px solid ${
                                                    isMine
                                                        ? `${accentColor}40`
                                                        : "rgba(255,255,255,0.08)"
                                                }`,
                                            }}
                                        >
                                            {m.content}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {istyping && (
                    <div className="flex gap-1.5 p-3 mt-2 w-fit bg-white/5 rounded-2xl border border-white/10">
                        <div className="typing-dot" style={{ background: accentColor, animationDelay: "0s" }} />
                        <div className="typing-dot" style={{ background: accentColor, animationDelay: "0.2s" }} />
                        <div className="typing-dot" style={{ background: accentColor, animationDelay: "0.4s" }} />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* Footer */}
            <footer className="flex-shrink-0 p-4 bg-[#060608]">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-1">
                    <input
                        value={newmessage}
                        onChange={typingHandler}
                        onKeyDown={sendMessage}
                        placeholder="Message..."
                        className="flex-1 bg-transparent py-3 outline-none text-white text-[14px]"
                    />
                    <button
                        onClick={sendMessage}
                        className="p-2 rounded-xl transition-transform active:scale-90"
                        style={{ color: newmessage.trim() ? accentColor : "#444" }}
                    >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default SingleChat;