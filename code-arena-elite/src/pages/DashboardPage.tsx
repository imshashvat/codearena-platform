import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  Code2, Trophy, Target, TrendingUp, ChevronRight,
  Flame, Zap, Star, Award, Calendar, BarChart3,
  CheckCircle, Clock, GitCommit,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserStats {
  totalSolved: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  totalByDiff: { easy: number; medium: number; hard: number };
  totalProblems: number;
  languageBreakdown: Record<string, number>;
  streak: number;
  maxStreak: number;
  recentSubmissions: any[];
}

// ─── Activity Heatmap ─────────────────────────────────────────────────────────
function ActivityHeatmap({ data }: { data: Record<string, { total: number; accepted: number }> }) {
  const weeks = 52;
  const today = new Date();
  const cells: { date: string; count: number; accepted: number }[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: key, count: data[key]?.total || 0, accepted: data[key]?.accepted || 0 });
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/20 border-muted/10";
    if (count === 1) return "bg-cyan-900/60 border-cyan-700/40";
    if (count <= 3) return "bg-cyan-700/70 border-cyan-500/40";
    if (count <= 6) return "bg-cyan-500/80 border-cyan-400/60";
    return "bg-cyan-400 border-cyan-300/80 shadow-[0_0_6px_rgba(34,211,238,0.5)]";
  };

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Group into weeks (columns of 7)
  const weekCols: typeof cells[] = [];
  for (let w = 0; w < weeks; w++) {
    weekCols.push(cells.slice(w * 7, (w + 1) * 7));
  }

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <div className="relative">
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 pointer-events-none bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-xl"
          style={{ left: tooltip.x + 10, top: tooltip.y - 40 }}
        >
          {tooltip.text}
        </div>
      )}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 shrink-0">
          <div className="h-4" />
          {days.map((d, i) => (
            <div key={d} className={cn("h-3 text-[9px] text-muted-foreground/50 leading-3 w-6", i % 2 !== 0 && "opacity-0")}>
              {d}
            </div>
          ))}
        </div>
        {/* Heatmap grid */}
        <div className="flex gap-1">
          {weekCols.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {/* Month label every 4 weeks */}
              {wi % 4 === 0 ? (
                <div className="h-4 text-[9px] text-muted-foreground/50 leading-4 whitespace-nowrap">
                  {months[new Date(week[0]?.date || "").getMonth()]}
                </div>
              ) : <div className="h-4" />}
              {week.map((cell, di) => (
                <div
                  key={di}
                  className={cn(
                    "w-3 h-3 rounded-sm border cursor-pointer transition-transform hover:scale-125",
                    getColor(cell.count)
                  )}
                  onMouseEnter={(e) =>
                    setTooltip({
                      text: cell.count > 0
                        ? `${cell.date}: ${cell.count} submissions (${cell.accepted} accepted)`
                        : `${cell.date}: No activity`,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[10px] text-muted-foreground mr-1">Less</span>
        {[0, 1, 3, 5, 8].map(v => (
          <div key={v} className={cn("w-3 h-3 rounded-sm border", getColor(v))} />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">More</span>
      </div>
    </div>
  );
}

// ─── Difficulty Ring (SVG circular progress) ──────────────────────────────────
function DifficultyRing({
  label, solved, total, color, textColor, bgColor,
}: {
  label: string; solved: number; total: number;
  color: string; textColor: string; bgColor: string;
}) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(solved / total, 1) : 0;
  const dash = pct * circ;

  return (
    <div className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border", bgColor)}>
      <div className="relative">
        <svg width="72" height="72" className="-rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(var(--muted)/0.3)" strokeWidth="5" />
          <circle
            cx="36" cy="36" r={r} fill="none"
            stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-base font-bold", textColor)}>{solved}</span>
        </div>
      </div>
      <div className="text-center">
        <p className={cn("text-xs font-semibold", textColor)}>{label}</p>
        <p className="text-[10px] text-muted-foreground">{solved}/{total}</p>
      </div>
    </div>
  );
}

// ─── Language Bar ──────────────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  python: "#3B82F6", javascript: "#22C55E", cpp: "#EF4444", c: "#F97316", java: "#EAB308",
};
const LANG_LABELS: Record<string, string> = {
  python: "Python 3", javascript: "JavaScript", cpp: "C++17", c: "C", java: "Java",
};

function LanguageBreakdown({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a);

  return (
    <div className="space-y-2">
      {sorted.map(([lang, count]) => (
        <div key={lang} className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 w-24 shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: LANG_COLORS[lang] || "#94a3b8" }} />
            <span className="text-xs text-muted-foreground">{LANG_LABELS[lang] || lang}</span>
          </div>
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(count / total) * 100}%`,
                backgroundColor: LANG_COLORS[lang] || "#94a3b8",
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
        </div>
      ))}
      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No submissions yet</p>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, { total: number; accepted: number }>>({});
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, heatRes, lbRes] = await Promise.all([
          api.get("/user/stats"),
          api.get("/user/heatmap"),
          api.get("/leaderboard"),
        ]);
        setStats(statsRes.data);
        setHeatmap(heatRes.data);
        setLeaderboard(lbRes.data || []);
      } catch (e) {
        console.error("Dashboard load failed", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const myRank = leaderboard.findIndex((u: any) => u.name === user?.name);
  const rank = myRank >= 0 ? myRank + 1 : leaderboard.length + 1;
  const totalPoints = leaderboard.find((u: any) => u.name === user?.name)?.totalPoints ?? 0;

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-orange-400";
    if (streak >= 7) return "text-yellow-400";
    return "text-muted-foreground";
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8 space-y-6">

        {/* ── Welcome Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back, <span className="gradient-text">{user?.name || "Coder"}</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              {stats?.streak && stats.streak > 0
                ? `🔥 ${stats.streak}-day streak — keep it going!`
                : "Start solving problems to build your streak!"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-2 border-primary/40 text-primary">
                  <Star className="h-4 w-4" /> Admin Panel
                </Button>
              </Link>
            )}
            <Link to="/problems">
              <Button size="sm" className="btn-neon gap-2">
                <Code2 className="h-4 w-4" /> Solve Problems
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Top Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            {
              label: "Problems Solved",
              value: loading ? "—" : stats?.totalSolved ?? 0,
              icon: <CheckCircle className="h-5 w-5" />,
              color: "text-cyan-400", bg: "from-cyan-500/10 to-transparent",
            },
            {
              label: "Global Rank",
              value: loading ? "—" : `#${rank}`,
              icon: <Trophy className="h-5 w-5" />,
              color: "text-yellow-400", bg: "from-yellow-500/10 to-transparent",
            },
            {
              label: "Total Points",
              value: loading ? "—" : totalPoints.toLocaleString(),
              icon: <Target className="h-5 w-5" />,
              color: "text-green-400", bg: "from-green-500/10 to-transparent",
            },
            {
              label: "Current Streak",
              value: loading ? "—" : `${stats?.streak ?? 0}d`,
              icon: <Flame className="h-5 w-5" />,
              color: getStreakColor(stats?.streak ?? 0),
              bg: "from-orange-500/10 to-transparent",
            },
            {
              label: "Acceptance Rate",
              value: loading ? "—" : `${stats?.acceptanceRate ?? 0}%`,
              icon: <Zap className="h-5 w-5" />,
              color: "text-purple-400", bg: "from-purple-500/10 to-transparent",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={cn(
                "glass-card p-4 flex flex-col gap-2 bg-gradient-to-br border border-border/50",
                card.bg
              )}
            >
              <div className={cn("flex items-center gap-2", card.color)}>
                {card.icon}
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              </div>
              <div className={cn("text-2xl font-bold", card.color)}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* ── Middle Row: Difficulty Rings + Language ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Difficulty Rings */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Solved by Difficulty
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <DifficultyRing
                label="Easy" solved={stats?.byDifficulty.easy ?? 0}
                total={stats?.totalByDiff.easy ?? 0}
                color="#22c55e" textColor="text-green-400"
                bgColor="border-green-500/20 bg-green-500/5"
              />
              <DifficultyRing
                label="Medium" solved={stats?.byDifficulty.medium ?? 0}
                total={stats?.totalByDiff.medium ?? 0}
                color="#f97316" textColor="text-orange-400"
                bgColor="border-orange-500/20 bg-orange-500/5"
              />
              <DifficultyRing
                label="Hard" solved={stats?.byDifficulty.hard ?? 0}
                total={stats?.totalByDiff.hard ?? 0}
                color="#ef4444" textColor="text-red-400"
                bgColor="border-red-500/20 bg-red-500/5"
              />
            </div>

            {/* Overall progress bar */}
            <div className="mt-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{stats?.totalSolved ?? 0} / {stats?.totalProblems ?? 0} solved</span>
                <span>{stats?.totalProblems ? Math.round(((stats?.totalSolved ?? 0) / stats.totalProblems) * 100) : 0}%</span>
              </div>
              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats?.totalProblems ? ((stats?.totalSolved ?? 0) / stats.totalProblems) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Streak badges */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 text-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-orange-400">{stats?.streak ?? 0}</div>
                <div className="text-[10px] text-muted-foreground">Current Streak</div>
              </div>
              <div className="flex-1 text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <Award className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-yellow-400">{stats?.maxStreak ?? 0}</div>
                <div className="text-[10px] text-muted-foreground">Max Streak</div>
              </div>
              <div className="flex-1 text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <GitCommit className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-400">{stats?.totalSubmissions ?? 0}</div>
                <div className="text-[10px] text-muted-foreground">Submissions</div>
              </div>
            </div>
          </div>

          {/* Language Breakdown */}
          <div className="glass-card p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" /> Language Usage
            </h2>
            {loading ? (
              <div className="text-center text-muted-foreground text-sm py-8">Loading...</div>
            ) : (
              <LanguageBreakdown data={stats?.languageBreakdown ?? {}} />
            )}
          </div>

          {/* Leaderboard snapshot */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Top Performers
              </h2>
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Full Board <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {loading ? (
                <div className="text-center text-muted-foreground text-sm py-4">Loading...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No data yet. Be the first!
                </div>
              ) : (
                leaderboard.slice(0, 5).map((entry: any, i: number) => (
                  <div
                    key={entry.userId}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg transition-colors",
                      entry.name === user?.name
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/20 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-sm font-bold w-6 text-center",
                        i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                      )}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                      </span>
                      <span className="text-sm font-medium">{entry.name}</span>
                      {entry.name === user?.name && (
                        <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-semibold text-sm">{entry.totalPoints}</span>
                      <span className="text-muted-foreground text-xs ml-1">pts</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Activity Heatmap ── */}
        <div className="glass-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Submission Activity
            <span className="text-xs text-muted-foreground font-normal ml-1">— last 52 weeks</span>
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4 animate-spin" /> Loading heatmap...
            </div>
          ) : (
            <ActivityHeatmap data={heatmap} />
          )}
        </div>

        {/* ── Recent Submissions ── */}
        <div className="glass-card">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Recent Submissions
            </h2>
            <Link to="/submissions">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : !stats?.recentSubmissions?.length ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No submissions yet.{" "}
                <Link to="/problems" className="text-primary hover:underline">
                  Solve your first problem!
                </Link>
              </div>
            ) : (
              stats.recentSubmissions.map((sub: any) => (
                <Link
                  key={sub._id}
                  to={`/problem/${sub.problem?._id}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    sub.verdict === "Accepted" ? "bg-green-400" :
                    sub.verdict === "Compilation Error" ? "bg-purple-400" :
                    sub.verdict === "Time Limit Exceeded" ? "bg-yellow-400" : "bg-red-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate hover:text-primary transition-colors text-sm">
                      {sub.problem?.title || "Unknown"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        sub.problem?.difficulty === "easy" ? "bg-green-500/10 text-green-400" :
                        sub.problem?.difficulty === "medium" ? "bg-orange-500/10 text-orange-400" :
                        "bg-red-500/10 text-red-400"
                      )}>
                        {sub.problem?.difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">{sub.language}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn(
                      "text-xs font-semibold",
                      sub.verdict === "Accepted" ? "text-green-400" :
                      sub.verdict === "Time Limit Exceeded" ? "text-yellow-400" :
                      sub.verdict === "Compilation Error" ? "text-purple-400" : "text-red-400"
                    )}>
                      {sub.verdict}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(sub.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
