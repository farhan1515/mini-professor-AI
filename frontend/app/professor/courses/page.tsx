"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyCourses, Course } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, BookOpen, Settings, LogOut, ChevronRight } from "lucide-react";

export default function ProfessorCoursesPage() {
    const router = useRouter();
    const { user, logout, loadFromStorage } = useAuthStore();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFromStorage();
    }, []);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        getMyCourses().then(setCourses).finally(() => setLoading(false));
    }, [user]);

    const handleLogout = () => { logout(); router.push("/login"); };

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Navbar */}
            <nav className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-lg">Mini Professor</span>
                    <Badge className="bg-violet-900 text-violet-300 text-xs">Professor</Badge>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm">{user?.name}</span>
                    <Button onClick={handleLogout} variant="ghost" size="sm" className="text-slate-400">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold">My Courses</h1>
                        <p className="text-slate-400 mt-1">Create courses and train your personal AI teaching assistant</p>
                    </div>
                    <Button onClick={() => router.push("/professor/courses/new")} className="bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4 mr-2" /> New Course
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading...</div>
                ) : courses.length === 0 ? (
                    <Card className="p-12 bg-slate-900 border-slate-800 text-center">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-violet-400 opacity-40" />
                        <p className="text-lg font-medium text-white">No courses yet</p>
                        <p className="text-slate-400 text-sm mt-2 mb-6">Create your first course and train your Mini Professor</p>
                        <Button onClick={() => router.push("/professor/courses/new")} className="bg-violet-600 hover:bg-violet-700">
                            <Plus className="w-4 h-4 mr-2" /> Create First Course
                        </Button>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {courses.map((course) => (
                            <Card key={course.id} className="p-6 bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                                onClick={() => router.push(`/professor/courses/${course.id}`)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center">
                                            <BookOpen className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white text-lg">{course.name}</h3>
                                            <p className="text-slate-400 text-sm">{course.subject || "No subject"} • {course.description || "No description"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={course.is_published ? "bg-green-900 text-green-300" : "bg-slate-700 text-slate-300"}>
                                            {course.is_published ? "Published" : "Draft"}
                                        </Badge>
                                        <ChevronRight className="w-5 h-5 text-slate-500" />
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