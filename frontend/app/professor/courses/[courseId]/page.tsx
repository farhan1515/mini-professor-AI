"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getMyCourses, getDocuments, uploadPDF, publishCourse, Course, Document, uploadVoiceSample } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileText, Brain, Globe, CheckCircle, Mic, MicOff } from "lucide-react";

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
        try {
            await uploadVoiceSample(courseId, audioBlob);
            setDone(true);
        } catch {
            alert("Voice upload failed. Make sure your sample is at least 30 seconds.");
        }
        setUploading(false);
    };

    return (
        <div className="space-y-4">
            {!recording && !audioBlob && (
                <div>
                    <p className="text-slate-400 text-sm mb-3">
                        Read aloud for <strong className="text-white">60 seconds</strong> — your course intro, a lecture excerpt, or just explain a concept naturally. The more natural the better.
                    </p>
                    <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                        <Mic className="w-4 h-4 mr-2" /> Start Recording
                    </Button>
                </div>
            )}

            {recording && (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-red-950 border border-red-700 rounded-xl px-4 py-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-300 font-mono text-lg">{seconds}s</span>
                        <span className="text-red-400 text-sm">Recording...</span>
                    </div>
                    <Button onClick={stopRecording} variant="outline" className="border-slate-600">
                        <MicOff className="w-4 h-4 mr-2" /> Stop
                    </Button>
                </div>
            )}

            {audioBlob && !done && (
                <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-slate-800 rounded-xl p-4">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <p className="text-white text-sm font-medium">Recording complete ({seconds}s)</p>
                            <p className="text-slate-400 text-xs">Ready to clone your voice</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleUpload} disabled={uploading} className="bg-violet-600 hover:bg-violet-700">
                            {uploading ? "Cloning voice..." : "🎙️ Clone My Voice"}
                        </Button>
                        <Button onClick={() => { setAudioBlob(null); setSeconds(0); }} variant="outline" className="border-slate-600">
                            Re-record
                        </Button>
                    </div>
                </div>
            )}

            {done && (
                <div className="flex items-center gap-3 bg-green-950 border border-green-700 rounded-xl p-4">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                        <p className="text-green-300 font-medium">Voice cloned successfully!</p>
                        <p className="text-slate-400 text-sm">Students will now hear answers in your voice</p>
                    </div>
                </div>
            )}
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
        try {
            await uploadPDF(courseId, e.target.files[0]);
            const updated = await getDocuments(courseId);
            setDocs(updated);
        } catch { alert("Upload failed"); }
        setUploading(false);
        e.target.value = "";
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            await publishCourse(courseId);
            if (course) setCourse({ ...course, is_published: true });
        } catch { alert("Failed to publish"); }
        setPublishing(false);
    };

    const steps = [
        { num: 1, label: "Upload Course Materials", desc: "Upload all your PDFs — lecture notes, slides, assignments", done: docs.length > 0, action: null },
        { num: 2, label: "Train Your Mini Professor", desc: "Set teaching style, tone, and your personal guidelines", done: false, action: () => router.push(`/professor/courses/${courseId}/train`) },
        { num: 3, label: "Publish to Students", desc: "Make your course visible so students can enroll", done: course?.is_published || false, action: null },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => router.push("/professor/courses")} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> My Courses
                </button>

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">{course?.name || "Loading..."}</h1>
                        <p className="text-slate-400 mt-1">{course?.subject} • {course?.professor_name}</p>
                    </div>
                    <Badge className={course?.is_published ? "bg-green-900 text-green-300" : "bg-slate-700 text-slate-300"}>
                        {course?.is_published ? "Published" : "Draft"}
                    </Badge>
                </div>

                {/* Setup Steps */}
                <div className="space-y-4 mb-8">
                    <h2 className="text-lg font-semibold text-slate-300">Setup Checklist</h2>
                    {steps.map((step) => (
                        <Card key={step.num} className={`p-5 border transition-all ${step.done ? "bg-green-950 border-green-800" : "bg-slate-900 border-slate-800"}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.done ? "bg-green-600" : "bg-slate-700"}`}>
                                        {step.done ? <CheckCircle className="w-4 h-4" /> : step.num}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{step.label}</p>
                                        <p className="text-sm text-slate-400">{step.desc}</p>
                                    </div>
                                </div>
                                {step.action && !step.done && (
                                    <Button onClick={step.action} size="sm" className="bg-violet-600 hover:bg-violet-700">
                                        <Brain className="w-4 h-4 mr-2" /> Train Now
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Documents */}
                <Card className="p-6 bg-slate-900 border-slate-800 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white">Uploaded Materials ({docs.length})</h2>
                        <label className="cursor-pointer">
                            <Button size="sm" className="bg-violet-600 hover:bg-violet-700" disabled={uploading} asChild>
                                <span><Upload className="w-4 h-4 mr-2" />{uploading ? "Uploading..." : "Upload PDF"}</span>
                            </Button>
                            <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
                        </label>
                    </div>
                    {docs.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-6">No materials uploaded yet. Upload your first PDF.</p>
                    ) : (
                        <div className="space-y-2">
                            {docs.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-4 h-4 text-violet-400" />
                                        <span className="text-sm text-white">{doc.filename}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-slate-700 text-slate-300 text-xs">{doc.chunk_count} chunks</Badge>
                                        <Badge className="bg-green-900 text-green-300 text-xs">{doc.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Voice Cloning Card */}
                <Card className="p-6 bg-slate-900 border-slate-800 border-2 border-violet-800">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🎙️</span>
                        <h2 className="font-semibold text-white">Clone Your Voice</h2>
                        <span className="text-xs bg-violet-900 text-violet-300 px-2 py-0.5 rounded-full ml-2">Premium Feature</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">
                        Students will hear AI answers delivered in <strong className="text-white">your actual voice</strong>. This is what makes Mini Professor truly unique.
                    </p>
                    <VoiceRecorder courseId={courseId} />
                </Card>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button onClick={() => router.push(`/professor/courses/${courseId}/train`)} className="flex-1 bg-violet-600 hover:bg-violet-700 h-12">
                        <Brain className="w-4 h-4 mr-2" /> Train Mini Professor
                    </Button>
                    {!course?.is_published && (
                        <Button onClick={handlePublish} disabled={publishing || docs.length === 0} variant="outline" className="flex-1 border-green-700 text-green-400 hover:bg-green-950 h-12">
                            <Globe className="w-4 h-4 mr-2" />{publishing ? "Publishing..." : "Publish Course"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}