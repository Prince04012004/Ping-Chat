import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from "react-router-dom";
import ChatProvider from "./Context/ChatProvider";
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';

// Check karne ke liye console
// console.log("Vite Env:", import.meta.env); 
const PUBLISHABLE_KEY = "pk_test_Zmx5aW5nLXNuYWtlLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ"

if (!PUBLISHABLE_KEY) {
  // Agar .env kaam nahi kar rahi, toh yahan direct key paste kar do temporarily
  console.error("Key nahi mili! .env file check karo.");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <ChatProvider>
          <App />
        </ChatProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);