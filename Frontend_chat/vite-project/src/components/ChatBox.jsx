import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../Context/ChatProvider";
import API from "../services/api";
import ProfileModal from "../pages/Profile";

const ChatBox = () => {
  const { selectedChat, setSelectedChat, user, config, hexToRGBA } = ChatState();
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
      setMessages([...messages, data]);
      setTimeout(() => inputRef.current?.focus(), 100);
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

  return (
    <div
      className={`fixed inset-0 z-[100] md:relative md:inset-auto md:flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        selectedChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0 hidden md:flex'
      }`}
      style={{ 
        backgroundColor: '#050505', 
        fontFamily: config?.font, 
        height: '100dvh',
        // --- ADDED: Subtle Background Pattern based on accent color ---
        backgroundImage: `radial-gradient(${hexToRGBA(accentColor, 0.04)} 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}
    >
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />

      {selectedChat ? (
        <div className="flex flex-col h-full relative z-10">

          {/* ── FIXED HEADER (FIXED: Sticky and Z-Index) ── */}
          <div
            className="sticky top-0 w-full flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-2xl border-b border-white/10 z-[120] flex-shrink-0 shadow-2xl"
            style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
          >
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedChat(null)} className="p-1 -ml-1 rounded-full md:hidden flex-shrink-0" style={{ color: accentColor }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
              </button>

              <div onClick={openProfile} className="flex items-center cursor-pointer gap-3 min-w-0">
                <div className="w-10 h-10 flex items-center justify-center rounded-2xl border flex-shrink-0"
                  style={{ backgroundColor: hexToRGBA(accentColor, 0.1), color: accentColor, borderColor: hexToRGBA(accentColor, 0.2) }}>
                  {receiverPic ? <img src={receiverPic} className="w-full h-full object-cover rounded-2xl" alt="receiver" /> : <span className="text-base font-black">{receiverName.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[14px] font-black text-white truncate max-w-[150px] uppercase italic">{receiverName}</h2>
                  <p className="text-[8px] tracking-[2px] font-black opacity-40 uppercase" style={{ color: accentColor }}>Active Signal</p>
                </div>
              </div>
            </div>

            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg></button>
          </div>

          {/* ── MESSAGES (Scrollable) ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col custom-scrollbar relative z-0">
            <div className="flex-grow" /> {/* Push messages to bottom */}
            <div className="space-y-4">
              {messages.map((m) => {
                const isMine = (m.sender?._id || m.sender?.id || m.sender) === (user?.user?._id || user?._id);
                return (
                  <div key={m._id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[85%] px-4 py-3 text-[14px] leading-relaxed shadow-lg"
                      style={{
                        borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                        backgroundColor: isMine ? hexToRGBA(accentColor, 0.15) : 'rgba(255,255,255,0.06)',
                        color: isMine ? '#fff' : '#e4e4e7',
                        border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.25) : 'rgba(255,255,255,0.08)'}`,
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
          </div>

          {/* ── INPUT BAR ── */}
          <div className="flex-shrink-0 px-4 py-3 bg-black/80 backdrop-blur-xl border-t border-white/5 z-20" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 15px)' }}>
            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 pl-4 pr-1.5 py-1.5 rounded-[28px] backdrop-blur-3xl shadow-inner">
              <input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Message..."
                className="flex-1 bg-transparent outline-none text-sm text-white py-2"
                style={{ minHeight: '36px' }}
              />
              <button onClick={sendMessage} disabled={!newMessage.trim()} className="w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-95 disabled:opacity-20" style={{ backgroundColor: accentColor, color: '#000' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="h-full hidden md:flex flex-col items-center justify-center opacity-20 relative z-10">
          <p className="font-black tracking-[8px] text-[10px] uppercase text-white">Select Vibe</p>
        </div>
      )}
    </div>
  );
};

export default ChatBox;