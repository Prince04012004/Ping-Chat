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
  const containerRef = useRef(null);

  // ✅ HEIGHT FIX: Isse sab dikhne lagega
  useEffect(() => {
    const updateHeight = () => {
      if (window.visualViewport && containerRef.current) {
        // Direct pixels set kar rahe hain taaki collapse na ho
        containerRef.current.style.height = `${window.visualViewport.height}px`;
      } else if (containerRef.current) {
        containerRef.current.style.height = "100vh";
      }
      window.scrollTo(0, 0);
    };

    window.visualViewport?.addEventListener('resize', updateHeight);
    updateHeight();
    return () => window.visualViewport?.removeEventListener('resize', updateHeight);
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
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
      setMessages((prev) => [...prev, data]);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?._id) return;
      setLoading(true);
      try {
        const { data } = await API.get(`/api/allmessages/${selectedChat._id}`, getAuthHeader());
        setMessages(data);
        setLoading(false);
      } catch (err) { setLoading(false); }
    };
    fetchMessages();
  }, [selectedChat?._id]);

  if (!selectedChat) return null;

  const receiver = selectedChat.users?.find((u) => u._id !== user?.user?._id) || {};

  return (
    <>
      <style>{`
        /* Global CSS reset for this page */
        html, body {
          margin: 0; padding: 0;
          height: 100%; width: 100%;
          overflow: hidden !important;
          background: #000;
        }

        #chat-master-container {
          position: fixed;
          top: 0; left: 0;
          width: 100vw;
          /* Initial height backup */
          height: 100vh; 
          display: flex;
          flex-direction: column;
          background: #050505;
          z-index: 9999;
          overflow: hidden;
        }

        .cyber-grid {
          position: absolute; inset: 0;
          background-image: linear-gradient(${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px),
                            linear-gradient(90deg, ${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px);
          background-size: 45px 45px; opacity: .4; z-index: 0; pointer-events: none;
        }
      `}</style>

      <div id="chat-master-container" ref={containerRef}>
        <div className="cyber-grid" />

        {/* HEADER */}
        <div className="flex-shrink-0 w-full h-[65px] flex items-center justify-between px-5 bg-black/80 backdrop-blur-xl border-b border-white/5 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="text-white">←</button>
            <span className="text-white font-bold uppercase tracking-widest text-sm italic">
              {receiver.name || "Aura User"}
            </span>
          </div>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }}></div>
        </div>

        {/* MESSAGES */}
        <div ref={chatAreaRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6 relative z-10 custom-scrollbar">
          {messages.map((m) => {
            const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%] px-4 py-3 text-white text-sm"
                  style={{
                    borderRadius: isMine ? "15px 15px 2px 15px" : "15px 15px 15px 2px",
                    background: isMine ? hexToRGBA(accentColor, 0.2) : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.3) : "rgba(255,255,255,0.1)"}`
                  }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="flex-shrink-0 p-4 bg-black/80 border-t border-white/5 z-20">
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onFocus={() => setTimeout(() => messagesEndRef.current?.scrollIntoView(), 300)}
              placeholder="Inject signal..."
              className="flex-1 bg-transparent outline-none text-white px-2 text-sm"
            />
            <button onClick={sendMessage} className="px-4 py-2 rounded-xl font-bold text-xs uppercase"
              style={{ background: accentColor, color: "#000" }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatBox;