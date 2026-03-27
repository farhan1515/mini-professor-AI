"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getMyCourses, getDocuments, uploadPDF, publishCourse, Course, Document, uploadVoiceSample } from "@/lib/api";
import { AppSidebar } from "@/components/AppSidebar";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { ArrowLeft, Upload, FileText, Brain, Globe, CheckCircle, Mic, MicOff, BarChart3, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

function VoiceRecorder({ courseId }: { courseId: string }) {
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);
    const [done, setDone] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [timerRef, setTimerRef] = useState<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: "audio/mpeg" });
            setAudioBlob(blob);
            setAudioChunks([]);
        };

        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
        setSeconds(0);

        const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
        setTimerRef(interval);
    };

    const stopRecording = () => {
        mediaRecorder?.stop();
        setRecording(false);
        if (timerRef) clearInterval(timerRef);
    };

    const handleUpload = async () => {
        if (!audioBlob) return;
        setUploading(true);
        const toastId = toast.loading("Cloning your voice...");
        try {
            await uploadVoiceSample(courseId, audioBlob);
            setDone(true);
            toast.success("Voice cloned successfully!", { id: toastId });
        } catch {
            toast.error("Upload failed.", { id: toastId });
        }
        setUploading(false);
    };

    return (
        <div className="rounded-2xl overflow-hidden shadow-lg mt-8" style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #005596 100%)" }}>
            <div className="p-8 text-white relative">
                {uploading && (
                    <div className="absolute top-0 left-0 h-1 bg-gold transition-all duration-300" style={{ width: "60%" }} />
                )}

                <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🎙️</span>
                    <h2 className="text-xl font-bold tracking-tight">Clone Your Voice</h2>
                    <span className="text-[11px] font-bold bg-gold text-dark px-2.5 py-1 rounded-full uppercase tracking-wider ml-2">Premium</span>
                </div>
                <p className="text-white/80 text-sm mb-6 max-w-xl">
                    Students will hear AI answers delivered in your actual voice. Record a 60-second natural response.
                </p>

                {!recording && !audioBlob && (
                    <button onClick={startRecording} className="bg-white text-blue hover:bg-bg px-6 py-3 rounded-xl font-bold transition-all flex items-center shadow-md">
                        <Mic className="w-5 h-5 mr-2" /> Start Recording
                    </button>
                )}

                {recording && (
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-dark/40 border border-white/10 rounded-xl px-5 py-3 relative overflow-hidden">
                            {/* Pulsing rings */}
                            <div className="absolute left-6 w-3 h-3 bg-gold rounded-full animate-[ping_1.5s_ease-in-out_infinite]" />
                            <div className="w-3 h-3 bg-gold rounded-full z-10" />
                            <span className="text-white font-mono text-xl ml-2 font-bold">{seconds}s</span>
                            <span className="text-white/70 text-sm font-medium uppercase tracking-widest ml-4">Recording</span>
                        </div>
                        <button onClick={stopRecording} className="bg-bg text-dark hover:bg-border px-5 py-3 rounded-xl font-bold transition-all flex items-center">
                            <MicOff className="w-5 h-5 mr-2" /> Stop
                        </button>
                    </div>
                )}

                {audioBlob && !done && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-white/10 rounded-xl px-5 py-3">
                            <CheckCircle className="w-5 h-5 text-gold" />
                            <div>
                                <p className="text-white font-bold text-sm">Recording complete ({seconds}s)</p>
                            </div>
                        </div>
                        <button onClick={handleUpload} disabled={uploading} className="bg-gold hover:bg-gold-mid text-dark px-6 py-3 rounded-xl font-bold transition-all shadow-md">
                            {uploading ? "Cloning..." : "Clone My Voice"}
                        </button>
                        <button onClick={() => { setAudioBlob(null); setSeconds(0); }} className="text-white/70 hover:text-white text-sm font-bold underline underline-offset-4">
                            Retake
                        </button>
                    </div>
                )}

                {done && (
                    <div className="flex items-center gap-3 bg-green-500/20 border border-green-500/30 rounded-xl p-4 w-max text-green-100">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="font-bold">Voice cloned & active</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CourseDetailPage() {
    const router = useRouter();
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [docs, setDocs] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [publishing, setPublishing] = useState(false);

    useEffect(() => {
        getMyCourses().then((courses) => {
            const c = courses.find((x) => x.id === courseId);
            if (c) setCourse(c);
        });
        getDocuments(courseId).then(setDocs);
    }, [courseId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        setUploading(true);
        const toastId = toast.loading(`Uploading ${e.target.files[0].name}...`);
        try {
            await uploadPDF(courseId, e.target.files[0]);
            const updated = await getDocuments(courseId);
            setDocs(updated);
            toast.success("PDF uploaded and indexed!", { id: toastId });
        } catch {
            toast.error("Upload failed.", { id: toastId });
        }
        setUploading(false);
        e.target.value = "";
    };

    const handlePublish = async () => {
        setPublishing(true);
        const toastId = toast.loading("Publishing course...");
        try {
            await publishCourse(courseId);
            if (course) setCourse({ ...course, is_published: true });
            toast.success("Course published!", { id: toastId });
        } catch {
            toast.error("Failed to publish.", { id: toastId });
        }
        setPublishing(false);
    };

    const steps = [
        { num: 1, label: "Upload Course Materials", desc: "Upload lecture notes, slides, assignments", done: docs.length > 0, action: null },
        { num: 2, label: "Train Your AI Clone", desc: "Set teaching style, tone, and guidelines", done: false, action: () => router.push(`/professor/courses/${courseId}/train`) },
        { num: 3, label: "Publish to Students", desc: "Make visible for enrollment", done: course?.is_published || false, action: null },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-bg font-sans">
            <AppSidebar />

            <main className="flex-1 ml-64 overflow-y-auto relative">
                {/* HERO SECTION */}
                <div
                    className="bg-dark pt-12 pb-16 px-12 relative overflow-hidden"
                >
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: "radial-gradient(rgba(255,206,0,0.15) 1px, transparent 1px)",
                            backgroundSize: "20px 20px"
                        }}
                    />
                    <div className="max-w-4xl relative z-10">
                        <button onClick={() => router.push("/professor/courses")} className="flex items-center gap-2 text-white/60 hover:text-white mb-6 uppercase tracking-wider text-[11px] font-bold transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-gold text-dark px-3 py-1 rounded font-bold text-xs uppercase tracking-widest shadow-sm">
                                {course?.subject || "Subject"}
                            </span>
                            <span className={`px-3 py-1 rounded font-bold text-xs uppercase shadow-sm border ${course?.is_published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-transparent text-white/80 border-white/20"
                                }`}>
                                {course?.is_published ? "Published ✓" : "Draft"}
                            </span>
                        </div>
                        <h1 className="text-white text-[32px] md:text-[40px] font-[800] tracking-tight leading-tight">
                            {course?.name || "Loading Course..."}
                        </h1>
                    </div>
                </div>

                <div className="max-w-4xl px-12 py-10 -mt-8 relative z-20">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* MAIN LEFT */}
                        <div className="lg:col-span-2 space-y-10">

                            {/* SETUP CHECKLIST */}
                            <section>
                                <SectionEyebrow label="SETUP" heading="Course Checklist" />
                                <div className="space-y-3 mt-4">
                                    {steps.map((step) => {
                                        const borderColor = step.done ? "border-l-[#10B981]" : (step.num === 1 || docs.length > 0 && !course?.is_published ? "border-l-blue" : "border-l-border");

                                        return (
                                            <div key={step.num} className={`bg-white rounded-xl border border-border border-l-[4px] shadow-sm p-5 flex items-center justify-between ${borderColor}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step.done ? "bg-[#ECFDF5] text-[#10B981]" : "bg-bg text-text-muted border border-border"
                                                        }`}>
                                                        {step.done ? "✓" : step.num}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold text-[15px] ${step.done ? "text-dark" : "text-dark"}`}>{step.label}</p>
                                                        <p className="text-text-secondary text-sm">{step.desc}</p>
                                                    </div>
                                                </div>
                                                {step.action && !step.done && (
                                                    <button onClick={step.action} className="bg-blue hover:bg-[#004080] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all">
                                                        Start →
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <VoiceRecorder courseId={courseId} />

                            {/* DOCUMENTS */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <SectionEyebrow label="MATERIALS" heading="Knowledge Base" />
                                    <label className="cursor-pointer bg-white border border-border hover:border-blue hover:text-blue text-dark px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 text-sm">
                                        <Upload className="w-4 h-4" />
                                        {uploading ? "Uploading..." : "Add PDF"}
                                        <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                                    </label>
                                </div>

                                <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-bg border-b border-border px-6 py-3 grid grid-cols-12 gap-4">
                                        <div className="col-span-6 text-[11px] font-bold text-text-secondary uppercase tracking-widest">Document</div>
                                        <div className="col-span-3 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-right">Chunks</div>
                                        <div className="col-span-3 text-[11px] font-bold text-text-secondary uppercase tracking-widest text-right">Status</div>
                                    </div>
                                    {docs.length === 0 ? (
                                        <div className="px-6 py-12 text-center text-text-muted font-medium">
                                            No materials uploaded yet.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border">
                                            {docs.map((doc) => (
                                                <div key={doc.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-bg transition-colors">
                                                    <div className="col-span-6 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-red-50 text-red-600 flex items-center justify-center">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-dark font-medium text-sm truncate">{doc.filename}</span>
                                                    </div>
                                                    <div className="col-span-3 text-right text-text-secondary font-medium text-sm">
                                                        {doc.chunk_count}
                                                    </div>
                                                    <div className="col-span-3 text-right">
                                                        <span className="inline-block px-2.5 py-1 text-[11px] font-bold uppercase rounded-full bg-gold-light text-[#B8941A]">
                                                            Ready
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>

                        {/* RIGHT SIDEBAR ACTIONS */}
                        <div className="space-y-4 pt-10">
                            <button
                                onClick={() => router.push(`/professor/courses/${courseId}/train`)}
                                className="w-full bg-dark hover:bg-black text-white p-5 rounded-2xl shadow-sm transition-all group text-left relative overflow-hidden"
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-2 bg-gold" />
                                <Brain className="w-6 h-6 mb-3 text-gold" />
                                <h3 className="font-bold text-lg mb-1 group-hover:underline">Train AI Clone</h3>
                                <p className="text-white/70 text-sm">Refine teaching style</p>
                            </button>

                            <button
                                onClick={() => router.push(`/professor/courses/${courseId}/analytics`)}
                                className="w-full bg-white border border-border hover:border-blue p-5 rounded-2xl shadow-sm transition-all group text-left"
                            >
                                <BarChart3 className="w-6 h-6 mb-3 text-blue" />
                                <h3 className="font-bold text-dark text-lg mb-1 group-hover:text-blue">View Analytics</h3>
                                <p className="text-text-secondary text-sm">Student sentiment & questions</p>
                            </button>

                            {!course?.is_published && (
                                <button
                                    onClick={handlePublish}
                                    disabled={publishing || docs.length === 0}
                                    className="w-full bg-blue hover:bg-[#004080] disabled:bg-opacity-50 text-white p-5 rounded-2xl shadow-sm transition-all text-left flex items-center justify-between group mt-8"
                                >
                                    <div>
                                        <h3 className="font-bold text-lg leading-none mb-1">Publish Course</h3>
                                        <p className="text-white/70 text-sm">{publishing ? "Publishing..." : "Make available"}</p>
                                    </div>
                                    <Globe className="w-6 h-6 text-white/50 group-hover:text-white transition-colors" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}