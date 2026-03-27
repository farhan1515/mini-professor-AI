import axios from "axios";

// Strip any trailing slashes from the URL (e.g. if Vercel env var has one)
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_URL = RAW_API_URL.replace(/\/+$/, "");

export const api = axios.create({ baseURL: API_URL });

// Auto-attach token to every request
api.interceptors.request.use((config) => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Types ───────────────────────────────────────────────
export interface User {
    id: string;
    name: string;
    role: "professor" | "student";
    email: string;
}

export interface Course {
    id: string;
    name: string;
    description: string;
    subject: string;
    professor_name: string;
    is_published?: boolean;
    collection_name?: string;
}

export interface Document {
    id: string;
    filename: string;
    chunk_count: number;
    status: string;
}

export interface Persona {
    teaching_style: string;
    tone: string;
    teaching_philosophy: string;
    key_emphasis: string;
    sensitive_topics: string;
    restrictions: string;
    greeting_message: string;
    example_qa: { question: string; answer: string }[];
    voice_id?: string;
    voice_name?: string;
}

// ─── Auth ────────────────────────────────────────────────
export const register = async (name: string, email: string, password: string, role: string) => {
    const res = await api.post("/auth/register", { name, email, password, role });
    return res.data.data;
};

export const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data.data;
};

// ─── Courses ─────────────────────────────────────────────
export const createCourse = async (data: { name: string; description: string; subject: string }) => {
    const res = await api.post("/courses/", data);
    return res.data.data;
};

export const getMyCourses = async (): Promise<Course[]> => {
    const res = await api.get("/courses/my-courses");
    return res.data.data;
};

export const browseCourses = async (): Promise<Course[]> => {
    const res = await api.get("/courses/browse");
    return res.data.data;
};

export const enrollInCourse = async (courseId: string) => {
    const res = await api.post(`/courses/${courseId}/enroll`);
    return res.data.data;
};

export const getEnrolledCourses = async (): Promise<Course[]> => {
    const res = await api.get("/courses/enrolled");
    return res.data.data;
};

export const publishCourse = async (courseId: string) => {
    const res = await api.post(`/courses/${courseId}/publish`);
    return res.data.data;
};

export const uploadPDF = async (courseId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post(`/courses/${courseId}/upload`, formData);
    return res.data.data;
};

export const getDocuments = async (courseId: string): Promise<Document[]> => {
    const res = await api.get(`/courses/${courseId}/documents`);
    return res.data.data;
};

// ─── Persona ─────────────────────────────────────────────
export const getPersona = async (courseId: string): Promise<Persona | null> => {
    const res = await api.get(`/persona/${courseId}`);
    return res.data.data;
};

export const savePersona = async (courseId: string, persona: Partial<Persona>) => {
    const res = await api.post(`/persona/${courseId}`, persona);
    return res.data.data;
};

// ─── Chat ─────────────────────────────────────────────────
export const streamChat = (
    courseId: string,
    question: string,
    history: { role: string; content: string }[],
    onToken: (t: string) => void,
    onSources: (s: { filename: string; page: number }[]) => void,
    onDone: () => void
) => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId, question, history }),
    }).then((res) => {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        const read = () =>
            reader.read().then(({ done, value }) => {
                if (done) { onDone(); return; }
                decoder.decode(value).split("\n").filter((l) => l.startsWith("data: ")).forEach((line) => {
                    try {
                        const json = JSON.parse(line.replace("data: ", ""));
                        if (json.token) onToken(json.token);
                        if (json.sources) onSources(json.sources);
                        if (json.done) onDone();
                    } catch { }
                });
                read();
            });
        read();
    });
};

export const generateQuiz = async (courseId: string) => {
    const res = await api.post("/chat/quiz", { course_id: courseId, num_questions: 5 });
    return res.data.data.questions;
};

export const generateFlashcards = async (courseId: string) => {
    const res = await api.post("/chat/flashcards", { course_id: courseId, num_cards: 6 });
    return res.data.data.flashcards;
};

export const summarizeCourse = async (courseId: string) => {
    const res = await api.post("/chat/summarize", { course_id: courseId });
    return res.data.data;
};

export const getAssignmentHelp = async (courseId: string, assignmentText: string) => {
    const res = await api.post("/chat/assignment-help", { course_id: courseId, assignment_text: assignmentText });
    return res.data.data;
};

export const getChatHistory = async (courseId: string) => {
    const res = await api.get(`/chat/history/${courseId}`);
    return res.data.data;
};

export const clearChatHistory = async (courseId: string) => {
    await api.delete(`/chat/history/${courseId}`);
};

export const getVoiceStatus = async (courseId: string) => {
    const res = await api.get(`/voice/${courseId}/status`);
    return res.data.data;
};



export const speakText = async (courseId: string, text: string): Promise<Blob> => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    const res = await fetch(`${API_URL}/voice/speak`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course_id: courseId, text }),
    });
    if (!res.ok) throw new Error("TTS failed");
    return res.blob();
};

export const uploadVoiceSample = async (courseId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "voice_sample.mp3");
    const res = await api.post(`/voice/${courseId}/clone`, formData);
    return res.data.data;
};

export const getCourseAnalytics = async (courseId: string) => {
    const res = await api.get(`/analytics/${courseId}`);
    return res.data.data;
};