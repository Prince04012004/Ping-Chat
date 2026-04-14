import React, { useState, useEffect } from "react";
import { ChatState } from "../Context/ChatProvider";
import API from "../services/api";

const ProfileModal = ({ isOpen, onClose, user: passedUser }) => {
  const { user: currentUser, setUser, config, hexToRGBA } = ChatState();
  
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const accentColor = config?.accent || "#10b981";
  const appRadius = config?.radius || "32px";

  const isMe = passedUser?._id === (currentUser?._id || currentUser?.user?._id);

  useEffect(() => {
    if (isOpen && passedUser) {
      setName(passedUser.name || "");
      setStatus(passedUser.status || "");
      setPreviewImage(passedUser.profilepic || passedUser.pic || "");
    }
  }, [isOpen, passedUser]);

  // ☁️ CLOUDINARY UPLOAD LOGIC
  const postDetails = (pics) => {
    setUploading(true);
    if (!pics) {
      alert("Bhai, image toh select karo!");
      setUploading(false);
      return;
    }

    // 🔴 IMPORTANT: 'chatapp' ya jo bhi naam tune 'Unsigned' preset ka rakha hai yahan dalo
    const CLOUD_NAME = "dtenwujnc"; 
    const UPLOAD_PRESET = "chatapp"; 

    if (pics.type === "image/jpeg" || pics.type === "image/png" || pics.type === "image/jpg") {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", UPLOAD_PRESET);

      fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.secure_url) {
            setPreviewImage(data.secure_url.toString());
            console.log("Image synced to Cloudinary:", data.secure_url);
          } else {
            console.error("Cloudinary Error:", data);
            alert("Upload failed! Check if your preset is 'Unsigned'.");
          }
          setUploading(false);
        })
        .catch((err) => {
          console.error("Network Error:", err);
          setUploading(false);
        });
    } else {
      alert("Please select a valid image (JPG/PNG)");
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!isMe || uploading) return;
    try {
      const configReq = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
      };

      const { data } = await API.put("/api/updateprofile", { 
        name, 
        status, 
        profilepic: previewImage 
      }, configReq);
      
      const freshData = data.user || data;
      const updatedUserInfo = { 
        ...currentUser, 
        ...freshData,
        user: freshData, 
        token: currentUser.token 
      };

      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
      setUser({ ...updatedUserInfo }); 
      
      alert("Identity Updated! ⚡");
      onClose(); 
    } catch (error) {
      alert("Update failed!");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-300"
      onClick={onClose} 
    >
      <div 
        className="border w-full max-w-sm overflow-hidden shadow-2xl transition-all duration-500"
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          backgroundColor: '#050505', 
          borderColor: 'rgba(255,255,255,0.05)',
          borderRadius: appRadius,
          fontFamily: config?.font
        }}
      >
        <div className="p-6 flex justify-between items-center border-b border-white/5">
          <h2 className="text-[10px] font-black uppercase tracking-[4px]" style={{ color: accentColor }}>
            {isMe ? "Edit My Profile" : "Identity Details"}
          </h2>
          <button onClick={onClose} className="text-zinc-600 hover:text-white">✕</button>
        </div>

        <div className="p-8 flex flex-col items-center">
          <div className="relative group mb-8">
            <div 
              className={`w-32 h-32 overflow-hidden border-2 transition-all duration-500 shadow-2xl ${isMe ? 'cursor-pointer hover:opacity-70' : ''}`}
              style={{ borderRadius: '32px', borderColor: hexToRGBA(accentColor, 0.3) }}
              onClick={() => isMe && document.getElementById("fileInput").click()}
            >
              <img 
                src={previewImage || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
                className={`w-full h-full object-cover ${uploading ? 'animate-pulse opacity-40' : ''}`} 
                alt="Profile" 
              />
              {isMe && !uploading && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                   <p className="text-[8px] font-bold uppercase tracking-widest text-white">Change</p>
                </div>
              )}
            </div>
            
            <input id="fileInput" type="file" hidden accept="image/*" onChange={(e) => postDetails(e.target.files[0])} />
            
            {uploading && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white text-black text-[7px] font-black px-3 py-1 rounded-full tracking-widest">
                  SYNCING...
                </div>
            )}
          </div>

          <div className="w-full space-y-5 text-center">
            {isMe ? (
              <div className="space-y-4">
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-center text-lg font-black text-white focus:border-white/20 outline-none"
                  placeholder="Your Name"
                />
                <input 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-transparent text-center text-sm text-zinc-500 italic outline-none"
                  placeholder="Set Status vibe..."
                />
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">{name}</h3>
                <p className="text-sm text-zinc-500 italic">"{status || "No bio yet"}"</p>
              </div>
            )}

            {isMe && (
               <div className="pt-6">
                 <button 
                    onClick={handleUpdate} 
                    disabled={uploading}
                    className="w-full py-4 uppercase tracking-[4px] text-[10px] font-black transition-all active:scale-95"
                    style={{ backgroundColor: accentColor, color: '#000', borderRadius: '16px', opacity: uploading ? 0.4 : 1 }}
                  >
                    {uploading ? "Uploading Image..." : "Commit Changes"}
                 </button>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;