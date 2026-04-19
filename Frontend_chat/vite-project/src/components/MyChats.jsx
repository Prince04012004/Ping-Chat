import React, { useState, useEffect } from "react";
import API from "../services/api";
import { ChatState } from "../Context/ChatProvider";
import BlockedModal from "./BlockedModal"; 
import ProfileModal from "../pages/Profile";
import { useNavigate } from 'react-router-dom';

const Mychats = () => {
  const [search, setsearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setloading] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const navigate = useNavigate();

  const { 
    setSelectedChat, 
    chats, 
    setChats, 
    selectedChat, 
    user, 
    config, 
    setConfig, 
    notification, 
    setNotification 
  } = ChatState();

  const userData = user?.user || user;
  const myId = (userData?._id || userData?.id)?.toString();
  const profileImage = userData?.profilepic || userData?.pic;
  const blockedList = userData?.blockedList || [];

  const themePresets = {
    "'Inter', sans-serif": { pattern: "radial-gradient(circle, #ffffff08 1px, transparent 1px)" },
    "'Plus Jakarta Sans', sans-serif": { pattern: "linear-gradient(#ffffff03 1px, transparent 1px)" },
    "'Fira Code', monospace": { pattern: "repeating-linear-gradient(0deg, #111, #111 1px, transparent 1px, transparent 2px)" },
    "'Playfair Display', serif": { pattern: "url('https://www.transparenttextures.com/patterns/stardust.png')" }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-family', config.font);
    root.style.setProperty('--accent-color', config.accent);
    localStorage.setItem("user-config", JSON.stringify(config));
  }, [config.font, config.accent]);

  const generateAITheme = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      const token = user?.token || localStorage.getItem("token");
      const { data } = await API.post(
        "/api/ai/generate-theme", 
        { prompt: aiPrompt }, 
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      if (data && data.accent) {
        setConfig({ ...config, accent: data.accent, texture_url: data.texture_url || '' });
        setAiPrompt("");
      }
    } catch (error) {
      console.error("AI Theme Error:", error.response?.data || error.message);
      alert("AI Generation failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setsearch(query);
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      setloading(true);
      const token = user?.token || localStorage.getItem("token");
      const { data } = await API.get(`/api/searchuser?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(data.filter(u => !blockedList.includes(u._id)));
    } catch (error) { console.error(error); } finally { setloading(false); }
  };

  const accessChat = async (userId) => {
    try {
      setloading(true);
      const token = user?.token || localStorage.getItem("token");
      const { data } = await API.post(`/api/accesschat`, { userId }, {
        headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setsearch(""); 
      setSearchResults([]);
    } catch (error) { console.error(error); } finally { setloading(false); }
  };

  const fetchChats = async () => {
    const token = user?.token || localStorage.getItem("token");
    if (!token) return;
    try {
      setloading(true);
      const { data } = await API.get("/api/chat", { headers: { Authorization: `Bearer ${token}` } });
      const filteredChats = data.filter(chat => {
        if (!chat.isGroupChat) {
          const otherUser = chat.users.find(u => (u._id || u.id)?.toString() !== myId);
          return !blockedList.includes(otherUser?._id || otherUser?.id);
        }
        return true;
      });
      setChats(filteredChats);
    } catch (error) { console.error("Sync Error", error); } finally { setloading(false); }
  };

  useEffect(() => { 
    const token = user?.token || localStorage.getItem("token");
    if (token) fetchChats(); 
  }, [user?.token, JSON.stringify(blockedList)]); 

  const hexToRGBA = (hex, alpha) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) { return `rgba(255, 255, 255, ${alpha})`; }
  };

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  // ✅ BLOCK FIX: Chat list se turant remove karo
  const handleBlockFromChat = (blockedUserId) => {
    // Chats se us user ki chat hata do
    setChats((prev) => prev.filter(chat => {
      if (!chat.isGroupChat) {
        const otherUser = chat.users.find(u => (u._id || u.id)?.toString() !== myId);
        return (otherUser?._id || otherUser?.id)?.toString() !== blockedUserId?.toString();
      }
      return true;
    }));
    // Agar wahi chat selected thi toh close karo
    if (selectedChat) {
      const otherUser = selectedChat.users?.find(u => (u._id || u.id)?.toString() !== myId);
      if ((otherUser?._id || otherUser?.id)?.toString() === blockedUserId?.toString()) {
        setSelectedChat(null);
      }
    }
  };

  const finalPattern = config.texture_url ? `url('${config.texture_url}')` : themePresets[config.font]?.pattern;

  return (
    <div 
      className={`h-full flex-col transition-all duration-500 relative overflow-hidden w-full md:w-[380px] lg:w-[420px] ${
        selectedChat ? 'hidden md:flex' : 'flex'
      }`}
      style={{ fontFamily: config.font }}
    >
      {/* ✅ BETTER BACKGROUND — layered gradients */}
      <div className="absolute inset-0 z-0" style={{
        background: `
          radial-gradient(ellipse at 20% 20%, ${hexToRGBA(config.accent, 0.06)} 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, ${hexToRGBA(config.accent, 0.04)} 0%, transparent 50%),
          linear-gradient(180deg, #070709 0%, #050505 100%)
        `
      }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(${hexToRGBA(config.accent, 0.03)} 1px, transparent 1px),
          linear-gradient(90deg, ${hexToRGBA(config.accent, 0.03)} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />

      {/* Pattern overlay */}
      {finalPattern && (
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ backgroundImage: finalPattern, backgroundRepeat: 'repeat', backgroundSize: '180px', opacity: 0.04 }} />
      )}

      {/* Right border glow */}
      <div className="absolute right-0 top-0 bottom-0 w-px z-0"
        style={{ background: `linear-gradient(180deg, transparent, ${hexToRGBA(config.accent, 0.15)}, transparent)` }} />

      <div className="content-wrapper relative z-10 flex flex-col h-full">
        <BlockedModal 
          isOpen={isBlockedModalOpen} 
          onClose={() => setIsBlockedModalOpen(false)} 
          userToken={user?.token} 
          fetchChats={fetchChats} 
          blockedList={blockedList} 
        />
        <ProfileModal 
          isOpen={isProfileOpen} 
          onClose={() => { setIsProfileOpen(false); setProfileUser(null); }} 
          user={profileUser}
          // ✅ Block hone par Mychats ko bhi notify karo
          onBlock={handleBlockFromChat}
        />

        {/* Header */}
        <div className="p-6 md:p-8 pb-4">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div className="flex items-center gap-4">
              <div 
                onClick={() => { setProfileUser(userData); setIsProfileOpen(true); }} 
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border flex items-center justify-center cursor-pointer transition-all hover:rotate-6 shadow-2xl"
                style={{ 
                  borderColor: hexToRGBA(config.accent, 0.3), 
                  backgroundColor: hexToRGBA(config.accent, 0.05),
                  boxShadow: `0 0 20px ${hexToRGBA(config.accent, 0.1)}`
                }}>
                {profileImage 
                  ? <img src={profileImage} className="w-full h-full object-cover rounded-2xl" alt="me" /> 
                  : <span style={{ color: config.accent }} className="font-black">{userData?.name?.[0]}</span>
                }
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">Ping</h3>
                <p className="text-[8px] uppercase tracking-[0.3em] font-bold opacity-40" style={{ color: config.accent }}>AI Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button title="Logout" onClick={handleLogout} 
                className="p-2.5 rounded-xl transition-all hover:bg-red-500/10 text-zinc-500 hover:text-red-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>

              <button title="Privacy" onClick={() => setIsBlockedModalOpen(true)} 
                className="p-2.5 rounded-xl transition-all hover:bg-white/5 text-zinc-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </button>
              
              <button 
                onClick={() => setShowCustomizer(!showCustomizer)} 
                className="p-2.5 rounded-xl transition-all active:scale-90" 
                style={{ 
                  backgroundColor: showCustomizer ? config.accent : 'rgba(255,255,255,0.03)', 
                  color: showCustomizer ? '#000' : config.accent 
                }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* AI Theme Customizer */}
          {showCustomizer && (
            <div className="mb-6 p-4 rounded-3xl border backdrop-blur-md"
              style={{ 
                background: hexToRGBA(config.accent, 0.04),
                borderColor: hexToRGBA(config.accent, 0.15)
              }}>
              <label className="text-[10px] uppercase tracking-widest font-black opacity-40 mb-3 block" style={{ color: config.accent }}>
                AI Theme Customizer
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. Royal Indigo, Cyberpunk..." 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateAITheme()}
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-white/20 transition-all"
                />
                <button 
                  onClick={generateAITheme}
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: config.accent, color: '#000' }}
                >
                  {aiLoading ? "..." : "Gen"}
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search chats..." 
              value={search} 
              onChange={(e) => handleSearch(e.target.value)} 
              className="w-full rounded-2xl px-5 py-3.5 text-sm text-white outline-none transition-all font-medium"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${search ? hexToRGBA(config.accent, 0.3) : 'rgba(255,255,255,0.06)'}`,
              }}
            />
            {search && (
              <button onClick={() => { setsearch(""); setSearchResults([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-5 space-y-1 pb-12 mt-2 custom-scrollbar">
          {search ? (
            searchResults.length > 0 ? searchResults.map((u) => (
              <div key={u._id} onClick={() => accessChat(u._id)} 
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0)'}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold overflow-hidden"
                  style={{ background: hexToRGBA(config.accent, 0.1), color: config.accent }}>
                  {u.profilepic 
                    ? <img src={u.profilepic} className="w-full h-full object-cover" alt="u" /> 
                    : u.name?.[0]
                  }
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm tracking-tight">{u.name}</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Start conversation</p>
                </div>
              </div>
            )) : (
              <p className="text-center text-zinc-600 text-xs py-8 uppercase tracking-widest">No results</p>
            )
          ) : (
            chats?.map((item) => {
              const chatUser = item.users?.find((u) => (u._id || u.id)?.toString() !== myId);
              const isSelected = selectedChat?._id === item._id;
              const hasNotification = notification?.filter((n) => n.chat._id === item._id) || [];

              return (
                <div 
                  key={item._id} 
                  onClick={() => { 
                    setSelectedChat(item); 
                    if (notification) setNotification(notification.filter((n) => n.chat._id !== item._id)); 
                  }} 
                  className="flex items-center gap-3 md:gap-4 p-4 rounded-[22px] transition-all cursor-pointer group relative"
                  style={{ 
                    backgroundColor: isSelected ? hexToRGBA(config.accent, 0.08) : 'transparent',
                    border: isSelected ? `1px solid ${hexToRGBA(config.accent, 0.15)}` : '1px solid transparent'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full" 
                      style={{ backgroundColor: config.accent, boxShadow: `0 0 8px ${config.accent}` }} />
                  )}

                  {/* Avatar */}
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-bold relative transition-transform group-hover:scale-105 shrink-0 overflow-hidden" 
                    style={{ 
                      backgroundColor: isSelected ? config.accent : hexToRGBA(config.accent, 0.08), 
                      color: isSelected ? '#000' : config.accent,
                      boxShadow: isSelected ? `0 4px 16px ${hexToRGBA(config.accent, 0.3)}` : 'none'
                    }}>
                    {chatUser?.profilepic 
                      ? <img src={chatUser.profilepic} className="w-full h-full object-cover" alt="avatar" /> 
                      : <span className="text-lg font-black">{chatUser?.name?.[0] || "?"}</span>
                    }
                    {hasNotification.length > 0 && !isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#050505] flex items-center justify-center text-[9px] font-black text-white animate-bounce">
                        {hasNotification.length}
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className={`font-bold text-[14px] md:text-[15px] tracking-tight truncate ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-white'} transition-colors`}>
                        {chatUser?.name || "Anonymous"}
                      </h4>
                      <span className="text-[9px] text-zinc-600 font-medium shrink-0 ml-2">
                        {item.latestMessage ? new Date(item.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      </span>
                    </div>
                    <p className={`text-[11px] md:text-[12px] truncate ${hasNotification.length > 0 ? 'font-bold' : 'text-zinc-600'}`}
                      style={{ color: hasNotification.length > 0 ? config.accent : '' }}>
                      {item.latestMessage?.content || "Waiting for signal..."}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Mychats;