import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../Context/ChatProvider";
import API from "../services/api";
import ProfileModal from "../pages/Profile";

const ChatBox = () => {
  const { selectedChat, setSelectedChat, user, setUser, config, hexToRGBA, chats, setChats } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const accentColor = config?.accent || "#10b981";
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  const getReceiverData = () => {
    if (!selectedChat?.users || !user) return null;
    const userData = user?.user || user;
    const myId = (userData?._id || userData?.id)?.toString();
    const otherUser = selectedChat.users.find(u => (u._id || u.id)?.toString() !== myId);
    return otherUser || selectedChat.users[0];
  };

  const receiver = getReceiverData();
  const receiverName = receiver?.name || receiver?.username || "Aura User";
  const receiverPic = receiver?.profilepic || receiver?.pic || "";

  const openProfile = async () => {
    const targetId = receiver?._id || receiver?.id;
    if (!targetId) return;
    try {
      const { data } = await API.get(`/api/getprofile/${targetId}`, getAuthHeader());
      setProfileUser(data);
      setIsProfileOpen(true);
      setShowMenu(false);
    } catch (err) { console.error(err); }
  };

  const clearChat = async () => {
    if (!window.confirm("Clear all messages?")) return;
    try {
      await API.delete(`/api/delete/${selectedChat._id}`, getAuthHeader());
      setMessages([]);
      setShowMenu(false);
    } catch (err) { console.error(err); }
  };

  const blockUser = async () => {
    const targetId = receiver?._id || receiver?.id;
    if (!targetId) return;
    if (!window.confirm(`Block ${receiverName}?`)) return;
    try {
      const token = user?.token || localStorage.getItem("token");
      const { data } = await API.post(`/api/block`,
        { userblockid: targetId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      let updatedUser = { ...user };
      if (updatedUser.user) {
        updatedUser.user = { ...updatedUser.user, blockedList: data.blockedList };
      } else {
        updatedUser.blockedList = data.blockedList;
      }
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setChats(chats.filter((c) => c._id !== selectedChat._id));
      setSelectedChat(null);
      setShowMenu(false);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?._id) return;
      try {
        const { data } = await API.get(`/api/allmessages/${selectedChat._id}`, getAuthHeader());
        setMessages(data);
      } catch (err) { console.error(err); }
    };
    fetchMessages();
  }, [selectedChat?._id]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = user?.token || localStorage.getItem("token");
      const { data } = await API.post("/api/sendmessage",
        { content: newMessage, chatid: selectedChat._id },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setNewMessage("");
      setMessages([...messages, data]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) alert("Session expired.");
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] md:relative md:inset-auto md:flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        selectedChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0 hidden md:flex'
      }`}
      style={{
        backgroundColor: '#050505',
        fontFamily: config?.font,
        height: '100dvh', // Dynamic viewport height for mobile
      }}
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-[0.08]"
          style={{ backgroundColor: accentColor }} />
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />

      {selectedChat ? (
        <div className="flex flex-col h-full relative">

          {/* ── HEADER ── */}
          <div
            className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 bg-black/80 backdrop-blur-3xl border-b border-white/5 z-20 flex-shrink-0"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="p-1 -ml-1 rounded-full active:scale-90 md:hidden flex-shrink-0"
                style={{ color: accentColor }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <div onClick={openProfile} className="flex items-center cursor-pointer gap-3 min-w-0">
                <div
                  className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center font-bold overflow-hidden rounded-2xl border flex-shrink-0"
                  style={{
                    backgroundColor: hexToRGBA(accentColor, 0.1),
                    color: accentColor,
                    borderColor: hexToRGBA(accentColor, 0.2)
                  }}
                >
                  {receiverPic
                    ? <img src={receiverPic} className="w-full h-full object-cover" alt="receiver" />
                    : <span className="text-base font-black">{receiverName.charAt(0)}</span>
                  }
                </div>
                <div className="min-w-0">
                  <h2 className="text-[13px] md:text-sm font-black text-white tracking-tight uppercase italic truncate max-w-[160px] md:max-w-xs">
                    {receiverName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                    <p className="text-[8px] uppercase tracking-[2px] font-black opacity-40">Live Sync</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex-shrink-0" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-xl text-zinc-500 hover:text-white active:bg-white/5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-44 bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[200]">
                  <button onClick={openProfile} className="w-full px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/5 border-b border-white/5">View Profile</button>
                  <button onClick={clearChat} className="w-full px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/5 border-b border-white/5">Clear Vibe</button>
                  <button onClick={blockUser} className="w-full px-5 py-3.5 text-left text-[10px] font-black uppercase tracking-widest text-red-500/80 hover:bg-red-500/5">Block Aura</button>
                </div>
              )}
            </div>
          </div>

          {/* ── MESSAGES CONTAINER ── */}
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 z-10 flex flex-col"
            style={{ overscrollBehavior: 'contain' }}
          >
            {/* WhatsApp-style push: empty space at top */}
            <div className="flex-grow" />

            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center mb-auto opacity-20 gap-3">
                <div className="w-12 h-12 rounded-full blur-2xl" style={{ backgroundColor: accentColor }} />
                <p className="text-[10px] uppercase tracking-[6px] font-black text-white">Start Chatting</p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((m) => {
                const senderId = (m.sender?._id || m.sender?.id || m.sender);
                const userData = user?.user || user;
                const myId = userData?._id || userData?.id;
                const isMine = senderId === myId;

                return (
                  <div key={m._id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[85%] md:max-w-[70%] px-4 py-3 text-[14px] md:text-[15px] leading-relaxed break-words shadow-lg"
                      style={{
                        borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        backgroundColor: isMine ? hexToRGBA(accentColor, 0.15) : 'rgba(255,255,255,0.06)',
                        color: isMine ? '#fff' : '#e4e4e7',
                        border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.25) : 'rgba(255,255,255,0.08)'}`,
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── INPUT BAR ── */}
          <div
            className="flex-shrink-0 px-4 py-3 md:px-8 md:py-6 bg-black/60 backdrop-blur-2xl border-t border-white/5 z-20"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 15px)' }}
          >
            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/10 pl-5 pr-2 py-2 rounded-[28px] backdrop-blur-3xl shadow-inner">
              <input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Message..."
                className="flex-1 bg-transparent outline-none text-[14px] md:text-base text-white placeholder:text-zinc-600 font-medium"
                style={{ minHeight: '40px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-20 flex-shrink-0"
                style={{ backgroundColor: accentColor, color: '#000' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="h-full hidden md:flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-full blur-[40px]" style={{ backgroundColor: accentColor, opacity: 0.2 }} />
          <p className="opacity-20 font-black tracking-[8px] text-[10px] uppercase text-white">Select Vibe</p>
        </div>
      )}
    </div>
  );
};

export default ChatBox;