"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    getEnrolledCourses, getPersona, generateQuiz, generateFlashcards,
    summarizeCourse, getAssignmentHelp, streamChat, Course, Persona
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import {
    Bot, User, Send, ArrowLeft, Zap, BookOpen, RotateCcw,
    ClipboardList, Sparkles, CheckCircle, XCircle, Volume2, VolumeX, Lightbulb, MessageSquare
} from "lucide-react";
import { getChatHistory, clearChatHistory, getVoiceStatus, speakText } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    role: "user" | "assistant";
    content: string;
    sources?: { filename: string; page: number }[];
    isThinking?: boolean;
}
interface QuizQuestion { question: string; options: string[]; answer: string; explanation: string; }
interface Flashcard { front: string; back: string; }
interface Summary { overview: string; key_topics: string[]; suggested_questions: string[]; }
interface AssignmentHelp { understanding: string; key_concepts: string[]; approach: string[]; hints: string[]; warning: string; }

// ── Flip Card ─────────────────────────────────────────────
function FlipCard({ card, index }: { card: Flashcard; index: number }) {
    const [flipped, setFlipped] = useState(false);
    return (
        <div className="cursor-pointer group" style={{ perspective: "1000px" }} onClick={() => setFlipped(!flipped)}>
            <div style={{
                transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                position: "relative", height: "220px"
            }}>
                {/* Front */}
                <div style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
                    className="bg-blue hover:bg-[#004080] transition-colors rounded-2xl p-6 flex flex-col justify-between shadow-md">
                    <span className="text-[10px] text-white/60 font-bold tracking-widest uppercase mb-2 block">Card {index + 1}</span>
                    <p className="text-white font-semibold text-lg text-center leading-snug my-auto">{card.front}</p>
                    <span className="text-[11px] text-white/50 text-center uppercase tracking-widest font-bold mt-4">Click to flip</span>
                </div>
                {/* Back */}
                <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }}
                    className="bg-white border-2 border-border border-b-[4px] border-b-blue rounded-2xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                    <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase mb-2 block">Answer</span>
                    <p className="text-dark text-base text-center leading-relaxed font-medium overflow-y-auto px-2">{card.back}</p>
                </div>
            </div>
        </div>
    );
}

// ── Thinking Dots ─────────────────────────────────────────
function ThinkingDots() {
    return (
        <div className="flex items-center gap-1.5 px-2 py-3">
            <span className="w-2.5 h-2.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2.5 h-2.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2.5 h-2.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    );
}

// ── Markdown Message ──────────────────────────────────────
function MarkdownMessage({ content }: { content: string }) {
    const cleanedContent = content.replace(/\[Source:\s*[^\]]*\]/g, '').trim();

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children }) => <p className="mb-3 last:mb-0 text-[15px] leading-[1.6]">{children}</p>,
                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-4 pb-2 border-b">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4 text-blue">{children}</h2>,
                h3: ({ children }) => <h3 className="text-[15px] font-bold mb-1.5 mt-3">{children}</h3>,
                ul: ({ children }) => <ul className="space-y-2 mb-3 ml-1">{children}</ul>,
                ol: ({ children }) => <ol className="space-y-3 mb-3 list-decimal ml-5 font-medium">{children}</ol>,
                li: ({ children, ordered, index, ...props }: any) => {
                    const isOrdered = props.node?.properties?.className?.includes('ordered') || (typeof index === 'number');
                    if (isOrdered) return <li className="pl-1 mb-1 text-[15px] leading-relaxed">{children}</li>;
                    return (
                        <li className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                            <span className="flex-shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full bg-gold" />
                            <span className="flex-1">{children}</span>
                        </li>
                    );
                },
                code: ({ inline, className, children, ...props }: any) => {
                    if (inline) {
                        return <code className="bg-black/5 text-[#D23D67] rounded flex-inline px-1 py-0.5 text-[13px] font-mono mx-0.5 font-bold">{children}</code>;
                    }
                    const language = className?.replace('language-', '') || 'text';
                    return (
                        <div className="my-4 rounded-xl overflow-hidden border border-border shadow-sm bg-dark font-mono">
                            <div className="bg-black/40 px-4 py-2 text-[11px] text-white/50 uppercase tracking-widest font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-white/20" />
                                {language}
                            </div>
                            <pre className="p-4 overflow-x-auto text-[13px] text-white leading-relaxed">
                                {children}
                            </pre>
                        </div>
                    );
                },
                blockquote: ({ children }) => (
                    <div className="my-4 bg-gold-light/40 border-l-[4px] border-l-gold p-4 rounded-r-xl">
                        <div className="text-[15px] text-dark font-medium italic leading-relaxed [&>p]:mb-0">{children}</div>
                    </div>
                ),
                table: ({ children }) => (
                    <div className="my-4 overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
                        <table className="w-full text-sm text-left">{children}</table>
                    </div>
                ),
                th: ({ children }) => <th className="bg-bg px-4 py-3 font-bold text-dark border-b border-border">{children}</th>,
                td: ({ children }) => <td className="px-4 py-3 text-text-secondary border-b border-border">{children}</td>,
            }}
        >
            {cleanedContent}
        </ReactMarkdown>
    );
}

