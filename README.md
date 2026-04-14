# 🛡️ Ping Aura - AI Powered Real-Time Chat

<div align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Socket.io-Real--Time-black?style=for-the-badge&logo=socket.io" />
  <img src="https://img.shields.io/badge/UI%2FUX-Glitter%20Design-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-Theme%20Engine-orange?style=for-the-badge" />
</div>

---

## 🌟 Overview
**Ping Aura** is a feature-rich real-time communication platform. It’s not just a chat app; it’s an experience. Built with the **MERN Stack**, it combines high-speed messaging with a modern, glitter-infused UI and smart AI themes.

## ✨ Key Highlights

* **⚡ Instant Connectivity:** Real-time messaging and notifications using **Socket.io**.
* **🎨 AI-Driven Themes:** Automatically adapts UI colors and vibes based on user interactions.
* **🛡️ Privacy First:** Built-in **User Blocking System** with a dedicated `BlockedModal` for total control.
* **✨ Aesthetics:** Sleek, modern interface featuring **Glitter UI** effects and smooth **Framer Motion** animations.
* **🔒 Enterprise Security:** JWT authentication ensures that your data and chats stay yours.

---

## 🚀 Tech Stack

### Frontend
- **React.js (Vite)** - For a blazing fast development experience.
- **Tailwind CSS** - Modern styling and glassmorphism.
- **Axios** - Efficient API handling.
- **Lucide React** - Beautiful, lightweight icons.

### Backend
- **Node.js & Express.js** - Robust server-side architecture.
- **MongoDB** - Scalable NoSQL database for flexible data storage.
- **Socket.io** - Bi-directional real-time communication.
- **JWT (JSON Web Token)** - Secure, stateless authentication.

---

## 📂 Project Architecture

```text
CHATTAPP/
├── Backend/              # Node.js Server, API Controllers, Models
│   └── server.js         # Entry Point
└── Frontend_chat/        
    └── vite-project/     # React Application (Client Side)
        ├── src/          # Components (Mychats.jsx, BlockedModal.jsx, etc.)
        └── public/       # Static Assets
