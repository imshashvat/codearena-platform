import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import api from "@/lib/axios";
import {
  Plus, Search, Trash2, Save, X, Shield, Code2, FileCode,
  Settings, Clock, Users, BarChart3, Trophy, Zap, CheckCircle,
  Crown, UserX, TrendingUp, CalendarPlus, Calendar,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Problem {
  _id: string; title: string; difficulty: "easy" | "medium" | "hard"; points: number;
  testCases: { input: string; output: string; hidden: boolean }[];
}
interface PlatformStats {
  totalUsers: number; totalProblems: number; totalSubmissions: number;
  totalContests: number; acceptedSubmissions: number; acceptanceRate: number;
  recentActivity: { _id: string; count: number }[];
  langDist: { _id: string; count: number }[];
}
interface UserRow {
  _id: string; name: string; email: string; role: string;
  submissionCount: number; acceptedCount: number; createdAt: string;
}
interface Contest {
  _id: string; title: string; startTime: string; endTime: string;
  liveStatus: string; participantCount: number; proctored: boolean; problems: any[];
}

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "problems", label: "Problems", icon: FileCode },
  { id: "users", label: "Users", icon: Users },
  { id: "contests", label: "Contests", icon: Trophy },
  { id: "settings", label: "Settings", icon: Settings },
];

