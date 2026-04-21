import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
let socketInstance = null;

// 🎨 Mood color palette — typing ke saath cycle hoga
const MOOD_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#a855f7", // purple
];

// 🔊 Click sound — Web Audio API se (koi file nahi chahiye)
const playClickSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Audio not supported — silently fail
  }
};

const SingleChat = ({ fetchagain, setFetchagain, onMoodChange }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 🎨 Mood state
  const [moodIndex, setMoodIndex] = useState(0);
  const [otherMoodIndex, setOtherMoodIndex] = useState(0);
  const moodIndexRef = useRef(0);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const selectedChatRef = useRef(null);

  const { user, selectedChat, setNotification, config, hexToRGBA } = ChatState();
  const accentColor = MOOD_COLORS[moodIndex];
  const myId = user?.user?._id || user?._id;

  const rgba = hexToRGBA
    ? hexToRGBA
    : (hex, alpha) => {
        try {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r},${g},${b},${alpha})`;
        } catch { return `rgba(16,185,129,${alpha})`; }
      };

  const getAuthHeader = () => {
    const token = user?.token || localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

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

    // 🎨 Dusre user ka mood receive karo
    socketInstance.on("mood change", ({ moodIndex: idx }) => {
      setOtherMoodIndex(idx);
      // Parent (ChatBox) ko bhi batao background change ke liye
      onMoodChange?.(MOOD_COLORS[idx]);
    });

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
        ? data
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

  useEffect(() => {
    if (!selectedChat?._id) return;
    setMessages([]);
    setPage(1);
    setHasMore(true);
    fetchMessages(1);
  }, [selectedChat?._id]);

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

  // 🎨 Typing handler — har keystroke pe color change + sound
  const typingHandler = (e) => {
    const val = e.target.value;
    setNewMessage(val);

    // 🔊 Click sound har key pe
    playClickSound();

    // 🎨 Color change — next color pe shift
    const nextIndex = (moodIndexRef.current + 1) % MOOD_COLORS.length;
    moodIndexRef.current = nextIndex;
    setMoodIndex(nextIndex);

    // Parent ko batao (ChatBox background ke liye)
    onMoodChange?.(MOOD_COLORS[nextIndex]);

    // Socket se dusre user ko bhejo
    socketInstance?.emit("mood change", {
      chatId: selectedChat._id,
      moodIndex: nextIndex,
    });

    // Typing indicator
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
        .sc-scroll::-webkit-scrollbar { width: 3px; }
        .sc-scroll::-webkit-scrollbar-thumb {
          background: ${rgba(accentColor, 0.4)};
          border-radius: 10px;
        }
        .msg-bubble {
          transition: background-color 0.4s ease, border-color 0.4s ease;
        }
        .send-btn {
          transition: background-color 0.4s ease, box-shadow 0.4s ease;
        }
      `}</style>

      {/* MESSAGES */}
      <div
        className="sc-scroll flex-1 overflow-y-auto px-5 py-6"
        style={{ minHeight: 0, background: "#050505" }}
        ref={containerRef}
        onScroll={handleScroll}
      >
        {loadingMore && (
          <div className="text-center text-[10px] py-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Loading older messages...
          </div>
        )}

        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              <span className="text-[9px] font-bold uppercase tracking-[2px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                {date}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>

            <div className="space-y-2">
              {msgs.map((m, i) => {
                const isMine = (m.sender?._id || m.sender) === myId;
                // Mine = apna mood color, other = unka mood color
                const bubbleColor = isMine ? accentColor : MOOD_COLORS[otherMoodIndex];
                return (
                  <div
                    key={m._id || i}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="msg-bubble max-w-[82%] px-5 py-3.5 text-[14.5px] leading-relaxed"
                      style={{
                        borderRadius: isMine ? "24px 24px 4px 24px" : "24px 24px 24px 4px",
                        backgroundColor: rgba(bubbleColor, 0.18),
                        border: `1px solid ${rgba(bubbleColor, 0.35)}`,
                        color: "#fff",
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
          <div
            className="flex gap-1.5 p-3 mt-2 w-fit rounded-2xl"
            style={{
              background: rgba(MOOD_COLORS[otherMoodIndex], 0.1),
              border: `1px solid ${rgba(MOOD_COLORS[otherMoodIndex], 0.2)}`,
              transition: "background 0.4s ease, border 0.4s ease",
            }}
          >
            <div className="typing-dot" style={{ background: MOOD_COLORS[otherMoodIndex], animationDelay: "0s" }} />
            <div className="typing-dot" style={{ background: MOOD_COLORS[otherMoodIndex], animationDelay: "0.2s" }} />
            <div className="typing-dot" style={{ background: MOOD_COLORS[otherMoodIndex], animationDelay: "0.4s" }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER */}
      <footer
        className="flex-shrink-0 p-5"
        style={{
          background: "#0a0a0a",
          borderTop: `1px solid ${rgba(accentColor, 0.15)}`,
          transition: "border-color 0.4s ease",
        }}
      >
        <div
          className="flex items-center gap-3 pl-6 pr-2 py-2 rounded-[28px]"
          style={{
            background: rgba(accentColor, 0.06),
            border: `1px solid ${rgba(accentColor, 0.2)}`,
            transition: "background 0.4s ease, border-color 0.4s ease",
          }}
        >
          <input
            value={newMessage}
            onChange={typingHandler}
            onKeyDown={sendMessage}
            onFocus={() => setTimeout(scrollToBottom, 150)}
            placeholder="Type to change the vibe..."
            className="flex-1 bg-transparent outline-none text-white py-2"
            style={{ fontSize: "16px" }}
          />
          <button
            onClick={sendMessage}
            className="send-btn w-11 h-11 flex items-center justify-center rounded-full active:scale-90"
            style={{
              backgroundColor: accentColor,
              color: "#000",
              boxShadow: `0 0 12px ${rgba(accentColor, 0.4)}`,
            }}
          >
            ➤
          </button>
        </div>
      </footer>
    </>
  );
};

export default SingleChat;