"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";

// ── Animated counter ──────────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let start = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
      observer.disconnect();
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Feature card ──────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent }: { icon: string; title: string; desc: string; accent: string }) {
  return (
    <div className="group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 overflow-hidden">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent}`} />
      <div className="relative z-10">
        <div className="text-3xl mb-4">{icon}</div>
        <h3 className="font-bold text-white text-lg mb-2 tracking-tight">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────
function StepCard({ num, role, title, steps, color }: {
  num: string; role: string; title: string; steps: string[]; color: string;
}) {
  return (
    <div className={`p-8 rounded-3xl border ${color} relative overflow-hidden`}>
      <div className="absolute top-4 right-6 text-7xl font-black opacity-10 select-none">{num}</div>
      <div className="relative z-10">
        <span className={`text-xs font-bold uppercase tracking-widest mb-3 block ${color.includes('amber') ? 'text-amber-400' : 'text-violet-400'}`}>{role}</span>
        <h3 className="text-2xl font-bold text-white mb-6">{title}</h3>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${color.includes('amber') ? 'bg-amber-500 text-black' : 'bg-violet-600 text-white'}`}>
                {i + 1}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { user, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Show landing page always — user can sign in from nav

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">

      {/* ── Grain texture overlay ── */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-50"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      {/* ── Ambient glow ── */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed top-1/3 left-0 w-[400px] h-[400px] bg-violet-600/5 blur-[100px] pointer-events-none" />
      <div className="fixed top-1/3 right-0 w-[400px] h-[400px] bg-amber-500/5 blur-[100px] pointer-events-none" />

      {/* ── NAV ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.06] backdrop-blur-sm bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-lg">🎓</div>
          <span className="font-black text-xl tracking-tight">Mini<span className="text-amber-400">Professor</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#professors" className="hover:text-white transition-colors">For Professors</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
            Sign in
          </Link>
          <Link href="/register"
            className="text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black px-5 py-2 rounded-xl transition-all duration-200 hover:scale-105">
            Get Started →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-10 px-6 md:px-12 pt-24 pb-20 text-center max-w-5xl mx-auto">

        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          AI-Powered Education Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
          Your professor,
          <br />
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">
              available 24/7
            </span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 8 Q75 2 150 8 Q225 14 298 8" stroke="url(#underline-grad)" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="underline-grad" x1="0" y1="0" x2="300" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
          Professors upload their materials and train an AI clone of themselves.
          Students get answers in their <strong className="text-white">professor's own style, context, and voice</strong> —
          even at 2am before exams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/register?role=professor"
            className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] text-center">
            I'm a Professor →
          </Link>
          <Link href="/register?role=student"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl transition-all duration-200 text-center">
            I'm a Student →
          </Link>
        </div>

        {/* ── Hero Visual ── */}
        <div className="relative mx-auto max-w-3xl">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f] z-10 pointer-events-none" style={{ top: "60%" }} />
          <div className="bg-slate-900/80 border border-white/[0.08] rounded-3xl p-1 backdrop-blur-sm shadow-2xl">
            <div className="bg-[#0d0d14] rounded-2xl overflow-hidden">
              {/* Fake browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <div className="flex-1 bg-white/5 rounded-md mx-4 py-1 px-3 text-xs text-slate-500">
                  mini-professor.app/learn/comp3540
                </div>
              </div>
              {/* Fake chat UI */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex-shrink-0 flex items-center justify-center text-sm">👤</div>
                  <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-300 max-w-xs text-left">
                    What's the difference between TCP and UDP? I have an exam tomorrow.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex-shrink-0 flex items-center justify-center text-sm">🎓</div>
                  <div className="text-left space-y-2 max-w-sm">
                    <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-200">
                      Great question! Think of TCP as registered mail — guaranteed delivery, confirmed receipt. UDP is dropping a letter in a mailbox — fast, but no guarantees. <span className="text-amber-400">[Lecture 4, slide 12]</span>
                    </div>
                    <button className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5 hover:bg-amber-500/20 transition-colors">
                      🔊 <span>Listen in Prof. voice</span>
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.01] py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 text-center">
          {[
            { value: 2, suffix: " min", label: "To create your first AI professor" },
            { value: 100, suffix: "%", label: "Answers grounded in course materials" },
            { value: 5, suffix: " features", label: "Chat, Quiz, Flashcards, Overview, Assignment" },
            { value: 24, suffix: "/7", label: "Available to students, no office hours needed" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-4xl font-black text-amber-400 mb-2">
                <Counter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative z-10 px-6 md:px-12 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Two sides, one platform</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <StepCard
            num="P"
            role="For Professors"
            title="Train your AI clone in minutes"
            color="border-amber-500/20 bg-amber-500/5"
            steps={[
              "Create a course and upload your PDFs, slides, and notes",
              "Set your teaching style — Socratic, direct, encouraging, or strict",
              "Write your philosophy and example Q&A pairs to shape the AI's voice",
              "Record 60 seconds of audio to clone your actual voice",
              "Publish — your Mini Professor is live for students instantly"
            ]}
          />
          <StepCard
            num="S"
            role="For Students"
            title="Learn from your professor, any time"
            color="border-violet-500/20 bg-violet-500/5"
            steps={[
              "Browse and enroll in your professor's course",
              "Ask questions in natural language — get answers in your professor's style",
              "Hear answers played back in your professor's actual voice",
              "Generate quizzes, flashcards, and assignment help from course materials",
              "Never wait for office hours again"
            ]}
          />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 px-6 md:px-12 py-24 bg-white/[0.01] border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Everything students need</h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">Every answer is strictly grounded in the professor's uploaded materials. The AI never makes things up.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <FeatureCard
              icon="💬"
              title="Contextual Chat"
              desc="Ask anything about the course. Get streaming answers with exact source citations — filename and page number."
              accent="bg-gradient-to-br from-violet-600/10 to-transparent"
            />
            <FeatureCard
              icon="🎙️"
              title="Professor Voice"
              desc="Answers play back in your professor's actual cloned voice. Powered by ElevenLabs voice AI. The wow moment."
              accent="bg-gradient-to-br from-amber-500/10 to-transparent"
            />
            <FeatureCard
              icon="📋"
              title="Course Overview"
              desc="AI-generated course summary, key topics, and suggested questions. Understand the full picture instantly."
              accent="bg-gradient-to-br from-blue-600/10 to-transparent"
            />
            <FeatureCard
              icon="🃏"
              title="Smart Flashcards"
              desc="Auto-generated flashcards from course materials. Flip to reveal answers. Study smarter, not harder."
              accent="bg-gradient-to-br from-green-600/10 to-transparent"
            />
            <FeatureCard
              icon="⚡"
              title="Adaptive Quizzes"
              desc="AI-generated MCQ quizzes from your materials. Instant scoring with explanations for every wrong answer."
              accent="bg-gradient-to-br from-yellow-600/10 to-transparent"
            />
            <FeatureCard
              icon="📝"
              title="Assignment Helper"
              desc="Paste any assignment question. Get structured approach, key concepts, and hints — without giving away answers."
              accent="bg-gradient-to-br from-red-600/10 to-transparent"
            />
          </div>
        </div>
      </section>

      {/* ── PROFESSOR SECTION ── */}
      <section id="professors" className="relative z-10 px-6 md:px-12 py-24 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">For Professors</p>
            <h2 className="text-4xl font-black tracking-tight leading-tight mb-6">
              Your AI teaches <br />
              <span className="text-amber-400">your way</span>
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Unlike generic AI chatbots, Mini Professor is trained by YOU. Your teaching philosophy, your tone, your restrictions, your example answers — all baked into every response your students receive.
            </p>
            <div className="space-y-4">
              {[
                { icon: "🧠", label: "Set teaching style", desc: "Socratic, direct, encouraging, or strict" },
                { icon: "📊", label: "See what confuses students", desc: "Analytics dashboard shows confusion areas" },
                { icon: "🚫", label: "Set boundaries", desc: "AI never solves assignments directly" },
                { icon: "🎤", label: "Clone your voice", desc: "Students hear your actual voice" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{item.label}</p>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fake train page preview */}
          <div className="bg-slate-900/60 border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-5 font-semibold">Train Your Mini Professor</p>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Teaching Style</p>
                <div className="flex gap-2 flex-wrap">
                  {["Socratic", "Direct", "Encouraging", "Strict", "Balanced"].map((s, i) => (
                    <span key={i} className={`px-3 py-1 rounded-lg text-xs font-medium border ${i === 2 ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-slate-700 text-slate-400"}`}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Your Teaching Philosophy</p>
                <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed border border-slate-700">
                  "I always connect theory to real-world examples. I want students to understand the WHY before the HOW..."
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Voice Clone</p>
                <div className="flex items-center gap-3 bg-green-950 border border-green-800 rounded-xl p-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-green-300 text-xs font-medium">Voice cloned ✓ Students hear your voice</p>
                </div>
              </div>
              <button className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-sm transition-all">
                Save & Train Mini Professor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/10 blur-[80px] rounded-full" />
            <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-3xl p-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Ready to build your
                <br />
                <span className="text-amber-400">Mini Professor?</span>
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Set up in under 2 minutes. Your students will thank you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register"
                  className="w-full sm:w-auto px-10 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-[0_0_60px_rgba(245,158,11,0.4)] text-lg text-center">
                  Create Free Account →
                </Link>
                <Link href="/login"
                  className="w-full sm:w-auto px-8 py-4 text-slate-400 hover:text-white transition-colors text-center">
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 md:px-12 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-sm">🎓</div>
            <span className="font-black tracking-tight">Mini<span className="text-amber-400">Professor</span></span>
            <span className="text-slate-600 text-sm">— Built for University of Windsor</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <span>Built with ❤️ by Farhan</span>
          </div>
        </div>
      </footer>

    </div>
  );
}