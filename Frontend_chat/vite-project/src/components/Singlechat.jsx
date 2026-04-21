import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
let socketInstance = null;

// accentColor aur hexToRGBA ChatBox se props mein aate hain
const SingleChat = ({ accentColor = "#10b981", hexToRGBA }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const selectedChatRef = useRef(null);

  const { user, selectedChat, setNotification } = ChatState();
  const myId = user?.user?._id || user?._id;

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Ref sync — socket callback mein stale closure se bachne ke liye
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Socket setup
  useEffect(() => {
    if (!user) return;
    socketInstance = io(ENDPOINT);
    socketInstance.emit("setup", user);

    socketInstance.on("typing", () => setIsTyping(true));
    socketInstance.on("stop typing", () => setIsTyping(false));

    socketInstance.on("message received", (newMsg) => {
      const currentChat = selectedChatRef.current;
      if (!currentChat || currentChat._id !== newMsg.chat._id) {
        setNotification?.((prev) => [newMsg, ...prev]);
      } else {
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      socketInstance.disconnect();
      socketInstance = null;
    };
  }, [user]);

  const fetchMessages = async (pageNum = 1) => {
    if (!selectedChat?._id) return;
    try {
      const { data } = await API.get(
        `/api/allmessages/${selectedChat._id}?page=${pageNum}`,
        getAuthHeader()
      );

      const newMsgs = Array.isArray(data.messages)
        ? data.messages
        : Array.isArray(data)
        ? data        // purana API jo seedha array bhejta tha uske liye fallback
        : [];

      setMessages((prev) => (pageNum === 1 ? newMsgs : [...newMsgs, ...prev]));
      setHasMore(data.hasMore || false);

      if (pageNum === 1) {
        socketInstance?.emit("join chat", selectedChat._id);
        setTimeout(scrollToBottom, 200);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Chat change hone par reset + fresh fetch
  useEffect(() => {
    if (!selectedChat?._id) return;
    setMessages([]);
    setPage(1);
    setHasMore(true);
    fetchMessages(1);
  }, [selectedChat?._id]);

  // Scroll upar jaane par older messages load karo
  const handleScroll = async (e) => {
    const { scrollTop, scrollHeight } = e.currentTarget;
    if (scrollTop < 10 && hasMore && !loadingMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      const prevHeight = scrollHeight;
      await fetchMessages(nextPage);
      setPage(nextPage);
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop =
            containerRef.current.scrollHeight - prevHeight;
        }
      }, 50);
    }
  };

  const sendMessage = async (event) => {
    if ((event.key === "Enter" || event.type === "click") && newMessage.trim()) {
      socketInstance?.emit("stop typing", selectedChat._id);
      try {
        const content = newMessage;
        setNewMessage("");
        const { data } = await API.post(
          "/api/sendmessage",
          { content, chatid: selectedChat._id },
          getAuthHeader()
        );
        socketInstance?.emit("new message", data);
        setMessages((prev) => [...prev, data]);
        setTimeout(scrollToBottom, 50);
      } catch (err) {
        console.error("Send error:", err);
      }
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!typing) {
      setTyping(true);
      socketInstance?.emit("typing", selectedChat._id);
    }
    const lastTypingTime = new Date().getTime();
    setTimeout(() => {
      if (new Date().getTime() - lastTypingTime >= 3000 && typing) {
        socketInstance?.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, 3000);
  };

  // Messages grouped by date
  const groupedMessages = messages.reduce((groups, msg) => {
    if (!msg?.createdAt) return groups;
    const date = new Date(msg.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  const borderColor = hexToRGBA
    ? hexToRGBA(accentColor, 0.3)
    : `${accentColor}4d`;
  const bgMine = hexToRGBA
    ? hexToRGBA(accentColor, 0.18)
    : `${accentColor}2e`;

  return (
    <>
      <style>{`
        @keyframes typingPulse {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50%       { opacity: 1;   transform: translateY(-3px); }
        }
        .typing-dot {
          width: 4px; height: 4px; border-radius: 50%;
          animation: typingPulse 1.2s ease infinite;
        }
        .sc-messages::-webkit-scrollbar { width: 3px; }
        .sc-messages::-webkit-scrollbar-thumb {
          background: ${accentColor}4d; border-radius: 10px;
        }
      `}</style>

      {/* Messages area */}
      <div
        className="sc-messages flex-1 overflow-y-auto px-5 py-6"
        style={{ minHeight: 0 }}
        ref={containerRef}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <div className="text-center text-[10px] text-white/30 py-2">
            Loading older messages...
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-[2px]">
                {date}
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-2">
              {msgs.map((m, i) => {
                const isMine = (m.sender?._id || m.sender) === myId;
                return (
                  <div
                    key={m._id || i}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-[82%] px-5 py-3.5 text-[14.5px] leading-relaxed text-white"
                      style={{
                        borderRadius: isMine
                          ? "24px 24px 4px 24px"
                          : "24px 24px 24px 4px",
                        backgroundColor: isMine
                          ? bgMine
                          : "rgba(255,255,255,0.04)",
                        border: `1px solid ${
                          isMine ? borderColor : "rgba(255,255,255,0.08)"
                        }`,
                        backdropFilter: "blur(15px)",
                      }}
                    >
                      {m.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-1.5 p-3 mt-2 w-fit bg-white/5 rounded-2xl border border-white/10">
            <div className="typing-dot" style={{ background: accentColor, animationDelay: "0s" }} />
            <div className="typing-dot" style={{ background: accentColor, animationDelay: "0.2s" }} />
            <div className="typing-dot" style={{ background: accentColor, animationDelay: "0.4s" }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer / Input */}
      <footer className="flex-shrink-0 p-5 bg-black/40 backdrop-blur-3xl border-t border-white/5">
        <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 pl-6 pr-2 py-2 rounded-[28px]">
          <input
            value={newMessage}
            onChange={typingHandler}
            onKeyDown={sendMessage}
            onFocus={() => setTimeout(scrollToBottom, 150)}
            placeholder="Inject signal..."
            className="flex-1 bg-transparent outline-none text-white py-2"
            style={{ fontSize: "16px" }}
          />
          <button
            onClick={sendMessage}
            className="w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-all"
            style={{ backgroundColor: accentColor, color: "#000" }}
          >
            ➤
          </button>
        </div>
      </footer>
    </>
  );
};

export default SingleChat;