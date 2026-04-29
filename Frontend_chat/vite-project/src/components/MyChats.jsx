import React, { useState, useEffect, useRef, useCallback } from "react";
import API from "../services/api";
import { ChatState } from "../Context/ChatProvider";
import BlockedModal from "./BlockedModal";
import ProfileModal from "../pages/Profile";
import { useNavigate } from "react-router-dom";

const Mychats = () => {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const longPressRef = useRef(null);
  const isLongPressRef = useRef(false);

  const navigate = useNavigate();

  const {
    setSelectedChat, chats, setChats,
    selectedChat, user, config, setConfig,
    notification, setNotification,
  } = ChatState();

  const userData = user?.user || user;
  const myId = (userData?._id || userData?.id)?.toString();
  const profileImage = userData?.profilepic || userData?.pic;
  const blockedList = userData?.blockedList || [];

  const hexToRGBA = (hex, alpha) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch { return `rgba(255,255,255,${alpha})`; }
  };

  const themePresets = {
    "'Inter', sans-serif": { pattern: "radial-gradient(circle, #ffffff08 1px, transparent 1px)" },
    "'Plus Jakarta Sans', sans-serif": { pattern: "linear-gradient(#ffffff03 1px, transparent 1px)" },
    "'Fira Code', monospace": { pattern: "repeating-linear-gradient(0deg, #111, #111 1px, transparent 1px, transparent 2px)" },
    "'Playfair Display', serif": { pattern: "url('https://www.transparenttextures.com/patterns/stardust.png')" },
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-family", config.font);
    root.style.setProperty("--accent-color", config.accent);
    localStorage.setItem("user-config", JSON.stringify(config));
  }, [config.font, config.accent]);

  const generateAITheme = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      const token = user?.token || localStorage.getItem("token");
      const { data } = await API.post("/api/ai/generate-theme", { prompt: aiPrompt },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      if (data?.accent) {
        setConfig({ ...config, accent: data.accent, texture_url: data.texture_url || "" });
        setAiPrompt("");
      }
    } catch { alert("AI Generation failed."); }
    finally { setAiLoading(false); }
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      setLoading(true);
      const token = user?.token || localStorage.getItem("token");
      const { data } = await API.get(`/api/searchuser?search=${query}`,
        { headers: { Authorization: `Bearer ${token}` } });
      // ✅ Deduplicate search results
      const seen = new Set();
      const unique = data.filter((u) => {
        if (blockedList.includes(u._id)) return false;
        if (seen.has(u._id)) return false;
        seen.add(u._id);
        return true;
      });
      setSearchResults(unique);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) return res.sendStatus(400);

  try {
    // ✅ Block check — dono taraf se
    const currentUser = await User.findById(req.user._id);
    const otherUser = await User.findById(userId);

    if (!otherUser) return res.status(404).json({ message: "User not found" });

    const iBlockedThem = currentUser.blockedList?.map(id => id.toString()).includes(userId.toString());
    const theyBlockedMe = otherUser.blockedList?.map(id => id.toString()).includes(req.user._id.toString());

    if (iBlockedThem) {
      return res.status(403).json({ 
        message: "You have blocked this user. Unblock to chat.",
        blocked: true,
        blockedBy: "me"
      });
    }

    if (theyBlockedMe) {
      return res.status(403).json({ 
        message: "You are blocked by this user.",
        blocked: true,
        blockedBy: "them"
      });
    }

    // Normal chat access
    var isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate("users", "-password")
      .populate("lastmessage");

    isChat = await User.populate(isChat, {
      path: "lastmessage.sender",
      select: "name profilepic email",
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: "sender",
        isGroupChat: false,
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users", "-password"
      );
      res.status(200).json(FullChat);
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};

  // ✅ fetchChats — sirf ek baar, fast
  const fetchChats = useCallback(async (force = false) => {
    if (fetchingRef.current) return;
    if (hasFetchedRef.current && !force) return;
    const token = user?.token || localStorage.getItem("token");
    if (!token) return;
    fetchingRef.current = true;
    try {
      const { data } = await API.get("/api/chat",
        { headers: { Authorization: `Bearer ${token}` } });

      // ✅ Filter blocked + deduplicate
      const seen = new Set();
      const unique = data.filter((chat) => {
        if (seen.has(chat._id)) return false;
        seen.add(chat._id);
        if (!chat.isGroupChat) {
          const other = chat.users.find((u) => (u._id || u.id)?.toString() !== myId);
          if (blockedList.includes(other?._id || other?.id)) return false;
        }
        return true;
      });

      setChats(unique);
      hasFetchedRef.current = true;
    } catch (e) { console.error(e); }
    finally { fetchingRef.current = false; setLoading(false); }
  }, [user?.token, myId]);

  useEffect(() => {
    const token = user?.token || localStorage.getItem("token");
    if (token && !hasFetchedRef.current) fetchChats();
  }, [user?.token]);

  // ✅ Notification aane pe chat upar aao
  useEffect(() => {
    if (!notification?.length) return;
    const latest = notification[0];
    if (!latest?.chat?._id) return;
    setChats((prev) => {
      const exists = prev.find((c) => c._id === latest.chat._id);
      if (!exists) return prev;
      return prev
        .map((c) => c._id === latest.chat._id ? { ...c, latestMessage: latest } : c)
        .sort((a, b) => {
          const at = a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt) : 0;
          const bt = b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt) : 0;
          return bt - at;
        });
    });
  }, [notification]);

  const handleLogout = () => {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  // ✅ Block hone pe chat history se bhi hata do
  const handleBlockFromChat = (blockedUserId) => {
    setChats((prev) => prev.filter((chat) => {
      if (!chat.isGroupChat) {
        const other = chat.users.find((u) => (u._id || u.id)?.toString() !== myId);
        return (other?._id || other?.id)?.toString() !== blockedUserId?.toString();
      }
      return true;
    }));
    if (selectedChat) {
      const other = selectedChat.users?.find((u) => (u._id || u.id)?.toString() !== myId);
      if ((other?._id || other?.id)?.toString() === blockedUserId?.toString()) {
        setSelectedChat(null);
      }
    }
  };

  // ✅ Chat history se remove karo (sirf apni list se)
  const handleRemoveChat = (chatId) => {
    setActiveMenu(null);
    setChats((prev) => prev.filter((c) => c._id !== chatId));
    if (selectedChat?._id === chatId) setSelectedChat(null);
  };

  // Long press handlers
  const handleTouchStart = (chatId) => {
    isLongPressRef.current = false;
    longPressRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setActiveMenu(chatId);
    }, 500);
  };
  const handleTouchEnd = () => clearTimeout(longPressRef.current);
  const handleTouchMove = () => {
    clearTimeout(longPressRef.current);
    isLongPressRef.current = false;
  };

  const finalPattern = config.texture_url
    ? `url('${config.texture_url}')`
    : themePresets[config.font]?.pattern;

  const getNotifCount = (chatId) => notification?.filter((n) => n.chat._id === chatId).length || 0;

  const getLastMsg = (item) => {
    const notifs = notification?.filter((n) => n.chat._id === item._id);
    if (notifs?.length > 0) return notifs[notifs.length - 1].content;
    return item.latestMessage?.content || "Waiting for signal...";
  };

  const getLastTime = (item) => {
    const notifs = notification?.filter((n) => n.chat._id === item._id);
    const msg = notifs?.length > 0 ? notifs[notifs.length - 1] : item.latestMessage;
    if (!msg?.createdAt) return "";
    const d = new Date(msg.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString()
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div
      className={`h-full flex-col transition-all duration-500 relative overflow-hidden w-full md:w-[380px] lg:w-[420px] ${selectedChat ? "hidden md:flex" : "flex"}`}
      style={{ fontFamily: config.font }}
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${hexToRGBA(config.accent, 0.2)}; border-radius: 10px; }
        @keyframes badgePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        .notif-badge { animation: badgePulse 1.5s ease infinite; }
        @keyframes menuIn { from{opacity:0;transform:scale(0.95) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .chat-menu { animation: menuIn 0.15s ease forwards; }
        .chat-item { -webkit-user-select:none; user-select:none; }
      `}</style>

      {/* Backdrop */}
      {activeMenu && (
        <div className="fixed inset-0 z-40"
          onClick={() => setActiveMenu(null)}
          onTouchStart={() => setActiveMenu(null)} />
      )}

      {/* Background */}
      <div className="absolute inset-0 z-0" style={{
        background: `
          radial-gradient(ellipse at 20% 20%, ${hexToRGBA(config.accent, 0.06)} 0%, transparent 50%),
          radial-gradient(ellipse at 80% 80%, ${hexToRGBA(config.accent, 0.04)} 0%, transparent 50%),
          linear-gradient(180deg, #070709 0%, #050505 100%)`
      }} />
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(${hexToRGBA(config.accent, 0.03)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRGBA(config.accent, 0.03)} 1px, transparent 1px)`,
        backgroundSize: "40px 40px"
      }} />
      {finalPattern && (
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{ backgroundImage: finalPattern, backgroundRepeat: "repeat", backgroundSize: "180px", opacity: 0.04 }} />
      )}
      <div className="absolute right-0 top-0 bottom-0 w-px z-0"
        style={{ background: `linear-gradient(180deg, transparent, ${hexToRGBA(config.accent, 0.15)}, transparent)` }} />

      <div className="content-wrapper relative z-10 flex flex-col h-full">
        <BlockedModal isOpen={isBlockedModalOpen} onClose={() => setIsBlockedModalOpen(false)}
          userToken={user?.token} fetchChats={() => fetchChats(true)} blockedList={blockedList} />
        <ProfileModal isOpen={isProfileOpen}
          onClose={() => { setIsProfileOpen(false); setProfileUser(null); }}
          user={profileUser} onBlock={handleBlockFromChat} />

        {/* Header */}
        <div className="p-6 md:p-8 pb-4">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <div className="flex items-center gap-4">
              <div onClick={() => { setProfileUser(userData); setIsProfileOpen(true); }}
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border flex items-center justify-center cursor-pointer transition-all hover:rotate-6 shadow-2xl"
                style={{ borderColor: hexToRGBA(config.accent, 0.3), backgroundColor: hexToRGBA(config.accent, 0.05), boxShadow: `0 0 20px ${hexToRGBA(config.accent, 0.1)}` }}>
                {profileImage
                  ? <img src={profileImage} className="w-full h-full object-cover rounded-2xl" alt="me" />
                  : <span style={{ color: config.accent }} className="font-black">{userData?.name?.[0]}</span>}
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">Ping</h3>
                <p className="text-[8px] uppercase tracking-[0.3em] font-bold opacity-40" style={{ color: config.accent }}>AI Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button title="Logout" onClick={handleLogout} className="p-2.5 rounded-xl transition-all hover:bg-red-500/10 text-zinc-500 hover:text-red-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
              <button title="Privacy" onClick={() => setIsBlockedModalOpen(true)} className="p-2.5 rounded-xl transition-all hover:bg-white/5 text-zinc-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </button>
              <button onClick={() => setShowCustomizer(!showCustomizer)} className="p-2.5 rounded-xl transition-all active:scale-90"
                style={{ backgroundColor: showCustomizer ? config.accent : "rgba(255,255,255,0.03)", color: showCustomizer ? "#000" : config.accent }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>
            </div>
          </div>

          {showCustomizer && (
            <div className="mb-6 p-4 rounded-3xl border"
              style={{ background: hexToRGBA(config.accent, 0.04), borderColor: hexToRGBA(config.accent, 0.15) }}>
              <label className="text-[10px] uppercase tracking-widest font-black opacity-40 mb-3 block" style={{ color: config.accent }}>
                AI Theme Customizer
              </label>
              <div className="flex gap-2">
                <input type="text" placeholder="e.g. Royal Indigo, Cyberpunk..." value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateAITheme()}
                  className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-white/20 transition-all" />
                <button onClick={generateAITheme} disabled={aiLoading}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: config.accent, color: "#000" }}>
                  {aiLoading ? "..." : "Gen"}
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <input type="text" placeholder="Search chats..." value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-2xl px-5 py-3.5 text-sm text-white outline-none transition-all font-medium"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${search ? hexToRGBA(config.accent, 0.3) : "rgba(255,255,255,0.06)"}` }} />
            {search && (
              <button onClick={() => { setSearch(""); setSearchResults([]); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">✕</button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-5 space-y-1 pb-12 mt-2 custom-scrollbar">
          {search ? (
            searchResults.length > 0 ? searchResults.map((u) => (
              <div key={u._id} onClick={() => accessChat(u._id)}
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                style={{ background: "rgba(255,255,255,0)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0)")}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold overflow-hidden"
                  style={{ background: hexToRGBA(config.accent, 0.1), color: config.accent }}>
                  {u.profilepic ? <img src={u.profilepic} className="w-full h-full object-cover" alt="u" /> : u.name?.[0]}
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
              const notifCount = getNotifCount(item._id);
              const hasNotif = notifCount > 0 && !isSelected;
              const lastMsg = getLastMsg(item);
              const lastTime = getLastTime(item);

              return (
                <div key={item._id} className="relative">
                  {/* ✅ Long press / right click menu */}
                  {activeMenu === item._id && (
                    <div className="chat-menu absolute right-2 top-1 z-50 rounded-2xl overflow-hidden"
                      style={{
                        background: "#1a1a1a",
                        border: `1px solid ${hexToRGBA(config.accent, 0.25)}`,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
                        minWidth: "190px",
                      }}>
                      <button
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={() => handleRemoveChat(item._id)}
                        className="flex items-center gap-3 px-4 py-3.5 text-[13px] text-red-400 font-bold w-full text-left active:bg-red-500/10">
                        🗑️ Remove from history
                      </button>
                    </div>
                  )}

                  <div
                    className="chat-item flex items-center gap-3 md:gap-4 p-4 rounded-[22px] transition-all cursor-pointer group relative"
                    style={{
                      backgroundColor: isSelected ? hexToRGBA(config.accent, 0.08) : "transparent",
                      border: isSelected ? `1px solid ${hexToRGBA(config.accent, 0.15)}` : "1px solid transparent",
                    }}
                    onClick={() => {
                      if (isLongPressRef.current) return;
                      setSelectedChat(item);
                      setNotification((prev) => prev ? prev.filter((n) => n.chat._id !== item._id) : []);
                    }}
                    onContextMenu={(e) => { e.preventDefault(); setActiveMenu(item._id); }}
                    onTouchStart={() => handleTouchStart(item._id)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                        style={{ backgroundColor: config.accent, boxShadow: `0 0 8px ${config.accent}` }} />
                    )}

                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-bold relative transition-transform group-hover:scale-105 shrink-0 overflow-hidden"
                      style={{
                        backgroundColor: isSelected ? config.accent : hexToRGBA(config.accent, 0.08),
                        color: isSelected ? "#000" : config.accent,
                        boxShadow: isSelected ? `0 4px 16px ${hexToRGBA(config.accent, 0.3)}` : "none",
                      }}>
                      {chatUser?.profilepic
                        ? <img src={chatUser.profilepic} className="w-full h-full object-cover" alt="avatar" />
                        : <span className="text-lg font-black">{chatUser?.name?.[0] || "?"}</span>}
                      {hasNotif && (
                        <div className="notif-badge absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-black text-white px-1"
                          style={{ backgroundColor: config.accent, borderColor: "#050505", boxShadow: `0 0 8px ${hexToRGBA(config.accent, 0.6)}` }}>
                          {notifCount > 99 ? "99+" : notifCount}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className={`font-bold text-[14px] md:text-[15px] tracking-tight truncate transition-colors ${isSelected ? "text-white" : hasNotif ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                          {chatUser?.name || "Anonymous"}
                        </h4>
                        <span className="text-[9px] font-medium shrink-0 ml-2"
                          style={{ color: hasNotif ? config.accent : "rgba(255,255,255,0.25)" }}>
                          {lastTime}
                        </span>
                      </div>
                      <p className="text-[11px] md:text-[12px] truncate"
                        style={{ color: hasNotif ? config.accent : "rgba(255,255,255,0.3)", fontWeight: hasNotif ? "700" : "400" }}>
                        {lastMsg}
                      </p>
                    </div>
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