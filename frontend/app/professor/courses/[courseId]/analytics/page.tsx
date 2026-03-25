"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCourseAnalytics } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Users, MessageSquare, FileText, TrendingUp,
    AlertTriangle, Lightbulb, ArrowLeft, RefreshCw,
    BarChart3, Brain, Clock
} from "lucide-react";

interface Analytics {
    stats: {
        total_students: number;
        active_students: number;
        total_questions: number;
        total_answers: number;
        total_documents: number;
        engagement_rate: number;
    };
    analysis: {
        top_topics: { topic: string; count: number; percentage: number }[];
        confusion_areas: { area: string; severity: string; sample_question: string }[];
        suggested_additions: string[];
        sentiment: string;
    };
    recent_questions: { question: string; asked_at: string }[];
}

const severityColor = {
    high: "bg-red-900 border-red-700 text-red-300",
    medium: "bg-yellow-900 border-yellow-700 text-yellow-300",
    low: "bg-blue-900 border-blue-700 text-blue-300",
};

export default function AnalyticsPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const router = useRouter();
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const result = await getCourseAnalytics(courseId);
            setData(result);
        } catch { alert("Failed to load analytics"); }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => { load(); }, [courseId]);

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-center text-slate-400">
                <Brain className="w-12 h-12 mx-auto mb-4 text-violet-400 animate-pulse" />
                <p>Analyzing student activity...</p>
            </div>
        </div>
    );

    if (!data) return null;

    const { stats, analysis, recent_questions } = data;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <div className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-xl flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-violet-400" />
                            Student Analytics
                        </h1>
                        <p className="text-slate-400 text-sm">What your students are struggling with</p>
                    </div>
                </div>
                <Button onClick={() => load(true)} disabled={refreshing} variant="outline" size="sm" className="border-slate-600 text-black">
                    <RefreshCw className={`w-4 h-4 text-black mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Enrolled Students", value: stats.total_students, icon: Users, color: "text-blue-400", bg: "bg-blue-950" },
                        { label: "Active Students", value: stats.active_students, icon: TrendingUp, color: "text-green-400", bg: "bg-green-950" },
                        { label: "Questions Asked", value: stats.total_questions, icon: MessageSquare, color: "text-violet-400", bg: "bg-violet-950" },
                        { label: "Engagement Rate", value: `${stats.engagement_rate}%`, icon: BarChart3, color: "text-orange-400", bg: "bg-orange-950" },
                    ].map((stat, i) => (
                        <Card key={i} className={`p-5 ${stat.bg} border-slate-800`}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-slate-400 text-sm">{stat.label}</p>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                        </Card>
                    ))}
                </div>

                {/* Sentiment Banner */}
                {analysis.sentiment && (
                    <div className={`rounded-xl p-4 border flex items-center gap-3 ${analysis.sentiment === "positive" ? "bg-green-950 border-green-800" :
                        analysis.sentiment === "confused" ? "bg-red-950 border-red-800" :
                            "bg-slate-800 border-slate-700"
                        }`}>
                        <span className="text-2xl">
                            {analysis.sentiment === "positive" ? "😊" :
                                analysis.sentiment === "confused" ? "😕" : "😐"}
                        </span>
                        <div>
                            <p className="font-medium text-white capitalize">Overall sentiment: {analysis.sentiment}</p>
                            <p className="text-slate-400 text-sm">
                                {analysis.sentiment === "positive" ? "Students seem to understand the material well." :
                                    analysis.sentiment === "confused" ? "Students are struggling — consider adding more explanations." :
                                        "Students are engaging but may need more clarity in some areas."}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Top Topics */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center gap-2 mb-5">
                            <BarChart3 className="w-5 h-5 text-violet-400" />
                            <h2 className="font-semibold text-lg text-white">Most Asked Topics</h2>
                        </div>
                        {analysis.top_topics?.length > 0 ? (
                            <div className="space-y-3">
                                {analysis.top_topics.map((topic, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-300">{topic.topic}</span>
                                            <span className="text-slate-400">{topic.count} questions</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-violet-600 rounded-full transition-all"
                                                style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-8">
                                No questions yet — share your course with students!
                            </p>
                        )}
                    </Card>

                    {/* Confusion Areas */}
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center gap-2 mb-5">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            <h2 className="font-semibold text-lg text-white">Confusion Areas</h2>
                        </div>
                        {analysis.confusion_areas?.length > 0 ? (
                            <div className="space-y-3">
                                {analysis.confusion_areas.map((area, i) => (
                                    <div key={i} className={`p-3 rounded-lg border ${severityColor[area.severity as keyof typeof severityColor] || severityColor.low}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-sm">{area.area}</p>
                                            <Badge className={`text-xs ${severityColor[area.severity as keyof typeof severityColor]}`}>
                                                {area.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-xs opacity-70 italic">"{area.sample_question}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 text-sm text-center py-8">
                                No confusion areas detected yet
                            </p>
                        )}
                    </Card>
                </div>

                {/* AI Suggestions for Professor */}
                {analysis.suggested_additions?.length > 0 && (
                    <Card className="p-6 bg-violet-950 border-violet-800">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-yellow-400" />
                            <h2 className="font-semibold text-lg text-white">AI Suggestions For You</h2>
                            <Badge className="bg-violet-900 text-violet-300 text-xs ml-1">Powered by Mini Professor</Badge>
                        </div>
                        <div className="space-y-3">
                            {analysis.suggested_additions.map((suggestion, i) => (
                                <div key={i} className="flex items-start gap-3 bg-violet-900/40 rounded-lg p-3">
                                    <span className="w-6 h-6 bg-yellow-500 text-black rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                                        {i + 1}
                                    </span>
                                    <p className="text-slate-200 text-sm leading-relaxed">{suggestion}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Recent Questions Feed */}
                <Card className="p-6 bg-slate-900 border-slate-800">
                    <div className="flex items-center gap-2 mb-5">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <h2 className="font-semibold text-lg text-white">Recent Student Questions</h2>
                    </div>
                    {recent_questions?.length > 0 ? (
                        <div className="space-y-2">
                            {recent_questions.map((q, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg">
                                    <MessageSquare className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-200 text-sm">{q.question}</p>
                                        <p className="text-slate-500 text-xs mt-1">
                                            {new Date(q.asked_at).toLocaleDateString("en-US", {
                                                month: "short", day: "numeric",
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm text-center py-8">
                            No questions yet. Publish your course so students can start learning!
                        </p>
                    )}
                </Card>

            </div>
        </div>
    );
}