import React, { useState, useCallback } from "react";
import { ChatState } from "../Context/ChatProvider";
import API from "../services/api";
import ProfileModal from "../pages/Profile";
import SingleChat from "../components/Singlechat";

const ChatBox = ({ fetchagain, setFetchagain }) => {
  const { selectedChat, setSelectedChat, user, config, hexToRGBA } = ChatState();
  const [showMenu, setShowMenu] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  // 🎨 Mood background — SingleChat se aata hai
  const [moodColor, setMoodColor] = useState(config?.accent || "#6366f1");

  const rgba = hexToRGBA
    ? hexToRGBA
    : (hex, alpha) => {
        try {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r},${g},${b},${alpha})`;
        } catch { return `rgba(99,102,241,${alpha})`; }
      };

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // SingleChat se mood color receive karo
  const handleMoodChange = useCallback((color) => {
    setMoodColor(color);
  }, []);

  if (!selectedChat) return null;

  const myId = user?.user?._id || user?._id;
  const receiver = selectedChat.users?.find((u) => u._id !== myId) || {};

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
    } catch (err) {
      alert("Failed to block user");
    }
    setShowMenu(false);
  };

  return (
    <>
      <style>{`
        .cb-mood-bg {
          transition: background 0.5s ease;
        }
        .cb-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(${rgba(moodColor, 0.06)} 1px, transparent 1px),
            linear-gradient(90deg, ${rgba(moodColor, 0.06)} 1px, transparent 1px);
          background-size: 45px 45px;
          opacity: .5; pointer-events: none; z-index: 0;
          transition: background-image 0.5s ease;
        }
        /* Mood glow — top corner */
        .cb-mood-glow {
          position: absolute;
          top: -80px; right: -80px;
          width: 300px; height: 300px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          transition: background 0.5s ease;
        }
      `}</style>

      {isProfileOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={profileUser}
          />
        </div>
      )}

      <div
        className="cb-mood-bg relative w-full h-full flex flex-col overflow-hidden"
        style={{
          fontFamily: config?.font,
          background: `radial-gradient(ellipse at top right, ${rgba(moodColor, 0.08)} 0%, #050505 60%)`,
        }}
      >
        <div className="cb-grid" />

        {/* Mood glow blob */}
        <div
          className="cb-mood-glow"
          style={{ background: `radial-gradient(circle, ${rgba(moodColor, 0.15)} 0%, transparent 70%)` }}
        />

        {/* HEADER */}
        <header
          className="flex-shrink-0 h-[70px] flex items-center justify-between px-5 z-10 relative"
          style={{
            background: "rgba(5,5,5,0.9)",
            borderBottom: `1px solid ${rgba(moodColor, 0.15)}`,
            transition: "border-color 0.5s ease",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedChat(null)}
              className="md:hidden p-2 rounded-xl text-white"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div onClick={handleViewProfile} className="flex items-center gap-3 cursor-pointer">
              <div
                className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-black text-lg"
                style={{
                  borderColor: rgba(moodColor, 0.4),
                  color: moodColor,
                  background: rgba(moodColor, 0.08),
                  transition: "border-color 0.5s ease, color 0.5s ease, background 0.5s ease",
                }}
              >
                {receiver.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div>
                <h2 className="text-[15px] font-black text-white uppercase italic leading-none">
                  {receiver.name || "User"}
                </h2>
                {/* Mood indicator dot */}
                <div className="flex items-center gap-1 mt-0.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: moodColor, transition: "background 0.5s ease" }}
                  />
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: rgba(moodColor, 0.7) }}>
                    vibe active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-zinc-400 text-xl">
              ⋮
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-[190]" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-[110%] w-48 rounded-2xl overflow-hidden z-[200]"
                  style={{
                    background: "#0f0f0f",
                    border: `1px solid ${rgba(moodColor, 0.25)}`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${rgba(moodColor, 0.1)}`,
                  }}
                >
                  <button
                    onClick={handleViewProfile}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-[13px] text-white/80 text-left"
                    style={{ borderBottom: `1px solid ${rgba(moodColor, 0.1)}` }}
                  >
                    View Identity
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-[13px] text-red-500 font-bold text-left"
                  >
                    Block User
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* SINGLE CHAT */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-10">
          <SingleChat
            fetchagain={fetchagain}
            setFetchagain={setFetchagain}
            onMoodChange={handleMoodChange}
          />
        </div>
      </div>
    </>
  );
};

export default ChatBox;