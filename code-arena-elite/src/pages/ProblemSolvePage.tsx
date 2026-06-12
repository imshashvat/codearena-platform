import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import api from "@/lib/axios";
import {
  Play,
  Send,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Settings,
  Maximize2,
  Copy,
  RotateCcw,
  AlertTriangle,
  Zap,
  Terminal,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ========================
// Types
// ========================
interface TestCase {
  input: string;
  output: string;
  hidden: boolean;
}

interface Problem {
  _id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  testCases: TestCase[];
}

interface TestResult {
  testCase: number;
  status: string;
  expected?: string;
  got?: string;
  compileError?: string;
}

interface SubmitResult {
  verdict: string;
  passed: number;
  total: number;
  results: TestResult[];
  compileError?: string;
}

// ========================
// Language Definitions
// ========================
interface Language {
  id: string;
  name: string;
  monacoLang: string;
  color: string;
  compiled: boolean;
}

const LANGUAGES: Language[] = [
  { id: "python",     name: "Python 3",   monacoLang: "python",     color: "#3B82F6", compiled: false },
  { id: "cpp",        name: "C++17",       monacoLang: "cpp",        color: "#EF4444", compiled: true  },
  { id: "c",          name: "C",           monacoLang: "c",          color: "#F97316", compiled: true  },
  { id: "java",       name: "Java",        monacoLang: "java",       color: "#EAB308", compiled: true  },
  { id: "javascript", name: "JavaScript",  monacoLang: "javascript", color: "#22C55E", compiled: false },
];

const DEFAULT_CODE: Record<string, string> = {
  python: `import sys
input = sys.stdin.readline

def solve():
    # Read input and write your solution here
    pass

solve()
`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your solution here

    return 0;
}
`,

  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // Write your solution here

    return 0;
}
`,

  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        // Write your solution here

    }
}
`,

  javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
    // Write your solution here
    // Access input lines via lines[0], lines[1], etc.
});
`,
};

// ========================
// Verdict helpers
// ========================
type VerdictType = "accepted" | "wrong" | "tle" | "rte" | "ce" | null;

function getVerdictType(verdict: string): VerdictType {
  if (!verdict) return null;
  if (verdict === "Accepted") return "accepted";
  if (verdict === "Compilation Error") return "ce";
  if (verdict === "Time Limit Exceeded") return "tle";
  if (verdict === "Runtime Error") return "rte";
  return "wrong";
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const type = getVerdictType(verdict);
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full",
        type === "accepted" && "bg-green-500/15 text-green-400 border border-green-500/30",
        type === "wrong"    && "bg-red-500/15 text-red-400 border border-red-500/30",
        type === "tle"      && "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
        type === "rte"      && "bg-orange-500/15 text-orange-400 border border-orange-500/30",
        type === "ce"       && "bg-purple-500/15 text-purple-400 border border-purple-500/30",
      )}
    >
      {type === "accepted" ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {verdict}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Passed") return <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />;
  if (status === "Time Limit Exceeded") return <Clock className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
  if (status.includes("Runtime Error")) return <Zap className="h-3.5 w-3.5 text-orange-400 shrink-0" />;
  if (status.includes("Compilation Error")) return <Code2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />;
  return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
}

function getStatusColor(status: string) {
  if (status === "Passed") return "border-green-500/30 bg-green-500/5 text-green-400";
  if (status === "Time Limit Exceeded") return "border-yellow-500/30 bg-yellow-500/5 text-yellow-400";
  if (status.includes("Runtime Error")) return "border-orange-500/30 bg-orange-500/5 text-orange-400";
  if (status.includes("Compilation Error")) return "border-purple-500/30 bg-purple-500/5 text-purple-400";
  return "border-red-400/30 bg-red-400/5 text-red-400";
}

