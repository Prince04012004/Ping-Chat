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

  // Keyboard height fix logic
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const chatContainer = document.getElementById("chat-container");
        if (chatContainer) {
          chatContainer.style.height = `${window.visualViewport.height}px`;
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
    // Keyboard blur for smoothness
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    const targetId = receiver?._id || receiver?.id;
    if (!targetId) return;

    try {
      const { data } = await API.get(`/api/getprofile/${targetId}`, getAuthHeader());
      setProfileUser(data);
      setShowMenu(false);
      
      // Force modal to top by state change
      setIsProfileOpen(true);
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
      <div className="hidden md:flex flex-col items-center justify-center h-full opacity-20 bg-[#050505]">
        <p className="font-black tracking-[10px] text-[10px] uppercase text-white italic">Signal Lost</p>
      </div>
    );
  }

  return (
    <>
      {/* CRITICAL FIX: ProfileModal ko yahan rakha hai aur z-index ko ensure karne ke liye 
        iske container ko fixed aur top-most banaya hai.
      */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
          <ProfileModal 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
            user={profileUser} 
          />
        </div>
      )}

      <style>{`
        .aura-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 10% 10%, ${hexToRGBA(accentColor, 0.1)} 0%, transparent 40%),
            radial-gradient(circle at 90% 90%, ${hexToRGBA(accentColor, 0.07)} 0%, transparent 40%);
          filter: blur(70px);
          z-index: 0;
          pointer-events: none;
        }
      `}</style>

      <div
        id="chat-container"
        className="fixed inset-0 z-[10] md:relative md:inset-auto md:flex md:flex-1 flex flex-col bg-[#050505] overflow-hidden"
        style={{ fontFamily: config?.font }}
      >
        <div className="aura-bg" />

        {/* --- HEADER --- */}
        <div className="flex-shrink-0 w-full flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-3xl border-b border-white/5 z-20 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSelectedChat(null)} className="p-1 md:hidden" style={{ color: accentColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div onClick={openProfile} className="flex items-center cursor-pointer gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl border flex-shrink-0 overflow-hidden" 
                   style={{ borderColor: hexToRGBA(accentColor, 0.2), backgroundColor: '#0a0a0a' }}>
                {receiverPic ? <img src={receiverPic} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-black" style={{color: accentColor}}>{receiverName.charAt(0)}</div>}
              </div>
              <div className="min-w-0">
                <h2 className="text-[14px] font-black text-white truncate uppercase tracking-tight leading-tight">{receiverName}</h2>
                <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest" style={{color: accentColor}}>Encrypted</p>
              </div>
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[200]">
                <button onClick={openProfile} className="w-full px-4 py-4 text-left text-[10px] font-black text-white uppercase tracking-[2px] hover:bg-white/5 border-b border-white/5">View Identity</button>
                <button className="w-full px-4 py-4 text-left text-[10px] font-black text-red-500 uppercase tracking-[2px] hover:bg-red-500/5">Block User</button>
              </div>
            )}
          </div>
        </div>

        {/* --- MESSAGES --- */}
        <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar relative z-10 space-y-6">
          {messages.map((m) => {
            const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
            return (
              <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-3 text-[14px] leading-relaxed shadow-2xl"
                  style={{
                    borderRadius: isMine ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                    backgroundColor: isMine ? hexToRGBA(accentColor, 0.15) : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.2) : 'rgba(255,255,255,0.06)'}`,
                    backdropFilter: 'blur(20px)',
                  }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* --- INPUT BAR --- */}
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-xl border-t border-white/5 z-20">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 pl-4 pr-1.5 py-1.5 rounded-[24px]">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type message..."
              className="flex-1 bg-transparent outline-none text-[13px] text-white py-2"
            />
            <button onClick={sendMessage} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform"
                    style={{ backgroundColor: accentColor, color: '#000' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;