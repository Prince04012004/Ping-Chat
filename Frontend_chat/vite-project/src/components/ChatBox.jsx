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
  const inputRef = useRef(null);

  // --- KEYBOARD & VIEWPORT LOGIC ---
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const chatWrapper = document.getElementById("chat-box-wrapper");
        if (chatWrapper) {
          // Height ko keyboard ke bache hue area ke barabar set karna
          chatWrapper.style.height = `${window.visualViewport.height}px`;
          // Browser ko force karna ki wo scroll na kare
          window.scrollTo(0, 0);
        }
      }
    };

    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      window.visualViewport?.removeEventListener("scroll", handleViewportChange);
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
        /* Kill browser default push */
        html, body {
          overflow: hidden !important;
          position: fixed;
          width: 100%;
          height: 100%;
          background: #000;
        }

        #chat-box-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          background-color: #050505;
          z-index: 100;
          overflow: hidden;
        }

        .premium-aura {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 15% 15%, ${hexToRGBA(accentColor, 0.08)} 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, ${hexToRGBA(accentColor, 0.05)} 0%, transparent 45%);
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }

        .msg-bubble { animation: msgFade 0.2s ease-out; }
        @keyframes msgFade {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {isProfileOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />
        </div>
      )}

      <div id="chat-box-wrapper" style={{ fontFamily: config?.font }}>
        <div className="premium-aura" />

        {/* --- HEADER (STICKY TO TOP) --- */}
        <div className="flex-shrink-0 w-full h-[70px] flex items-center justify-between px-4 bg-black/60 backdrop-blur-3xl border-b border-white/5 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="p-1 md:hidden" style={{ color: accentColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <div onClick={openProfile} className="flex items-center cursor-pointer gap-3">
              <div className="w-11 h-11 rounded-2xl border-2 overflow-hidden bg-zinc-900" style={{ borderColor: hexToRGBA(accentColor, 0.2) }}>
                {receiverPic ? <img src={receiverPic} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-black" style={{color: accentColor}}>{receiverName.charAt(0)}</div>}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] font-black text-white uppercase italic leading-none">{receiverName}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{backgroundColor: accentColor}}></div>
                   <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Connected</p>
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
              <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-4 top-16 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl z-[150] overflow-hidden">
              <button onClick={openProfile} className="w-full px-4 py-4 text-left text-[10px] font-black text-white uppercase border-b border-white/5 hover:bg-white/5">View Identity</button>
              <button className="w-full px-4 py-4 text-left text-[10px] font-black text-red-500 uppercase hover:bg-red-500/5">Block User</button>
            </div>
          )}
        </div>

        {/* --- CHAT AREA --- */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 relative z-10 custom-scrollbar">
          {messages.map((m) => {
            const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
            return (
              <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} msg-bubble`}>
                <div className="max-w-[82%] px-4 py-3 text-[14px] leading-relaxed shadow-xl"
                  style={{
                    borderRadius: isMine ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                    backgroundColor: isMine ? hexToRGBA(accentColor, 0.15) : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.2) : 'rgba(255,255,255,0.06)'}`,
                    backdropFilter: 'blur(15px)',
                  }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* --- INPUT BAR --- */}
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-3xl border-t border-white/5 z-20">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 pl-5 pr-1.5 py-1.5 rounded-[26px]">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Start typing..."
              className="flex-1 bg-transparent outline-none text-[14px] text-white py-2"
            />
            <button onClick={sendMessage} className="w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-all"
                    style={{ backgroundColor: accentColor, color: '#000', boxShadow: `0 0 20px ${hexToRGBA(accentColor, 0.4)}` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;