import React, { useState } from "react";
import { ChatState } from "../Context/ChatProvider";
import API from "../services/api";
import ProfileModal from "../pages/Profile";
import SingleChat from "../components/Singlechat";

const ChatBox = ({ fetchagain, setFetchagain }) => {
  const { selectedChat, setSelectedChat, user, config, hexToRGBA } = ChatState();
  const [showMenu, setShowMenu] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  const accentColor = config?.accent || "#10b981";

  // Wahi logic jo Mychats mein hai
  const rgba = (hex, alpha) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) { return `rgba(255, 255, 255, ${alpha})`; }
  };

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  if (!selectedChat) return null;

  const userData = user?.user || user;
  const myId = (userData?._id || userData?.id)?.toString();
  const receiver = selectedChat.users?.find((u) => (u._id || u.id)?.toString() !== myId) || {};

  const handleViewProfile = () => {
    setProfileUser(receiver);
    setIsProfileOpen(true);
    setShowMenu(false);
  };

  const handleBlockUser = async () => {
    if (!window.confirm(`Block ${receiver.name}?`)) return;
    try {
      await API.post("/api/blockuser", { userblockid: receiver._id }, getAuthHeader());
      alert("User blocked successfully");
      setSelectedChat(null);
      setFetchagain(!fetchagain);
    } catch (err) {
      alert("Failed to block user");
    }
    setShowMenu(false);
  };

  return (
    <>
      <div 
        className={`relative h-full flex-col overflow-hidden w-full transition-all duration-500 ${
          selectedChat ? 'flex' : 'hidden md:flex'
        }`}
        style={{ fontFamily: config.font, background: "#050505" }}
      >
        {/* ✅ SYNCED BACKGROUND — Mychats jaisa layered gradient */}
        <div className="absolute inset-0 z-0" style={{
          background: `
            radial-gradient(ellipse at 80% 20%, ${rgba(accentColor, 0.06)} 0%, transparent 50%),
            radial-gradient(ellipse at 20% 80%, ${rgba(accentColor, 0.04)} 0%, transparent 50%),
            linear-gradient(180deg, #070709 0%, #050505 100%)
          `
        }} />

        {/* Grid overlay - matched size */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{
          backgroundImage: `
            linear-gradient(${rgba(accentColor, 0.03)} 1px, transparent 1px),
            linear-gradient(90deg, ${rgba(accentColor, 0.03)} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />

        {/* Profile Modal */}
        {isProfileOpen && (
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={profileUser}
          />
        )}

        {/* Header */}
        <header 
          className="flex-shrink-0 h-[70px] md:h-[85px] flex items-center justify-between px-6 z-10 relative"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,12,0.4)", backdropFilter: "blur(10px)" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedChat(null)}
              className="md:hidden p-2 rounded-xl text-white transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div onClick={handleViewProfile} className="flex items-center gap-3 cursor-pointer group">
              <div
                className="w-10 h-10 md:w-11 md:h-11 rounded-2xl border flex items-center justify-center font-black text-lg transition-transform group-hover:rotate-6"
                style={{ 
                  borderColor: rgba(accentColor, 0.3), 
                  color: accentColor, 
                  background: rgba(accentColor, 0.05),
                  boxShadow: `0 0 20px ${rgba(accentColor, 0.1)}`
                }}
              >
                {receiver.profilepic ? (
                  <img src={receiver.profilepic} className="w-full h-full object-cover rounded-2xl" alt="p" />
                ) : (
                  receiver.name?.charAt(0)?.toUpperCase() || "?"
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] font-black text-white uppercase italic leading-none tracking-tight">
                  {receiver.name || "User"}
                </h2>
                <span className="text-[8px] uppercase tracking-[0.2em] font-bold opacity-40 mt-1" style={{ color: accentColor }}>
                  Connection Active
                </span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-zinc-500 hover:text-white transition-colors text-xl"
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-[190]" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-[110%] w-48 rounded-2xl overflow-hidden z-[200]"
                  style={{
                    background: "#0f0f0f",
                    border: `1px solid ${rgba(accentColor, 0.2)}`,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <button
                    onClick={handleViewProfile}
                    className="w-full px-4 py-3.5 text-[11px] text-white/70 hover:bg-white/5 text-left uppercase font-bold tracking-widest"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    View Identity
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-4 py-3.5 text-[11px] text-red-500 hover:bg-red-500/10 text-left uppercase font-black tracking-widest"
                  >
                    Block User
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* SingleChat Component Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <SingleChat fetchagain={fetchagain} setFetchagain={setFetchagain} />
        </div>
      </div>
    </>
  );
};

export default ChatBox;