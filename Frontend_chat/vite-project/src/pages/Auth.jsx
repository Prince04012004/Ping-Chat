import React, { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

// ✅ EmailJS credentials
const EMAILJS_SERVICE_ID = "service_fhln7bn";
const EMAILJS_TEMPLATE_ID = "template_brnhz58";
const EMAILJS_PUBLIC_KEY = "2gGonZL1BOeW1c7sh";

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
        if (userInfo) navigate("/chat", { replace: true });
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

                // ✅ Backend se OTP generate karwao
                const res = await API.post("/api/sendotp", { email });
                const generatedOtp = res.data.otp;

                // ✅ EmailJS se OTP bhejo
                await emailjs.send(
                    EMAILJS_SERVICE_ID,
                    EMAILJS_TEMPLATE_ID,
                    {
                        to_email: email,
                        otp: generatedOtp,
                    },
                    EMAILJS_PUBLIC_KEY
                );

                setStep(2);
            } else {
                // Login
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
        <div className="min-h-screen w-full flex bg-[#05070a] relative overflow-hidden">
            {/* Ambient grid, fades toward center */}
            <div
                className="absolute inset-0 opacity-60 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    maskImage: "radial-gradient(ellipse 70% 60% at 30% 40%, black, transparent)",
                    WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 30% 40%, black, transparent)",
                }}
            />

            {/* ============ LEFT: Brand / Signal Panel (desktop only) ============ */}
            <div className="hidden lg:flex flex-col justify-between w-[46%] relative px-16 py-14 border-r border-white/[0.06] z-10">
                <div>
                    <span className="auth-mono text-[11px] tracking-[0.35em] text-emerald-400/80 uppercase">
                        Real-time messaging
                    </span>
                    <h1 className="auth-mono text-[42px] leading-none font-bold text-white mt-4 tracking-tight">
                        Ping<span className="text-emerald-400">·</span>Chat
                    </h1>
                    <p className="text-zinc-500 text-[15px] mt-4 max-w-[320px] leading-relaxed">
                        Every message arrives the instant you hit send. No delay, no refresh — just a live line to the people you talk to.
                    </p>
                </div>

                {/* Signal / radar visual — the literal "ping" */}
                <div className="relative w-64 h-64 self-center flex items-center justify-center my-10">
                    <span className="absolute inset-0 rounded-full border border-emerald-400/25 [animation:ping_2.8s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <span
                        className="absolute inset-8 rounded-full border border-emerald-400/25 [animation:ping_2.8s_cubic-bezier(0,0,0.2,1)_infinite]"
                        style={{ animationDelay: "0.6s" }}
                    />
                    <span
                        className="absolute inset-16 rounded-full border border-emerald-400/35 [animation:ping_2.8s_cubic-bezier(0,0,0.2,1)_infinite]"
                        style={{ animationDelay: "1.2s" }}
                    />
                    <span className="relative w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_30px_8px_rgba(16,185,129,0.45)]" />
                </div>

                {/* Mock conversation snippet — shows the product, not a stock illustration */}
                <div className="space-y-2 max-w-[270px]">
                    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-zinc-300 w-fit">
                        team standup in 5?
                    </div>
                    <div className="ml-auto bg-emerald-500 text-black rounded-2xl rounded-br-sm px-4 py-2.5 text-sm font-medium w-fit">
                        omw 🏃
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-600 text-xs pl-1 pt-1">
                        <span className="auth-mono">delivered · seen</span>
                        <span className="flex gap-1 ml-1">
                            <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1 h-1 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                    </div>
                </div>
            </div>

            {/* ============ RIGHT: Auth Form Panel ============ */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
                <div className="w-full max-w-[400px]">

                    {/* Mobile-only compact wordmark */}
                    <div className="lg:hidden mb-8 text-center">
                        <h1 className="auth-mono text-2xl font-bold text-white tracking-tight">
                            Ping<span className="text-emerald-400">·</span>Chat
                        </h1>
                    </div>

                    <div className="bg-white/[0.025] backdrop-blur-[30px] border border-white/[0.08] p-7 sm:p-10 rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">

                        <div className="mb-8 text-left">
                            <span className="auth-mono text-[11px] tracking-[0.3em] text-emerald-400/70 uppercase">
                                {step === 1 ? (isSignup ? "New here" : "Welcome back") : "One step left"}
                            </span>
                            <h2 className="text-2xl md:text-[28px] font-bold text-white mt-2 mb-1.5 tracking-tight">
                                {step === 1 ? (isSignup ? "Create your account" : "Log back in") : "Check your inbox"}
                            </h2>
                            <p className="text-zinc-500 text-sm">
                                {step === 1 ? "Takes about 20 seconds." : `We sent a 6-digit code to ${email || "your email"}.`}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 p-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-xs text-center">
                                {error}
                            </div>
                        )}

                        {step === 1 ? (
                            <div className="space-y-7">
                                <div className="flex bg-black/25 p-1 rounded-full border border-white/[0.06]">
                                    <button
                                        className={`flex-1 py-2 rounded-full auth-mono text-[11px] tracking-[0.15em] font-bold transition-all ${!isSignup ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => { setIsSignup(false); setError(""); }}
                                    >LOG IN</button>
                                    <button
                                        className={`flex-1 py-2 rounded-full auth-mono text-[11px] tracking-[0.15em] font-bold transition-all ${isSignup ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                                        onClick={() => { setIsSignup(true); setError(""); }}
                                    >SIGN UP</button>
                                </div>

                                <div className="space-y-5">
                                    {isSignup && (
                                        <div>
                                            <label className="auth-mono block text-[10px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">
                                                Full name
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full bg-transparent border-b border-white/[0.12] pb-3 text-white text-[15px] outline-none focus:border-emerald-400 transition-colors placeholder:text-zinc-700"
                                                placeholder="Prince Kumar"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="auth-mono block text-[10px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">
                                            Email address
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full bg-transparent border-b border-white/[0.12] pb-3 text-white text-[15px] outline-none focus:border-emerald-400 transition-colors placeholder:text-zinc-700"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="auth-mono block text-[10px] tracking-[0.2em] text-zinc-500 mb-2 uppercase">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full bg-transparent border-b border-white/[0.12] pb-3 text-white text-[15px] outline-none focus:border-emerald-400 transition-colors placeholder:text-zinc-700"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleAction}
                                    disabled={loading}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-semibold rounded-full shadow-[0_10px_30px_-10px_rgba(16,185,129,0.55)] transition-all disabled:opacity-50"
                                >
                                    {loading ? "Processing…" : isSignup ? "Send verification code" : "Log in"}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-7">
                                <input
                                    type="text"
                                    className="w-full bg-transparent border-b-2 border-white/[0.12] pb-4 text-center text-4xl font-light text-white outline-none focus:border-emerald-400 tracking-[15px] transition-colors"
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                />

                                <button
                                    onClick={handleVerifySignup}
                                    disabled={loading}
                                    className="w-full py-4 bg-white hover:bg-zinc-200 active:scale-[0.98] text-black font-semibold rounded-full transition-all disabled:opacity-50"
                                >
                                    {loading ? "Verifying…" : "Verify & create account"}
                                </button>

                                <div className="flex items-start gap-2 px-1">
                                    <span className="text-amber-500/90 text-sm leading-none">📩</span>
                                    <p className="text-left text-xs text-amber-500/80 leading-relaxed">
                                        Don't see it? Check your Spam or Promotions folder — it can land there on first send.
                                    </p>
                                </div>

                                <p className="text-center text-xs text-zinc-500 hover:text-zinc-400 cursor-pointer transition-colors" onClick={() => setStep(1)}>
                                    Edit email or details
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Auth;