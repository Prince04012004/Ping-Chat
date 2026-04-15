import React, { useState, useEffect } from "react";
import API from "../services/api"; 
import { useNavigate } from 'react-router-dom';

const Auth = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [step, setStep] = useState(1); 
    const [isSignup, setIsSignup] = useState(false); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
            navigate("/chat", { replace: true });
        }
    }, [navigate]);

    const handleAction = async () => {
        setError("");
        if (!email || !password) return setError("Email and Password are required!");
        
        setLoading(true);
        try {
            if (isSignup) {
                if (!name) {
                    setError("Name is required!");
                    setLoading(false);
                    return;
                }
                // Pehle OTP bhejenge signup ke liye
                await API.post("/api/sendotp", { email });
                setStep(2); 
            } else {
                // Direct login call
                const res = await API.post("/api/login", { email, password });
                if (res.data) {
                    localStorage.setItem("userInfo", JSON.stringify(res.data.user));
                    localStorage.setItem("token", res.data.token);
                    navigate("/chat", { replace: true });
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySignup = async () => {
        setError("");
        if (!otp) return setError("Please enter the OTP");

        setLoading(true);
        try {
            const res = await API.post("/api/signup", { name, email, password, otp });
            if (res.data) {
                localStorage.setItem("userInfo", JSON.stringify(res.data.user));
                localStorage.setItem("token", res.data.token);
                navigate("/chat", { replace: true }); 
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP or Server Error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d1117] relative overflow-hidden font-sans p-4">
            <div className="relative w-full max-w-[420px] z-10">
                <div className="bg-white/[0.03] backdrop-blur-[30px] border border-white/10 p-6 md:p-10 rounded-[32px] shadow-2xl">
                    
                    <div className="mb-8 text-left">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {step === 1 ? (isSignup ? "Create Account" : "Welcome Back") : "Verification"}
                        </h1>
                        <p className="text-zinc-500 text-sm">
                            {step === 1 ? "Enter details to continue." : "Enter the code sent to your email."}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                                <button 
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${!isSignup ? 'bg-white/10 text-white' : 'text-zinc-500'}`}
                                    onClick={() => { setIsSignup(false); setError(""); }}
                                >LOG IN</button>
                                <button 
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${isSignup ? 'bg-white/10 text-white' : 'text-zinc-500'}`}
                                    onClick={() => { setIsSignup(true); setError(""); }}
                                >SIGN UP</button>
                            </div>

                            <div className="space-y-4">
                                {isSignup && (
                                    <input 
                                        type="text" 
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-emerald-500/50"
                                        placeholder="Full Name" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                )}
                                <input 
                                    type="email" 
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-emerald-500/50"
                                    placeholder="Email Address" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <input 
                                    type="password" 
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-emerald-500/50"
                                    placeholder="Password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleAction} 
                                disabled={loading}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl disabled:opacity-50 transition-all"
                            >
                                {loading ? "Processing..." : isSignup ? "Send OTP" : "Login"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right">
                            <input 
                                type="text" 
                                className="w-full bg-transparent border-b-2 border-white/10 text-center text-4xl font-light text-white outline-none focus:border-emerald-500 tracking-[15px]"
                                placeholder="000000" 
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />

                            <button 
                                onClick={handleVerifySignup} 
                                disabled={loading}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl disabled:opacity-50 transition-all"
                            >
                                {loading ? "Verifying..." : "Verify & Register"}
                            </button>
                            
                            <p className="text-center text-xs text-zinc-500 cursor-pointer" onClick={() => setStep(1)}>
                                Edit Email/Details?
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Auth;