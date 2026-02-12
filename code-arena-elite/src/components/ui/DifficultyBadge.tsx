import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  difficulty: "easy" | "medium" | "hard";
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const badgeClasses = {
    easy: "badge-easy",
    medium: "badge-medium",
    hard: "badge-hard",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        badgeClasses[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
}
