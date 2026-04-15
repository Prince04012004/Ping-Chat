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

  // Fix keyboard pushing layout on mobile
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
      // Refocus input after send on mobile
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
        // Fix for mobile: use dynamic viewport height
        height: '100dvh',
      }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-[0.08]"
          style={{ backgroundColor: accentColor }} />
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />

      {selectedChat ? (
        <div className="flex flex-col h-full">

          {/* ── HEADER ── */}
          <div
            className="flex items-center justify-between px-3 py-2 md:px-6 md:py-4 bg-black/70 backdrop-blur-3xl border-b border-white/5 z-20 flex-shrink-0"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 10px)' }}
          >
            <div className="flex items-center gap-2">
              {/* Back button — mobile only */}
              <button
                onClick={() => setSelectedChat(null)}
                className="p-1.5 -ml-1 rounded-full active:scale-90 md:hidden flex-shrink-0"
                style={{ color: accentColor }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              {/* Avatar + name */}
              <div onClick={openProfile} className="flex items-center cursor-pointer gap-2 min-w-0">
                <div
                  className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center font-bold overflow-hidden rounded-xl border flex-shrink-0"
                  style={{
                    backgroundColor: hexToRGBA(accentColor, 0.1),
                    color: accentColor,
                    borderColor: hexToRGBA(accentColor, 0.2)
                  }}
                >
                  {receiverPic
                    ? <img src={receiverPic} className="w-full h-full object-cover" alt="receiver" />
                    : <span className="text-sm font-black">{receiverName.charAt(0)}</span>
                  }
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs md:text-sm font-black text-white/90 tracking-tight uppercase italic truncate max-w-[140px] md:max-w-xs">
                    {receiverName}
                  </h2>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                    <p className="text-[7px] uppercase tracking-[1.5px] font-black opacity-40">Synchronized</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3-dot menu */}
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-xl text-zinc-500 hover:text-white transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[200]">
                  <button onClick={openProfile} className="w-full px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/70 hover:bg-white/5 border-b border-white/5 active:bg-white/10">
                    View Identity
                  </button>
                  <button onClick={clearChat} className="w-full px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-white/70 hover:bg-white/5 border-b border-white/5 active:bg-white/10">
                    Clear Vibe
                  </button>
                  <button onClick={blockUser} className="w-full px-4 py-3 text-left text-[9px] font-black uppercase tracking-widest text-red-500/80 hover:bg-red-500/5 active:bg-red-500/10">
                    Block Aura
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── MESSAGES ── */}
          <div className="flex-1 overflow-y-auto px-3 py-4 md:px-6 md:py-6 space-y-3 md:space-y-4 z-10"
            style={{ overscrollBehavior: 'contain' }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-20 gap-2">
                <div className="w-10 h-10 rounded-full blur-xl" style={{ backgroundColor: accentColor }} />
                <p className="text-[9px] uppercase tracking-[4px] font-black text-white">Start the vibe</p>
              </div>
            )}

            {messages.map((m) => {
              const senderId = (m.sender?._id || m.sender?.id || m.sender);
              const userData = user?.user || user;
              const myId = userData?._id || userData?.id;
              const isMine = senderId === myId;

              return (
                <div key={m._id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-[80%] md:max-w-[70%] px-3.5 py-2.5 text-[13px] md:text-[14px] leading-relaxed break-words"
                    style={{
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: isMine ? hexToRGBA(accentColor, 0.12) : 'rgba(255,255,255,0.04)',
                      color: isMine ? '#fff' : '#ccc',
                      border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.2) : 'rgba(255,255,255,0.06)'}`,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ── INPUT BAR ── */}
          <div
            className="flex-shrink-0 px-3 py-2 md:px-6 md:py-4 bg-black/40 backdrop-blur-xl border-t border-white/5 z-20"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 10px)' }}
          >
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 pl-4 pr-1.5 py-1.5 rounded-[24px] backdrop-blur-3xl">
              <input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Message..."
                className="flex-1 bg-transparent outline-none text-[13px] md:text-sm text-white placeholder:text-zinc-600 font-medium"
                style={{ minHeight: '36px' }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 disabled:opacity-30 flex-shrink-0"
                style={{ backgroundColor: accentColor, color: '#000' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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