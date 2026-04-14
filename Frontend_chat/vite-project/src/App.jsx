import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import Auth from './pages/Auth.jsx'; 
import Chatpage from './pages/Chatpage';
import Onboarding from './components/Onboarding'; // <-- Ye line check kar lena path ke hisaab se

function App() {
  // Ek chota sa check: Kya user ne pehle onboarding kiya hai?
  const isSetupDone = localStorage.getItem("onboarding-complete");

  return (
    <div className="App">
      <Routes>
        {/* 1. Root path par Auth (Login/Signup) */}
        <Route path="/" element={<Auth />} />

        {/* 2. Onboarding Page */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* 3. Main Chat Page */}
        <Route 
          path="/chat" 
          element={
            // Agar setup nahi hua, toh zabardasti onboarding pe bhejo
            isSetupDone ? <Chatpage /> : <Navigate to="/onboarding" />
          } 
        />

        {/* 4. Catch-all: Agar koi galat URL daale toh home pe bhejo */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;