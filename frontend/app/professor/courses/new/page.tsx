"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCourse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

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
        <div className="min-h-screen bg-slate-950 text-white p-6">
            <div className="max-w-xl mx-auto">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <h1 className="text-2xl font-bold mb-2">Create New Course</h1>
                <p className="text-slate-400 mb-8">After creating, you'll upload materials and train your Mini Professor.</p>

                <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">Course Name *</label>
                        <Input placeholder="e.g. Advanced Software Engineering" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-11" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">Subject</label>
                        <Input placeholder="e.g. Computer Science, Mathematics" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="bg-slate-800 border-slate-700 text-white h-11" />
                    </div>
                    <div>
                        <label className="text-sm text-slate-400 mb-1 block">Description</label>
                        <Textarea placeholder="What will students learn?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white resize-none" rows={3} />
                    </div>
                    <Button onClick={handleCreate} disabled={loading || !form.name} className="w-full bg-violet-600 hover:bg-violet-700 h-11">
                        {loading ? "Creating..." : "Create Course →"}
                    </Button>
                </Card>
            </div>
        </div>
    );
}