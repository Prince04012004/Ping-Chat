import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../Context/ChatProvider";
import API from "../services/api";
import ProfileModal from "../pages/Profile";

const ChatBox = () => {
  const { selectedChat, setSelectedChat, user, config, hexToRGBA } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const accentColor = config?.accent || "#10b981";
  
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // --- KEYBOARD HEIGHT FIX (WHATSAPP STYLE) ---
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const viewport = window.visualViewport;
        const chatContainer = document.getElementById("chat-container");
        if (chatContainer) {
          // Keyboard khulne par height kam ho jayegi par header-footer wahi rahenge
          chatContainer.style.height = `${viewport.height}px`;
        }
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = user?.token || localStorage.getItem("token");
      const { data } = await API.post("/api/sendmessage",
        { content: newMessage, chatid: selectedChat._id },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setNewMessage("");
      setMessages(prev => [...prev, data]);
    } catch (err) { console.error(err); }
  };

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

  if (!selectedChat) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full opacity-20">
        <p className="font-black tracking-[10px] text-[10px] uppercase text-white italic">Signal Lost</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* Premium Cyber Background Animation */
        @keyframes nebula {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-5%, 5%) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .nebula-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 30%, ${hexToRGBA(accentColor, 0.08)} 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, ${hexToRGBA(accentColor, 0.05)} 0%, transparent 40%);
          filter: blur(60px);
          animation: nebula 10s infinite alternate ease-in-out;
          z-index: 0;
        }
      `}</style>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />
      
      <div
        id="chat-container"
        className="fixed inset-0 z-[100] md:relative md:inset-auto md:flex md:flex-1 flex flex-col bg-[#050505] overflow-hidden"
        style={{ fontFamily: config?.font }}
      >
        <div className="nebula-bg" />

        {/* ── HEADER ── */}
        <div className="flex-shrink-0 w-full flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-3xl border-b border-white/5 z-20 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSelectedChat(null)} className="p-1 md:hidden" style={{ color: accentColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div onClick={openProfile} className="flex items-center cursor-pointer gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl border-2 flex-shrink-0 overflow-hidden" 
                   style={{ borderColor: hexToRGBA(accentColor, 0.2), backgroundColor: '#111' }}>
                {receiverPic ? <img src={receiverPic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black" style={{color: accentColor}}>{receiverName.charAt(0)}</div>}
              </div>
              <div className="min-w-0">
                <h2 className="text-[14px] font-black text-white truncate uppercase tracking-tight">{receiverName}</h2>
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: accentColor}}></span>
                   <p className="text-[8px] font-bold opacity-50 uppercase tracking-widest text-zinc-400">Secure Line</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg></button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200]">
                <button onClick={openProfile} className="w-full px-4 py-3 text-left text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/5 border-b border-white/5">View Identity</button>
                <button className="w-full px-4 py-3 text-left text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500/5">Block Contact</button>
              </div>
            )}
          </div>
        </div>

        {/* ── MESSAGES (WHATSAPP STYLE SCROLL) ── */}
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar relative z-10 space-y-6">
          {messages.map((m, i) => {
            const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
            return (
              <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className="group relative max-w-[80%]">
                  <div className={`px-4 py-3 text-[14px] shadow-2xl transition-all ${isMine ? 'hover:brightness-110' : ''}`}
                    style={{
                      borderRadius: isMine ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                      backgroundColor: isMine ? hexToRGBA(accentColor, 0.12) : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.2) : 'rgba(255,255,255,0.05)'}`,
                      backdropFilter: 'blur(20px)',
                    }}>
                    {m.content}
                  </div>
                  <p className={`text-[7px] mt-1 font-bold opacity-0 group-hover:opacity-30 uppercase tracking-tighter ${isMine ? 'text-right' : 'text-left'}`}>Delivered</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT BAR (WHATSAPP STYLE FIXED) ── */}
        <div className="flex-shrink-0 p-4 bg-black/20 backdrop-blur-xl border-t border-white/5 z-20">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 pl-4 pr-1.5 py-1.5 rounded-[24px] shadow-inner focus-within:border-white/20 transition-all">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Encrypt message..."
              className="flex-1 bg-transparent outline-none text-[13px] text-white py-2 placeholder:text-zinc-600"
            />
            <button onClick={sendMessage} className="w-10 h-10 flex items-center justify-center rounded-full transition-transform active:scale-90"
                    style={{ backgroundColor: accentColor, color: '#000', boxShadow: `0 0 20px ${hexToRGBA(accentColor, 0.3)}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default ChatBox;