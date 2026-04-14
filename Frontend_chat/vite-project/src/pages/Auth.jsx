import React, { useState, useEffect } from "react";
import API from "../services/api"; 
import { useNavigate } from 'react-router-dom';
import { auth } from "../firebaseConfig";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const Auth = () => {
    const [phonenumber, setphonenumber] = useState("");
    const [otp, setotp] = useState("");
    const [name, setname] = useState("");
    const [step, setStep] = useState(1); 
    const [isSignup, setIsSignup] = useState(false); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // 1. Agar user pehle se login hai toh seedha chat par bhej do
    useEffect(() => {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
            navigate("/chat", { replace: true });
        }
    }, [navigate]);

    const onCaptchVerify = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => { console.log("Recaptcha verified"); }
            });
        }
    }

    const handlesendotp = async () => {
        setError("");
        if (!phonenumber) return setError("Phone number is required!");
        if (isSignup && !name) return setError("Name is required for Signup!");

        setLoading(true);
        try {
            onCaptchVerify();
            const appVerifier = window.recaptchaVerifier;
            const formatPh = phonenumber.startsWith('+') ? phonenumber : "+91" + phonenumber;

            const confirmationResult = await signInWithPhoneNumber(auth, formatPh, appVerifier);
            window.confirmationResult = confirmationResult;
            
            setStep(2); 
        } catch (err) {
            console.error("Firebase Send Error:", err);
            setError("Error sending OTP. Please check your number.");
        } finally {
            setLoading(false);
        }
    }

    const handlesubmit = async () => {
        setError("");
        if (!otp) return setError("Please enter the OTP");

        setLoading(true);
        try {
            const result = await window.confirmationResult.confirm(otp);
            const user = result.user;

            let res;
            const payload = { phonenumber };

            if (isSignup) {
                res = await API.post("/api/signup", { ...payload, name });
            } else {
                res = await API.post("/api/login", payload);
            }

            if (res.data) {
                localStorage.setItem("userInfo", JSON.stringify(res.data.user || res.data.newuser));
                localStorage.setItem("token", res.data.token);
                
                // 2. Navigation ko "replace" kar diya taaki history mein Auth na rahe
                navigate("/chat", { replace: true }); 
            }
        } catch (err) {
            console.error("Verification Error:", err);
            setError(err.response?.data?.message || "Invalid OTP or Server Error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d1117] relative overflow-hidden font-sans p-4">
            <div id="recaptcha-container"></div>

            <div className="relative w-full max-w-[420px] z-10">
                <div className="bg-white/[0.03] backdrop-blur-[30px] border border-white/10 p-6 md:p-10 rounded-[32px] shadow-2xl">
                    
                    <div className="mb-8 text-left">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {step === 1 ? (isSignup ? "Create Account" : "Welcome Back") : "Verification"}
                        </h1>
                        <p className="text-zinc-500 text-sm">
                            {step === 1 ? "Enter details to continue." : "Enter the 6-digit code."}
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
                                        onChange={(e) => setname(e.target.value)}
                                    />
                                )}
                                <input 
                                    type="tel" 
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-emerald-500/50"
                                    placeholder="Phone Number" 
                                    value={phonenumber}
                                    onChange={(e) => setphonenumber(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handlesendotp} 
                                disabled={loading}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl disabled:opacity-50 transition-all"
                            >
                                {loading ? "Sending..." : "Continue"}
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
                                onChange={(e) => setotp(e.target.value)}
                            />

                            <button 
                                onClick={handlesubmit} 
                                disabled={loading}
                                className="w-full py-4 bg-white text-black font-bold rounded-xl disabled:opacity-50 transition-all"
                            >
                                {loading ? "Verifying..." : "Verify & Login"}
                            </button>
                            
                            <p className="text-center text-xs text-zinc-500 cursor-pointer" onClick={() => setStep(1)}>
                                Edit Phone Number?
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Auth;