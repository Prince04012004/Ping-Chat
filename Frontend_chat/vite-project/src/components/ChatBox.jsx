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

  // ✅ ULTRA-SMOOTH VIEWPORT & HEIGHT LOCK
  useEffect(() => {
    const updateHeight = () => {
      if (window.visualViewport) {
        document.documentElement.style.setProperty('--vh', `${window.visualViewport.height}px`);
        window.scrollTo(0, 0);
      }
    };
    window.visualViewport?.addEventListener('resize', updateHeight, { passive: true });
    window.visualViewport?.addEventListener('scroll', updateHeight, { passive: true });
    updateHeight();
    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('scroll', updateHeight);
    };
  }, []);

  // ✅ SMART SCROLL LOGIC
  const scrollToBottom = (force = false) => {
    if (!chatAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;

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

  const getReceiverData = () => {
    if (!selectedChat?.users || !user) return null;
    const userData = user?.user || user;
    const myId = (userData?._id || userData?.id)?.toString();
    const otherUser = selectedChat.users.find((u) => (u._id || u.id)?.toString() !== myId);
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
      setMessages((prev) => [...prev, data]);
      scrollToBottom(true); // Naya message bhejne par force scroll
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
      } catch (err) { 
        console.error(err);
        setLoading(false);
      }
    };
    fetchMessages();
  }, [selectedChat?._id]);

  // SKELETON COMPONENT
  const MessageSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className="w-[60%] h-12 rounded-2xl bg-white/5 border border-white/5" />
        </div>
      ))}
    </div>
  );

  if (!selectedChat) return null;

  return (
    <>
      <style>{`
        :root { --vh: 100vh; }
        html, body { overflow: hidden; position: fixed; width: 100%; height: 100%; background: #000; }
        #chat-master-container {
          position: fixed; top: 0; left: 0; width: 100%; height: var(--vh);
          display: flex; flex-direction: column; background: #050505; z-index: 100; overflow: hidden;
          will-change: height; transition: height 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .cyber-grid { position: absolute; inset: 0; background-image: linear-gradient(${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px); background-size: 45px 45px; opacity: .4; z-index: 0; pointer-events: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${hexToRGBA(accentColor, 0.3)}; border-radius: 10px; }
      `}</style>

      {isProfileOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />
        </div>
      )}

      <div id="chat-master-container" style={{ fontFamily: config?.font }}>
        <div className="cyber-grid" />

        {/* HEADER */}
        <header className="flex-shrink-0 w-full h-[70px] flex items-center justify-between px-5 bg-black/80 backdrop-blur-3xl border-b border-white/5 z-[150]">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedChat(null)} className="p-1 md:hidden" style={{ color: accentColor }}> ← </button>
            <div onClick={openProfile} className="flex items-center gap-3 cursor-pointer">
              <div className="w-11 h-11 rounded-2xl border-2 overflow-hidden bg-black" style={{ borderColor: hexToRGBA(accentColor, 0.2) }}>
                {receiverPic ? <img src={receiverPic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black" style={{ color: accentColor }}>{receiverName.charAt(0)}</div>}
              </div>
              <h2 className="text-[15px] font-black text-white uppercase italic leading-none">{receiverName}</h2>
            </div>
          </div>
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-600 hover:text-white"> ⋮ </button>
        </header>

        {/* CHAT AREA */}
        <main 
          ref={chatAreaRef}
          className="flex-1 overflow-y-auto px-5 py-6 space-y-7 relative z-10 custom-scrollbar"
        >
          {loading ? (
            <MessageSkeleton />
          ) : (
            messages.map((m) => {
              const isMine = (m.sender?._id || m.sender) === (user?.user?._id || user?._id);
              return (
                <div key={m._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[82%] px-5 py-3.5 text-[14.5px] leading-relaxed shadow-xl"
                    style={{
                      borderRadius: isMine ? "24px 24px 4px 24px" : "24px 24px 24px 4px",
                      backgroundColor: isMine ? hexToRGBA(accentColor, 0.18) : "rgba(255,255,255,0.04)",
                      color: "#fff",
                      border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.3) : "rgba(255,255,255,0.08)"}`,
                      backdropFilter: "blur(15px)"
                    }}>
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* INPUT */}
        <footer className="flex-shrink-0 p-5 bg-black/40 backdrop-blur-3xl border-t border-white/5 z-20">
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 pl-6 pr-2 py-2 rounded-[28px]">
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Inject signal..."
              className="flex-1 bg-transparent outline-none text-[14px] text-white py-2"
            />
            <button onClick={sendMessage} className="w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-all"
              style={{ backgroundColor: accentColor, color: "#000", boxShadow: `0 0 20px ${hexToRGBA(accentColor, 0.4)}` }}>
              ➤
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ChatBox;