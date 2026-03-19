"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getEnrolledCourses, Course } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, BookOpen, Plus, LogOut, GraduationCap } from "lucide-react";

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
        <div className="min-h-screen bg-slate-950 text-white">
            <nav className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center"><Bot className="w-4 h-4" /></div>
                    <span className="font-bold text-lg">Mini Professor</span>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => router.push("/student/browse")} variant="ghost" size="sm" className="text-slate-300">
                        <Plus className="w-4 h-4 mr-2" /> Browse Courses
                    </Button>
                    <span className="text-slate-400 text-sm">{user?.name}</span>
                    <Button onClick={() => { logout(); router.push("/login"); }} variant="ghost" size="sm" className="text-slate-400">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold mb-2">My Courses</h1>
                <p className="text-slate-400 mb-8">Your enrolled courses with AI teaching assistants</p>

                {courses.length === 0 ? (
                    <Card className="p-12 bg-slate-900 border-slate-800 text-center">
                        <GraduationCap className="w-12 h-12 mx-auto mb-4 text-violet-400 opacity-40" />
                        <p className="text-lg font-medium text-white">No courses yet</p>
                        <p className="text-slate-400 text-sm mt-2 mb-6">Browse and enroll in courses to start learning</p>
                        <Button onClick={() => router.push("/student/browse")} className="bg-violet-600 hover:bg-violet-700">
                            Browse Courses
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {courses.map((course) => (
                            <Card key={course.id} onClick={() => router.push(`/student/learn/${course.id}`)}
                                className="p-6 bg-slate-900 border-slate-800 hover:border-violet-700 transition-all cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">{course.name}</h3>
                                        <p className="text-violet-400 text-sm">Prof. {course.professor_name}</p>
                                        <p className="text-slate-500 text-xs mt-1">{course.subject}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}