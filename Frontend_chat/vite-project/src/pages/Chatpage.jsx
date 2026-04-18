import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MyChats from "../components/MyChats"; 
import ChatBox from "../components/ChatBox";
import { ChatState } from "../Context/ChatProvider";

const Chatpage = () => {
    const [fetchagain, setfetchagain] = useState(false);
    const { user, selectedChat } = ChatState();
    const navigate = useNavigate();

    useEffect(() => {
        const userinfo = JSON.parse(localStorage.getItem("userInfo"));
        if (!userinfo) navigate('/');
    }, [navigate]);

    return (
        // ✅ h-screen → 100dvh: keyboard open hone par shrink hoga properly
        <div style={{ height: "100dvh" }} className="w-full bg-[#05070a] flex items-center justify-center p-0 md:p-6 overflow-hidden font-sans relative">
            
            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full"></div>
            </div>

            <div className="relative w-full h-full max-w-[1600px] flex flex-col bg-white/[0.01] backdrop-blur-3xl border border-white/10 md:rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">

                <main className="flex flex-1 overflow-hidden w-full relative h-full">
                    
                    {/* Left Side: MyChats */}
                    <div className={`${selectedChat ? "hidden" : "flex"} md:flex w-full md:w-[350px] lg:w-[400px] h-full border-r border-white/5 flex-col bg-black/20 shrink-0`}>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <MyChats fetchAgain={fetchagain} />
                        </div>
                    </div>

                    {/* Right Side: ChatBox */}
                    <div className={`${!selectedChat ? "hidden" : "flex"} md:flex flex-1 h-full bg-transparent overflow-hidden`}>
                        {user && (
                            <ChatBox fetchagain={fetchagain} setfetchagain={setfetchagain} />
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Chatpage;