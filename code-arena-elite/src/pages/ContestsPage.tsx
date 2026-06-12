import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import {
  Trophy, Clock, Users, Lock, Globe, Zap,
  CalendarDays, CheckCircle, ChevronRight, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Contest {
  _id: string; title: string; description: string;
  startTime: string; endTime: string; liveStatus: string;
  participantCount: number; proctored: boolean;
  requireWebcam: boolean; requireScreen: boolean; requireMic: boolean;
  problems: { _id: string; title: string; difficulty: string }[];
  isParticipant?: boolean;
  accessCode?: string;
}

function ContestTimer({ endTime }: { endTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return <span className="font-mono text-sm font-bold">{timeLeft}</span>;
}

function TimeUntilStart({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(startTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Starting now"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return <span className="font-mono text-xs">{timeLeft}</span>;
}

export default function ContestsPage() {
  const { user } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "ended">("all");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/contests")
      .then(r => setContests(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = async (contest: Contest) => {
    const code = accessCodes[contest._id] || "";
    if (contest.accessCode && !code) {
      const entered = prompt(`This contest requires an access code:`);
      if (!entered) return;
      setAccessCodes(prev => ({ ...prev, [contest._id]: entered }));
    }
    setJoiningId(contest._id);
    try {
      await api.post(`/contests/${contest._id}/join`, { accessCode: accessCodes[contest._id] || "" });
      setContests(prev =>
        prev.map(c => c._id === contest._id ? { ...c, isParticipant: true, participantCount: c.participantCount + 1 } : c)
      );
    } catch (e: any) {
      alert(e?.response?.data?.message || "Failed to join");
    } finally {
      setJoiningId(null);
    }
  };

  const filtered = contests.filter(c =>
    filter === "all" ? true : c.liveStatus === filter
  );

  const statusStyle: Record<string, { border: string; badge: string; dot: string }> = {
    active:   { border: "border-green-500/30",  badge: "bg-green-500/15 text-green-400 border-green-500/30",  dot: "bg-green-400" },
    upcoming: { border: "border-blue-500/30",   badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",    dot: "bg-blue-400" },
    ended:    { border: "border-border/30",      badge: "bg-muted/20 text-muted-foreground border-muted/30",  dot: "bg-muted-foreground" },
  };

  const counts = { all: contests.length, active: contests.filter(c => c.liveStatus === "active").length, upcoming: contests.filter(c => c.liveStatus === "upcoming").length, ended: contests.filter(c => c.liveStatus === "ended").length };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              <span className="gradient-text">Contests</span>
            </h1>
            <p className="text-muted-foreground text-sm">Compete in timed, proctored coding challenges</p>
          </div>
          {user?.role === "admin" && (
            <Link to="/admin">
              <Button className="btn-neon gap-2"><Trophy className="h-4 w-4" /> Manage Contests</Button>
            </Link>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "active", "upcoming", "ended"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {f === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="ml-1 text-xs opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>

        {/* Contest List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Clock className="h-5 w-5 animate-spin" /> Loading contests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-16 text-center text-muted-foreground">
            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No {filter !== "all" ? filter : ""} contests</p>
            <p className="text-sm">Check back later or ask an admin to create one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(contest => {
              const st = statusStyle[contest.liveStatus] || statusStyle.ended;
              return (
                <div key={contest._id} className={cn("glass-card p-6 border transition-all hover:border-primary/30", st.border)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h2 className="text-lg font-bold">{contest.title}</h2>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border flex items-center gap-1", st.badge)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", st.dot, contest.liveStatus === "active" && "animate-pulse")} />
                          {contest.liveStatus === "active" ? "🔴 LIVE" : contest.liveStatus === "upcoming" ? "Upcoming" : "Ended"}
                        </span>
                        {contest.proctored && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-500/15 text-purple-400 border-purple-500/30 flex items-center gap-1">
                            🔒 Proctored
                            {contest.requireWebcam && " · 📷"}
                            {contest.requireMic && " · 🎤"}
                            {contest.requireScreen && " · 🖥️"}
                          </span>
                        )}
                        {contest.accessCode && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
                            <Lock className="h-3 w-3 inline mr-1" />Private
                          </span>
                        )}
                      </div>

                      {contest.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{contest.description}</p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {new Date(contest.startTime).toLocaleDateString()} {new Date(contest.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" — "}
                          {new Date(contest.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {contest.participantCount} participants
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          {contest.problems?.length || 0} problems
                        </span>
                        {contest.liveStatus === "active" && (
                          <span className="flex items-center gap-1.5 text-green-400 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            Ends in: <ContestTimer endTime={contest.endTime} />
                          </span>
                        )}
                        {contest.liveStatus === "upcoming" && (
                          <span className="flex items-center gap-1.5 text-blue-400">
                            <Clock className="h-3.5 w-3.5" />
                            Starts in: <TimeUntilStart startTime={contest.startTime} />
                          </span>
                        )}
                      </div>

                      {/* Problem chips */}
                      {contest.problems && contest.problems.length > 0 && (
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {contest.problems.slice(0, 5).map((p: any) => (
                            <span key={p._id} className={cn(
                              "text-xs px-2 py-0.5 rounded-md border",
                              p.difficulty === "easy" ? "border-green-500/30 text-green-400 bg-green-500/5" :
                              p.difficulty === "medium" ? "border-orange-500/30 text-orange-400 bg-orange-500/5" :
                              "border-red-500/30 text-red-400 bg-red-500/5"
                            )}>
                              {p.title}
                            </span>
                          ))}
                          {contest.problems.length > 5 && (
                            <span className="text-xs text-muted-foreground">+{contest.problems.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      {contest.isParticipant ? (
                        <Link to={`/contests/${contest._id}`}>
                          <Button className={cn("gap-2", contest.liveStatus === "active" ? "btn-neon" : "")}>
                            {contest.liveStatus === "active" ? (
                              <><Play className="h-4 w-4" /> Enter Contest</>
                            ) : (
                              <><ChevronRight className="h-4 w-4" /> View</>
                            )}
                          </Button>
                        </Link>
                      ) : contest.liveStatus === "ended" ? (
                        <Link to={`/contests/${contest._id}`}>
                          <Button variant="outline" className="gap-2">View Results</Button>
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleJoin(contest)}
                          disabled={joiningId === contest._id}
                          className={cn(contest.liveStatus === "active" ? "btn-neon" : "")}
                          variant={contest.liveStatus === "upcoming" ? "outline" : "default"}
                        >
                          {joiningId === contest._id ? (
                            <><Clock className="h-4 w-4 animate-spin" /> Joining...</>
                          ) : (
                            <>{contest.accessCode ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            {contest.liveStatus === "active" ? " Join & Enter" : " Register"}</>
                          )}
                        </Button>
                      )}
                      {contest.isParticipant && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Registered
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
