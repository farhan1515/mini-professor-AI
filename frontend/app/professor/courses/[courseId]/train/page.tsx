"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPersona, savePersona, Persona } from "@/lib/api";
import { AppSidebar } from "@/components/AppSidebar";
import { SectionEyebrow } from "@/components/SectionEyebrow";
import { ArrowLeft, Trash2 } from "lucide-react";

const STYLES = [
    { id: "socratic", label: "Socratic", desc: "Guide with questions" },
    { id: "direct", label: "Direct", desc: "Clear & concise" },
    { id: "encouraging", label: "Encouraging", desc: "Warm & supportive" },
    { id: "strict", label: "Strict", desc: "Rigorous & precise" },
    { id: "balanced", label: "Balanced", desc: "Mix of all" },
];

const TONES = [
    { id: "formal", label: "Formal" },
    { id: "professional", label: "Professional" },
    { id: "friendly", label: "Friendly" },
    { id: "casual", label: "Casual" },
];

export default function TrainPersonaPage() {
    const router = useRouter();
    const { courseId } = useParams<{ courseId: string }>();
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [persona, setPersona] = useState<Partial<Persona>>({
        teaching_style: "balanced",
        tone: "professional",
        teaching_philosophy: "",
        key_emphasis: "",
        sensitive_topics: "",
        restrictions: "",
        greeting_message: "",
        example_qa: [],
    });

    useEffect(() => {
        getPersona(courseId).then((p) => { if (p) setPersona(p); });
    }, [courseId]);

    const updateField = (field: string, value: any) => setPersona((prev) => ({ ...prev, [field]: value }));

    const addExample = () => {
        const examples = [...(persona.example_qa || []), { question: "", answer: "" }];
        updateField("example_qa", examples);
    };

    const updateExample = (i: number, field: "question" | "answer", val: string) => {
        const examples = [...(persona.example_qa || [])];
        examples[i] = { ...examples[i], [field]: val };
        updateField("example_qa", examples);
    };

    const removeExample = (i: number) => {
        updateField("example_qa", (persona.example_qa || []).filter((_, idx) => idx !== i));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await savePersona(courseId, persona);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { } // Error handling toast if needed
        setSaving(false);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-bg font-sans">
            <AppSidebar />

            <main className="flex-1 ml-64 overflow-y-auto relative pb-28">
                <div className="max-w-3xl mx-auto px-12 py-10">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-text-secondary hover:text-blue mb-8 uppercase tracking-wider text-[11px] font-bold transition-colors">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Course
                    </button>

                    <div className="mb-10 relative">
                        <SectionEyebrow label="TRAINING" heading="Train Your MiniProfessorAI" />
                        <div className="h-[3px] bg-gold w-10 mt-4 rounded-full" />
                        <p className="text-text-secondary mt-4">Fine-tune the behavior, teaching style, and constraints for your AI clone.</p>
                    </div>

                    <div className="space-y-8">
                        {/* STYLE */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-gold" />
                                <h3 className="font-bold text-dark text-lg">Teaching Style</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {STYLES.map((s) => {
                                    const selected = persona.teaching_style === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => updateField("teaching_style", s.id)}
                                            className={`relative p-4 rounded-xl border-2 text-center transition-all ${selected ? "border-blue bg-blue-light" : "border-border bg-white hover:border-blue/30"
                                                }`}
                                        >
                                            {selected && <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 rounded-full bg-gold" />}
                                            <p className={`font-bold text-sm ${selected ? "text-blue" : "text-dark"}`}>{s.label}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TONE */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-gold" />
                                <h3 className="font-bold text-dark text-lg">Communication Tone</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {TONES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => updateField("tone", t.id)}
                                        className={`px-5 py-2.5 rounded-full border text-sm font-bold transition-all ${persona.tone === t.id ? "border-blue bg-blue text-white" : "border-border bg-white text-text-secondary hover:border-text-muted"
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* TEXT AREAS */}
                        {[
                            { id: "teaching_philosophy", label: "Teaching Philosophy", desc: "e.g. 'I want students to understand the WHY before the HOW.'" },
                            { id: "key_emphasis", label: "Key Emphasis", desc: "What should your AI always highlight or connect back to?" },
                            { id: "restrictions", label: "Boundaries & Restrictions", desc: "What should your AI never do?" }
                        ].map((field) => (
                            <div key={field.id} className="bg-white rounded-2xl shadow-sm border border-border p-8">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-gold" />
                                    <h3 className="font-bold text-dark text-lg">{field.label}</h3>
                                </div>
                                <p className="text-text-secondary text-sm mb-4">{field.desc}</p>
                                <textarea
                                    value={(persona as any)[field.id] || ""}
                                    onChange={(e) => updateField(field.id, e.target.value)}
                                    className="w-full bg-bg border-none rounded-xl p-4 text-dark focus:ring-2 focus:ring-blue focus:outline-none min-h-[120px] resize-y"
                                    placeholder="Type here..."
                                />
                            </div>
                        ))}

                        {/* EXAMPLES */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-gold" />
                                    <h3 className="font-bold text-dark text-lg">Example Q&A</h3>
                                </div>
                                <button onClick={addExample} className="text-blue font-bold text-sm bg-blue-light hover:bg-[#CCE2F2] px-3 py-1.5 rounded-md transition-colors">
                                    + Add Pair
                                </button>
                            </div>

                            <div className="space-y-4">
                                {(persona.example_qa || []).map((ex, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-border border-l-2 border-l-gold p-6 relative animate-in slide-in-from-bottom-2 duration-300">
                                        <button onClick={() => removeExample(i)} className="absolute top-4 right-4 text-text-muted hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <span className="font-bold text-gold mt-1">Q:</span>
                                                <input
                                                    value={ex.question}
                                                    onChange={(e) => updateExample(i, "question", e.target.value)}
                                                    placeholder="Student's question"
                                                    className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue"
                                                />
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <span className="font-bold text-blue mt-1">A:</span>
                                                <textarea
                                                    value={ex.answer}
                                                    onChange={(e) => updateExample(i, "answer", e.target.value)}
                                                    placeholder="Your ideal response"
                                                    className="flex-1 bg-bg border border-border rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:border-blue"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* STICKY SAVE BAR */}
                <div className="fixed bottom-0 right-0 left-64 bg-white border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] py-4 px-12 z-50">
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <div className="text-text-secondary text-sm font-medium">
                            {saved ? <span className="text-[#10B981]">All saved ✓</span> : <span>Unsaved changes</span>}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-blue hover:bg-[#004080] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-sm"
                        >
                            {saving ? "Saving..." : "Save & Train MiniProfessorAI"}
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
}