const emptyProblem = { title: "", difficulty: "easy" as "easy"|"medium"|"hard", points: 10, description: "", inputFormat: "", outputFormat: "" };
const emptyContest = { title: "", description: "", startTime: "", endTime: "", proctored: false, requireWebcam: false, requireScreen: false, requireMic: false, accessCode: "", problems: [] as string[] };

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Data
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);

  // UI state
  const [search, setSearch] = useState("");
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [showAddContest, setShowAddContest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newProblem, setNewProblem] = useState(emptyProblem);
  const [testCases, setTestCases] = useState([{ input: "", output: "", hidden: false }]);
  const [newContest, setNewContest] = useState(emptyContest);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, probRes, usersRes, contestsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/problems"),
          api.get("/admin/users"),
          api.get("/contests"),
        ]);
        setStats(statsRes.data);
        setProblems(probRes.data || []);
        setUsers(usersRes.data || []);
        setContests(contestsRes.data || []);
      } catch { toast.error("Failed to load admin data"); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // ── Problem CRUD ────────────────────────────────────────────────────────────
  const handleDeleteProblem = async (id: string) => {
    if (!confirm("Delete this problem?")) return;
    try {
      await api.delete(`/problems/${id}`);
      setProblems(p => p.filter(x => x._id !== id));
      toast.success("Problem deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleAddProblem = async () => {
    if (!newProblem.title.trim() || !newProblem.description.trim()) {
      toast.error("Title and description are required"); return;
    }
    const valid = testCases.filter(tc => tc.input.trim() && tc.output.trim());
    if (!valid.length) { toast.error("Add at least one test case"); return; }
    setSaving(true);
    try {
      const res = await api.post("/problems", { ...newProblem, testCases: valid });
      setProblems(p => [...p, res.data]);
      toast.success("Problem created!");
      setShowAddProblem(false);
      setNewProblem(emptyProblem);
      setTestCases([{ input: "", output: "", hidden: false }]);
    } catch (e: any) { toast.error(e?.response?.data?.error || "Failed"); }
    finally { setSaving(false); }
  };

  // ── User management ─────────────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      setUsers(u => u.map(x => x._id === userId ? { ...x, role } : x));
      toast.success(`User ${role === "admin" ? "promoted to Admin" : "set to Student"}`);
    } catch { toast.error("Failed to change role"); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Permanently delete this user and all their submissions?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(u => u.filter(x => x._id !== userId));
      toast.success("User deleted");
    } catch { toast.error("Failed to delete user"); }
  };

  // ── Contest CRUD ────────────────────────────────────────────────────────────
  const handleAddContest = async () => {
    if (!newContest.title.trim() || !newContest.startTime || !newContest.endTime) {
      toast.error("Title, start time, and end time are required"); return;
    }
    setSaving(true);
    try {
      const res = await api.post("/contests", newContest);
      setContests(c => [res.data.contest, ...c]);
      toast.success("Contest created!");
      setShowAddContest(false);
      setNewContest(emptyContest);
    } catch (e: any) { toast.error(e?.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDeleteContest = async (id: string) => {
    if (!confirm("Delete this contest?")) return;
    try {
      await api.delete(`/contests/${id}`);
      setContests(c => c.filter(x => x._id !== id));
      toast.success("Contest deleted");
    } catch { toast.error("Failed to delete contest"); }
  };

  const filteredProblems = problems.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const liveStatusColor: Record<string, string> = {
    active: "bg-green-500/15 text-green-400 border-green-500/30",
    upcoming: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    ended: "bg-muted/30 text-muted-foreground border-muted/30",
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Admin <span className="gradient-text">Command Center</span>
          </h1>
          <p className="text-muted-foreground text-sm">Manage your platform — problems, users, contests, analytics</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-muted/20 p-1 rounded-xl w-fit flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(""); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Users", value: stats?.totalUsers, icon: <Users className="h-5 w-5" />, color: "text-blue-400", bg: "from-blue-500/10" },
                { label: "Problems", value: stats?.totalProblems, icon: <FileCode className="h-5 w-5" />, color: "text-cyan-400", bg: "from-cyan-500/10" },
                { label: "Submissions", value: stats?.totalSubmissions, icon: <Zap className="h-5 w-5" />, color: "text-purple-400", bg: "from-purple-500/10" },
                { label: "Accepted", value: stats?.acceptedSubmissions, icon: <CheckCircle className="h-5 w-5" />, color: "text-green-400", bg: "from-green-500/10" },
                { label: "Contests", value: stats?.totalContests, icon: <Trophy className="h-5 w-5" />, color: "text-yellow-400", bg: "from-yellow-500/10" },
              ].map(card => (
                <div key={card.label} className={cn("glass-card p-4 bg-gradient-to-br to-transparent border border-border/50", card.bg)}>
                  <div className={cn("flex items-center gap-2 mb-2", card.color)}>
                    {card.icon}
                    <span className="text-xs text-muted-foreground">{card.label}</span>
                  </div>
                  <div className={cn("text-3xl font-bold", card.color)}>
                    {loading ? "—" : card.value ?? 0}
                  </div>
                </div>
              ))}
            </div>

            {/* Acceptance Rate Banner */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Platform Acceptance Rate
                </h3>
                <span className="text-2xl font-bold text-green-400">{stats?.acceptanceRate ?? 0}%</span>
              </div>
              <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${stats?.acceptanceRate ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.acceptedSubmissions ?? 0} accepted out of {stats?.totalSubmissions ?? 0} total submissions
              </p>
            </div>

            {/* Language Distribution */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" /> Submissions by Language
              </h3>
              <div className="space-y-3">
                {(stats?.langDist || []).map(({ _id, count }) => {
                  const total = stats?.totalSubmissions || 1;
                  const pct = Math.round((count / total) * 100);
                  const colors: Record<string, string> = {
                    python: "#3B82F6", javascript: "#22C55E", cpp: "#EF4444", c: "#F97316", java: "#EAB308"
                  };
                  const labels: Record<string, string> = {
                    python: "Python 3", javascript: "JavaScript", cpp: "C++17", c: "C", java: "Java"
                  };
                  return (
                    <div key={_id} className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 w-28 shrink-0">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[_id] || "#94a3b8" }} />
                        <span className="text-sm">{labels[_id] || _id}</span>
                      </div>
                      <div className="flex-1 h-2.5 bg-muted/30 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[_id] || "#94a3b8" }} />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity (last 7 days) */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Activity Last 7 Days
              </h3>
              <div className="flex items-end gap-2 h-24">
                {(stats?.recentActivity || []).map(({ _id, count }) => {
                  const maxCount = Math.max(...(stats?.recentActivity || [{ count: 1 }]).map(a => a.count), 1);
                  const h = Math.round((count / maxCount) * 100);
                  return (
                    <div key={_id} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs text-muted-foreground">{count}</div>
                      <div
                        className="w-full bg-primary/60 rounded-t-sm transition-all"
                        style={{ height: `${h}%`, minHeight: 4 }}
                      />
                      <div className="text-[9px] text-muted-foreground">{_id.slice(5)}</div>
                    </div>
                  );
                })}
                {!stats?.recentActivity?.length && (
                  <p className="text-muted-foreground text-sm w-full text-center">No activity in last 7 days</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PROBLEMS TAB ── */}
        {activeTab === "problems" && (
          <div className="space-y-4">
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search problems..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-background/50 border-border" />
              </div>
              <Button onClick={() => setShowAddProblem(true)} className="btn-neon gap-2">
                <Plus className="h-4 w-4" /> Add Problem
              </Button>
            </div>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    {["Title", "Difficulty", "Points", "Test Cases", ""].map(h => (
                      <th key={h} className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Clock className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...</td></tr>
                  ) : filteredProblems.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No problems found.</td></tr>
                  ) : filteredProblems.map(p => (
                    <tr key={p._id} className="table-row-hover">
                      <td className="p-4 font-medium">{p.title}</td>
                      <td className="p-4"><DifficultyBadge difficulty={p.difficulty} /></td>
                      <td className="p-4"><span className="text-primary font-semibold">+{p.points}</span></td>
                      <td className="p-4 text-muted-foreground">{p.testCases?.length ?? 0} cases</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteProblem(p._id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-background/50 border-border" />
              </div>
            </div>
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    {["User", "Role", "Submissions", "Accepted", "Joined", "Actions"].map(h => (
                      <th key={h} className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Clock className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found.</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u._id} className="table-row-hover">
                      <td className="p-4">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full border font-medium",
                          u.role === "admin" ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-muted/30"
                        )}>
                          {u.role === "admin" ? "👑 Admin" : "Student"}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">{u.submissionCount}</td>
                      <td className="p-4 text-green-400 text-sm font-medium">{u.acceptedCount}</td>
                      <td className="p-4 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {u.role !== "admin" ? (
                            <Button variant="ghost" size="sm" onClick={() => handleRoleChange(u._id, "admin")}
                              className="text-primary hover:text-primary text-xs gap-1">
                              <Crown className="h-3 w-3" /> Promote
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => handleRoleChange(u._id, "student")}
                              className="text-muted-foreground hover:text-foreground text-xs gap-1">
                              <UserX className="h-3 w-3" /> Demote
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(u._id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CONTESTS TAB ── */}
        {activeTab === "contests" && (
          <div className="space-y-4">
            <div className="glass-card p-4 flex justify-between items-center">
              <p className="text-muted-foreground text-sm">{contests.length} contest{contests.length !== 1 ? "s" : ""} total</p>
              <Button onClick={() => setShowAddContest(true)} className="btn-neon gap-2">
                <CalendarPlus className="h-4 w-4" /> Create Contest
              </Button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="glass-card p-8 text-center text-muted-foreground"><Clock className="h-5 w-5 animate-spin mx-auto mb-2" />Loading...</div>
              ) : contests.length === 0 ? (
                <div className="glass-card p-12 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium mb-1">No contests yet</p>
                  <p className="text-sm">Create your first contest to get started</p>
                </div>
              ) : contests.map(c => (
                <div key={c._id} className="glass-card p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full border", liveStatusColor[c.liveStatus] || liveStatusColor.ended)}>
                        {c.liveStatus}
                      </span>
                      {c.proctored && (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-500/15 text-purple-400 border-purple-500/30">
                          🔒 Proctored
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>📅 {new Date(c.startTime).toLocaleString()} → {new Date(c.endTime).toLocaleString()}</span>
                      <span>👥 {c.participantCount} participants</span>
                      <span>📝 {c.problems?.length || 0} problems</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/contests/${c._id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteContest(c._id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === "settings" && (
          <div className="glass-card p-6 max-w-xl space-y-5">
            <h3 className="text-lg font-semibold">Platform Settings</h3>
            {[
              { id: "siteName", label: "Platform Name", defaultValue: "CodeArena", type: "text" },
              { id: "maxSubmissions", label: "Max Submissions Per Day", defaultValue: "100", type: "number" },
              { id: "executionTimeout", label: "Execution Timeout (seconds)", defaultValue: "5", type: "number" },
            ].map(f => (
              <div key={f.id} className="space-y-2">
                <Label htmlFor={f.id}>{f.label}</Label>
                <Input id={f.id} type={f.type} defaultValue={f.defaultValue} className="bg-muted/50 border-border" />
              </div>
            ))}
            <Button className="btn-neon gap-2" onClick={() => toast.success("Settings saved!")}>
              <Save className="h-4 w-4" /> Save Settings
            </Button>
          </div>
        )}
      </div>

      {/* ═══ ADD PROBLEM MODAL ═══ */}
      {showAddProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddProblem(false)} />
          <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-card/90 backdrop-blur-sm z-10">
              <h3 className="font-semibold flex items-center gap-2"><Code2 className="h-4 w-4 text-primary" />Add New Problem</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddProblem(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Problem Title *</Label>
                <Input value={newProblem.title} onChange={e => setNewProblem({ ...newProblem, title: e.target.value })} placeholder="e.g., Two Sum" className="bg-muted/50 border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <select value={newProblem.difficulty} onChange={e => setNewProblem({ ...newProblem, difficulty: e.target.value as any })}
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input type="number" min={1} value={newProblem.points} onChange={e => setNewProblem({ ...newProblem, points: parseInt(e.target.value) || 10 })} className="bg-muted/50 border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={newProblem.description} onChange={e => setNewProblem({ ...newProblem, description: e.target.value })} rows={4} className="bg-muted/50 border-border resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Input Format</Label>
                  <Textarea value={newProblem.inputFormat} onChange={e => setNewProblem({ ...newProblem, inputFormat: e.target.value })} rows={2} className="bg-muted/50 border-border resize-none text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Textarea value={newProblem.outputFormat} onChange={e => setNewProblem({ ...newProblem, outputFormat: e.target.value })} rows={2} className="bg-muted/50 border-border resize-none text-sm" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Test Cases *</Label>
                  <Button variant="outline" size="sm" onClick={() => setTestCases([...testCases, { input: "", output: "", hidden: false }])} className="gap-1 text-xs">
                    <Plus className="h-3 w-3" /> Add Case
                  </Button>
                </div>
                {testCases.map((tc, i) => (
                  <div key={i} className="border border-border/50 rounded-lg p-4 space-y-3 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Test Case {i + 1}</span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                          <input type="checkbox" checked={tc.hidden} onChange={e => { const u = [...testCases]; u[i] = { ...u[i], hidden: e.target.checked }; setTestCases(u); }} className="accent-primary" />
                          Hidden
                        </label>
                        {testCases.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setTestCases(testCases.filter((_, j) => j !== i))} className="text-destructive h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Input</Label>
                        <Textarea value={tc.input} onChange={e => { const u = [...testCases]; u[i] = { ...u[i], input: e.target.value }; setTestCases(u); }} rows={3} className="bg-muted/50 border-border resize-none font-mono text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Expected Output</Label>
                        <Textarea value={tc.output} onChange={e => { const u = [...testCases]; u[i] = { ...u[i], output: e.target.value }; setTestCases(u); }} rows={3} className="bg-muted/50 border-border resize-none font-mono text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border/50 sticky bottom-0 bg-card/90 backdrop-blur-sm">
              <Button variant="outline" onClick={() => setShowAddProblem(false)}>Cancel</Button>
              <Button onClick={handleAddProblem} disabled={saving} className="btn-neon gap-2">
                {saving ? <><Clock className="h-4 w-4 animate-spin" />Saving...</> : <><Plus className="h-4 w-4" />Add Problem</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CREATE CONTEST MODAL ═══ */}
      {showAddContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddContest(false)} />
          <div className="relative glass-card w-full max-w-xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-border/50 sticky top-0 bg-card/90 backdrop-blur-sm z-10">
              <h3 className="font-semibold flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" />Create Contest</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddContest(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Contest Title *</Label>
                <Input value={newContest.title} onChange={e => setNewContest({ ...newContest, title: e.target.value })} placeholder="e.g., Weekly Challenge #1" className="bg-muted/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newContest.description} onChange={e => setNewContest({ ...newContest, description: e.target.value })} rows={3} className="bg-muted/50 border-border resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input type="datetime-local" value={newContest.startTime} onChange={e => setNewContest({ ...newContest, startTime: e.target.value })} className="bg-muted/50 border-border" />
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Input type="datetime-local" value={newContest.endTime} onChange={e => setNewContest({ ...newContest, endTime: e.target.value })} className="bg-muted/50 border-border" />
                </div>
              </div>

              {/* Problem Picker */}
              <div className="space-y-2">
                <Label>Select Problems</Label>
                <div className="border border-border/50 rounded-lg max-h-40 overflow-y-auto divide-y divide-border/30">
                  {problems.map(p => (
                    <label key={p._id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/20">
                      <input
                        type="checkbox"
                        checked={newContest.problems.includes(p._id)}
                        onChange={e => {
                          const next = e.target.checked
                            ? [...newContest.problems, p._id]
                            : newContest.problems.filter(id => id !== p._id);
                          setNewContest({ ...newContest, problems: next });
                        }}
                        className="accent-primary"
                      />
                      <span className="text-sm flex-1">{p.title}</span>
                      <DifficultyBadge difficulty={p.difficulty} />
                      <span className="text-xs text-primary">+{p.points}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{newContest.problems.length} problem{newContest.problems.length !== 1 ? "s" : ""} selected</p>
              </div>

              {/* Access Code */}
              <div className="space-y-2">
                <Label>Access Code (optional)</Label>
                <Input value={newContest.accessCode} onChange={e => setNewContest({ ...newContest, accessCode: e.target.value })} placeholder="Leave blank for public contest" className="bg-muted/50 border-border" />
              </div>

              {/* Proctoring options */}
              <div className="space-y-3 p-4 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <p className="text-sm font-semibold text-purple-300">Proctoring Settings</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Enable to monitor participants during the contest. 3 violations = auto-submit.
                </p>
                {([
                  { key: "proctored",      label: "Enable Proctoring",   desc: "Activates all anti-cheat measures" },
                  { key: "requireWebcam",  label: "Require Webcam",      desc: "Face detection & head pose monitoring" },
                  { key: "requireScreen",  label: "Require Screen Share", desc: "Full-screen share (bypass-resistant)" },
                  { key: "requireMic",     label: "Require Microphone",   desc: "Audio presence monitoring" },
                ] as { key: keyof typeof newContest; label: string; desc: string }[]).map(opt => (
                  <label key={opt.key as string} className={cn(
                    "flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                    (newContest as any)[opt.key]
                      ? "bg-purple-500/10 border-purple-500/30"
                      : "bg-muted/10 border-border/30 hover:border-border"
                  )}>
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    {/* Toggle switch */}
                    <div className="relative shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={(newContest as any)[opt.key]}
                        onChange={e => setNewContest({ ...newContest, [opt.key as string]: e.target.checked })}
                      />
                      <div className={cn(
                        "w-10 h-5 rounded-full transition-all duration-200 relative",
                        (newContest as any)[opt.key] ? "bg-purple-500" : "bg-muted/50 border border-border"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200",
                          (newContest as any)[opt.key] ? "translate-x-5" : "translate-x-0.5"
                        )} />
                      </div>
                    </div>
                  </label>
                ))}
              </div>

            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border/50 sticky bottom-0 bg-card/90 backdrop-blur-sm">
              <Button variant="outline" onClick={() => setShowAddContest(false)}>Cancel</Button>
              <Button onClick={handleAddContest} disabled={saving} className="btn-neon gap-2">
                {saving ? <><Clock className="h-4 w-4 animate-spin" />Creating...</> : <><CalendarPlus className="h-4 w-4" />Create Contest</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
