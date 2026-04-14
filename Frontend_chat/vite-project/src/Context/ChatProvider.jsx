import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState([]);
  
  // 🔥 1. NOTIFICATION STATE (Added with initial empty array)
  const [notification, setNotification] = useState([]); 
  
  const navigate = useNavigate();

  // --- 2. THEME & CONFIG STATE ---
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

  // --- 3. ASSET ENGINE ---
  const [assets, setAssets] = useState({
    character: "", 
    bgOverlay: "",
    sound: ""      
  });

  // --- HELPER: Hex to RGBA ---
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

  // --- 4. THEME SYNC ENGINE ---
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

  // --- 5. AUTH LOGIC ---
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (userInfo) {
      setUser(userInfo);
    } else {
      const path = window.location.pathname;
      if (path !== "/" && path !== "/signup") navigate("/");
    }
  }, [navigate]);

  // --- 6. AI EMOJI ENGINE ---
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
        notification, setNotification, // 🔥 Pass kiya Context mein
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