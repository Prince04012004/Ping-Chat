import React, { useState, useEffect, useRef } from "react";
import { ChatState } from "../Context/ChatProvider";
import API from "../services/api";
import ProfileModal from "../pages/Profile";

const ChatBox = () => {
  const { selectedChat, setSelectedChat, user, config, hexToRGBA } = ChatState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);

  const accentColor = config?.accent || "#10b981";

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const getReceiverData = () => {
    if (!selectedChat?.users || !user) return null;

    const userData = user?.user || user;
    const myId = (userData?._id || userData?.id)?.toString();

    const otherUser = selectedChat.users.find(
      (u) => (u._id || u.id)?.toString() !== myId
    );

    return otherUser || selectedChat.users[0];
  };

  const receiver = getReceiverData();
  const receiverName = receiver?.name || receiver?.username || "Aura User";
  const receiverPic = receiver?.profilepic || receiver?.pic || "";

  const openProfile = async () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    const targetId = receiver?._id || receiver?.id;
    if (!targetId) return;

    try {
      const { data } = await API.get(`/api/getprofile/${targetId}`, getAuthHeader());

      setProfileUser(data);
      setShowMenu(false);
      setIsProfileOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = user?.token || localStorage.getItem("token");

      const { data } = await API.post(
        "/api/sendmessage",
        {
          content: newMessage,
          chatid: selectedChat._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setNewMessage("");
      setMessages((prev) => [...prev, data]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?._id) return;

      try {
        const { data } = await API.get(
          `/api/allmessages/${selectedChat._id}`,
          getAuthHeader()
        );

        setMessages(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [selectedChat?._id]);

  if (!selectedChat) return null;

  return (
    <>
      <style>{`

      #chat-master-container {
        position: fixed;
        inset: 0;
        height: 100dvh;
        width: 100%;
        display: flex;
        flex-direction: column;
        background: #050505;
        z-index: 100;
      }

      .cyber-grid {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px), 
                          linear-gradient(90deg, ${hexToRGBA(accentColor, 0.05)} 1px, transparent 1px);
        background-size: 45px 45px;
        opacity: 0.4;
        z-index: 0;
        pointer-events: none;
      }

      .aura-sphere {
        position: absolute;
        width: 350px;
        height: 350px;
        background: ${hexToRGBA(accentColor, 0.1)};
        filter: blur(100px);
        border-radius: 50%;
        z-index: 0;
        animation: float 8s infinite alternate;
      }

      @keyframes float {
        from {
          top: 0%;
          left: 0%;
        }
        to {
          top: 50%;
          left: 60%;
        }
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 3px;
      }

      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: ${hexToRGBA(accentColor, 0.3)};
        border-radius: 10px;
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

      <div id="chat-master-container" style={{ fontFamily: config?.font }}>
        
        <div className="cyber-grid" />
        <div className="aura-sphere" />

        {/* HEADER */}
        <div className="sticky top-0 flex-shrink-0 w-full h-[70px] flex items-center justify-between px-5 bg-black/80 backdrop-blur-3xl border-b border-white/5 z-50">
          
          <div className="flex items-center gap-4 min-w-0">
            
            <button
              onClick={() => setSelectedChat(null)}
              className="p-1 md:hidden"
              style={{ color: accentColor }}
            >
              ←
            </button>

            <div
              onClick={openProfile}
              className="flex items-center cursor-pointer gap-3 min-w-0"
            >
              
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-2xl border-2 overflow-hidden bg-black"
                  style={{ borderColor: hexToRGBA(accentColor, 0.2) }}
                >
                  {receiverPic ? (
                    <img
                      src={receiverPic}
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center font-black"
                      style={{ color: accentColor }}
                    >
                      {receiverName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <h2 className="text-[15px] font-black text-white truncate uppercase italic leading-none">
                  {receiverName}
                </h2>
              </div>

            </div>
          </div>
        </div>

        {/* CHAT AREA */}
        <div
          className="flex-1 overflow-y-auto px-5 py-6 space-y-7 relative z-10 custom-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          
          {messages.map((m) => {
            const isMine =
              (m.sender?._id || m.sender) ===
              (user?.user?._id || user?._id);

            return (
              <div
                key={m._id}
                className={`flex ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className="max-w-[82%] px-5 py-3.5 text-[14.5px] leading-relaxed shadow-xl"
                  style={{
                    borderRadius: isMine
                      ? "24px 24px 4px 24px"
                      : "24px 24px 24px 4px",

                    backgroundColor: isMine
                      ? hexToRGBA(accentColor, 0.18)
                      : "rgba(255,255,255,0.04)",

                    color: "#fff",
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BAR */}
        <div className="sticky bottom-0 flex-shrink-0 p-5 bg-black/40 backdrop-blur-3xl border-t border-white/5 z-20">
          
          <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 pl-6 pr-2 py-2 rounded-[28px] shadow-inner">
            
            <input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Inject signal..."
              className="flex-1 bg-transparent outline-none text-[14px] text-white py-2"
            />

            <button
              onClick={sendMessage}
              className="w-11 h-11 flex items-center justify-center rounded-full"
              style={{
                backgroundColor: accentColor,
                color: "#000",
              }}
            >
              ➤
            </button>

          </div>

        </div>

      </div>
    </>
  );
};

export default ChatBox;