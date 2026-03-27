"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browseCourses, enrollInCourse, getEnrolledCourses, Course } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Bot, BookOpen, GraduationCap, LogOut, Search } from "lucide-react";

export default function BrowsePage() {
    const router = useRouter();
    const { user, logout, loadFromStorage } = useAuthStore();
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolled, setEnrolled] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [enrolling, setEnrolling] = useState<string | null>(null);

    useEffect(() => { loadFromStorage(); }, []);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        browseCourses().then(setCourses);
        getEnrolledCourses().then((c) => setEnrolled(c.map((x) => x.id)));
    }, [user]);

    const handleEnroll = async (courseId: string) => {
        setEnrolling(courseId);
        try {
            await enrollInCourse(courseId);
            setEnrolled([...enrolled, courseId]);
        } catch { }
        setEnrolling(null);
    };

    const filtered = courses.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.professor_name.toLowerCase().includes(search.toLowerCase())
    );

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
                    <button onClick={() => router.push("/student/learn")} className="flex items-center text-white/80 hover:text-white text-sm font-bold transition-colors">
                        <GraduationCap className="w-4 h-4 mr-2" /> My Courses
                    </button>
                    <div className="h-4 w-px bg-white/20" />
                    <span className="text-white/90 text-sm font-medium">{user?.name}</span>
                    <button onClick={() => { logout(); router.push("/login"); }} className="text-white/80 hover:text-white transition-colors">
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-[800] tracking-tight text-dark mb-4">Browse Courses</h1>
                    <p className="text-text-secondary text-lg max-w-2xl mx-auto">Find your professor's AI teaching assistant and get personalized help anchored in their exact course materials.</p>
                </div>

                <div className="relative mb-10 max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-text-muted" />
                    </div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by course name or professor..."
                        className="w-full bg-white border-2 border-border focus:border-blue rounded-2xl py-4 pl-12 pr-4 text-dark font-medium outline-none shadow-sm transition-all"
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-3xl border border-border border-dashed">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-50" />
                        <h3 className="text-xl font-bold text-dark mb-2">No courses available yet</h3>
                        <p className="text-text-secondary">Check back later once professors publish their courses.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((course) => (
                            <div key={course.id} className="bg-white rounded-2xl p-6 border border-border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,85,150,0.08)] transition-all flex flex-col">
                                <div className="mb-4 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-light rounded-2xl flex items-center justify-center text-blue">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        {course.subject && (
                                            <span className="bg-bg text-text-secondary text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border">
                                                {course.subject}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-dark text-lg leading-tight mb-2">{course.name}</h3>
                                    <p className="text-blue font-semibold text-sm mb-3">Prof. {course.professor_name}</p>
                                    {course.description && <p className="text-text-secondary text-sm line-clamp-2">{course.description}</p>}
                                </div>
                                <div className="mt-auto pt-4 border-t border-border">
                                    {enrolled.includes(course.id) ? (
                                        <button onClick={() => router.push(`/student/learn/${course.id}`)} className="w-full bg-blue hover:bg-[#004080] text-white py-3 rounded-xl font-bold transition-all text-sm">
                                            Go to Course →
                                        </button>
                                    ) : (
                                        <button onClick={() => handleEnroll(course.id)} disabled={enrolling === course.id} className="w-full bg-white border-2 border-blue text-blue hover:bg-blue hover:text-white py-3 rounded-xl font-bold transition-all text-sm">
                                            {enrolling === course.id ? "Enrolling..." : "+ Enroll Now"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}