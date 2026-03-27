import { create } from "zustand";

interface User {
    id: string;
    name: string;
    role: "professor" | "student";
    email?: string;
}

interface AuthStore {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
    loadFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    token: null,
    setAuth: (user, token) => {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        set({ user, token });
    },
    logout: () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        set({ user: null, token: null });
    },
    loadFromStorage: () => {
        const token = sessionStorage.getItem("token");
        const userStr = sessionStorage.getItem("user");
        if (token && userStr) {
            set({ token, user: JSON.parse(userStr) });
        }
    },
}));