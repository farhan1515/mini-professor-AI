"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getEnrolledCourses, getPersona, generateQuiz, generateFlashcards, summarizeCourse, getAssignmentHelp, streamChat, Course, Persona } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Bot, User, Send, ArrowLeft, Zap, BookOpen, RotateCcw, ClipboardList, Sparkles, CheckCircle, XCircle, BookMarked } from "lucide-react";
import { getChatHistory, clearChatHistory, getVoiceStatus, speakText } from "@/lib/api";

interface Message { role: "user" | "assistant"; content: string; sources?: { filename: string; page: number }[]; }
interface QuizQuestion { question: string; options: string[]; answer: string; explanation: string; }
interface Flashcard { front: string; back: string; }
interface Summary { overview: string; key_topics: string[]; suggested_questions: string[]; }
interface AssignmentHelp { understanding: string; key_concepts: string[]; approach: string[]; hints: string[]; warning: string; }

function FlipCard({ card, index }: { card: Flashcard; index: number }) {
    const [flipped, setFlipped] = useState(false);
    return (
        <div className="cursor-pointer" style={{ perspective: "1000px" }} onClick={() => setFlipped(!flipped)}>
            <div style={{ transition: "transform 0.5s", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", position: "relative", height: "160px" }}>
                <div style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col justify-between">
                    <span className="text-xs text-violet-400 font-medium uppercase">Card {index + 1}</span>
                    <p className="text-white font-medium text-center">{card.front}</p>
                    <span className="text-xs text-slate-500 text-center">Click to flip</span>
                </div>
                <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", inset: 0 }} className="bg-violet-900 border border-violet-600 rounded-xl p-5 flex flex-col justify-between">
                    <span className="text-xs text-violet-300 font-medium uppercase">Answer</span>
                    <p className="text-white text-sm text-center leading-relaxed">{card.back}</p>
                    <span className="text-xs text-violet-400 text-center">Click to flip back</span>
                </div>
            </div>
        </div>
    );
}

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
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => { loadFromStorage(); }, []);

    useEffect(() => {
        getEnrolledCourses().then((courses) => {
            const c = courses.find((x) => x.id === courseId);
            if (c) setCourse(c);
        });
        getPersona(courseId).then(setPersona);

        // Load chat history from DB
        getChatHistory(courseId).then((history) => {
            if (history && history.length > 0) {
                setMessages(history.map((m: any) => ({
                    role: m.role,
                    content: m.content,
                    sources: m.sources || undefined,
                })));
            }
        });

        getVoiceStatus(courseId).then((status) => {
            setHasVoice(status.has_voice);
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
        setSpeakingIndex(index);
        try {
            const blob = await speakText(courseId, text);
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.play();
            audio.onended = () => setSpeakingIndex(null);
        } catch {
            setSpeakingIndex(null);
            alert("Voice not available for this course.");
        }
    };

    const sendMessage = (q?: string) => {
        const msg = q || question;
        if (!msg.trim() || !course || isStreaming) return;
        const userMsg: Message = { role: "user", content: msg };
        const history = messages.filter(m => m.role !== "assistant" || m.content !== persona?.greeting_message)
            .map(m => ({ role: m.role, content: m.content }));
        setMessages(prev => [...prev, userMsg]);
        setQuestion("");
        setIsStreaming(true);
        let assistantMsg: Message = { role: "assistant", content: "" };
        setMessages(prev => [...prev, assistantMsg]);

        streamChat(courseId, msg, history,
            (token) => { assistantMsg = { ...assistantMsg, content: assistantMsg.content + token }; setMessages(prev => [...prev.slice(0, -1), assistantMsg]); },
            (sources) => { assistantMsg = { ...assistantMsg, sources }; setMessages(prev => [...prev.slice(0, -1), assistantMsg]); },
            () => setIsStreaming(false)
        );
    };

    const handleGenerateQuiz = async () => {
        setQuizLoading(true); setQuiz(null); setSelectedAnswers({}); setQuizSubmitted(false);
        try { setQuiz(await generateQuiz(courseId)); } catch { alert("Failed"); }
        setQuizLoading(false);
    };

    const handleFlashcards = async () => {
        setFlashcardsLoading(true); setFlashcards(null);
        try { setFlashcards(await generateFlashcards(courseId)); } catch { alert("Failed"); }
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
        try { setAssignmentHelp(await getAssignmentHelp(courseId, assignmentText)); } catch { alert("Failed"); }
        setAssignmentLoading(false);
    };

    const quizScore = quiz ? quiz.filter((q, i) => selectedAnswers[i]?.charAt(0) === q.answer).length : 0;

    const tabs = [
        { id: "chat", label: "💬 Chat" },
        { id: "overview", label: "📋 Overview" },
        { id: "flashcards", label: "🃏 Flashcards" },
        { id: "quiz", label: "⚡ Quiz" },
        { id: "assignment", label: "📝 Assignment" },
    ] as const;

    return (
        <div className="flex h-screen bg-slate-950 text-white flex-col">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push("/student/learn")} className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-white">{course?.name || "Loading..."}</h1>
                        <p className="text-sm text-violet-400">Prof. {course?.professor_name}</p>
                    </div>
                </div>
                {persona && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        Mini Professor Active • {persona.teaching_style} style
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900 overflow-x-auto">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-b-2 border-violet-500 text-violet-400" : "text-slate-400 hover:text-white"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CHAT */}
            {activeTab === "chat" && (
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                {msg.role === "assistant" && (
                                    <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-1"><Bot className="w-4 h-4" /></div>
                                )}
                                <div className="max-w-2xl">
                                    <div className={`rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-violet-600" : "bg-slate-800"}`}>
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                                            <span className="inline-block w-2 h-4 bg-violet-400 ml-1 animate-pulse rounded" />
                                        )}
                                        {msg.role === "assistant" && hasVoice && msg.content !== persona?.greeting_message && (
                                            <button
                                                onClick={() => handleSpeak(msg.content, i)}
                                                className={`mt-3 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${speakingIndex === i
                                                        ? "bg-violet-600 text-white"
                                                        : "bg-slate-900 border border-slate-700 hover:bg-slate-950 text-slate-300"
                                                    }`}
                                            >
                                                {speakingIndex === i ? (
                                                    <><span className="w-2 h-2 bg-white rounded-full animate-pulse" />Playing in professor's voice...</>
                                                ) : (
                                                    <>🔊 Listen in professor's voice</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-2 flex gap-1 flex-wrap">
                                            {Array.from(new Map(msg.sources.map(s => [`${s.filename}-${s.page}`, s])).values()).map((s, j) => (
                                                <Badge key={j} variant="outline" className="text-xs text-slate-400 border-slate-600">📄 {s.filename}, p.{s.page}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1"><User className="w-4 h-4" /></div>
                                )}
                            </div>
                        ))}
                        {messages.length === 1 && summary?.suggested_questions && (
                            <div className="max-w-lg mx-auto space-y-2 mt-4">
                                <p className="text-xs text-slate-500 uppercase tracking-wide text-center mb-3">Suggested questions</p>
                                {summary.suggested_questions.map((sq, i) => (
                                    <button key={i} onClick={() => askQuestion(sq)} className="w-full text-left px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">{sq}</button>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    {messages.length > 1 && (
                        <div className="px-6 pt-2 flex justify-end">
                            <button
                                onClick={async () => {
                                    await clearChatHistory(courseId);
                                    setMessages(persona?.greeting_message
                                        ? [{ role: "assistant", content: persona.greeting_message }]
                                        : []
                                    );
                                }}
                                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                            >
                                Clear history
                            </button>
                        </div>
                    )}
                    <div className="p-4 border-t border-slate-800 bg-slate-900">
                        <div className="flex gap-3 max-w-4xl mx-auto">
                            <Textarea value={question} onChange={e => setQuestion(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                placeholder="Ask your question..." className="flex-1 bg-slate-800 border-slate-700 text-white resize-none" rows={2} />
                            <Button onClick={() => sendMessage()} disabled={isStreaming || !question.trim()} className="bg-violet-600 hover:bg-violet-700 self-end">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* OVERVIEW */}
            {activeTab === "overview" && (
                <div className="flex-1 overflow-y-auto p-6">
                    {summaryLoading && <div className="text-center mt-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-400">Analyzing...</p></div>}
                    {summary && (
                        <div className="max-w-2xl mx-auto space-y-5">
                            <Card className="p-5 bg-slate-800 border-slate-700"><div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-violet-400" /><h4 className="font-semibold text-white">Summary</h4></div><p className="text-slate-300 text-sm leading-relaxed">{summary.overview}</p></Card>
                            <Card className="p-5 bg-slate-800 border-slate-700"><div className="flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4 text-blue-400" /><h4 className="font-semibold text-white">Key Topics</h4></div><div className="flex flex-wrap gap-2">{summary.key_topics.map((t, i) => <Badge key={i} className="bg-blue-900 text-blue-200 border-blue-700 px-3 py-1">{t}</Badge>)}</div></Card>
                            <Card className="p-5 bg-slate-800 border-slate-700"><div className="flex items-center gap-2 mb-3"><Bot className="w-4 h-4 text-green-400" /><h4 className="font-semibold text-white">Questions to Explore</h4></div><div className="space-y-2">{summary.suggested_questions.map((q, i) => (<button key={i} onClick={() => askQuestion(q)} className="w-full text-left px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-200 flex items-center justify-between group"><span>{q}</span><Send className="w-3 h-3 opacity-0 group-hover:opacity-100 text-violet-400 ml-2" /></button>))}</div></Card>
                        </div>
                    )}
                </div>
            )}

            {/* FLASHCARDS */}
            {activeTab === "flashcards" && (
                <div className="flex-1 overflow-y-auto p-6">
                    {!flashcards && !flashcardsLoading && (<div className="text-center mt-20"><div className="text-5xl mb-4">🃏</div><p className="text-lg font-medium mb-6 text-slate-300">Study with AI-generated flashcards</p><Button onClick={handleFlashcards} className="bg-violet-600 hover:bg-violet-700"><Sparkles className="w-4 h-4 mr-2" />Generate Flashcards</Button></div>)}
                    {flashcardsLoading && <div className="text-center mt-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-400">Creating flashcards...</p></div>}
                    {flashcards && (<div className="max-w-3xl mx-auto"><div className="flex justify-between mb-6"><h3 className="font-bold text-lg">Flashcards</h3><Button onClick={handleFlashcards} variant="outline" size="sm" className="border-slate-600"><RotateCcw className="w-3 h-3 mr-2" />New Set</Button></div><div className="grid grid-cols-2 gap-4">{flashcards.map((card, i) => <FlipCard key={i} card={card} index={i} />)}</div><p className="text-center text-slate-500 text-sm mt-6">Click any card to reveal the answer</p></div>)}
                </div>
            )}

            {/* QUIZ */}
            {activeTab === "quiz" && (
                <div className="flex-1 overflow-y-auto p-6">
                    {!quiz && !quizLoading && (<div className="text-center mt-20"><Zap className="w-12 h-12 mx-auto mb-3 text-yellow-400 opacity-70" /><p className="text-lg font-medium mb-6">Test Your Knowledge</p><Button onClick={handleGenerateQuiz} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"><Zap className="w-4 h-4 mr-2" />Generate Quiz</Button></div>)}
                    {quizLoading && <div className="text-center mt-20"><div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-slate-400">Generating questions...</p></div>}
                    {quiz && (
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="flex justify-between"><h3 className="font-bold text-lg">Quiz</h3><Button onClick={handleGenerateQuiz} variant="outline" size="sm" className="border-slate-600">New Quiz</Button></div>
                            {quiz.map((q, i) => (
                                <Card key={i} className="p-5 bg-slate-800 border-slate-700">
                                    <p className="font-medium mb-3">{i + 1}. {q.question}</p>
                                    <div className="space-y-2">{q.options.map((opt, j) => { const letter = opt.charAt(0); const isSelected = selectedAnswers[i] === opt; const isCorrect = letter === q.answer; let style = "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"; if (quizSubmitted) { if (isCorrect) style = "bg-green-900 border-green-500 text-green-100"; else if (isSelected) style = "bg-red-900 border-red-500 text-red-100"; else style = "bg-slate-700 border-slate-600 text-slate-400"; } else if (isSelected) style = "bg-violet-700 border-violet-500 text-white"; return (<button key={j} onClick={() => !quizSubmitted && setSelectedAnswers(prev => ({ ...prev, [i]: opt }))} className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${style}`}>{opt}</button>); })}</div>
                                    {quizSubmitted && (<div className="mt-3 flex items-start gap-2 text-sm bg-slate-700 rounded-lg p-3">{selectedAnswers[i]?.charAt(0) === q.answer ? <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />}<span className="text-slate-300">{q.explanation}</span></div>)}
                                </Card>
                            ))}
                            {!quizSubmitted ? (<Button onClick={() => setQuizSubmitted(true)} disabled={Object.keys(selectedAnswers).length < quiz.length} className="w-full bg-violet-600 hover:bg-violet-700">Submit ({Object.keys(selectedAnswers).length}/{quiz.length})</Button>) : (<Card className="p-6 bg-slate-800 border-slate-700 text-center"><p className="text-3xl font-bold mb-1">{quizScore}/{quiz.length}</p><p className="text-slate-400">{quizScore === quiz.length ? "🎉 Perfect!" : quizScore >= quiz.length * 0.7 ? "👍 Great!" : "📚 Keep studying!"}</p><Button onClick={handleGenerateQuiz} className="mt-4 bg-violet-600 hover:bg-violet-700">Try Again</Button></Card>)}
                        </div>
                    )}
                </div>
            )}

            {/* ASSIGNMENT */}
            {activeTab === "assignment" && (
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-2xl mx-auto space-y-5">
                        <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-orange-400" /><h3 className="font-bold text-lg">Assignment Helper</h3></div>
                        <Card className="p-5 bg-slate-800 border-slate-700">
                            <p className="text-sm text-slate-400 mb-3">Paste your assignment question for guidance grounded in course materials.</p>
                            <Textarea value={assignmentText} onChange={e => setAssignmentText(e.target.value)} placeholder="Paste your assignment question here..." className="bg-slate-700 border-slate-600 text-white resize-none mb-3" rows={4} />
                            <Button onClick={handleAssignmentHelp} disabled={assignmentLoading || !assignmentText.trim()} className="w-full bg-orange-500 hover:bg-orange-600">
                                {assignmentLoading ? "Analyzing..." : "Get Help"}
                            </Button>
                        </Card>
                        {assignmentHelp && (
                            <div className="space-y-4">
                                <Card className="p-5 bg-slate-800 border-slate-700"><p className="text-xs text-orange-400 font-medium uppercase mb-2">What it's asking</p><p className="text-slate-200 text-sm leading-relaxed">{assignmentHelp.understanding}</p></Card>
                                <Card className="p-5 bg-slate-800 border-slate-700"><p className="text-xs text-blue-400 font-medium uppercase mb-3">Key concepts</p><div className="flex flex-wrap gap-2">{assignmentHelp.key_concepts.map((c, i) => <Badge key={i} className="bg-blue-900 text-blue-200 border-blue-700">{c}</Badge>)}</div></Card>
                                <Card className="p-5 bg-slate-800 border-slate-700"><p className="text-xs text-green-400 font-medium uppercase mb-3">Suggested approach</p><div className="space-y-2">{assignmentHelp.approach.map((step, i) => (<div key={i} className="flex items-start gap-3"><span className="w-6 h-6 rounded-full bg-green-900 text-green-300 text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span><p className="text-slate-300 text-sm">{step.replace(/^Step \d+:\s*/, "")}</p></div>))}</div></Card>
                                <Card className="p-5 bg-red-950 border-red-800"><p className="text-xs text-red-400 font-medium uppercase mb-2">⚠️ Avoid this</p><p className="text-slate-300 text-sm">{assignmentHelp.warning}</p></Card>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}