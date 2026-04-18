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

  const scrollToBottom = (force = false) => {
    if (!chatAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    if (force || scrollHeight - scrollTop - clientHeight < 200) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const { data } = await API.post(
        "/api/sendmessage",
        { content: newMessage, chatid: selectedChat._id },
        getAuthHeader()
      );
      setNewMessage("");
      setMessages((prev) => [...prev, data]);
      setTimeout(() => scrollToBottom(true), 50);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?._id) return;
      setLoading(true);
      try {
        const { data } = await API.get(
          `/api/allmessages/${selectedChat._id}`,
          getAuthHeader()
        );
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
        html, body {
          overflow: hidden !important;
          height: 100%;
          background: #000;
        }

        .cyber-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px),
            linear-gradient(90deg, ${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px);
          background-size: 45px 45px;
          opacity: 0.4; z-index: 0; pointer-events: none;
        }
      `}</style>

      {isProfileOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />
        </div>
      )}

      {/* 
        index.html mein interactive-widget=resizes-content hai,
        isliye ab browser khud viewport ko keyboard ke saath resize karta hai.
        100dvh = dynamic viewport height — keyboard ke saath shrink hoga automatically.
      */}
      <div
        className="flex flex-col bg-[#050505]"
        style={{ height: "100dvh", position: "relative", zIndex: 100, overflow: "hidden" }}
      >
        <div className="cyber-grid" />

        {/* HEADER */}
        <header className="flex-shrink-0 w-full h-[70px] flex items-center justify-between px-5 bg-black/80 backdrop-blur-3xl border-b border-white/5 relative z-[150]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedChat(null)}
              className="p-1 md:hidden"
              style={{ color: accentColor }}
            >
              ←
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl border-2 overflow-hidden bg-black"
                style={{ borderColor: hexToRGBA(accentColor, 0.2) }}
              >
                <div
                  className="w-full h-full flex items-center justify-center font-black"
                  style={{ color: accentColor }}
                >
                  {receiver.name?.charAt(0) || "A"}
                </div>
              </div>
              <h2 className="text-[15px] font-black text-white uppercase italic leading-none">
                {receiver.name || "Aura User"}
              </h2>
            </div>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-600">
            ⋮
          </button>
        </header>

        {/* CHAT AREA */}
        <main
          ref={chatAreaRef}
          className="flex-1 overflow-y-auto px-5 py-6 space-y-7 relative z-10 min-h-0"
        >
          {messages.map((m) => {
            const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
            return (
              <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[82%] px-5 py-3.5 text-[14.5px] leading-relaxed"
                  style={{
                    borderRadius: isMine ? "24px 24px 4px 24px" : "24px 24px 24px 4px",
                    backgroundColor: isMine ? hexToRGBA(accentColor, 0.18) : "rgba(255,255,255,0.04)",
                    color: "#fff",
                    border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.3) : "rgba(255,255,255,0.08)"}`,
                    backdropFilter: "blur(15px)",
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* FOOTER */}
        <footer className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-3xl border-t border-white/5 relative z-20">
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 pl-6 pr-2 py-2 rounded-[28px]">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Inject signal..."
              className="flex-1 bg-transparent outline-none text-white py-2"
              style={{ fontSize: "16px" }}
            />
            <button
              onClick={sendMessage}
              className="w-11 h-11 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ backgroundColor: accentColor, color: "#000" }}
            >
              ➤
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ChatBox;