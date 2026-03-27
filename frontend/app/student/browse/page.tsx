"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browseCourses, enrollInCourse, getEnrolledCourses, Course } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, BookOpen, GraduationCap, LogOut, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

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
        const toastId = toast.loading("Enrolling in course...");
        try {
            await enrollInCourse(courseId);
            setEnrolled([...enrolled, courseId]);
            toast.success("Enrolled successfully! Start learning now.", { id: toastId });
        } catch {
            toast.error("Enrollment failed. Please try again.", { id: toastId });
        }
        setEnrolling(null);
    };

    const filtered = courses.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.professor_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <nav className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center"><Bot className="w-4 h-4" /></div>
                    <span className="font-bold text-lg">Mini Professor</span>
                    <Badge className="bg-blue-900 text-blue-300 text-xs">Student</Badge>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => router.push("/student/learn")} variant="ghost" size="sm" className="text-slate-300">
                        <GraduationCap className="w-4 h-4 mr-2" /> My Courses
                    </Button>
                    <span className="text-slate-400 text-sm">{user?.name}</span>
                    <Button onClick={() => { logout(); router.push("/login"); }} variant="ghost" size="sm" className="text-slate-400">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Browse Courses</h1>
                    <p className="text-slate-400">Enroll in courses to learn with AI teaching assistants trained by your professors</p>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by course or professor..." className="bg-slate-900 border-slate-700 text-white pl-10 h-11" />
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No courses available yet</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {filtered.map((course) => (
                            <Card key={course.id} className="p-6 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-white">{course.name}</h3>
                                        <p className="text-violet-400 text-sm mt-0.5">Prof. {course.professor_name}</p>
                                        {course.subject && <Badge className="bg-slate-700 text-slate-300 text-xs mt-2">{course.subject}</Badge>}
                                        {course.description && <p className="text-slate-400 text-sm mt-2">{course.description}</p>}
                                    </div>
                                </div>
                                {enrolled.includes(course.id) ? (
                                    <Button onClick={() => router.push(`/student/learn/${course.id}`)} className="w-full bg-violet-600 hover:bg-violet-700">
                                        Open Course →
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleEnroll(course.id)} disabled={enrolling === course.id} variant="outline" className="w-full bg-transparent border-violet-600 text-violet-400 hover:bg-violet-600 hover:text-white transition-colors">
                                        {enrolling === course.id ? "Enrolling..." : "Enroll Free"}
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}