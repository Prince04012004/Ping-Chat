import React, { useEffect, useState } from "react";
import API from "../services/api";

const BlockedModal = ({ isOpen, onClose, userToken, fetchChats }) => {
  const [blockedList, setBlockedList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sabse pehle token handle karne ke liye ek helper function
  const getSafeToken = () => {
    const token = userToken || localStorage.getItem("token");
    if (!token) return null;
    // Kabhi kabhi token quotes ke saath save hota hai, usko clean karna zaroori hai
    return token.startsWith('"') ? JSON.parse(token) : token;
  };

  const fetchBlocked = async () => {
    const token = getSafeToken();
    if (!token) {
      console.error("No token found!");
      return;
    }

    try {
      setLoading(true);
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        } 
      };
      
      const { data } = await API.get("/api/getblockedusers", config);
      setBlockedList(data);
    } catch (e) { 
      console.log("Fetch Blocked Error Details:", e.response?.data || e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    if (isOpen) fetchBlocked(); 
  }, [isOpen]);

  const handleUnblock = async (id) => {
    const token = getSafeToken();
    if (!token) return;

    const backupList = [...blockedList];
    // Optimistic UI: Turant list se hata do
    setBlockedList((prev) => prev.filter((u) => u._id !== id));

    try {
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        } 
      };
      
      // Backend check karna ki "userunblockid" hi key mang raha hai ya "userId"
      await API.post("/api/unblockuser", { userunblockid: id }, config);
      
      if (fetchChats) fetchChats();
    } catch (e) { 
      setBlockedList(backupList); // Error aane par wapas purani list set kar do
      console.error("Unblock Error:", e.response?.data || e.message);
      alert("Unblock failed! Check console for details."); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all">
      
      <div className="bg-[#0f172a] w-full max-w-[360px] md:max-w-sm rounded-[28px] md:rounded-[32px] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex flex-col">
            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-orange-400">🛡️ Privacy Shield</h3>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">Blocked Connections</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* List Body */}
        <div className="p-3 md:p-4 max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="opacity-30 text-[9px] font-black tracking-[0.2em]">SYNCHRONIZING...</div>
            </div>
          ) : blockedList.length === 0 ? (
            <div className="text-center py-12">
               <div className="text-[24px] mb-2 opacity-20">✨</div>
               <div className="opacity-20 text-[9px] font-black tracking-[0.2em] uppercase">No Blocked Users</div>
            </div>
          ) : (
            <div className="space-y-2">
              {blockedList.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3.5 md:p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-400/10 flex items-center justify-center text-orange-400 text-[10px] font-bold">
                       {u.name?.[0]}
                    </div>
                    <span className="text-sm font-bold text-zinc-200 truncate max-w-[120px] md:max-w-[150px]">{u.name}</span>
                  </div>
                  <button 
                    onClick={() => handleUnblock(u._id)} 
                    className="text-[9px] bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-xl font-black transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
                  >
                    UNBLOCK
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/[0.01] text-center border-t border-white/5">
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">End-to-End Encrypted Privacy</p>
        </div>
      </div>
    </div>
  );
};

export default BlockedModal;