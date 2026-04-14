import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import Auth from './pages/Auth.jsx'; 
import Chatpage from './pages/Chatpage';

function App() {
  // Onboarding hatane ke baad ab isSetupDone ki zaroorat nahi hai
  // Agar tum authentication check lagana chahte ho toh yahan 'token' check kar sakte ho

  return (
    <div className="App">
      <Routes>
        {/* 1. Root path par Auth (Login/Signup) */}
        <Route path="/" element={<Auth />} />

        {/* 2. Main Chat Page (Direct Access) */}
        <Route 
          path="/chat" 
          element={<Chatpage />} 
        />

        {/* 3. Catch-all: Agar koi galat URL daale toh home pe bhejo */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;