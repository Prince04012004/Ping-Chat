import React, { useState } from "react";
import API from "../services/api"; 
import { useNavigate } from 'react-router-dom';
// Firebase Imports
import { auth } from "../firebaseConfig";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const Auth = () => {
    const [phonenumber, setphonenumber] = useState("");
    const [otp, setotp] = useState("");
    const [name, setname] = useState("");
    const [step, setStep] = useState(1); 
    const [isSignup, setIsSignup] = useState(false); 
    const navigate = useNavigate();

    // --- Firebase Recaptcha Setup ---
    const onCaptchVerify = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    console.log("Recaptcha verified");
                }
            });
        }
    }

    // 1. Send OTP Logic (Updated with Firebase)
    const handlesendotp = async () => {
        if (!phonenumber) return alert("Phone number zaroori hai!");
        if (isSignup && !name) return alert("Signup ke liye Name!");

        try {
            onCaptchVerify();
            const appVerifier = window.recaptchaVerifier;
            const formatPh = phonenumber.startsWith('+') ? phonenumber : "+91" + phonenumber;

            // Firebase se OTP bhejna
            const confirmationResult = await signInWithPhoneNumber(auth, formatPh, appVerifier);
            window.confirmationResult = confirmationResult;
            
            alert("OTP sent successfully via Firebase!");
            setStep(2); 
        } catch (err) {
            console.error("Firebase Send Error:", err);
            alert("OTP bhejne mein error hai. Check if number is correct!");
        }
    }

    // 2. Verify OTP Logic (Updated with Firebase)
    const handlesubmit = async () => {
        if (!otp) return alert("OTP enter karein");

        try {
            // Firebase OTP Verification
            const result = await window.confirmationResult.confirm(otp);
            const user = result.user;
            console.log("Firebase User Verified:", user);

            // Ab backend ko notify karna (Purana logic intact)
            let res;
            const payload = {
                phonenumber: phonenumber,
                otp: otp // Backend validation agar rakha hai toh ye jayega
            };

            if (isSignup) {
                res = await API.post("/api/signup", { ...payload, name: name });
            } else {
                res = await API.post("/api/login", payload);
            }

            if (res.data) {
                localStorage.setItem("userInfo", JSON.stringify(res.data.user || res.data.newuser));
                localStorage.setItem("token", res.data.token);
                alert(res.data.message || "Success!");
                navigate("/chat"); 
            }
        } catch (err) {
            console.error("Verification Error:", err);
            alert("Invalid OTP or Server Error!");
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d1117] relative overflow-hidden font-sans p-4 md:p-6">
            
            {/* Firebase Recaptcha Container (Zaroori Hai) */}
            <div id="recaptcha-container"></div>

            {/* Background Glows */}
            <div className="absolute top-[-5%] left-[-5%] md:top-[-10%] md:left-[-10%] w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-emerald-500/10 blur-[80px] md:blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-5%] right-[-5%] md:bottom-[-10%] md:right-[-10%] w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-blue-500/10 blur-[80px] md:blur-[120px] rounded-full"></div>

            <div className="relative w-full max-w-[420px] z-10">
                <div className="bg-white/[0.03] backdrop-blur-[30px] border border-white/10 p-6 md:p-10 rounded-[28px] md:rounded-[32px] shadow-2xl ring-1 ring-white/5">
                    
                    <div className="mb-8 md:mb-10 text-left">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            {step === 1 ? (isSignup ? "Create Account" : "Welcome Back") : "Verification"}
                        </h1>
                        <p className="text-zinc-500 text-xs md:text-sm">
                            {step === 1 ? "Enter your details to continue." : "Enter the code sent to your phone."}
                        </p>
                    </div>

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-6 md:mb-8">
                                <button 
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${!isSignup ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                                    onClick={() => setIsSignup(false)}
                                >LOG IN</button>
                                <button 
                                    className={`flex-1 py-2.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${isSignup ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
                                    onClick={() => setIsSignup(true)}
                                >SIGN UP</button>
                            </div>

                            <div className="space-y-4">
                                {isSignup && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Full Name</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 md:px-5 py-3.5 md:py-4 text-sm md:text-base text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                            placeholder="John Doe" 
                                            value={name}
                                            onChange={(e) => setname(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] md:text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 md:px-5 py-3.5 md:py-4 text-sm md:text-base text-white outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                                        placeholder="+91 XXXXX XXXXX" 
                                        value={phonenumber}
                                        onChange={(e) => setphonenumber(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handlesendotp} 
                                className="w-full py-3.5 md:py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 mt-4 text-sm md:text-base"
                            >
                                Continue
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
                             <input 
                                type="text" 
                                className="w-full bg-transparent border-b-2 border-white/10 text-center text-4xl md:text-5xl font-light text-white outline-none focus:border-emerald-500 transition-all pb-4 tracking-[10px] md:tracking-[15px]"
                                placeholder="000000" 
                                maxLength="6"
                                value={otp}
                                inputMode="numeric"
                                onChange={(e) => setotp(e.target.value)}
                            />

                            <button 
                                onClick={handlesubmit} 
                                className="w-full py-3.5 md:py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all text-sm md:text-base"
                            >
                                Verify & Login
                            </button>
                            
                            <p className="text-center text-[11px] md:text-xs text-zinc-500 cursor-pointer hover:text-white transition-colors" onClick={() => setStep(1)}>
                                Edit Phone Number?
                            </p>
                        </div>
                    )}
                </div>
                
                <p className="text-center mt-8 text-zinc-600 text-[10px] uppercase tracking-widest">
                    Secured by Ping AI Encryption
                </p>
            </div>
        </div>
    );
}

export default Auth;