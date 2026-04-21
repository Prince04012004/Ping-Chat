import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";
import { ChatState } from "../Context/ChatProvider";

const Chatpage = () => {
  const [fetchagain, setFetchagain] = useState(false);
  const { user, selectedChat, config } = ChatState();
  const navigate = useNavigate();

  const accentColor = config?.accent || "#10b981";

  // RGBA Helper consistent with your other components
  const rgba = (hex, alpha) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16),
            g = parseInt(hex.slice(3, 5), 16),
            b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) { return `rgba(255, 255, 255, ${alpha})`; }
  };

  useEffect(() => {
    const userinfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userinfo) navigate("/");
  }, [navigate]);

  return (
    <div
      className="w-full h-[100dvh] flex items-center justify-center p-0 md:p-6 overflow-hidden relative"
      style={{ 
        fontFamily: config?.font,
        backgroundColor: "#050505" // Base dark theme
      }}
    >
      {/* ✅ SYNCED BACKGROUND — MyChats jaisa layered design */}
      <div className="absolute inset-0 z-0" style={{
        background: `
          radial-gradient(ellipse at 10% 10%, ${rgba(accentColor, 0.08)} 0%, transparent 50%),
          radial-gradient(ellipse at 90% 90%, ${rgba(accentColor, 0.06)} 0%, transparent 50%),
          linear-gradient(180deg, #070709 0%, #050505 100%)
        `
      }} />

      {/* Synced Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(${rgba(accentColor, 0.03)} 1px, transparent 1px),
          linear-gradient(90deg, ${rgba(accentColor, 0.03)} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }} />

      {/* Main Container */}
      <div className="relative w-full h-full max-w-[1600px] flex bg-black/10 backdrop-blur-md border border-white/5 md:rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)]">

        {/* Left — MyChats */}
        <div
          className={`
            ${selectedChat ? "hidden" : "flex"} md:flex
            w-full md:w-[350px] lg:w-[420px] h-full
            border-r border-white/5 flex-col bg-black/5 shrink-0
          `}
        >
          <div className="flex-1 overflow-hidden">
            <MyChats fetchAgain={fetchagain} setFetchAgain={setFetchagain} />
          </div>
        </div>

        {/* Right — ChatBox */}
        <div
          className={`
            ${!selectedChat ? "hidden" : "flex"} md:flex
            flex-1 h-full overflow-hidden relative
          `}
        >
          {user && (
            <ChatBox fetchagain={fetchagain} setFetchagain={setFetchagain} />
          )}
        </div>

      </div>
    </div>
  );
};

export default Chatpage;