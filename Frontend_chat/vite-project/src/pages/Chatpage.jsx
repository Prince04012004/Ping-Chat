import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MyChats from "../components/MyChats";
import ChatBox from "../components/ChatBox";
import { ChatState } from "../Context/ChatProvider";

const Chatpage = () => {
  const [fetchagain, setFetchagain] = useState(false);
  const { user, selectedChat } = ChatState();
  const navigate = useNavigate();

  useEffect(() => {
    const userinfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userinfo) navigate("/");
  }, [navigate]);

  return (
    <div
      style={{ height: "100dvh" }}
      className="w-full bg-[#05070a] flex items-center justify-center p-0 md:p-6 overflow-hidden font-sans relative"
    >
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative w-full h-full max-w-[1600px] flex bg-white/[0.01] backdrop-blur-3xl border border-white/10 md:rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">

        {/* Left — MyChats: mobile par hidden jab chat open ho */}
        <div
          className={`
            ${selectedChat ? "hidden" : "flex"} md:flex
            w-full md:w-[350px] lg:w-[400px] h-full
            border-r border-white/5 flex-col bg-black/20 shrink-0
          `}
        >
          <div className="flex-1 overflow-y-auto">
            <MyChats fetchAgain={fetchagain} setFetchAgain={setFetchagain} />
          </div>
        </div>

        {/* Right — ChatBox: mobile par full width jab chat open ho */}
        <div
          className={`
            ${!selectedChat ? "hidden" : "flex"} md:flex
            flex-1 h-full overflow-hidden
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