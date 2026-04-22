import React, { useEffect, useState, useRef } from "react";
import API from "../services/api";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";

const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
let socketInstance = null;

const MOOD_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#a855f7",
];

const QUICK_EMOJIS = [
  "😂", "❤️", "🔥", "😍", "🥹",
  "💀", "🤯", "😎", "🥰", "👑",
  "💯", "🚀", "✨", "🫶", "😭",
];

const playClickSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
};

const SingleChat = ({ fetchagain, setFetchagain, onMoodChange }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [moodIndex, setMoodIndex] = useState(0);
  const [otherMoodIndex, setOtherMoodIndex] = useState(0);
  const moodIndexRef = useRef(0);

  const [showPicker, setShowPicker] = useState(false);
  const [flyingEmoji, setFlyingEmoji] = useState(null);

  // 🗑️ Delete menu — state mein sirf messageId store
  const [activeMenu, setActiveMenu] = useState(null);
  // Ref use karo timer ke liye — state se re-render issue hota tha
  const longPressTimerRef = useRef(null);
  // Track karo ki long press hua ya normal tap
  const isLongPressRef = useRef(false);

  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const selectedChatRef = useRef(null);
  const pickerRef = useRef(null);

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
        } catch { return `rgba(99,102,241,${alpha})`; }
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

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const showFlyingEmoji = (emoji) => {
    const id = Date.now();
    setFlyingEmoji({ emoji, id });
    setTimeout(() => setFlyingEmoji(null), 2000);
  };

  useEffect(() => {
    if (!user) return;
    socketInstance = io(ENDPOINT);
    socketInstance.emit("setup", user);

    socketInstance.on("typing", () => setIsTyping(true));
    socketInstance.on("stop typing", () => setIsTyping(false));

    socketInstance.on("mood change", ({ moodIndex: idx }) => {
      setOtherMoodIndex(idx);
      onMoodChange?.(MOOD_COLORS[idx]);
    });

    socketInstance.on("emoji reaction", ({ emoji }) => {
      showFlyingEmoji(emoji);
    });

    socketInstance.on("message deleted", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, content: "This message was deleted", deletedForEveryone: true }
            : m
        )
      );
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
        // ✅ Last emoji message pe flying animation dikha do
        const lastEmoji = [...newMsgs].reverse().find((m) => m.isEmoji);
        if (lastEmoji) {
          setTimeout(() => showFlyingEmoji(lastEmoji.content), 400);
        }
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

  const handleDelete = async (messageId, deleteForEveryone) => {
    setActiveMenu(null);
    try {
      await API.delete(`/api/deletemessage/${messageId}`, {
        data: { deleteForEveryone },
        ...getAuthHeader(),
      });
      if (deleteForEveryone) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, content: "This message was deleted", deletedForEveryone: true }
              : m
          )
        );
        socketInstance?.emit("message deleted", {
          messageId,
          chatId: selectedChat._id,
        });
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const sendEmojiReaction = async (emoji) => {
    setShowPicker(false);
    // Apni screen pe turant dikhao
    showFlyingEmoji(emoji);
    try {
      // DB mein save karo
      const { data } = await API.post(
        "/api/sendemoji",
        { chatid: selectedChat._id, emoji },
        getAuthHeader()
      );
      // Message list mein add karo (isEmoji: true)
      setMessages((prev) => [...prev, data]);
      // Socket se dusre user ko bhejo — woh online ho toh turant dikhe
      socketInstance?.emit("new message", data);
      socketInstance?.emit("emoji reaction", {
        chatId: selectedChat._id,
        emoji,
      });
    } catch (err) {
      console.error("Emoji send error:", err);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    playClickSound();
    const nextIndex = (moodIndexRef.current + 1) % MOOD_COLORS.length;
    moodIndexRef.current = nextIndex;
    setMoodIndex(nextIndex);
    onMoodChange?.(MOOD_COLORS[nextIndex]);
    socketInstance?.emit("mood change", {
      chatId: selectedChat._id,
      moodIndex: nextIndex,
    });
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

  // ✅ Long press handlers — ref use kar rahe hain timer ke liye
  const handleTouchStart = (msgId) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setActiveMenu(msgId);
    }, 500);
  };

  const handleTouchEnd = (e) => {
    clearTimeout(longPressTimerRef.current);
    // Agar long press hua toh scroll/tap prevent karo
    if (isLongPressRef.current) {
      e.preventDefault();
    }
  };

  const handleTouchMove = () => {
    // Scroll karne par long press cancel ho
    clearTimeout(longPressTimerRef.current);
    isLongPressRef.current = false;
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
          50%       { opacity: 1; transform: translateY(-3px); }
        }
        .typing-dot {
          width: 4px; height: 4px; border-radius: 50%;
          animation: typingPulse 1.2s ease infinite;
        }
        .sc-scroll::-webkit-scrollbar { width: 3px; }
        .sc-scroll::-webkit-scrollbar-thumb {
          background: ${rgba(accentColor, 0.4)}; border-radius: 10px;
        }
        .msg-bubble {
          transition: background-color 0.4s ease, border-color 0.4s ease;
          -webkit-user-select: none;
          user-select: none;
        }
        /* Emoji message — pop in animation */
        @keyframes emojiMsgPop {
          0%   { transform: scale(0.3); opacity: 0; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        .emoji-msg-bubble {
          animation: emojiMsgPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          -webkit-user-select: none;
          user-select: none;
        }
        /* Delete menu animation */
        @keyframes menuIn {
          from { opacity: 0; transform: scale(0.9) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .delete-menu {
          animation: menuIn 0.15s ease forwards;
        }
        @keyframes emojiFloat {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
          60%  { opacity: 1; transform: translate(-50%, -60%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -80%) scale(0.8); }
        }
        .flying-emoji {
          position: fixed;
          top: 50%; left: 50%;
          font-size: 120px;
          z-index: 9999;
          pointer-events: none;
          animation: emojiFloat 2s ease forwards;
          filter: drop-shadow(0 0 30px rgba(255,255,255,0.3));
        }
        @keyframes pickerIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .emoji-picker { animation: pickerIn 0.2s ease forwards; }
      `}</style>

      {flyingEmoji && (
        <div key={flyingEmoji.id} className="flying-emoji">
          {flyingEmoji.emoji}
        </div>
      )}

      {/* Backdrop — activeMenu ho toh bahar tap se close ho */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-40"
          onTouchStart={() => setActiveMenu(null)}
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* MESSAGES */}
      <div
        className="sc-scroll flex-1 overflow-y-auto px-4 py-6"
        style={{ minHeight: 0, background: "transparent" }}
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
                const isDeleted = m.deletedForEveryone;
                const isEmoji = m.isEmoji;

                // Emoji message — animated bubble, no delete menu
                if (isEmoji) {
                  return (
                    <div
                      key={m._id || i}
                      className={`flex ${isMine ? "justify-end" : "justify-start"} emoji-msg-wrapper`}
                    >
                      <div
                        className="emoji-msg-bubble"
                        style={{ fontSize: "52px", lineHeight: 1, padding: "4px 8px" }}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={m._id || i}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {/* 
                      Wrapper — relative position taaki menu sahi jagah aaye
                      inline-flex taaki wrapper sirf bubble jitna wide ho
                    */}
                    <div
                      className="relative"
                      style={{ display: "inline-flex", maxWidth: "82%" }}
                      onContextMenu={(e) => { e.preventDefault(); setActiveMenu(m._id); }}
                      onTouchStart={() => handleTouchStart(m._id)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchMove}
                    >
                      {/* Delete menu */}
                      {activeMenu === m._id && !isDeleted && (
                        <div
                          className="delete-menu absolute z-50 rounded-2xl overflow-hidden shadow-2xl"
                          style={{
                            background: "#1a1a1a",
                            border: `1px solid ${rgba(accentColor, 0.3)}`,
                            boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 20px ${rgba(accentColor, 0.1)}`,
                            // Menu ko bubble ke upar dikhao
                            bottom: "calc(100% + 8px)",
                            // Sender ke liye right align, receiver ke liye left
                            ...(isMine ? { right: 0 } : { left: 0 }),
                            minWidth: "200px",
                          }}
                        >
                          {isMine && (
                            <button
                              onTouchStart={(e) => e.stopPropagation()}
                              onClick={() => handleDelete(m._id, true)}
                              className="flex items-center gap-3 px-5 py-3.5 text-[13px] text-red-400 font-bold w-full text-left active:bg-red-500/10"
                              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              🗑️ Delete for Everyone
                            </button>
                          )}
                          <button
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={() => handleDelete(m._id, false)}
                            className="flex items-center gap-3 px-5 py-3.5 text-[13px] text-white/70 w-full text-left active:bg-white/5"
                          >
                            🙈 Delete for Me
                          </button>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className="msg-bubble px-5 py-3.5 text-[14.5px] leading-relaxed"
                        style={{
                          borderRadius: isMine ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                          backgroundColor: isDeleted
                            ? "rgba(255,255,255,0.03)"
                            : isMine
                            ? rgba(accentColor, 0.2)
                            : "rgba(255,255,255,0.08)",
                          border: `1px solid ${
                            isDeleted
                              ? "rgba(255,255,255,0.06)"
                              : isMine
                              ? rgba(accentColor, 0.4)
                              : "rgba(255,255,255,0.12)"
                          }`,
                          color: isDeleted ? "rgba(255,255,255,0.3)" : "#fff",
                          fontStyle: isDeleted ? "italic" : "normal",
                        }}
                      >
                        {m.content}
                      </div>
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
              transition: "all 0.4s ease",
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
        className="flex-shrink-0 p-4 relative"
        style={{
          background: "#0a0a0a",
          borderTop: `1px solid ${rgba(accentColor, 0.15)}`,
          transition: "border-color 0.4s ease",
        }}
      >
        {showPicker && (
          <div
            ref={pickerRef}
            className="emoji-picker absolute bottom-[80px] right-4 rounded-2xl p-3 z-50"
            style={{
              background: "#111",
              border: `1px solid ${rgba(accentColor, 0.25)}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${rgba(accentColor, 0.1)}`,
            }}
          >
            <p className="text-[9px] uppercase tracking-widest mb-2 px-1" style={{ color: rgba(accentColor, 0.6) }}>
              React with emoji
            </p>
            <div className="grid grid-cols-5 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendEmojiReaction(emoji)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-2xl active:scale-90 transition-transform"
                  style={{ background: rgba(accentColor, 0.08) }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className="flex items-center gap-2 pl-5 pr-2 py-2 rounded-[28px]"
          style={{
            background: rgba(accentColor, 0.06),
            border: `1px solid ${rgba(accentColor, 0.2)}`,
            transition: "all 0.4s ease",
          }}
        >
          <button
            onClick={() => setShowPicker((p) => !p)}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl active:scale-90 transition-all"
            style={{
              background: showPicker ? rgba(accentColor, 0.2) : rgba(accentColor, 0.08),
              color: accentColor,
            }}
          >
            <span style={{ fontSize: "18px", letterSpacing: "-2px", lineHeight: 1 }}>•••</span>
          </button>

          <input
            value={newMessage}
            onChange={typingHandler}
            onKeyDown={sendMessage}
            onFocus={() => setTimeout(scrollToBottom, 150)}
            placeholder="Type to vibe..."
            className="flex-1 bg-transparent outline-none text-white py-2"
            style={{ fontSize: "16px" }}
          />

          <button
            onClick={sendMessage}
            className="w-11 h-11 flex items-center justify-center rounded-full active:scale-90 transition-all flex-shrink-0"
            style={{
              backgroundColor: accentColor,
              color: "#000",
              boxShadow: `0 0 12px ${rgba(accentColor, 0.4)}`,
              transition: "background-color 0.4s ease, box-shadow 0.4s ease",
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