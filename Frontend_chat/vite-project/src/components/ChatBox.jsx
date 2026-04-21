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

  const rgba = hexToRGBA
    ? hexToRGBA
    : (hex, alpha) =>
        `${hex}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

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
      await API.post(
        "/api/blockuser",
        { userblockid: receiver._id },
        getAuthHeader()
      );
      alert("User blocked successfully");
      setSelectedChat(null);
    } catch (err) {
      console.error("Block failed", err);
      alert("Failed to block user");
    }
    setShowMenu(false);
  };

  return (
    <>
      <style>{`
        .cb-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(${rgba(accentColor, 0.05)} 1px, transparent 1px),
            linear-gradient(90deg, ${rgba(accentColor, 0.05)} 1px, transparent 1px);
          background-size: 45px 45px;
          opacity: .4; pointer-events: none; z-index: 0;
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

      {/*
        w-full h-full flex flex-col — Chatpage ke flex container mein fit hota hai
        overflow-hidden — scroll sirf messages div par hoga
        koi position: fixed nahi
      */}
      <div
        className="relative w-full h-full flex flex-col bg-[#050505] overflow-hidden"
        style={{ fontFamily: config?.font }}
      >
        <div className="cb-grid" />

        {/* ── HEADER ── */}
        <header className="flex-shrink-0 h-[70px] flex items-center justify-between px-5 bg-black/80 backdrop-blur-3xl border-b border-white/5 z-10 relative">
          <div className="flex items-center gap-4">
            {/* Back button — mobile only */}
            <button
              onClick={() => setSelectedChat(null)}
              className="md:hidden p-2 rounded-xl bg-white/5 text-white"
            >
              <svg
                width="18" height="18" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              onClick={handleViewProfile}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-black text-lg bg-black"
                style={{ borderColor: rgba(accentColor, 0.25), color: accentColor }}
              >
                {receiver.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <h2 className="text-[15px] font-black text-white uppercase italic leading-none">
                {receiver.name || "User"}
              </h2>
            </div>
          </div>

          {/* 3-dot menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-zinc-400 hover:text-white transition-colors text-xl"
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-[190]"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className="absolute right-0 top-[110%] w-48 rounded-2xl overflow-hidden z-[200]"
                  style={{
                    background: "rgba(10,10,10,0.95)",
                    border: `1px solid ${rgba(accentColor, 0.2)}`,
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <button
                    onClick={handleViewProfile}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-[13px] text-white/80 hover:text-white transition-colors text-left"
                    style={{ borderBottom: `1px solid ${rgba(accentColor, 0.1)}` }}
                  >
                    View Identity
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-[13px] text-red-500 font-bold hover:bg-red-500/10 transition-colors text-left"
                  >
                    Block User
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* ── SINGLE CHAT (messages + input) ── */}
        {/* flex-1 + min-h-0 — yeh critical hai, bina iske messages overflow ho jaate hain */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-10">
          <SingleChat fetchagain={fetchagain} setFetchagain={setFetchagain} />
        </div>
      </div>
    </>
  );
};

export default ChatBox;