"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Bot, BookOpen, GraduationCap, LineChart, Mic, Shield, Users } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [role, setRole] = useState<"professor" | "student" | null>(null);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!role) return;
        setLoading(true);
        setError("");
        try {
            const data = await register(form.name, form.email, form.password, role);
            setAuth(data.user, data.token);
            if (data.user.role === "professor") router.push("/professor/courses");
            else router.push("/student/browse");
        } catch {
            setError("Registration failed. Email may already be in use.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen relative flex bg-[#F8F9FA] font-sans overflow-hidden">
            {/* WAVY BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <svg
                    className="absolute inset-0 w-full h-full object-cover"
                    preserveAspectRatio="none"
                    viewBox="0 0 1440 900"
                >
                    <path
                        d="M0 0h600c250 0 450 450 500 900H0V0z"
                        fill="url(#grad)"
                    />
                    <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#005596" /> {/* UWindsor Blue */}
                            <stop offset="100%" stopColor="#003566" /> {/* Deep Blue */}
                        </linearGradient>
                    </defs>
                </svg>
                {/* Subtle overlay grid on the blue section only for texture */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                        clipPath: "polygon(0 0, 42% 0, 75% 100%, 0% 100%)"
                    }}
                />
            </div>

            <div className="relative z-10 w-full min-h-screen flex flex-col md:flex-row">
                {/* LEFT COLUMN - FORM */}
                <div className="w-full md:w-[50%] lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 text-white">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-md">
                            <GraduationCap className="w-6 h-6 text-[#1A1A2E]" strokeWidth={2.5} />
                        </div>
                        <span className="font-[800] text-2xl tracking-tight">
                            Mini<span className="text-gold">Professor</span>AI
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-[800] leading-tight mb-4">
                        Join the University<br />of tomorrow
                    </h1>
                    <p className="text-white/80 text-lg mb-8 font-medium leading-relaxed max-w-sm">
                        Create your account to unlock personalized AI assistance for every course.
                    </p>

                    <div className="w-full max-w-md">
                        {/* ROLE SELECTION */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setRole("professor")}
                                className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden ${role === "professor"
                                    ? "border-gold bg-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,206,0,0.2)]"
                                    : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm"
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${role === "professor" ? "bg-gold text-dark" : "bg-white/20 text-white"
                                    }`}>
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-white mb-1">I'm a Professor</h3>
                                <p className="text-sm text-white/70 leading-snug">Create courses, train AI</p>
                            </button>

                            <button
                                onClick={() => setRole("student")}
                                className={`relative text-left p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden ${role === "student"
                                    ? "border-gold bg-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,206,0,0.2)]"
                                    : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 backdrop-blur-sm"
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${role === "student" ? "bg-gold text-dark" : "bg-white/20 text-white"
                                    }`}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-white mb-1">I'm a Student</h3>
                                <p className="text-sm text-white/70 leading-snug">Learn with AI tutors</p>
                            </button>
                        </div>

                        {/* FORM INPUTS */}
                        <div className={`transition-all duration-500 ease-in-out transform ${role ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none hidden"
                            }`}>
                            <div className="space-y-4">
                                <input
                                    placeholder="Full name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full h-14 px-5 rounded-xl bg-white focus:bg-white border-0 text-dark focus:ring-4 focus:ring-gold/40 shadow-sm font-medium placeholder:text-text-muted transition-all"
                                />
                                <input
                                    placeholder="Email address"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full h-14 px-5 rounded-xl bg-white focus:bg-white border-0 text-dark focus:ring-4 focus:ring-gold/40 shadow-sm font-medium placeholder:text-text-muted transition-all"
                                />
                                <input
                                    placeholder="Password"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                                    className="w-full h-14 px-5 rounded-xl bg-white focus:bg-white border-0 text-dark focus:ring-4 focus:ring-gold/40 shadow-sm font-medium placeholder:text-text-muted transition-all"
                                />

                                {error && <p className="text-red-300 text-sm font-bold bg-red-900/30 px-4 py-2 rounded-lg">{error}</p>}

                                <button
                                    onClick={handleRegister}
                                    disabled={loading || !role || !form.name || !form.email || !form.password}
                                    className="w-full h-12 bg-[#1A1A2E] hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {loading ? "Wait..." : "Create Account"}
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-sm text-white/70 font-medium">
                                Already have an account?{" "}
                                <Link href="/login" className="text-white font-bold hover:text-gold transition-colors ml-1">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - GRAPHICS */}
                <div className="hidden md:flex w-full md:w-[50%] lg:w-[55%] items-center justify-center p-12 relative pointer-events-none">
                    <div className="relative w-[500px] h-[500px]">
                        {/* Center Box */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.08)] rounded-[2.5rem] flex flex-col items-center justify-center border border-border z-20">
                            <svg className="w-32 h-32 text-[#005596] mb-6 drop-shadow-md transition-transform hover:scale-105 duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                {/* Cute Robot Face */}
                                <rect x="3" y="7" width="18" height="12" rx="4" fill="#EBF3FB" strokeWidth={1.5} />
                                {/* Antennas */}
                                <path d="M12 3v4" strokeWidth={2} />
                                <circle cx="12" cy="2" r="1.5" fill="#005596" stroke="none" />
                                {/* Ears */}
                                <path d="M1 11h2" strokeWidth={2} />
                                <path d="M21 11h2" strokeWidth={2} />
                                {/* Cute Big Eyes */}
                                <circle cx="8" cy="12" r="1.5" fill="#005596" stroke="none" />
                                <circle cx="16" cy="12" r="1.5" fill="#005596" stroke="none" />
                                {/* Cheeks */}
                                <circle cx="5" cy="14" r="1" fill="#FFCE00" stroke="none" opacity="0.6" />
                                <circle cx="19" cy="14" r="1" fill="#FFCE00" stroke="none" opacity="0.6" />
                                {/* Happy Smile */}
                                <path d="M9 15c1 1.5 5 1.5 6 0" strokeWidth={1.5} />
                            </svg>
                            <div className="h-3 w-32 bg-[#EBF3FB] rounded-full mb-4" />
                            <div className="h-3 w-20 bg-[#EBF3FB] rounded-full" />
                        </div>

                        {/* Floating Element 1 - Book (Top Left) */}
                        <div className="absolute top-[8%] left-[8%] w-32 h-32 bg-gold shadow-2xl rounded-full flex items-center justify-center z-10 animate-[bounce_5s_infinite]">
                            <BookOpen className="w-12 h-12 text-[#1A1A2E]" strokeWidth={2} />
                        </div>

                        {/* Floating Element 2 - Grad Cap (Bottom Right) */}
                        <div className="absolute bottom-[5%] right-[5%] w-40 h-40 bg-[#1A1A2E] shadow-[0_20px_50px_rgba(26,26,46,0.3)] rounded-[2.5rem] flex items-center justify-center z-30 animate-[pulse_4s_infinite]">
                            <GraduationCap className="w-16 h-16 text-white" strokeWidth={1.5} />
                        </div>

                        {/* Floating Element 3 - Chart (Top Right) */}
                        <div className="absolute top-[18%] right-[2%] w-24 h-24 bg-white shadow-xl rounded-full flex items-center justify-center border border-border z-10 transition-transform hover:-translate-y-2">
                            <LineChart className="w-10 h-10 text-[#005596]" strokeWidth={2} />
                        </div>

                        {/* Floating Element 4 - Voice (Bottom Left) */}
                        <div className="absolute bottom-[18%] left-[2%] w-28 h-28 bg-[#EBF3FB] shadow-lg rounded-[1.5rem] flex items-center justify-center z-30 transform -rotate-12 animate-[bounce_6s_infinite] delay-1000">
                            <Mic className="w-10 h-10 text-[#005596]" strokeWidth={2} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}