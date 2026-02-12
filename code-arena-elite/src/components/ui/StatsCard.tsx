import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  glowColor?: "blue" | "purple" | "green" | "orange";
}

const glowClasses = {
  blue: "hover:shadow-glow-blue",
  purple: "hover:shadow-glow-purple",
  green: "hover:shadow-glow-green",
  orange: "before:from-neon-orange/10",
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  className,
  glowColor = "blue",
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "glass-card p-6 transition-all duration-300 hover:-translate-y-1",
        glowClasses[glowColor],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-neon-green" : "text-neon-red"
                )}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-muted-foreground">vs last week</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-primary/10 text-primary">{icon}</div>
      </div>
    </div>
  );
}
