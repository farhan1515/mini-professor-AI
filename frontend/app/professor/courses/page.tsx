"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyCourses, Course } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { AppSidebar } from "@/components/AppSidebar";
import { CourseCard } from "@/components/CourseCard";
import { SectionEyebrow } from "@/components/SectionEyebrow";

export default function ProfessorCoursesPage() {
    const router = useRouter();
    const { user, loadFromStorage } = useAuthStore();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFromStorage();
    }, []);

    useEffect(() => {
        if (!user) { router.push("/login"); return; }
        getMyCourses().then(setCourses).finally(() => setLoading(false));
    }, [user]);

    return (
        <div className="flex h-screen overflow-hidden bg-bg font-sans">
            <AppSidebar />

            <main className="flex-1 ml-64 overflow-y-auto">
                {/* Header Banner */}
                <div className="bg-white border-l-[4px] border-l-gold py-10 px-12 border-b border-border">
                    <div className="max-w-5xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-[28px] font-[800] text-dark tracking-tight mb-1">
                                Good morning, Prof. {user?.name?.split(' ')[0] || "Professor"}
                            </h1>
                            <p className="text-text-secondary font-medium">
                                University of Windsor • Dashboard
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/professor/courses/new")}
                            className="bg-blue hover:bg-[#004080] text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm w-max"
                        >
                            New Course
                        </button>
                    </div>
                </div>

                <div className="max-w-5xl px-12 py-10">
                    <SectionEyebrow label="YOUR COURSES" heading="My Teaching Dashboard" />

                    {loading ? (
                        <div className="text-center py-20 text-text-muted font-medium animate-pulse">
                            Loading your courses...
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="max-w-md bg-white border border-border rounded-2xl p-10 text-center mx-auto mt-12 shadow-sm">
                            <svg className="w-24 h-24 mx-auto mb-6 opacity-30 text-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                            </svg>
                            <h3 className="text-xl font-bold text-dark mb-2">No courses yet</h3>
                            <p className="text-text-secondary text-sm mb-8">
                                Create your first course and train your MiniProfessorAI in minutes
                            </p>
                            <button
                                onClick={() => router.push("/professor/courses/new")}
                                className="w-full bg-blue hover:bg-[#004080] text-white py-3 rounded-xl font-bold transition-all"
                            >
                                Create Course
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    id={course.id}
                                    name={course.name}
                                    professor={course.professor_name || user?.name || ""}
                                    subject={(course.subject as any) || "Engineering"}
                                    studentsCount={0}
                                    docsCount={0}
                                    isPublished={course.is_published ?? false}
                                    role="professor"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}