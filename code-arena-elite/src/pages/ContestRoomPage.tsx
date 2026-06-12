import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { ProctoringSetup, ProctoringWarningBanner, WebcamPreview, ViolationsPanel } from "@/components/proctoring/ProctoringGuard";
import { useProctoring } from "@/hooks/useProctoring";
import {
  Clock, Play, Send, ChevronLeft, CheckCircle, XCircle,
  Shield, Trophy, Users, Zap, Code2, AlertTriangle,
  Eye, ChevronDown, ChevronUp, Loader2, List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Problem {
  _id: string; title: string; difficulty: string; points: number;
  description: string; inputFormat?: string; outputFormat?: string;
  testCases: { input: string; output: string; hidden: boolean }[];
}
interface Contest {
  _id: string; title: string; description: string;
  startTime: string; endTime: string; liveStatus: string;
  problems: Problem[]; proctored: boolean;
  requireWebcam: boolean; requireScreen: boolean; requireMic: boolean;
  participantCount: number;
}
interface LeaderboardEntry { userId: string; name: string; score: number; solved: number; rank: number; }
interface TestResult { testCase: number; status: string; expected?: string; got?: string; time?: number; }

const LANGUAGES = [
  { id: "python",     label: "Python 3", monaco: "python",     color: "#3B82F6" },
  { id: "cpp",        label: "C++17",    monaco: "cpp",        color: "#EF4444" },
  { id: "c",          label: "C",        monaco: "c",          color: "#F97316" },
  { id: "java",       label: "Java",     monaco: "java",       color: "#EAB308" },
  { id: "javascript", label: "JS",       monaco: "javascript", color: "#22C55E" },
];

const DEFAULT_CODE: Record<string, string> = {
  python:     `import sys\ninput = sys.stdin.readline\n\ndef solve():\n    # Write your solution here\n    pass\n\nsolve()\n`,
  cpp:        `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Write your solution here\n    \n    return 0;\n}\n`,
  c:          `#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}\n`,
  java:       `import java.util.*;\nimport java.io.*;\n\npublic class Solution {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // Write your solution here\n        \n    }\n}\n`,
  javascript: `const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');\n// Write your solution here\n`,
};

// ─── Countdown Timer ──────────────────────────────────────────────────────────
function ContestTimer({ endTime }: { endTime: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const tick = () => setDiff(Math.max(0, new Date(endTime).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const urgent = diff < 300000;
  if (!diff) return <span className="text-red-400 font-bold text-sm font-mono">TIME UP</span>;
  return (
    <div className={cn(
      "flex items-center gap-1.5 font-mono text-sm font-bold px-3 py-1.5 rounded-lg border transition-all",
      urgent ? "text-red-400 border-red-500/40 bg-red-500/10 animate-pulse" : "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
    )}>
      <Clock className="h-3.5 w-3.5" />
      {String(h).padStart(2,"0")}:{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContestRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Contest data
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [showSetup, setShowSetup] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{ verdict: string; passed: number; total: number; results: TestResult[]; runtime?: number } | null>(null);
  const [consoleError, setConsoleError] = useState<string | null>(null);
  const [solvedProblems, setSolvedProblems] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showViolations, setShowViolations] = useState(false);

  // Proctoring webcam video element ref
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);

  // ── Proctoring Hook ───────────────────────────────────────────────────────────
  const { state: proctor, activateProctoring, issueWarning, setStreams } = useProctoring({
    requireWebcam: contest?.requireWebcam ?? false,
    requireScreen: contest?.requireScreen ?? false,
    requireMic: contest?.requireMic ?? false,
    maxWarnings: 3,
    onAutoSubmit: async (violations, warnings) => {
      toast.error("🚫 Test auto-submitted due to violations", { duration: 8000 });
      if (selectedProblem) {
        try {
          await api.post("/submit", {
            problemId: selectedProblem._id, code, language: language.id,
            runMode: "submit", autoSubmitted: true, warnings,
            contestId: id,
            violations: violations.map(v => ({ type: v.type, message: v.message, timestamp: v.timestamp })),
          });
        } catch { /* best effort */ }
      }
    },
    onWarning: (v, count) => {
      // Warning toast is handled inside the hook
    },
  });

  // ── Load contest ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/contests/${id}`)
      .then(r => {
        setContest(r.data);
        if (r.data.problems?.length > 0) setSelectedProblem(r.data.problems[0]);
        // If not proctored, go straight in
        if (!r.data.proctored) setProctoringActive(true);
        else setShowSetup(true);
      })
      .catch(() => toast.error("Failed to load contest"))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Leaderboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const refresh = () => api.get(`/contests/${id}/leaderboard`).then(r => setLeaderboard(r.data)).catch(() => {});
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [id]);

  // ── Activate proctoring after setup ──────────────────────────────────────────
  const handleSetupReady = useCallback((streams: { webcam?: MediaStream; screen?: MediaStream }) => {
    // Inject the acquired streams into the proctoring hook so face detection can use webcam
    if (streams.webcam || streams.screen) {
      setStreams(streams.webcam, streams.screen);
    }
    setShowSetup(false);
    setProctoringActive(true);
    // activateProctoring starts tab monitoring, copy-paste blocking, and face detection
    activateProctoring();
  }, [activateProctoring, setStreams]);

  // ── Run code ──────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!selectedProblem) return;
    setIsRunning(true); setResults(null); setConsoleError(null);
    try {
      const res = await api.post("/submit", {
        problemId: selectedProblem._id, code, language: language.id, runMode: "run",
        customInput: customInput || undefined,
      });
      setResults(res.data);
      if (res.data.verdict === "Accepted") toast.success("✅ All sample tests passed!");
      else toast.warning(`${res.data.passed}/${res.data.total} sample tests passed`);
    } catch (e: any) {
      const msg = e?.response?.data?.error || "Run failed";
      setConsoleError(msg);
    } finally { setIsRunning(false); }
  };

  // ── Submit code ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedProblem || proctor.autoSubmitted) return;
    setIsSubmitting(true); setResults(null); setConsoleError(null);
    try {
      const res = await api.post("/submit", {
        problemId: selectedProblem._id, code, language: language.id, runMode: "submit",
        warnings: proctor.warnings,
        violations: proctor.violations.map(v => ({ type: v.type, message: v.message })),
      });
      setResults(res.data);
      if (res.data.verdict === "Accepted") {
        setSolvedProblems(prev => new Set([...prev, selectedProblem._id]));
        toast.success("🎉 Accepted!");
      } else {
        toast.error(`${res.data.verdict} — ${res.data.passed}/${res.data.total} passed`);
      }
    } catch (e: any) {
      setConsoleError(e?.response?.data?.error || "Submission failed");
    } finally { setIsSubmitting(false); }
  };

  const isLoading = isRunning || isSubmitting;
  const isEnded = contest?.liveStatus === "ended";

  // ── Loading / Error states ────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading contest...
      </div>
    </div>
  );

  if (!contest) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-center">
      <div>
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
        <h2 className="text-xl font-semibold mb-3">Contest Not Found</h2>
        <Link to="/contests"><Button variant="outline">← Back to Contests</Button></Link>
      </div>
    </div>
  );

  // ── Proctoring Setup Flow ─────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <ProctoringSetup
        contestTitle={contest.title}
        requireWebcam={contest.requireWebcam}
        requireScreen={contest.requireScreen}
        requireMic={contest.requireMic}
        onReady={handleSetupReady}
        onBack={() => navigate("/contests")}
      />
    );
  }

  // ── Contest Room ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col select-none" style={{ userSelect: 'none' }}>

      {/* Proctoring Warning Banner */}
      {proctoringActive && contest.proctored && (
        <ProctoringWarningBanner
          warnings={proctor.warnings}
          maxWarnings={3}
          faceStatus={proctor.faceStatus}
          bypassDetected={proctor.bypassDetected}
        />
      )}

      {/* ── Header ── */}
      <header className="h-13 border-b border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between px-3 shrink-0 z-30" style={{ marginTop: proctor.warnings > 0 || proctor.bypassDetected ? 32 : 0 }}>
        <div className="flex items-center gap-3">
          <Link to="/contests" className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Trophy className="h-4 w-4 text-primary shrink-0" />
            <h1 className="font-semibold text-sm truncate max-w-[160px]">{contest.title}</h1>
            {contest.proctored && (
              <span className="hidden sm:flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-purple-500/15 text-purple-400 border-purple-500/30 shrink-0">
                <Shield className="h-3 w-3" /> Proctored
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bypass alert */}
          {proctor.bypassDetected && (
            <span className="text-xs text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Bypass Detected
            </span>
          )}

          {/* Warnings indicator */}
          {proctor.warnings > 0 && (
            <button onClick={() => setShowViolations(v => !v)} className="text-xs border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded-lg flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {proctor.warnings}/3
            </button>
          )}

          {/* Webcam mini-preview */}
          {contest.proctored && contest.requireWebcam && (
            <WebcamPreview stream={proctor.webcamStream} faceStatus={proctor.faceStatus} />
          )}

          {/* Timer */}
          {!isEnded && <ContestTimer endTime={contest.endTime} />}
          {isEnded && <span className="text-xs text-muted-foreground px-2 py-1 border border-border/30 rounded-lg">Ended</span>}

          {/* Leaderboard */}
          <Button variant="ghost" size="sm" onClick={() => setShowLeaderboard(v => !v)} className="gap-1.5 h-8">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:block text-xs">Leaderboard</span>
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Problem Sidebar ── */}
        <aside className="hidden md:flex flex-col w-52 border-r border-border/40 bg-card/20 shrink-0">
          <div className="p-3 border-b border-border/40">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Problems</p>
          </div>
          <div className="flex-1 overflow-auto">
            {contest.problems.map((p, i) => (
              <button
                key={p._id}
                onClick={() => { setSelectedProblem(p); setResults(null); setConsoleError(null); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-border/20 transition-all",
                  selectedProblem?._id === p._id
                    ? "bg-primary/10 border-l-2 border-l-primary"
                    : "hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  solvedProblems.has(p._id) ? "bg-green-500/20 text-green-400" : "bg-muted/50 text-muted-foreground"
                )}>
                  {solvedProblems.has(p._id) ? "✓" : String.fromCharCode(65 + i)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{p.title}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-[10px]",
                      p.difficulty === "easy" ? "text-emerald-400" :
                      p.difficulty === "medium" ? "text-orange-400" : "text-red-400"
                    )}>{p.difficulty}</span>
                    <span className="text-[10px] text-primary">+{p.points}pt</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Mini leaderboard */}
          {leaderboard.length > 0 && (
            <div className="border-t border-border/40 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Top 3</p>
              {leaderboard.slice(0, 3).map(e => (
                <div key={e.userId} className="flex items-center justify-between py-1 text-[10px]">
                  <span className="text-muted-foreground">{e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : "🥉"} {e.name}</span>
                  <span className="text-primary font-semibold">{e.score}pt</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Main Editor Area ── */}
        <div className="flex-1 flex min-h-0">

          {/* Problem Description */}
          {selectedProblem && (
            <div className="hidden lg:flex flex-col w-[42%] border-r border-border/40 min-h-0">
              <div className="flex-1 overflow-auto p-5">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold">{selectedProblem.title}</h2>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium",
                    selectedProblem.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-400" :
                    selectedProblem.difficulty === "medium" ? "bg-orange-500/10 text-orange-400" :
                    "bg-red-500/10 text-red-400"
                  )}>{selectedProblem.difficulty}</span>
                  <span className="text-[11px] text-primary">+{selectedProblem.points} pts</span>
                  {solvedProblems.has(selectedProblem._id) && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle className="h-3 w-3" /> Solved
                    </span>
                  )}
                </div>

                <div className="prose prose-sm prose-invert max-w-none mb-5">
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {selectedProblem.description}
                  </div>
                </div>

                {selectedProblem.inputFormat && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-1.5 text-muted-foreground uppercase text-[10px] tracking-wider">Input Format</h3>
                    <p className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">{selectedProblem.inputFormat}</p>
                  </div>
                )}

                {selectedProblem.outputFormat && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-1.5 text-muted-foreground uppercase text-[10px] tracking-wider">Output Format</h3>
                    <p className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">{selectedProblem.outputFormat}</p>
                  </div>
                )}

                {selectedProblem.testCases?.filter(tc => !tc.hidden).length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Examples</h3>
                    {selectedProblem.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                      <div key={i} className="mb-3 bg-muted/10 border border-border/30 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-border/30">
                          <div className="p-3">
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Input</p>
                            <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{tc.input}</pre>
                          </div>
                          <div className="p-3">
                            <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Output</p>
                            <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">{tc.output}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code Editor + Console */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Language tabs */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40 bg-card/30 shrink-0">
              <div className="flex items-center gap-0.5 bg-muted/20 p-0.5 rounded-lg">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => { setLanguage(lang); setCode(DEFAULT_CODE[lang.id] || ""); setResults(null); }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                      language.id === lang.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lang.color }} />
                    {lang.label}
                  </button>
                ))}
              </div>
              {isEnded && <span className="text-xs text-muted-foreground">View Only</span>}
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={language.monaco}
                value={code}
                onChange={v => !isEnded && setCode(v || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 10, bottom: 10 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                  readOnly: isEnded || proctor.autoSubmitted,
                  contextmenu: false,
                  find: { seedSearchStringFromSelection: "never" },
                }}
              />
            </div>

            {/* Console Area */}
            <div className="h-40 border-t border-border/40 flex flex-col shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card/30 border-b border-border/40 shrink-0">
                <span className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                  <Code2 className="h-3.5 w-3.5" /> Console
                </span>
                <div className="flex-1" />
                {/* Custom input toggle */}
                <button
                  onClick={() => setShowCustomInput(v => !v)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-0.5 rounded border border-border/30 hover:border-border transition-all"
                >
                  Custom Input {showCustomInput ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {results && (
                  <span className={cn("text-sm font-semibold flex items-center gap-1",
                    results.verdict === "Accepted" ? "text-emerald-400" : "text-red-400"
                  )}>
                    {results.verdict === "Accepted"
                      ? <CheckCircle className="h-4 w-4" />
                      : <XCircle className="h-4 w-4" />}
                    {results.verdict}
                    <span className="text-xs text-muted-foreground ml-1">({results.passed}/{results.total})</span>
                    {results.runtime && <span className="text-xs text-muted-foreground">{results.runtime}ms</span>}
                  </span>
                )}
              </div>

              {showCustomInput ? (
                <textarea
                  className="flex-1 bg-[hsl(230,25%,4%)] text-xs font-mono p-3 resize-none outline-none border-none text-foreground/80 placeholder-muted-foreground"
                  placeholder="Enter custom input here..."
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                />
              ) : (
                <div className="flex-1 overflow-auto p-3 font-mono text-xs bg-[hsl(230,25%,4%)]">
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {isSubmitting ? "Judging all test cases..." : "Running..."}
                    </div>
                  ) : consoleError ? (
                    <pre className="text-red-400 whitespace-pre-wrap">{consoleError}</pre>
                  ) : results ? (
                    <div className="space-y-1.5">
                      {results.results?.map(r => (
                        <div key={r.testCase} className={cn(
                          "p-2 rounded border text-[11px]",
                          r.status === "Passed"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                            : r.status === "Time Limit Exceeded"
                            ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
                            : "border-red-400/30 bg-red-500/5 text-red-400"
                        )}>
                          <div className="flex items-center gap-1.5 font-semibold">
                            {r.status === "Passed" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            Test {r.testCase}: {r.status}
                            {r.time && <span className="font-normal ml-1 text-muted-foreground">{r.time}ms</span>}
                          </div>
                          {r.status !== "Passed" && r.expected && (
                            <div className="pl-4 mt-1 text-muted-foreground space-y-0.5">
                              <div>Expected: <span className="text-foreground">{r.expected}</span></div>
                              {r.got && <div>Got: <span className="text-foreground">{r.got}</span></div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {isEnded ? "Contest ended. View-only mode." : "Click Run to test samples, Submit to judge all cases."}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/40 bg-card/30 shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: language.color }} />
                {language.label}
              </div>

              {proctor.autoSubmitted ? (
                <span className="text-sm text-red-400 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Auto-submitted
                </span>
              ) : !isEnded ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleRun} disabled={isLoading} size="sm" className="gap-1.5 h-8 px-3 text-xs">
                    <Play className="h-3.5 w-3.5" /> Run
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading} size="sm" className="btn-neon gap-1.5 h-8 px-4 text-xs">
                    <Send className="h-3.5 w-3.5" /> Submit
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Contest ended</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Violations Slide-over ── */}
      {showViolations && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setShowViolations(false)}>
          <div className="flex-1" />
          <div className="w-72 bg-card border-l border-border/50 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" /> Violations Log
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowViolations(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <ViolationsPanel violations={proctor.violations} />
            </div>
            <div className="p-3 border-t border-border/50 text-xs text-muted-foreground text-center">
              {proctor.warnings}/3 warnings — {3 - proctor.warnings} remaining
            </div>
          </div>
        </div>
      )}

      {/* ── Leaderboard Slide-over ── */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setShowLeaderboard(false)}>
          <div className="flex-1" />
          <div className="w-72 bg-card border-l border-border/50 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" /> Live Leaderboard
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLeaderboard(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-1.5">
              {leaderboard.length === 0
                ? <p className="text-center text-muted-foreground text-sm py-8">No submissions yet</p>
                : leaderboard.map(e => (
                  <div key={e.userId} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold w-6">{e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}</span>
                      <div>
                        <p className="text-xs font-medium">{e.name}</p>
                        <p className="text-[10px] text-muted-foreground">{e.solved} solved</p>
                      </div>
                    </div>
                    <span className="text-primary font-bold text-sm">{e.score}pt</span>
                  </div>
                ))
              }
            </div>
            <div className="p-3 border-t border-border/50 text-[10px] text-muted-foreground text-center">
              Refreshes every 30 seconds
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
