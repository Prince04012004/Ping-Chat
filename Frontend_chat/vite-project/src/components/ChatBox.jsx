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

  // --- BRAHMASTRA: THE ONLY WAY TO STOP THE JUMP ---
  useEffect(() => {
    const fixViewport = () => {
      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        const offset = window.visualViewport.offsetTop;
        const wrapper = document.getElementById("aura-chat-root");
        if (wrapper) {
          // Keyboard khulne par height lock aur top offset zero
          wrapper.style.height = `${vh}px`;
          wrapper.style.top = `${offset}px`;
        }
        window.scrollTo(0, 0); // Force stop browser push
      }
    };

    window.visualViewport?.addEventListener("resize", fixViewport);
    window.visualViewport?.addEventListener("scroll", fixViewport);
    fixViewport();

    return () => {
      window.visualViewport?.removeEventListener("resize", fixViewport);
      window.visualViewport?.removeEventListener("scroll", fixViewport);
    };
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
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const targetId = receiver?._id || receiver?.id;
    if (!targetId) return;
    try {
      const { data } = await API.get(`/api/getprofile/${targetId}`, getAuthHeader());
      setProfileUser(data);
      setShowMenu(false);
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

  if (!selectedChat) return null;

  return (
    <>
      <style>{`
        /* Global override to stop browser jump */
        html, body {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
          background: #000;
        }

        #aura-chat-root {
          position: fixed;
          left: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          background: #050505;
          z-index: 100;
          transition: height 0.1s ease-out;
        }

        .cyber-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.3;
          pointer-events: none;
        }

        .glow-aura {
          position: absolute;
          width: 300px; height: 300px;
          background: ${hexToRGBA(accentColor, 0.12)};
          filter: blur(100px);
          border-radius: 50%;
          top: 10%; left: 10%;
          pointer-events: none;
        }
      `}</style>

      {isProfileOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />
        </div>
      )}

      <div id="aura-chat-root" style={{ fontFamily: config?.font }}>
        <div className="cyber-grid" />
        <div className="glow-aura" />

        {/* --- STICKY HEADER --- */}
        <header className="flex-shrink-0 w-full h-[70px] flex items-center justify-between px-5 bg-black/80 backdrop-blur-3xl border-b border-white/5 z-[110]">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setSelectedChat(null)} className="p-1 md:hidden" style={{ color: accentColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div onClick={openProfile} className="flex items-center cursor-pointer gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl border-2 overflow-hidden bg-black" style={{ borderColor: hexToRGBA(accentColor, 0.3) }}>
                {receiverPic ? <img src={receiverPic} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-black" style={{color: accentColor}}>{receiverName.charAt(0)}</div>}
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-black text-white truncate uppercase italic leading-tight">{receiverName}</h2>
                <div className="flex items-center gap-1 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: accentColor}}></div>
                   <p className="text-[8px] font-bold opacity-30 uppercase tracking-[2px]">Encrypted</p>
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-5 top-16 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-[150] overflow-hidden">
              <button onClick={openProfile} className="w-full px-4 py-4 text-[10px] font-black text-white uppercase border-b border-white/5">View Info</button>
              <button className="w-full px-4 py-4 text-[10px] font-black text-red-500 uppercase">Clear</button>
            </div>
          )}
        </header>

        {/* --- CHAT SECTION --- */}
        <main className="flex-1 overflow-y-auto px-5 py-6 space-y-6 relative z-10 custom-scrollbar">
          {messages.map((m) => {
            const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
            return (
              <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-3 text-[14px] leading-relaxed shadow-lg"
                  style={{
                    borderRadius: isMine ? '22px 22px 4px 22px' : '22px 22px 22px 4px',
                    backgroundColor: isMine ? hexToRGBA(accentColor, 0.15) : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.2) : 'rgba(255,255,255,0.06)'}`,
                    backdropFilter: 'blur(10px)',
                  }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* --- FOOTER (STICKY) --- */}
        <footer className="flex-shrink-0 p-4 bg-black/60 backdrop-blur-3xl border-t border-white/5 z-20">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 pl-5 pr-1.5 py-1.5 rounded-[26px]">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Signal..."
              className="flex-1 bg-transparent outline-none text-[14px] text-white py-2"
            />
            <button onClick={sendMessage} className="w-11 h-11 flex items-center justify-center rounded-full"
                    style={{ backgroundColor: accentColor, color: '#000', boxShadow: `0 0 15px ${hexToRGBA(accentColor, 0.3)}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ChatBox;