import React from "react";
import { ChatState } from "../Context/ChatProvider";

const Onboarding = () => {
  const { config, setConfig } = ChatState();

  const handleFinish = () => {
    // 1. Storage update karo
    localStorage.setItem("onboarding-complete", "true");
    
    // 2. Hard Navigation (Isse App.js ko naya storage data mil jayega)
    window.location.assign("/chat");
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 transition-all duration-500" 
         style={{ backgroundColor: 'var(--bg-sidebar)', fontFamily: 'var(--font-family)' }}>
      
      <div className="max-w-md w-full space-y-8 text-center dynamic-card p-10 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <h2 className="text-4xl font-black dynamic-text italic tracking-tighter">SWAG SETUP.</h2>
        <p className="text-xs opacity-50 dynamic-text uppercase tracking-[0.3em]">Apne chat room ko shahi banayein</p>

        {/* Font Selection */}
        <div className="space-y-3 text-left">
          <label className="text-[10px] font-bold opacity-40 dynamic-text uppercase tracking-widest">Font Style</label>
          <select 
            value={config.font} 
            onChange={(e) => setConfig({...config, font: e.target.value})}
            className="w-full bg-black/40 p-4 rounded-xl text-sm dynamic-text border border-white/10 outline-none cursor-pointer hover:border-[var(--accent)] transition-all appearance-none"
          >
            <option value="'Outfit', sans-serif">Modern & Clean</option>
            <option value="'Cinzel Decorative', serif">Royal Indian</option>
            <option value="'Kalam', cursive">Desi Handwritten</option>
            <option value="'Orbitron', sans-serif">Cyberpunk Gaming</option>
            <option value="'JetBrains Mono', monospace">Coding Style</option>
          </select>
        </div>

        {/* Accent Color Selection */}
        <div className="space-y-3 text-left">
          <label className="text-[10px] font-bold opacity-40 dynamic-text uppercase tracking-widest">Brand Color</label>
          <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/10">
             <span className="text-xs dynamic-text opacity-70 italic">Pick your vibe</span>
             <input 
                type="color" 
                value={config.accent} 
                onChange={(e) => setConfig({...config, accent: e.target.value})}
                className="w-10 h-10 cursor-pointer bg-transparent border-none outline-none"
             />
          </div>
        </div>

        {/* Finish Button */}
        <button 
          onClick={handleFinish}
          className="w-full py-4 bg-[var(--accent)] text-black font-black rounded-xl shadow-lg shadow-[var(--accent)]/20 active:scale-95 transition-all uppercase tracking-widest text-sm mt-4"
        >
          Chalo Chat Karein! 🚀
        </button>
      </div>
    </div>
  );
};

export default Onboarding;