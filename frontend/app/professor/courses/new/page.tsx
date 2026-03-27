"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/lib/api";
import { ArrowLeft, BookOpen, FileText, BrainCircuit, Rocket, ChevronRight, GraduationCap } from "lucide-react";

export default function NewCoursePage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", description: "", subject: "" });
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!form.name) return;
        setLoading(true);
        try {
            const course = await createCourse(form);
            router.push(`/professor/courses/${course.id}`);
        } catch { alert("Failed to create course"); }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
            {/* Soft background blurred blobs for premium aesthetic */}
            <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-gold/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative w-full max-w-5xl bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-border overflow-hidden flex flex-col md:flex-row min-h-[600px] z-10">
                
                {/* LEFT SIDE - STEPPER & INFO */}
                <div className="w-full md:w-[40%] relative bg-[#005596] p-10 text-white flex flex-col overflow-hidden">
                    {/* Wavy background decorative */}
                    <svg className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" viewBox="0 0 1440 900" preserveAspectRatio="none">
                        <path d="M0 0h600c250 0 450 450 500 900H0V0z" fill="#003566"/>
                    </svg>

                    <button 
                        onClick={() => router.back()} 
                        className="relative z-10 flex items-center gap-2 text-white/70 hover:text-white mb-16 transition-colors font-bold text-sm w-fit group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </button>

                    <div className="relative z-10 flex-1">
                        <h2 className="text-3xl font-[800] tracking-tight mb-2">Build Your Clone</h2>
                        <p className="text-white/80 text-sm mb-12 leading-relaxed">Let's set up your new course. This is the first step in creating your 24/7 AI teaching assistant.</p>

                        {/* Premium Stepper */}
                        <div className="space-y-8">
                            {/* Step 1 */}
                            <div className="flex gap-4 relative">
                                <div className="absolute top-10 left-[1.125rem] bottom-[-2rem] w-0.5 bg-white/20" />
                                <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(255,206,0,0.4)] z-10 text-[#1A1A2E]">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gold leading-tight">1. Course Details</h3>
                                    <p className="text-white/70 text-sm mt-1">Name, subject, and description.</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-4 relative opacity-50">
                                <div className="absolute top-10 left-[1.125rem] bottom-[-2rem] w-0.5 bg-white/20" />
                                <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 z-10">
                                    <BrainCircuit className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">2. Train AI</h3>
                                    <p className="text-white/70 text-sm mt-1">Upload materials & set format.</p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-4 relative opacity-50">
                                <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 z-10">
                                    <Rocket className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">3. Publish</h3>
                                    <p className="text-white/70 text-sm mt-1">Go live for your students.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - FORM */}
                <div className="w-full md:w-[60%] p-10 md:p-14 lg:p-16 flex flex-col justify-center bg-white">
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EBF3FB] text-[#005596] font-bold text-xs uppercase tracking-widest mb-4">
                            <GraduationCap className="w-4 h-4" /> Phase 1
                        </div>
                        <h1 className="text-4xl font-[800] text-[#1A1A2E] tracking-tight mb-3">Course Details</h1>
                        <p className="text-text-secondary text-base">Give your course a clear identity so students can easily locate it in the university portal.</p>
                    </div>

                    <div className="space-y-6">
                        {/* Course Name */}
                        <div className="group">
                            <label className="text-xs font-bold text-text-secondary tracking-widest uppercase mb-2 flex items-center gap-2">
                                Course Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-[#005596] transition-colors">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <input
                                    placeholder="e.g. COMP 3540: Advanced Software Eng..."
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full h-14 pl-12 pr-4 bg-[#F8F9FA] hover:bg-white border-2 border-transparent hover:border-border focus:bg-white focus:border-[#005596] focus:outline-none focus:ring-4 focus:ring-[#005596]/10 rounded-xl transition-all text-[#1A1A2E] font-medium placeholder:text-text-muted/70 text-lg"
                                />
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="group">
                            <label className="text-xs font-bold text-text-secondary tracking-widest uppercase mb-2 flex items-center gap-2">
                                Subject Area
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-[#005596] transition-colors">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <input
                                    placeholder="e.g. Computer Science"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    className="w-full h-14 pl-12 pr-4 bg-[#F8F9FA] hover:bg-white border-2 border-transparent hover:border-border focus:bg-white focus:border-[#005596] focus:outline-none focus:ring-4 focus:ring-[#005596]/10 rounded-xl transition-all text-[#1A1A2E] font-medium placeholder:text-text-muted/70 text-lg"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="group">
                            <label className="text-xs font-bold text-text-secondary tracking-widest uppercase mb-2 flex items-center gap-2">
                                Description
                            </label>
                            <div className="relative">
                                <textarea
                                    placeholder="Briefly describe what this course covers..."
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full p-4 bg-[#F8F9FA] hover:bg-white border-2 border-transparent hover:border-border focus:bg-white focus:border-[#005596] focus:outline-none focus:ring-4 focus:ring-[#005596]/10 rounded-xl transition-all resize-none text-[#1A1A2E] font-medium placeholder:text-text-muted/70 min-h-[120px] text-base"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 mt-8">
                            <button
                                onClick={handleCreate}
                                disabled={loading || !form.name}
                                className="w-full h-14 bg-[#1A1A2E] hover:bg-black text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:-translate-y-0.5 group"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Creating Workspace...
                                    </>
                                ) : (
                                    <>
                                        Continue to AI Training
                                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            <p className="text-center text-text-muted text-xs mt-4 font-medium">
                                You can edit these details later in course settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}