"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await login(form.email, form.password);
            setAuth(data.user, data.token);
            if (data.user.role === "professor") router.push("/professor/courses");
            else router.push("/student/browse");
        } catch {
            setError("Invalid email or password.");
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
                        <p className="text-slate-400 text-sm">Sign in to your account</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Input
                        placeholder="Email address"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white h-11"
                    />
                    <Input
                        placeholder="Password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        className="bg-slate-800 border-slate-700 text-white h-11"
                    />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <Button
                        onClick={handleLogin}
                        disabled={loading}
                        className="w-full bg-violet-600 hover:bg-violet-700 h-11 text-base font-medium"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </div>

                <p className="text-center text-slate-400 text-sm mt-6">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium">
                        Create account
                    </Link>
                </p>
            </Card>
        </div>
    );
}