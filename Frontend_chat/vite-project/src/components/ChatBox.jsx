import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../Context/ChatProvider";
import API from "../services/api";
import ProfileModal from "../pages/Profile";

const ChatBox = () => {
  const { selectedChat, setSelectedChat, user, config, hexToRGBA } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const accentColor = config?.accent || "#10b981";

  const chatAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // ✅ 1. VIEWPORT HEIGHT LOCK (Butter Smooth)
  useEffect(() => {
    const updateHeight = () => {
      if (window.visualViewport && containerRef.current) {
        const height = window.visualViewport.height;
        // Seedha style update kar rhe hain performance ke liye
        containerRef.current.style.height = `${height}px`;
        // Browser ko scroll hone se rokta hai
        window.scrollTo(0, 0); 
      }
    };

    window.visualViewport?.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('scroll', updateHeight);
    updateHeight();

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('scroll', updateHeight);
    };
  }, []);

  // ✅ 2. PREVENT DEFAULT KEYBOARD SCROLL
  const handleInputFocus = (e) => {
    // Ye browser ko layout shift karne se rokega
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      scrollToBottom(true);
    }, 100);
  };

  const scrollToBottom = (force = false) => {
    if (!chatAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 200;

    if (force || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchMessages = async () => {
    if (!selectedChat?._id) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/api/allmessages/${selectedChat._id}`, getAuthHeader());
      setMessages(data);
      setLoading(false);
    } catch (err) { 
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
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
      setMessages((prev) => [...prev, data]);
      scrollToBottom(true);
    } catch (err) { console.error(err); }
  };

  if (!selectedChat) return null;

  return (
    <>
      <style>{`
        /* Body overflow ko sakti se band rakho */
        html, body { 
          overflow: hidden !important; 
          height: 100%; 
          position: fixed; 
          width: 100%;
          overscroll-behavior: none;
        }

        #chat-master-container {
          position: fixed;
          top: 0; left: 0; width: 100%;
          display: flex; flex-direction: column;
          background: #050505;
          z-index: 100;
          overflow: hidden;
          will-change: height;
          /* Transition thoda tez rakha hai keyboard speed match karne ke liye */
          transition: height 0.15s ease-out;
        }

        .cyber-grid { position: absolute; inset: 0; background-image: linear-gradient(${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px); background-size: 45px 45px; opacity: .4; z-index: 0; pointer-events: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${hexToRGBA(accentColor, 0.3)}; border-radius: 10px; }
      `}</style>

      <div id="chat-master-container" ref={containerRef} style={{ fontFamily: config?.font }}>
        <div className="cyber-grid" />

        {/* HEADER */}
        <header className="flex-shrink-0 w-full h-[70px] flex items-center justify-between px-5 bg-black/90 backdrop-blur-3xl border-b border-white/5 z-[150]">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedChat(null)} className="p-1" style={{ color: accentColor }}> ← </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-zinc-900">
                {receiverPic && <img src={receiverPic} className="w-full h-full object-cover" />}
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">{receiverName}</h2>
            </div>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-500"> ⋮ </button>
        </header>

        {/* MESSAGES AREA */}
        <main ref={chatAreaRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-6 relative z-10 custom-scrollbar">
          {messages.map((m) => {
            const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] px-4 py-3 text-[14px] shadow-2xl"
                  style={{
                    borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    backgroundColor: isMine ? hexToRGBA(accentColor, 0.15) : "rgba(255,255,255,0.03)",
                    color: "#fff",
                    border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.2) : "rgba(255,255,255,0.05)"}`,
                    backdropFilter: "blur(10px)"
                  }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* INPUT AREA */}
        <footer className="flex-shrink-0 p-4 bg-black/60 backdrop-blur-3xl border-t border-white/5 z-20">
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 pl-5 pr-1.5 py-1.5 rounded-full shadow-inner">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onFocus={handleInputFocus}
              placeholder="Inject signal..."
              className="flex-1 bg-transparent outline-none text-sm text-white py-2"
            />
            <button onClick={sendMessage} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all"
              style={{ backgroundColor: accentColor, color: "#000" }}>
              ➤
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ChatBox;