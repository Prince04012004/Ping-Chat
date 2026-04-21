import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";
import ProfileModal from "../pages/Profile";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
let socketInstance = null;

const SingleChat = () => {
    const [messages, setmessages] = useState([]);
    const [newmessage, setnewmessage] = useState("");
    const [typing, setTyping] = useState(false);
    const [istyping, setIsTyping] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    // ✅ PAGINATION STATES
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const messagesEndRef = useRef(null);
    const containerRef = useRef(null); // Ye messages container ke liye hai
    const chatContainerRef = useRef(null); // Ye viewport height ke liye
    const selectedChatRef = useRef(null);

    const { user, selectedChat, setSelectedChat, notification, setNotification, config } = ChatState();
    const accentColor = config?.accent || "#10b981";
    const myId = user?.user?._id || user?._id;

    const getAuthHeader = () => {
        const token = user?.token || localStorage.getItem("token");
        return { headers: { Authorization: `Bearer ${token}` } };
    };

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    // ✅ KEYBOARD & VIEWPORT FIX
    useEffect(() => {
        const syncHeight = () => {
            if (window.visualViewport && chatContainerRef.current) {
                chatContainerRef.current.style.height = `${window.visualViewport.height}px`;
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
        if (!user) return;
        socketInstance = io(ENDPOINT);
        socketInstance.emit("setup", user);
        socketInstance.on("connected", () => console.log("✅ Socket Connected"));
        socketInstance.on("typing", () => setIsTyping(true));
        socketInstance.on("stop typing", () => setIsTyping(false));

        socketInstance.on("message received", (newMsg) => {
            const currentChat = selectedChatRef.current;
            if (!currentChat || currentChat._id !== newMsg.chat._id) {
                setNotification((prev) => {
                    if (prev.some((n) => n._id === newMsg._id)) return prev;
                    return [newMsg, ...prev];
                });
            } else {
                setmessages((prev) => [...prev, newMsg]);
            }
        });

        return () => {
            socketInstance.disconnect();
            socketInstance = null;
        };
    }, [user]);

    // ✅ FETCH MESSAGES WITH PAGINATION
    const getmessages = async (pageNum = 1) => {
        try {
            const { data } = await API.get(
                `/api/allmessages/${selectedChat._id}?page=${pageNum}`,
                getAuthHeader()
            );

            // Agar page 1 hai toh naya array, warna purane ke sath merge (naye batch ko upar rakhna hai)
            setmessages((prev) => (pageNum === 1 ? data.messages : [...data.messages, ...prev]));
            setHasMore(data.hasMore);
            
            if (pageNum === 1) {
                socketInstance?.emit("join chat", selectedChat._id);
                setTimeout(scrollToBottom, 100);
            }
        } catch (err) {
            console.log("Message fetch error", err);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (!selectedChat?._id) return;
        setPage(1);
        setHasMore(true);
        getmessages(1);
    }, [selectedChat?._id]);

    // ✅ INFINITE SCROLL LOGIC
    const handleScroll = async (e) => {
        const { scrollTop, scrollHeight } = e.currentTarget;
        
        // Agar user top par pahuche (scrollTop < 5 safe zone)
        if (scrollTop < 5 && hasMore && !loadingMore) {
            setLoadingMore(true);
            const nextPage = page + 1;
            const previousHeight = scrollHeight; // Height capture karo

            await getmessages(nextPage);
            setPage(nextPage);

            // Scroll jump fix: Naye messages load hone ke baad position maintain rakho
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight - previousHeight;
                }
            }, 50);
        }
    };

    // ✅ SEND MESSAGE
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
            } catch (err) { console.log("Send error", err); }
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

    const otherUser = selectedChat?.users?.find(u => u._id !== myId) || {};

    // Grouping logic based on current messages state
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (!groups[date]) groups[date] = [];
        groups[date].push(msg);
        return groups;
    }, {});

    if (!selectedChat) {
        return (
            <div className="flex items-center justify-center h-full w-full" style={{ background: "#060608" }}>
                <p className="text-white/20 text-xs font-bold uppercase tracking-[4px]">Select a conversation</p>
            </div>
        );
    }

    return (
        <>
            <style>{`
                #sc-container { position: fixed; top: 0; left: 0; width: 100%; display: flex; flex-direction: column; overflow: hidden; background: #060608; }
                .sc-messages { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
                @keyframes typingPulse { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-3px); } }
                .typing-dot:nth-child(1) { animation: typingPulse 1.2s ease infinite 0s; }
                .typing-dot:nth-child(2) { animation: typingPulse 1.2s ease infinite 0.2s; }
                .typing-dot:nth-child(3) { animation: typingPulse 1.2s ease infinite 0.4s; }
            `}</style>

            <div id="sc-container" ref={chatContainerRef}>
                {/* HEADER */}
                <header className="flex-shrink-0 relative z-[150]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,6,8,0.9)", backdropFilter: "blur(24px)" }}>
                    <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedChat(null)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl" style={{ color: accentColor, background: `${accentColor}12` }}>
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            <div className="flex items-center gap-3">
                                <h2 className="text-[13px] font-black text-white uppercase tracking-wider">{otherUser?.name}</h2>
                            </div>
                        </div>
                    </div>
                </header>

                {/* MESSAGES WITH INFINITE SCROLL */}
                <main 
                    className="sc-messages px-4 py-5 relative z-10" 
                    ref={containerRef} 
                    onScroll={handleScroll}
                >
                    {loadingMore && (
                        <div className="flex justify-center p-4">
                            <div className="w-5 h-5 border-2 border-t-transparent animate-spin rounded-full" style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }}></div>
                        </div>
                    )}

                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 my-5">
                                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                                <span className="text-[9px] font-bold uppercase tracking-[3px] text-white/20">{date}</span>
                                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
                            </div>

                            <div className="space-y-1.5">
                                {msgs.map((m, i) => {
                                    const isMine = (m.sender?._id || m.sender) === myId;
                                    return (
                                        <div key={m._id || i} className={`flex ${isMine ? "justify-end" : "justify-start"} mt-2`}>
                                            <div className="max-w-[78%] px-4 py-2.5 rounded-2xl text-white text-[13.5px]" style={{
                                                background: isMine ? `linear-gradient(135deg, ${accentColor}35, ${accentColor}18)` : "rgba(255,255,255,0.05)",
                                                border: `1px solid ${isMine ? `${accentColor}40` : "rgba(255,255,255,0.07)"}`
                                            }}>
                                                {m.content}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    
                    {istyping && (
                        <div className="flex items-center gap-2 mt-4 ml-1">
                            <div className="flex gap-1 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
                                <div className="typing-dot w-1 h-1 rounded-full" style={{ background: accentColor }} />
                                <div className="typing-dot w-1 h-1 rounded-full" style={{ background: accentColor }} />
                                <div className="typing-dot w-1 h-1 rounded-full" style={{ background: accentColor }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>

                {/* INPUT */}
                <footer className="flex-shrink-0 px-4 py-3" style={{ background: "rgba(6,6,8,0.9)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <input
                            value={newmessage}
                            onChange={typingHandler}
                            onKeyDown={sendMessage}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent outline-none text-white text-[15px]"
                        />
                        <button onClick={sendMessage} disabled={!newmessage.trim()} className="p-2 rounded-xl transition-all active:scale-90" style={{ background: newmessage.trim() ? accentColor : 'transparent' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={newmessage.trim() ? "#000" : "#666"} strokeWidth="2"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default SingleChat;