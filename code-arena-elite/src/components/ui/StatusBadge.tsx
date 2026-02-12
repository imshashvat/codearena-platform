import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

type Status = "accepted" | "wrong_answer" | "pending" | "runtime_error" | "time_limit";

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<Status, { label: string; icon: typeof CheckCircle; className: string }> = {
  accepted: {
    label: "Accepted",
    icon: CheckCircle,
    className: "text-neon-green bg-neon-green/10 border-neon-green/30",
  },
  wrong_answer: {
    label: "Wrong Answer",
    icon: XCircle,
    className: "text-neon-red bg-neon-red/10 border-neon-red/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "text-neon-orange bg-neon-orange/10 border-neon-orange/30",
  },
  runtime_error: {
    label: "Runtime Error",
    icon: AlertCircle,
    className: "text-neon-red bg-neon-red/10 border-neon-red/30",
  },
  time_limit: {
    label: "Time Limit",
    icon: Clock,
    className: "text-neon-orange bg-neon-orange/10 border-neon-orange/30",
  },
};

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
}
