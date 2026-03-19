"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, GraduationCap, BookOpen } from "lucide-react";
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8 bg-slate-900 border-slate-800">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Mini Professor</h1>
                        <p className="text-slate-400 text-sm">Create your account</p>
                    </div>
                </div>

                {/* Role selection */}
                <p className="text-slate-300 text-sm font-medium mb-3">I am a...</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={() => setRole("professor")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${role === "professor"
                                ? "border-violet-500 bg-violet-600/20"
                                : "border-slate-700 bg-slate-800 hover:border-slate-600"
                            }`}
                    >
                        <BookOpen className={`w-6 h-6 mb-2 ${role === "professor" ? "text-violet-400" : "text-slate-400"}`} />
                        <p className="font-semibold text-white text-sm">Professor</p>
                        <p className="text-xs text-slate-400 mt-1">Create courses, train your AI clone</p>
                    </button>
                    <button
                        onClick={() => setRole("student")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${role === "student"
                                ? "border-violet-500 bg-violet-600/20"
                                : "border-slate-700 bg-slate-800 hover:border-slate-600"
                            }`}
                    >
                        <GraduationCap className={`w-6 h-6 mb-2 ${role === "student" ? "text-violet-400" : "text-slate-400"}`} />
                        <p className="font-semibold text-white text-sm">Student</p>
                        <p className="text-xs text-slate-400 mt-1">Learn from professor AI assistants</p>
                    </button>
                </div>

                <div className="space-y-4">
                    <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-11" />
                    <Input placeholder="Email address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-11" />
                    <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-11" />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <Button onClick={handleRegister} disabled={loading || !role} className="w-full bg-violet-600 hover:bg-violet-700 h-11 text-base font-medium">
                        {loading ? "Creating account..." : "Create Account"}
                    </Button>
                </div>

                <p className="text-center text-slate-400 text-sm mt-6">
                    Already have an account?{" "}
                    <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
                </p>
            </Card>
        </div>
    );
}