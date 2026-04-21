import React, { useState, useEffect } from "react";
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

  // Helper for RGBA
  const rgba = (hex, alpha) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    } catch {
      return `rgba(16,185,129,${alpha})`;
    }
  };

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // View Identity Logic
  const handleViewProfile = () => {
    if (receiver) {
      setProfileUser(receiver);
      setIsProfileOpen(true);
      setShowMenu(false);
    }
  };

  // Block User Logic
  const handleBlockUser = async () => {
    if (!receiver?._id) return;
    if (!window.confirm(`Are you sure you want to block ${receiver.name}?`)) return;
    
    try {
      await API.post("/api/blockuser", { userblockid: receiver._id }, getAuthHeader());
      alert(`${receiver.name} has been blocked.`);
      setSelectedChat(null); // Close chat after blocking
      setFetchagain(!fetchagain); // Refresh chat list
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to block user");
    }
    setShowMenu(false);
  };

  if (!selectedChat) return null;

  const myId = user?.user?._id || user?._id;
  const receiver = selectedChat.users?.find((u) => u._id !== myId) || {};

  return (
    <>
      <style>{`
        .cb-wrapper {
          position: relative;
          width: 100%;
          height: 100dvh; /* Dynamic viewport height for mobile */
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #050505;
        }
        
        /* High-Tech Background */
        .cb-bg-glow {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 50% -20%, ${rgba(accentColor, 0.15)} 0%, transparent 70%);
          pointer-events: none;
        }

        .cb-grid-animated {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(${rgba(accentColor, 0.03)} 1px, transparent 1px),
            linear-gradient(90deg, ${rgba(accentColor, 0.03)} 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse at center, black, transparent 80%);
          pointer-events: none;
          z-index: 0;
        }

        /* Viewport Fix for Mobile */
        @media (max-width: 768px) {
          .cb-wrapper { height: 100vh; }
        }
      `}</style>

      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={profileUser}
        />
      )}

      <div className="cb-wrapper" style={{ fontFamily: config?.font }}>
        <div className="cb-bg-glow" />
        <div className="cb-grid-animated" />

        {/* HEADER */}
        <header
          className="flex-shrink-0 h-[75px] flex items-center justify-between px-6 z-[100] relative"
          style={{ 
            background: "rgba(10, 10, 10, 0.8)", 
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(255,255,255,0.05)" 
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedChat(null)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-white transition-all active:scale-90"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div onClick={handleViewProfile} className="flex items-center gap-3.5 cursor-pointer group">
              <div
                className="w-11 h-11 rounded-2xl border flex items-center justify-center font-black text-xl transition-transform group-hover:scale-105"
                style={{ 
                  borderColor: rgba(accentColor, 0.3), 
                  color: accentColor, 
                  background: `linear-gradient(135deg, #111, #000)`,
                  boxShadow: `0 0 20px ${rgba(accentColor, 0.1)}`
                }}
              >
                {receiver.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[14px] font-black text-white uppercase tracking-wider leading-tight">
                  {receiver.name || "Unknown"}
                </h2>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[2px]">Encrypted Session</span>
              </div>
            </div>
          </div>

          {/* MENU BOX */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-zinc-400 text-2xl hover:text-white transition-colors"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
              </svg>
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-[190]" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-[120%] w-52 rounded-2xl overflow-hidden z-[200] animate-in fade-in zoom-in duration-200"
                  style={{
                    background: "#0a0a0a",
                    border: `1px solid rgba(255,255,255,0.08)`,
                    boxShadow: "0 15px 40px rgba(0,0,0,0.8)",
                  }}
                >
                  <button
                    onClick={handleViewProfile}
                    className="w-full flex items-center gap-3 px-5 py-4 text-[12px] text-white/70 hover:text-white hover:bg-white/5 transition-all text-left uppercase font-bold tracking-widest"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    View Identity
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="w-full flex items-center gap-3 px-5 py-4 text-[12px] text-red-500 hover:bg-red-500/10 transition-all text-left uppercase font-black tracking-widest"
                  >
                    Terminate Access (Block)
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* MESSAGES AREA */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          <SingleChat fetchagain={fetchagain} setFetchagain={setFetchagain} />
        </div>
      </div>
    </>
  );
};

export default ChatBox;