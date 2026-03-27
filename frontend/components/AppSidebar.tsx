"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Home, BookOpen, User, Settings, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export function AppSidebar() {
  const router = useRouter();
  const { user, loadFromStorage, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadFromStorage();
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const name = user?.name || "Professor";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-dark flex flex-col z-50">
      {/* Top section (72px) */}
      <div className="h-[72px] px-6 flex items-center gap-3 border-b-[2px] border-gold">
        <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center shadow-md">
          <GraduationCap className="w-5 h-5 text-dark" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg tracking-tight text-white">
          Mini<span className="text-gold">Professor</span>AI
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {[
          { icon: Home, label: "Dashboard", href: "/professor/courses" },
          { icon: BookOpen, label: "My Courses", href: "/professor/courses" },
          { icon: Settings, label: "Settings", href: "#", disabled: true },
        ].map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className={`flex items-center gap-3 px-3 h-12 rounded-md transition-all duration-150 ${i === 0
                ? "text-white bg-blue/20 border-l-[3px] border-gold"
                : "text-white/60 hover:text-white hover:bg-white/5 hover:border-l-[2px] border-gold border-l-0"
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-white/10 flex items-center gap-3">
        {mounted && (
            <>
                <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center font-bold text-dark flex-shrink-0">
                {initials}
                </div>
                <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{name}</p>
                <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[11px] font-bold bg-blue-light text-blue uppercase">
                    Professor
                </span>
                </div>
            </>
        )}
        <button onClick={handleLogout} className="p-2 text-white/60 hover:text-white rounded-md hover:bg-white/5 transition-colors absolute right-4">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
