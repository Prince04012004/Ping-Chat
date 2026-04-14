import axios from "axios";

const API = axios.create({
  // baseURL: "http://localhost:5000", 
  baseURL: "https://ping-chat-wj31.onrender.com"
});

// Auto-token attacher
API.interceptors.request.use((req) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  if (userInfo && userInfo.token) {
    req.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return req;
});

export default API;