import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const ChatContext = createContext();
const ENDPOINT = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ✅ Global socket — dono MyChats aur SingleChat use karenge
export let globalSocket = null;

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);
  const [navigate_] = useState(null);

  const navigate = useNavigate();

  const [theme, setTheme] = useState(localStorage.getItem("app-theme") || "default");
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem("user-config");
    return savedConfig ? JSON.parse(savedConfig) : {
      font: "'Space Grotesk', sans-serif",
      radius: "24px",
      accent: "#6366f1",
      glass: "12px",
    };
  });

  const [assets, setAssets] = useState({
    character: "",
    bgOverlay: "",
    sound: ""
  });

  const hexToRGBA = (hex, alpha = 1) => {
    if (!hex) return `rgba(255, 255, 255, ${alpha})`;
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return `rgba(99, 102, 241, ${alpha})`;
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--font-family", config.font);
    root.style.setProperty("--radius", config.radius);
    root.style.setProperty("--accent", config.accent);
    root.style.setProperty("--accent-glow", hexToRGBA(config.accent, 0.2));
    root.style.setProperty("--glass", `blur(${config.glass})`);

    document.body.className = `theme-${theme}`;

    let themeAssets = { character: "", bgOverlay: "" };
    if (theme === "god") {
      themeAssets = {
        character: "https://assets9.lottiefiles.com/packages/lf20_jm9vny6f.json",
        bgOverlay: "radial-gradient(circle, rgba(255,153,51,0.05) 0%, transparent 70%)"
      };
    } else if (theme === "horror") {
      themeAssets = {
        character: "https://assets10.lottiefiles.com/packages/lf20_m6cu9k.json",
        bgOverlay: "linear-gradient(rgba(0,0,0,0.9), rgba(20,0,0,0.8))"
      };
    }

    setAssets(themeAssets);
    localStorage.setItem("app-theme", theme);
    localStorage.setItem("user-config", JSON.stringify(config));
  }, [theme, config]);

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setUser(userInfo);
    } else {
      const path = window.location.pathname;
      if (path !== "/" && path !== "/signup") navigate("/");
    }
  }, [navigate]);

  // ✅ Socket setup — user login hone ke baad ek baar
  useEffect(() => {
    if (!user) return;

    globalSocket = io(ENDPOINT);
    globalSocket.emit("setup", user);

    // ✅ Incoming message — MyChats mein notification update karo
    globalSocket.on("message received", (newMsg) => {
      setNotification((prev) => {
        // Already hai toh add mat karo
        const exists = prev.find((n) => n._id === newMsg._id);
        if (exists) return prev;
        return [newMsg, ...prev];
      });

      // Chat list mein latest message update karo
      setChats((prev) => {
        const exists = prev.find((c) => c._id === newMsg.chat._id);
        if (!exists) return prev;
        return prev
          .map((c) => c._id === newMsg.chat._id ? { ...c, latestMessage: newMsg } : c)
          .sort((a, b) => {
            const at = a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt) : 0;
            const bt = b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt) : 0;
            return bt - at;
          });
      });
    });

    return () => {
      globalSocket?.disconnect();
      globalSocket = null;
    };
  }, [user]);

  const getAIEmojis = (text) => {
    const input = text.toLowerCase();
    if (input.includes("kaisa") || input.includes("hey")) return ["👋", "✨", "🔥"];
    if (input.includes("fuck") || input.includes("ghussa")) return ["🤬", "😤", "🚫"];
    if (input.includes("haha") || input.includes("lol")) return ["😂", "🤣", "💀"];
    if (input.includes("shubh") || input.includes("pranam")) return ["🙏", "🪔", "🕉️"];
    return ["💯", "🚀", "✌️"];
  };

  return (
    <ChatContext.Provider
      value={{
        user, setUser,
        selectedChat, setSelectedChat,
        chats, setChats,
        notification, setNotification,
        theme, setTheme,
        config, setConfig,
        assets,
        getAIEmojis,
        hexToRGBA,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => useContext(ChatContext);
export default ChatProvider;