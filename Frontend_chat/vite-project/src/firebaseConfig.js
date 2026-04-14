import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // 1. Ye import zaroori hai

const firebaseConfig = {
  apiKey: "AIzaSyBnSvLMBtUyzLxAeQB6xjGBLjTAhokEziQ",
  authDomain: "ping-chat-74fdf.firebaseapp.com",
  projectId: "ping-chat-74fdf",
  storageBucket: "ping-chat-74fdf.firebasestorage.app",
  messagingSenderId: "826140210094",
  appId: "1:826140210094:web:52b6de381be47668d04e3f",
  measurementId: "G-CDL5F5889R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. Auth ko initialize karo aur EXPORT karo
export const auth = getAuth(app);