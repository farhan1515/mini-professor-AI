import { Users, FileText } from "lucide-react";
import Link from "next/link";

interface CourseCardProps {
  id: string;
  name: string;
  professor: string;
  subject: "Engineering" | "Science" | "Business" | "Arts" | "CS/Computing";
  studentsCount: number;
  docsCount: number;
  isPublished: boolean;
  role?: "professor" | "student";
}

const subjectColors = {
  Engineering: "bg-blue",
  Science: "bg-[#0077B6]",
  Business: "bg-[#B8941A]",
  Arts: "bg-gray-500",
  "CS/Computing": "bg-blue",
};

export function CourseCard({
  id,
  name,
  professor,
  subject,
  studentsCount,
  docsCount,
  isPublished,
  role = "professor"
}: CourseCardProps) {
  return (
    <Link
      href={role === 'professor' ? `/professor/courses/${id}` : `/student/learn/${id}`}
      className="block relative bg-white border border-border rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden group"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 ${subjectColors[subject]} transition-opacity`} />

      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <span className="inline-block px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-blue-light text-blue mb-3">
            {subject}
          </span>
          {role === 'professor' && (
            <span className={`px-2 py-0.5 text-xs font-bold rounded ${isPublished ? "bg-gold text-dark" : "bg-gray-100 text-grey"
              }`}>
              {isPublished ? "PUBLISHED" : "DRAFT"}
            </span>
          )}
        </div>
        <h3 className="text-[18px] font-bold text-dark leading-tight mb-1 group-hover:text-blue transition-colors">
          {name}
        </h3>
        <p className="text-[14px] font-medium text-blue">
          Prof. {professor}
        </p>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-border mt-auto">
        <div className="flex items-center gap-1.5 text-grey text-sm font-medium">
          <Users className="w-4 h-4" />
          {studentsCount}
        </div>
        <div className="flex items-center gap-1.5 text-grey text-sm font-medium">
          <FileText className="w-4 h-4" />
          {docsCount}
        </div>
      </div>
    </Link>
  );
}
