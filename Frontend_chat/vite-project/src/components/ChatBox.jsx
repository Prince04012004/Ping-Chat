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
    } catch (err) { 
      console.error(err);
      if(err.response?.status === 401) alert("Session expired.");
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] md:relative md:inset-auto md:flex-1 flex flex-col h-[100dvh] md:h-full overflow-hidden transition-all duration-300 ${
        selectedChat ? 'translate-x-0' : 'translate-x-full md:translate-x-0 hidden md:flex'
      }`} 
      style={{ backgroundColor: '#050505', fontFamily: config?.font }}
    >
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-[0.1]" style={{ backgroundColor: accentColor }} />
      </div>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={profileUser} />

      {selectedChat ? (
        <>
          <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-5 bg-black/60 backdrop-blur-3xl border-b border-white/5 z-20 sticky top-0 pt-[env(safe-area-inset-top,12px)]">
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={() => setSelectedChat(null)} 
                className="p-2 -ml-2 rounded-full active:scale-90 md:hidden"
                style={{ color: accentColor }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>

              <div onClick={openProfile} className="flex items-center cursor-pointer max-w-[200px] md:max-w-none">
                <div className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center font-bold mr-2 md:mr-3 overflow-hidden rounded-xl md:rounded-2xl border" 
                  style={{ backgroundColor: hexToRGBA(accentColor, 0.1), color: accentColor, borderColor: hexToRGBA(accentColor, 0.2) }}>
                  {receiverPic ? <img src={receiverPic} className="w-full h-full object-cover" alt="receiver" /> : (receiverName.charAt(0))}
                </div>
                <div className="overflow-hidden">
                  <h2 className="text-xs md:text-sm font-black text-white/90 tracking-tight uppercase italic truncate">{receiverName}</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                    <p className="text-[6px] md:text-[8px] uppercase tracking-[1px] md:tracking-[2px] font-black opacity-40">Synchronized</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-xl text-zinc-500 hover:text-white transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-3 w-40 md:w-44 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[100] animate-in fade-in zoom-in duration-150">
                  <button onClick={openProfile} className="w-full px-4 py-3 text-left text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/5 border-b border-white/5">View Identity</button>
                  <button onClick={clearChat} className="w-full px-4 py-3 text-left text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/70 hover:bg-white/5 border-b border-white/5">Clear Vibe</button>
                  <button onClick={blockUser} className="w-full px-4 py-3 text-left text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500/80 hover:bg-red-500/5">Block Aura</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 custom-scrollbar z-10 pb-20 md:pb-6">
            {messages.map((m) => {
              const senderId = (m.sender?._id || m.sender?.id || m.sender);
              const userData = user?.user || user;
              const myId = userData?._id || userData?.id;
              const isMine = senderId === myId;
              
              return (
                <div key={m._id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] px-4 py-2.5 md:py-3 text-[12px] md:text-[14px] leading-relaxed shadow-sm`} 
                    style={{ 
                      borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                      backgroundColor: isMine ? hexToRGBA(accentColor, 0.12) : 'rgba(255,255,255,0.03)', 
                      color: isMine ? '#fff' : '#ccc', 
                      border: `1px solid ${isMine ? hexToRGBA(accentColor, 0.2) : 'rgba(255,255,255,0.05)'}`, 
                      backdropFilter: 'blur(10px)'
                    }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 md:p-6 bg-transparent z-20 pb-[env(safe-area-inset-bottom,12px)]">
            <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 pl-4 pr-1.5 py-1.5 rounded-[22px] md:rounded-[28px] backdrop-blur-3xl shadow-2xl">
              <input 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
                placeholder="Message..." 
                className="flex-1 bg-transparent outline-none text-xs md:text-sm text-white placeholder:text-zinc-600 font-medium h-9 md:h-10" 
              />
              <button 
                onClick={sendMessage} 
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all active:scale-90"
                style={{ backgroundColor: accentColor, color: '#000' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
        </>
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