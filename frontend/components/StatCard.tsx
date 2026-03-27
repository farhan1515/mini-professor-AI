import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "blue" | "gold";
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "blue",
  trend,
  trendUp = true,
}: StatCardProps) {
  const isBlue = variant === "blue";
  const iconBg = isBlue ? "bg-blue-light" : "bg-gold-light";
  const iconColor = isBlue ? "text-blue" : "text-[#B8941A]";

  return (
    <div className="bg-white border border-border flex flex-col rounded-2xl p-6 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,85,150,0.08)] hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      <div>
        <h3 className="text-[36px] font-bold text-dark leading-none mb-2">{value}</h3>
        <p className="text-[13px] text-grey font-medium">{title}</p>
      </div>
      {trend && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <span className={`text-sm font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