// ── Main Page ─────────────────────────────────────────────
export default function LearnPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const router = useRouter();
    const { loadFromStorage } = useAuthStore();

    const [course, setCourse] = useState<Course | null>(null);
    const [persona, setPersona] = useState<Persona | null>(null);
    const [activeTab, setActiveTab] = useState<"chat" | "overview" | "flashcards" | "quiz" | "assignment">("chat");
    const [messages, setMessages] = useState<Message[]>([]);
    const [question, setQuestion] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);

    // Feature States
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    const [flashcards, setFlashcards] = useState<Flashcard[] | null>(null);
    const [flashcardsLoading, setFlashcardsLoading] = useState(false);

    const [summary, setSummary] = useState<Summary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);

    const [assignmentText, setAssignmentText] = useState("");
    const [assignmentHelp, setAssignmentHelp] = useState<AssignmentHelp | null>(null);
    const [assignmentLoading, setAssignmentLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [hasVoice, setHasVoice] = useState(false);
    const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
    const [voiceLoading, setVoiceLoading] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [historyLoaded, setHistoryLoaded] = useState(false);

    useEffect(() => { loadFromStorage(); }, []);

    useEffect(() => {
        if (!courseId) return;

        Promise.all([
            getEnrolledCourses(),
            getPersona(courseId),
            getChatHistory(courseId),
            getVoiceStatus(courseId),
        ]).then(([courses, personaData, history, voiceStatus]) => {
            const c = courses.find((x) => x.id === courseId);
            if (c) setCourse(c);
            setPersona(personaData);
            setHasVoice(voiceStatus?.has_voice ?? false);

            if (history && history.length > 0) {
                setMessages(history.map((m: any) => ({ role: m.role, content: m.content, sources: m.sources ?? undefined })));
            } else if (personaData?.greeting_message) {
                setMessages([{ role: "assistant", content: personaData.greeting_message }]);
            }

            setHistoryLoaded(true);
        });
    }, [courseId]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    useEffect(() => { if (activeTab === "overview" && !summary) handleSummarize(); }, [activeTab]);

    const askQuestion = (q: string) => { setActiveTab("chat"); setTimeout(() => sendMessage(q), 50); };

    const handleSpeak = async (text: string, index: number) => {
        if (speakingIndex === index) {
            audioRef.current?.pause();
            setSpeakingIndex(null);
            return;
        }
        setVoiceLoading(index);
        try {
            const blob = await speakText(courseId, text);
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            setVoiceLoading(null);
            setSpeakingIndex(index);
            audio.play();
            audio.onended = () => setSpeakingIndex(null);
        } catch {
            setVoiceLoading(null);
            setSpeakingIndex(null);
        }
    };

    const sendMessage = (q?: string) => {
        const msg = q || question;
        if (!msg.trim() || !course || isStreaming) return;

        const userMsg: Message = { role: "user", content: msg };
        const history = messages.filter(m => !m.isThinking).map(m => ({ role: m.role, content: m.content }));

        setMessages(prev => [...prev, userMsg, { role: "assistant", content: "", isThinking: true }]);
        setQuestion("");
        setIsStreaming(true);

        let assistantMsg: Message = { role: "assistant", content: "", isThinking: false };
        let firstToken = true;

        streamChat(
            courseId, msg, history,
            (token) => {
                if (firstToken) {
                    firstToken = false;
                    assistantMsg = { ...assistantMsg, content: token, isThinking: false };
                } else {
                    assistantMsg = { ...assistantMsg, content: assistantMsg.content + token };
                }
                setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
            },
            (sources) => {
                assistantMsg = { ...assistantMsg, sources };
                setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
            },
            () => setIsStreaming(false)
        );
    };

    const handleGenerateQuiz = async () => {
        setQuizLoading(true); setQuiz(null); setSelectedAnswers({}); setQuizSubmitted(false);
        try { setQuiz(await generateQuiz(courseId)); } catch { }
        setQuizLoading(false);
    };

    const handleFlashcards = async () => {
        setFlashcardsLoading(true); setFlashcards(null);
        try { setFlashcards(await generateFlashcards(courseId)); } catch { }
        setFlashcardsLoading(false);
    };

    const handleSummarize = async () => {
        setSummaryLoading(true);
        try { setSummary(await summarizeCourse(courseId)); } catch { }
        setSummaryLoading(false);
    };

    const handleAssignmentHelp = async () => {
        if (!assignmentText.trim()) return;
        setAssignmentLoading(true); setAssignmentHelp(null);
        try { setAssignmentHelp(await getAssignmentHelp(courseId, assignmentText)); } catch { }
        setAssignmentLoading(false);
    };

    const handleClearHistory = async () => {
        try {
            await clearChatHistory(courseId);
            setMessages(persona?.greeting_message ? [{ role: "assistant", content: persona.greeting_message }] : []);
        } catch { }
    };

    const quizScore = quiz ? quiz.filter((q, i) => selectedAnswers[i]?.charAt(0) === q.answer).length : 0;

    const tabs = [
        { id: "chat", label: "Chat", icon: MessageSquare },
        { id: "overview", label: "Overview", icon: BookOpen },
        { id: "flashcards", label: "Flashcards", icon: Zap },
        { id: "quiz", label: "Quiz", icon: ClipboardList },
        { id: "assignment", label: "Assignment", icon: Lightbulb },
    ] as const;

    return (
        <div className="flex h-screen bg-bg font-sans overflow-hidden">
            {/* Dark Sidebar (#1A1A2E) */}
            <div className="w-64 bg-dark flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-20 flex-shrink-0 relative">
                <div className="px-6 py-8">
                    <button onClick={() => router.push("/student/learn")} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 font-bold text-[11px] uppercase tracking-wider transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <div className="mb-2">
                        <span className="bg-gold text-dark text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-sm inline-block mb-3">AI Tutor</span>
                        <h1 className="text-white font-[800] text-xl leading-tight mb-1">{course?.name || "Loading..."}</h1>
                        <p className="text-white/60 text-sm font-medium">Prof. {course?.professor_name}</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-1 px-4">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all group ${active
                                    ? "bg-[#2D2D44] text-gold border-border border-l-4 border-l-gold"
                                    : "text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-l-transparent"
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${active ? "text-gold" : "text-white/40 group-hover:text-white/80"}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-bg flex flex-col overflow-hidden relative z-10">
                {/* ── CHAT TAB ─────────────────────────────────────── */}
                {activeTab === "chat" && (
                    <>
                        <div className="flex-1 overflow-y-auto px-6 py-8">
                            <div className="max-w-3xl mx-auto space-y-6">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        {msg.role === "assistant" && (
                                            <div className="w-10 h-10 rounded-xl bg-blue flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Bot className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                        <div className={`max-w-[85%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                                            <div className={`px-5 py-4 ${msg.role === "user"
                                                ? "bg-blue text-white rounded-[20px] rounded-tr-[4px] shadow-sm ml-auto font-medium"
                                                : "bg-white border border-border text-dark rounded-[20px] rounded-tl-[4px] shadow-sm"
                                                }`}>
                                                {msg.isThinking ? (
                                                    <ThinkingDots />
                                                ) : msg.role === "assistant" ? (
                                                    <>
                                                        <div className="text-dark">
                                                            <MarkdownMessage content={msg.content} />
                                                        </div>
                                                        {isStreaming && i === messages.length - 1 && (
                                                            <span className="inline-block w-1.5 h-3.5 bg-blue ml-1 animate-pulse rounded" />
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                                                )}

                                                {/* Voice Playback */}
                                                {msg.role === "assistant" && !msg.isThinking && hasVoice && msg.content && msg.content !== persona?.greeting_message && (
                                                    <button
                                                        onClick={() => handleSpeak(msg.content, i)}
                                                        disabled={voiceLoading === i}
                                                        className={`mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all ${speakingIndex === i
                                                            ? "bg-gold text-dark shadow-sm"
                                                            : voiceLoading === i
                                                                ? "bg-bg text-text-muted cursor-wait"
                                                                : "bg-bg hover:bg-[#EBF3FB] text-blue border border-border hover:border-blue/30"
                                                            }`}
                                                    >
                                                        {voiceLoading === i ? (
                                                            <>
                                                                <div className="w-3 h-3 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                                                                <span>Loading...</span>
                                                            </>
                                                        ) : speakingIndex === i ? (
                                                            <>
                                                                <VolumeX className="w-3.5 h-3.5" />
                                                                <span>Stop</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Volume2 className="w-3.5 h-3.5" />
                                                                <span>Listen to Professor</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Source citations */}
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-2 flex gap-1.5 flex-wrap ml-2">
                                                    {Array.from(new Map(msg.sources.map(s => [`${s.filename}-${s.page}`, s])).values()).map((s, j) => (
                                                        <span key={j} className="text-[10px] font-bold uppercase tracking-widest text-[#58595B] bg-white border border-border px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                                            <span className="text-blue">📄</span> {s.filename}, p.{s.page}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {historyLoaded && messages.length <= 1 && summary?.suggested_questions && (
                                    <div className="max-w-xl mx-auto space-y-2 mt-8 animate-in fade-in duration-500">
                                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest text-center mb-4">Suggested questions</p>
                                        <div className="grid gap-2">
                                            {summary.suggested_questions.map((sq, i) => (
                                                <button key={i} onClick={() => askQuestion(sq)}
                                                    className="w-full text-left px-5 py-3.5 bg-white hover:border-blue border border-border rounded-xl text-sm font-medium text-dark shadow-sm transition-all hover:-translate-y-0.5 group flex items-center justify-between">
                                                    {sq}
                                                    <Send className="w-4 h-4 text-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="bg-white border-t border-border p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-10 flex-shrink-0">
                            <div className="max-w-4xl mx-auto relative">
                                {messages.filter(m => !m.isThinking).length > 1 && (
                                    <button onClick={handleClearHistory} className="absolute -top-10 right-0 text-[11px] font-bold uppercase tracking-widest text-text-muted hover:text-red-500 transition-colors">
                                        Clear History
                                    </button>
                                )}
                                <div className="flex gap-3 bg-bg border border-border focus-within:border-blue p-2 rounded-2xl transition-colors shadow-sm">
                                    <textarea
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                        placeholder="Ask your professor..."
                                        className="flex-1 bg-transparent border-none text-dark focus:ring-0 p-3 resize-none outline-none font-medium min-h-[50px] max-h-[150px]"
                                        rows={1}
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={isStreaming || !question.trim()}
                                        className="bg-blue hover:bg-[#004080] text-white p-3.5 rounded-xl self-end transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-center text-[11px] font-semibold text-text-muted mt-3">Answers are generated by AI based on actual course materials.</p>
                            </div>
                        </div>
                    </>
                )}

                {/* ── OVERVIEW TAB ─────────────────────────────────── */}
                {activeTab === "overview" && (
                    <div className="flex-1 overflow-y-auto p-10">
                        <div className="max-w-3xl mx-auto space-y-8">
                            <h2 className="text-3xl font-[800] tracking-tight text-dark mb-8">Course Overview</h2>

                            {summaryLoading && (
                                <div className="text-center py-20">
                                    <div className="w-10 h-10 border-4 border-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-text-secondary font-bold">Analyzing course materials...</p>
                                </div>
                            )}

                            {summary && (
                                <>
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-gold-light text-gold-dark flex items-center justify-center">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-bold text-xl text-dark">Summary</h3>
                                        </div>
                                        <p className="text-text-secondary text-[15px] leading-relaxed font-medium">{summary.overview}</p>
                                    </div>

                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-light text-blue flex items-center justify-center">
                                                <BookOpen className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-bold text-xl text-dark">Key Topics Covered</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {summary.key_topics.map((t, i) => (
                                                <span key={i} className="bg-bg text-dark font-bold text-[13px] px-3.5 py-1.5 rounded-lg border border-border">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ── FLASHCARDS TAB ───────────────────────────────── */}
                {activeTab === "flashcards" && (
                    <div className="flex-1 overflow-y-auto p-10">
                        <div className="max-w-4xl mx-auto">
                            {!flashcards && !flashcardsLoading && (
                                <div className="text-center py-32 bg-white rounded-3xl border border-border shadow-sm">
                                    <div className="w-20 h-20 bg-blue-light rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue">
                                        <Zap className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-3xl font-[800] text-dark mb-4">Smart Flashcards</h2>
                                    <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">Master concepts quickly with AI-generated flashcards from the syllabus.</p>
                                    <button onClick={handleFlashcards} className="bg-gold hover:bg-gold-mid text-dark px-8 py-3.5 rounded-xl font-bold text-lg shadow-md transition-all">
                                        Generate Deck
                                    </button>
                                </div>
                            )}

                            {flashcardsLoading && (
                                <div className="text-center py-32">
                                    <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-text-secondary font-bold">Extracting key terminology...</p>
                                </div>
                            )}

                            {flashcards && (
                                <div>
                                    <div className="flex justify-between items-end mb-8">
                                        <div>
                                            <h2 className="text-3xl font-[800] tracking-tight text-dark mb-2">Practice Deck</h2>
                                            <span className="bg-blue text-white text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                                                {flashcards.length} cards
                                            </span>
                                        </div>
                                        <button onClick={handleFlashcards} className="text-blue font-bold text-sm bg-blue-light hover:bg-[#CCE2F2] px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                                            <RotateCcw className="w-4 h-4" /> Shuffle & New
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {flashcards.map((card, i) => <FlipCard key={i} card={card} index={i} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── QUIZ TAB ─────────────────────────────────────── */}
                {activeTab === "quiz" && (
                    <div className="flex-1 overflow-y-auto p-10">
                        <div className="max-w-3xl mx-auto">
                            {!quiz && !quizLoading && (
                                <div className="text-center py-32 bg-white rounded-3xl border border-border shadow-sm">
                                    <div className="w-20 h-20 bg-gold-light/50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gold">
                                        <ClipboardList className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-3xl font-[800] text-dark mb-4">Test Knowledge</h2>
                                    <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">Take a dynamically generated multiple-choice quiz based on course material.</p>
                                    <button onClick={handleGenerateQuiz} className="bg-blue hover:bg-[#004080] text-white px-8 py-3.5 rounded-xl font-bold text-lg shadow-md transition-all">
                                        Start Quiz
                                    </button>
                                </div>
                            )}

                            {quizLoading && (
                                <div className="text-center py-32">
                                    <div className="w-10 h-10 border-4 border-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-text-secondary font-bold">Generating questions...</p>
                                </div>
                            )}

                            {quiz && (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-end mb-2">
                                        <h2 className="text-3xl font-[800] tracking-tight text-dark">Knowledge Check</h2>
                                        <button onClick={handleGenerateQuiz} className="text-text-secondary font-bold text-sm hover:text-dark transition-colors">
                                            Start Over
                                        </button>
                                    </div>

                                    {quiz.map((q, i) => (
                                        <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-border shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                            <div className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-bg text-text-muted font-bold flex items-center justify-center flex-shrink-0 text-sm">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-dark text-lg mb-4">{q.question}</p>
                                                    <div className="space-y-3">
                                                        {q.options.map((opt, j) => {
                                                            const letter = opt.charAt(0);
                                                            const isSelected = selectedAnswers[i] === opt;
                                                            const isCorrect = letter === q.answer;

                                                            let style = "bg-bg border-border text-dark hover:border-blue hover:bg-blue-light/30";

                                                            if (quizSubmitted) {
                                                                if (isCorrect) style = "bg-[#ECFDF5] border-[#10B981] text-[#047857]";
                                                                else if (isSelected) style = "bg-red-50 border-red-300 text-red-700";
                                                                else style = "bg-bg border-border text-text-muted opacity-60";
                                                            } else if (isSelected) {
                                                                style = "bg-[#EBF3FB] border-blue text-blue border-[2px]";
                                                            }

                                                            return (
                                                                <button key={j}
                                                                    onClick={() => !quizSubmitted && setSelectedAnswers(prev => ({ ...prev, [i]: opt }))}
                                                                    className={`w-full text-left px-5 py-3.5 rounded-xl border font-medium text-[15px] transition-all flex items-center gap-3 ${style}`}>
                                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected && !quizSubmitted ? "border-[5px] border-blue" :
                                                                        quizSubmitted && isCorrect ? "bg-[#10B981] border-[#10B981] text-white" :
                                                                            quizSubmitted && isSelected && !isCorrect ? "bg-red-500 border-red-500 text-white" :
                                                                                "border-text-muted/40"
                                                                        }`}>
                                                                        {quizSubmitted && isCorrect && <CheckCircle className="w-3 h-3" />}
                                                                        {quizSubmitted && isSelected && !isCorrect && <XCircle className="w-3 h-3" />}
                                                                    </div>
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {quizSubmitted && (
                                                        <div className="mt-6 bg-gold-light/30 border border-gold/30 rounded-xl p-4 flex gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-gold shrink-0 flex items-center justify-center">💡</div>
                                                            <p className="text-dark font-medium text-sm leading-relaxed pt-0.5">{q.explanation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {!quizSubmitted ? (
                                        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between sticky bottom-6">
                                            <span className="font-bold text-text-secondary">
                                                {Object.keys(selectedAnswers).length} of {quiz.length} answered
                                            </span>
                                            <button
                                                onClick={() => { setQuizSubmitted(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                                                disabled={Object.keys(selectedAnswers).length < quiz.length}
                                                className="bg-blue hover:bg-[#004080] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md disabled:bg-text-muted">
                                                Submit Answers
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-blue text-white rounded-2xl p-10 text-center shadow-md">
                                            <span className="text-[11px] uppercase tracking-widest font-bold text-white/70 block mb-2">Final Score</span>
                                            <p className="text-6xl font-[800] mb-2">{quizScore}/{quiz.length}</p>
                                            <p className="text-xl font-bold text-white mb-8">
                                                {quizScore === quiz.length ? "Perfect! Excellent work." : quizScore >= quiz.length * 0.7 ? "Great job!" : "Needs review."}
                                            </p>
                                            <button onClick={handleGenerateQuiz} className="bg-white text-blue hover:bg-bg px-8 py-3.5 rounded-xl font-bold transition-all text-lg shadow-sm">
                                                Take Another Quiz
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── ASSIGNMENT TAB ───────────────────────────────── */}
                {activeTab === "assignment" && (
                    <div className="flex-1 overflow-y-auto p-10">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <h2 className="text-3xl font-[800] tracking-tight text-dark mb-2">Assignment Helper</h2>
                            <p className="text-text-secondary font-medium mb-6">Stuck? Get guidance without breaking academic integrity. AI will parse your question and provide hints and framework.</p>

                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                                <textarea
                                    value={assignmentText}
                                    onChange={e => setAssignmentText(e.target.value)}
                                    placeholder="Paste your assignment question here..."
                                    className="w-full bg-bg border border-border focus:border-blue rounded-xl p-4 text-dark font-medium shadow-inner min-h-[150px] outline-none transition-colors resize-y mb-4"
                                />
                                <button
                                    onClick={handleAssignmentHelp}
                                    disabled={assignmentLoading || !assignmentText.trim()}
                                    className="w-full bg-dark hover:bg-black text-white py-3.5 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2">
                                    {assignmentLoading ? (
                                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                                    ) : (
                                        <><Lightbulb className="w-5 h-5" /> Analyze Assignment</>
                                    )}
                                </button>
                            </div>

                            {assignmentHelp && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pt-4">
                                    <div className="border-l-[4px] border-l-[#10B981] bg-white rounded-r-2xl p-6 shadow-sm border-y border-r border-border">
                                        <span className="text-[11px] font-bold tracking-widest uppercase text-[#059669] mb-2 block">What is being asked</span>
                                        <p className="text-dark font-medium leading-relaxed">{assignmentHelp.understanding}</p>
                                    </div>

                                    <div className="border-l-[4px] border-l-gold bg-white rounded-r-2xl p-6 shadow-sm border-y border-r border-border">
                                        <span className="text-[11px] font-bold tracking-widest uppercase text-gold-dark mb-3 block">Suggested Framework</span>
                                        <div className="space-y-3">
                                            {assignmentHelp.approach.map((step, i) => (
                                                <div key={i} className="flex items-start gap-4">
                                                    <div className="w-6 h-6 rounded-full bg-gold text-dark text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                                                    <p className="text-dark font-medium">{step.replace(/^Step \d+:\s*/, "")}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
                                            <span className="text-[11px] font-bold tracking-widest uppercase text-blue mb-3 block">Key Concepts to Review</span>
                                            <div className="flex flex-wrap gap-2">
                                                {assignmentHelp.key_concepts.map((c, i) => (
                                                    <span key={i} className="bg-bg border border-border text-dark text-xs font-bold px-2.5 py-1 rounded-md">{c}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="bg-[#FEF2F2] rounded-2xl p-6 shadow-sm border border-[#FECACA]">
                                            <span className="text-[11px] font-bold tracking-widest uppercase text-[#DC2626] mb-2 block flex items-center gap-1">⚠️ Common Trap</span>
                                            <p className="text-[#991B1B] font-bold text-sm leading-relaxed">{assignmentHelp.warning}</p>
                                        </div>
                                    </div>

                                    {assignmentHelp.hints?.length > 0 && (
                                        <div className="bg-dark rounded-2xl p-6 shadow-md text-white">
                                            <span className="text-[11px] font-bold tracking-widest uppercase text-white/50 mb-4 block">Hints</span>
                                            <ul className="space-y-3">
                                                {assignmentHelp.hints.map((h, i) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                                        <span className="text-white/90 font-medium text-sm">{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}