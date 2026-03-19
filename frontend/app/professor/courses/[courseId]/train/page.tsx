"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPersona, savePersona, Persona } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Plus, Trash2, CheckCircle } from "lucide-react";

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
        } catch { alert("Failed to save"); }
        setSaving(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Course
                </button>

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Brain className="w-6 h-6 text-violet-400" />
                        <h1 className="text-2xl font-bold">Train Your Mini Professor</h1>
                    </div>
                    <p className="text-slate-400">This is what makes your AI unique. Every answer students get will reflect your teaching style and guidelines.</p>
                </div>

                <div className="space-y-6">

                    {/* Teaching Style */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <h2 className="font-semibold text-white mb-1">Teaching Style</h2>
                        <p className="text-slate-400 text-sm mb-4">How should your AI approach student questions?</p>
                        <div className="grid grid-cols-5 gap-2">
                            {STYLES.map((s) => (
                                <button key={s.id} onClick={() => updateField("teaching_style", s.id)}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${persona.teaching_style === s.id ? "border-violet-500 bg-violet-600/20" : "border-slate-700 hover:border-slate-600"}`}>
                                    <p className="text-sm font-medium text-white">{s.label}</p>
                                    <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Tone */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <h2 className="font-semibold text-white mb-1">Communication Tone</h2>
                        <p className="text-slate-400 text-sm mb-4">How should your AI sound when talking to students?</p>
                        <div className="flex gap-2">
                            {TONES.map((t) => (
                                <button key={t.id} onClick={() => updateField("tone", t.id)}
                                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${persona.tone === t.id ? "border-violet-500 bg-violet-600/20 text-white" : "border-slate-700 text-slate-400 hover:border-slate-600"}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* Teaching Philosophy */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <h2 className="font-semibold text-white mb-1">Your Teaching Philosophy</h2>
                        <p className="text-slate-400 text-sm mb-3">In your own words — how do you teach? What's your approach?</p>
                        <Textarea
                            placeholder='e.g. "I always connect theory to real-world examples. I want students to understand the WHY before the HOW. I encourage questions and never make students feel stupid for asking."'
                            value={persona.teaching_philosophy}
                            onChange={(e) => updateField("teaching_philosophy", e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white resize-none"
                            rows={4}
                        />
                    </Card>

                    {/* Key Emphasis */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <h2 className="font-semibold text-white mb-1">What to Always Emphasize</h2>
                        <p className="text-slate-400 text-sm mb-3">What should your AI always highlight or connect back to?</p>
                        <Textarea
                            placeholder='e.g. "Always mention time complexity in algorithms questions. Always relate back to the exam topics covered in Week 3-7. Always remind students to test edge cases."'
                            value={persona.key_emphasis}
                            onChange={(e) => updateField("key_emphasis", e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white resize-none"
                            rows={3}
                        />
                    </Card>

                    {/* Restrictions */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <h2 className="font-semibold text-white mb-1">Boundaries & Restrictions</h2>
                        <p className="text-slate-400 text-sm mb-3">What should your AI never do? Academic integrity rules?</p>
                        <Textarea
                            placeholder='e.g. "Never solve assignments directly — guide students to the answer. Never reveal exam questions. If students ask for code solutions, give pseudocode only."'
                            value={persona.restrictions}
                            onChange={(e) => updateField("restrictions", e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white resize-none"
                            rows={3}
                        />
                    </Card>

                    {/* Greeting */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <h2 className="font-semibold text-white mb-1">Custom Greeting Message</h2>
                        <p className="text-slate-400 text-sm mb-3">What do students see when they first open your course?</p>
                        <Textarea
                            placeholder="e.g. Hi! I'm Prof. Smith's AI assistant for COMP 3540. I'm here to help you understand concepts deeply — not just get answers. Ask me anything!"
                            value={persona.greeting_message}
                            onChange={(e) => updateField("greeting_message", e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white resize-none"
                            rows={3}
                        />
                    </Card>

                    {/* Example Q&A */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="font-semibold text-white">Example Q&A Pairs</h2>
                            <Button onClick={addExample} size="sm" variant="outline" className="border-slate-600 text-slate-300">
                                <Plus className="w-3 h-3 mr-1" /> Add Example
                            </Button>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">Show your AI exactly how YOU would answer specific questions. This is the most powerful training tool.</p>
                        {(persona.example_qa || []).length === 0 ? (
                            <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-xl">
                                <p className="text-slate-500 text-sm">Add example Q&A pairs to deeply shape your AI's responses</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {(persona.example_qa || []).map((ex, i) => (
                                    <div key={i} className="bg-slate-800 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-violet-400 font-medium uppercase">Example {i + 1}</span>
                                            <button onClick={() => removeExample(i)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Student asks:</label>
                                            <Input value={ex.question} onChange={(e) => updateExample(i, "question", e.target.value)}
                                                placeholder="What is the difference between TCP and UDP?" className="bg-slate-700 border-slate-600 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">How YOU would answer:</label>
                                            <Textarea value={ex.answer} onChange={(e) => updateExample(i, "answer", e.target.value)}
                                                placeholder="Great question! Think of TCP as a registered mail service and UDP as dropping a letter in a mailbox..."
                                                className="bg-slate-700 border-slate-600 text-white resize-none" rows={3} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Save */}
                    <Button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700 h-12 text-base font-medium">
                        <Brain className="w-4 h-4 mr-2" />
                        {saving ? "Saving..." : saved ? "✅ Saved!" : "Save & Train Mini Professor"}
                    </Button>

                    {saved && (
                        <div className="flex items-center gap-2 bg-green-950 border border-green-800 rounded-xl p-4">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <p className="text-green-300 text-sm">Your Mini Professor has been trained! Students will now get answers in your style.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}