// ========================
// Main Component
// ========================
export default function ProblemSolvePage() {
  const { id } = useParams<{ id: string }>();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(true);
  const [problemError, setProblemError] = useState("");

  const [language, setLanguage] = useState<Language>(LANGUAGES[0]);
  const [code, setCode] = useState(DEFAULT_CODE["python"]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [consoleError, setConsoleError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "solutions" | "submissions">("description");

  // ========================
  // Load Problem
  // ========================
  useEffect(() => {
    const fetchProblem = async () => {
      setLoadingProblem(true);
      setProblemError("");
      try {
        const res = await api.get(`/problems/${id}`);
        setProblem(res.data);
      } catch (err: any) {
        setProblemError(err?.response?.data?.message || "Failed to load problem");
      } finally {
        setLoadingProblem(false);
      }
    };
    if (id) fetchProblem();
  }, [id]);

  // ========================
  // Language Switch
  // ========================
  const handleLanguageChange = (langId: string) => {
    const lang = LANGUAGES.find(l => l.id === langId);
    if (!lang) return;
    setLanguage(lang);
    setCode(DEFAULT_CODE[langId] || "// Write your solution here\n");
    setSubmitResult(null);
    setConsoleError(null);
  };

  // ========================
  // Run
  // ========================
  const handleRun = async () => {
    if (!problem) return;
    setIsRunning(true);
    setSubmitResult(null);
    setConsoleError(null);
    try {
      const res = await api.post("/submit", {
        problemId: problem._id,
        code,
        language: language.id,
        runMode: "run",
      });
      setSubmitResult(res.data);
      if (res.data.verdict === "Accepted") {
        toast.success("✅ All sample tests passed!");
      } else if (res.data.verdict === "Compilation Error") {
        toast.error("Compilation Error — check your code");
      } else {
        toast.warning(`${res.data.passed}/${res.data.total} sample tests passed`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Execution failed";
      setConsoleError(msg);
      toast.error("Run failed: " + msg);
    } finally {
      setIsRunning(false);
    }
  };

  // ========================
  // Submit
  // ========================
  const handleSubmit = async () => {
    if (!problem) return;
    setIsSubmitting(true);
    setSubmitResult(null);
    setConsoleError(null);
    try {
      const res = await api.post("/submit", {
        problemId: problem._id,
        code,
        language: language.id,
        runMode: "submit",
      });
      setSubmitResult(res.data);
      if (res.data.verdict === "Accepted") {
        toast.success("🎉 Congratulations! All test cases passed!");
      } else if (res.data.verdict === "Compilation Error") {
        toast.error("Compilation Error — fix your code and resubmit");
      } else {
        toast.error(`${res.data.verdict} — ${res.data.passed}/${res.data.total} passed`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || "Submission failed";
      setConsoleError(msg);
      toast.error("Submit failed: " + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const handleResetCode = () => {
    setCode(DEFAULT_CODE[language.id] || "");
    setSubmitResult(null);
    setConsoleError(null);
    toast.info("Code reset to default template");
  };

  const verdictType = submitResult ? getVerdictType(submitResult.verdict) : null;
  const isLoading = isRunning || isSubmitting;
  const loadingLabel = isSubmitting
    ? language.compiled ? "Compiling & Judging..." : "Judging..."
    : language.compiled ? "Compiling & Running..." : "Running...";

  // ========================
  // Loading / Error states
  // ========================
  if (loadingProblem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Clock className="h-5 w-5 animate-spin" />
          Loading problem...
        </div>
      </div>
    );
  }

  if (problemError || !problem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Problem Not Found</h2>
          <p className="text-muted-foreground mb-4">{problemError}</p>
          <Link to="/problems">
            <Button variant="outline">← Back to Problems</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ── */}
      <header className="h-14 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to="/problems"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Problems</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-semibold truncate max-w-xs">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">+{problem.points} pts</span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left Panel – Problem Description ── */}
        <div className="w-1/2 border-r border-border/50 flex flex-col min-h-0">
          {/* Tabs */}
          <div className="flex border-b border-border/50 shrink-0">
            {[
              { id: "description", label: "Description", icon: BookOpen },
              { id: "solutions",   label: "Solutions",   icon: Lightbulb },
              { id: "submissions", label: "Submissions", icon: MessageSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === "description" && (
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-foreground whitespace-pre-wrap mb-6">
                  {problem.description}
                </div>

                {problem.inputFormat && (
                  <>
                    <h3 className="text-base font-semibold mb-2">Input Format</h3>
                    <p className="text-muted-foreground mb-4">{problem.inputFormat}</p>
                  </>
                )}

                {problem.outputFormat && (
                  <>
                    <h3 className="text-base font-semibold mb-2">Output Format</h3>
                    <p className="text-muted-foreground mb-4">{problem.outputFormat}</p>
                  </>
                )}

                {problem.testCases.filter(tc => !tc.hidden).length > 0 && (
                  <>
                    <h3 className="text-base font-semibold mb-3">Sample Test Cases</h3>
                    {problem.testCases.filter(tc => !tc.hidden).map((tc, i) => (
                      <div key={i} className="glass-card p-4 mb-4 font-mono text-sm">
                        <div className="mb-2">
                          <span className="text-muted-foreground">Input: </span>
                          <span className="text-foreground">{tc.input}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Output: </span>
                          <span className="text-neon-green">{tc.output}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {activeTab === "solutions" && (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Solutions will be available after you solve the problem</p>
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your submissions will appear here</p>
                <Link
                  to="/submissions"
                  className="text-primary text-sm mt-2 inline-block hover:underline"
                >
                  View all submissions →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel – Code Editor ── */}
        <div className="w-1/2 flex flex-col min-h-0">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/30 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-muted/30 rounded-lg p-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => handleLanguageChange(lang.id)}
                    title={lang.name}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
                      language.id === lang.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    )}
                  >
                    {/* Language color dot */}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: lang.color }}
                    />
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleCopyCode} title="Copy code">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetCode} title="Reset to template">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language.monacoLang}
              value={code}
              onChange={(value) => setCode(value || "")}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                tabSize: language.id === "python" ? 4 : 4,
                insertSpaces: true,
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true },
              }}
            />
          </div>

          {/* ── Output Console ── */}
          <div className="h-56 border-t border-border/50 flex flex-col shrink-0">
            {/* Console Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-card/30 border-b border-border/50 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Console</span>
                {submitResult && (
                  <span className="text-xs text-muted-foreground ml-1">
                    · {submitResult.passed}/{submitResult.total} passed
                  </span>
                )}
              </div>
              {submitResult && <VerdictBadge verdict={submitResult.verdict} />}
            </div>

            {/* Console Body */}
            <div className="flex-1 overflow-auto p-4 font-mono text-sm bg-[hsl(230,25%,4%)]">
              {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" />
                  {loadingLabel}
                </div>
              ) : consoleError ? (
                <div className="text-red-400">
                  <span className="text-muted-foreground font-medium">Error: </span>
                  <span className="whitespace-pre-wrap">{consoleError}</span>
                </div>
              ) : submitResult ? (
                <div className="space-y-2">
                  {/* Compilation Error block */}
                  {submitResult.compileError && (
                    <div className="p-3 rounded border border-purple-500/30 bg-purple-500/5 text-purple-300 text-xs">
                      <div className="font-semibold mb-2 flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5" />
                        Compilation Error
                      </div>
                      <pre className="whitespace-pre-wrap text-purple-200">{submitResult.compileError}</pre>
                    </div>
                  )}

                  {/* Per-test-case results */}
                  {!submitResult.compileError && submitResult.results.map((r) => (
                    <div
                      key={r.testCase}
                      className={cn(
                        "p-2.5 rounded border text-xs",
                        getStatusColor(r.status)
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold mb-1">
                        <StatusIcon status={r.status} />
                        Test {r.testCase}: {r.status}
                      </div>
                      {r.status !== "Passed" && r.status !== "Time Limit Exceeded" && !r.status.includes("Compilation Error") && (
                        <div className="text-muted-foreground space-y-0.5 pl-5">
                          {r.expected !== undefined && (
                            <div>Expected: <span className="text-foreground font-medium">{r.expected}</span></div>
                          )}
                          {r.got !== undefined && (
                            <div>Got: <span className="text-foreground font-medium whitespace-pre-wrap">{r.got}</span></div>
                          )}
                        </div>
                      )}
                      {r.status === "Time Limit Exceeded" && (
                        <div className="text-yellow-400/70 pl-5 text-xs">Execution exceeded 5 seconds</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  Click <span className="text-foreground font-semibold">Run</span> to test your code or{" "}
                  <span className="text-foreground font-semibold">Submit</span> to judge against all test cases
                </span>
              )}
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-card/30 shrink-0">
            {/* Language info */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: language.color }}
              />
              {language.name}
              {language.compiled && (
                <span className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                  compiled
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRun}
                disabled={isLoading}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Run
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-neon bg-primary text-primary-foreground gap-2"
              >
                <Send className="h-4 w-4" />
                Submit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
