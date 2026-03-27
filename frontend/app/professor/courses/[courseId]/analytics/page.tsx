"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCourseAnalytics } from "@/lib/api";
import { AppSidebar } from "@/components/AppSidebar";
import { StatCard } from "@/components/StatCard";
import { ArrowLeft, Users, MessageSquare, TrendingUp, HelpCircle } from "lucide-react";

export default function AnalyticsPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCourseAnalytics(courseId)
            .then(setData)
            .finally(() => setLoading(false));
    }, [courseId]);

    if (!data && !loading) return null;

    return (
        <div className="flex h-screen overflow-hidden bg-bg font-sans">
            <AppSidebar />

            <main className="flex-1 ml-64 overflow-y-auto">
                {/* HERO */}
                <div className="bg-dark pt-12 pb-14 px-12 relative overflow-hidden">
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: "radial-gradient(rgba(255,206,0,0.15) 1px, transparent 1px)",
                            backgroundSize: "20px 20px"
                        }}
                    />
                    <div className="max-w-5xl relative z-10">
                        <button onClick={() => router.back()} className="flex items-center gap-2 text-white/60 hover:text-white mb-6 uppercase tracking-wider text-[11px] font-bold transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Course
                        </button>
                        <h1 className="text-white text-[32px] md:text-[40px] font-[800] tracking-tight leading-tight mb-2">
                            Student Analytics
                        </h1>
                        <p className="text-white/70">What your students are confused about</p>
                    </div>
                </div>

                <div className="max-w-5xl px-12 py-10 -mt-8 relative z-20 space-y-8">
                    {/* STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Students" value={data?.stats?.total_students || 0} icon={Users} variant="blue" />
                        <StatCard title="Active Students" value={data?.stats?.active_students || 0} icon={TrendingUp} variant="gold" />
                        <StatCard title="Questions Asked" value={data?.stats?.total_questions || 0} icon={MessageSquare} variant="blue" />
                        <StatCard title="Engagement Rate" value={`${data?.stats?.engagement_rate || 0}%`} icon={HelpCircle} variant="gold" />
                    </div>

                    {/* SENTIMENT */}
                    {data?.analysis?.sentiment && (
                        <div className={`p-4 rounded-xl border-l-[4px] flex items-center gap-4 bg-white shadow-sm ${data.analysis.sentiment === 'positive' ? 'border-l-gold bg-gold-light/30' :
                                data.analysis.sentiment === 'confused' ? 'border-l-red-500 bg-red-50' :
                                    'border-l-blue bg-blue-light/50'
                            }`}>
                            <span className="text-3xl">
                                {data.analysis.sentiment === 'positive' ? '😊' : data.analysis.sentiment === 'confused' ? '😕' : '😐'}
                            </span>
                            <div>
                                <h3 className="font-bold text-dark text-lg capitalize">{data.analysis.sentiment} Overall Sentiment</h3>
                                <p className="text-text-secondary text-sm">Based on recent student conversations with your AI clone.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* TOP TOPICS */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
                            <h3 className="font-bold text-dark text-xl mb-6">Most Asked Topics</h3>
                            <div className="space-y-5">
                                {(data?.analysis?.top_topics || []).map((topic: any, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-2 font-bold text-dark">
                                            <span>{topic.topic}</span>
                                            <span className="text-blue">{topic.count} questions</span>
                                        </div>
                                        <div className="h-2.5 bg-blue-light rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue rounded-full"
                                                style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* CONFUSION AREAS */}
                        <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
                            <h3 className="font-bold text-dark text-xl mb-6">Confusion Areas</h3>
                            <div className="space-y-3">
                                {(data?.analysis?.confusion_areas || []).map((area: any, i: number) => {
                                    const severityStyle = area.severity === 'high'
                                        ? "border-l-[4px] border-l-[#DC2626] bg-[#FEF2F2]"
                                        : area.severity === 'medium'
                                            ? "border-l-[4px] border-l-gold bg-gold-light/30"
                                            : "border-l-[4px] border-l-blue bg-blue-light";

                                    return (
                                        <div key={i} className={`p-4 rounded-xl border border-border ${severityStyle}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="font-bold text-dark">{area.area}</p>
                                                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${area.severity === 'high' ? 'bg-[#FECACA] text-[#991B1B]' :
                                                        area.severity === 'medium' ? 'bg-gold text-dark' : 'bg-blue text-white'
                                                    }`}>
                                                    {area.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm text-text-secondary italic line-clamp-2">"{area.sample_question}"</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* AI SUGGESTIONS */}
                    {(data?.analysis?.suggested_additions?.length > 0) && (
                        <div className="bg-dark rounded-2xl p-8 text-white relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 text-gold opacity-10">
                                <HelpCircle className="w-40 h-40" />
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold">💡</div>
                                <h3 className="font-bold text-xl">AI Suggestions For You</h3>
                            </div>
                            <div className="space-y-3 relative z-10">
                                {data.analysis.suggested_additions.map((suggestion: string, i: number) => (
                                    <div key={i} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl items-start">
                                        <div className="w-6 h-6 rounded-full bg-gold text-dark flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                                            {i + 1}
                                        </div>
                                        <p className="text-white/90 text-sm leading-relaxed">{suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RECENT FEED */}
                    <div className="pb-10">
                        <h3 className="font-bold text-dark text-xl mb-6">Recent Questions</h3>
                        <div className="relative pl-6 space-y-6">
                            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border z-0" />
                            {(data?.recent_questions || []).map((q: any, i: number) => (
                                <div key={i} className="relative z-10">
                                    <div className="absolute -left-6 w-3 h-3 rounded-full bg-gold border-[3px] border-bg mt-1.5" />
                                    <div className="bg-white border border-border p-4 rounded-xl shadow-sm inline-block max-w-2xl">
                                        <p className="text-dark font-medium mb-1">{q.question}</p>
                                        <p className="text-text-muted text-xs">
                                            {new Date(q.asked_at).toLocaleDateString()} at {new Date(q.asked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}