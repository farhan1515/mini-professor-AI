"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEnrolledCourses, Course } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Bot, BookOpen, Plus, LogOut, GraduationCap, ArrowRight } from "lucide-react";

export default function MyCoursesPage() {
    const router = useRouter();
    const { user, logout, loadFromStorage } = useAuthStore();
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => { loadFromStorage(); }, []);
    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        getEnrolledCourses().then(setCourses);
    }, [user]);

    return (
        <div className="min-h-screen bg-bg text-dark font-sans flex flex-col">
            {/* UWindsor Blue Navbar */}
            <nav className="bg-blue text-white px-6 py-4 flex items-center justify-between shadow-md relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-md">
                        <GraduationCap className="w-6 h-6 text-dark" strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold tracking-tight text-lg">Mini<span className="text-gold">Professor</span>AI</span>
                            <span className="bg-gold text-dark text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm">Student</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={() => router.push("/student/browse")} className="flex items-center text-white/80 hover:text-white text-sm font-bold transition-colors">
                        <Plus className="w-4 h-4 mr-1.5" /> Browse Courses
                    </button>
                    <div className="h-4 w-px bg-white/20" />
                    <span className="text-white/90 text-sm font-medium">{user?.name}</span>
                    <button onClick={() => { logout(); router.push("/login"); }} className="text-white/80 hover:text-white transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-[800] tracking-tight text-dark mb-4">My Dashboard</h1>
                        <p className="text-text-secondary text-lg">Continue learning with your personalized AI professors.</p>
                    </div>
                    <button onClick={() => router.push("/student/browse")} className="bg-blue hover:bg-[#004080] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center">
                        <Plus className="w-4 h-4 mr-2" /> Find more courses
                    </button>
                </div>

                {courses.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-border shadow-sm">
                        <GraduationCap className="w-20 h-20 mx-auto mb-6 text-blue opacity-20" />
                        <h2 className="text-2xl font-bold text-dark mb-3">No courses yet</h2>
                        <p className="text-text-secondary mb-8 max-w-md mx-auto">You haven't enrolled in any courses. Browse the course catalog to find your professor's AI assistant.</p>
                        <button onClick={() => router.push("/student/browse")} className="bg-blue hover:bg-[#004080] text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition-all text-lg">
                            Explore Courses
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <button
                                key={course.id}
                                onClick={() => router.push(`/student/learn/${course.id}`)}
                                className="group bg-white rounded-2xl p-6 border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,85,150,0.08)] hover:border-blue/50 transition-all text-left flex flex-col relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-gold transition-colors" />

                                <div className="mb-4 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-light group-hover:bg-blue group-hover:text-white transition-colors rounded-2xl flex items-center justify-center text-blue shadow-sm">
                                            <Bot className="w-6 h-6" />
                                        </div>
                                        {course.subject && (
                                            <span className="bg-bg text-text-secondary text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border">
                                                {course.subject}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-dark text-lg leading-tight mb-2 group-hover:text-blue transition-colors">{course.name}</h3>
                                    <p className="text-text-secondary font-medium text-sm">Prof. {course.professor_name}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-blue font-bold text-sm">
                                    <span>Continue learning</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}