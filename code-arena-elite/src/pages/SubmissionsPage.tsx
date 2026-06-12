import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Code2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Submission {
  _id: string;
  problem: {
    _id: string;
    title: string;
    difficulty: "easy" | "medium" | "hard";
  };
  verdict: string;
  language: string;
  code: string;
  passed: number;
  total: number;
  createdAt: string;
}

const statusFilters = ["all", "Accepted", "Wrong Answer", "Compilation Error", "Runtime Error", "Time Limit Exceeded"] as const;

// Language color map matching ProblemSolvePage
const LANG_COLORS: Record<string, string> = {
  python:     "#3B82F6",
  javascript: "#22C55E",
  c:          "#F97316",
  cpp:        "#EF4444",
  java:       "#EAB308",
};

const LANG_LABELS: Record<string, string> = {
  python:     "Python 3",
  javascript: "JavaScript",
  c:          "C",
  cpp:        "C++17",
  java:       "Java",
};

function LanguageBadge({ lang }: { lang: string }) {
  const color = LANG_COLORS[lang] || "#94a3b8";
  const label = LANG_LABELS[lang] || lang;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch real submission history
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await api.get("/history");
        setSubmissions(res.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = sub.problem?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.verdict === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / itemsPerPage));
  const paginated = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const getStatusValue = (verdict: string): "accepted" | "wrong_answer" | "pending" | "time_limit" => {
    if (verdict === "Accepted") return "accepted";
    if (verdict === "Wrong Answer") return "wrong_answer";
    if (verdict === "Time Limit Exceeded") return "time_limit";
    if (verdict === "Compilation Error" || verdict === "Runtime Error") return "wrong_answer";
    return "pending";
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Submission <span className="gradient-text">History</span>
          </h1>
          <p className="text-muted-foreground">
            Track all your code submissions and verdicts
          </p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by problem name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-10 bg-background/50 border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary capitalize"
              >
                {statusFilters.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Problem</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Language</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Submitted</th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Clock className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading submissions...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-red-400">{error}</td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No submissions found.{" "}
                      <Link to="/problems" className="text-primary hover:underline">
                        Solve a problem!
                      </Link>
                    </td>
                  </tr>
                ) : (
                  paginated.map((submission) => (
                    <tr key={submission._id} className="table-row-hover">
                      <td className="p-4">
                        <Link
                          to={`/problem/${submission.problem?._id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {submission.problem?.title || "Unknown Problem"}
                        </Link>
                        <div className="mt-1">
                          <DifficultyBadge difficulty={submission.problem?.difficulty || "easy"} />
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={getStatusValue(submission.verdict)} />
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        <LanguageBadge lang={submission.language} />
                      </td>
                      <td className="p-4 text-sm">
                        <span className={submission.verdict === "Accepted" ? "text-neon-green font-medium" : "text-muted-foreground"}>
                          {submission.passed}/{submission.total}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatTime(submission.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {paginated.length} of {filteredSubmissions.length} submissions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedSubmission(null)}
          />
          <div className="relative glass-card w-full max-w-3xl max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Code2 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">{selectedSubmission.problem?.title}</h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {selectedSubmission.language} • {formatTime(selectedSubmission.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={getStatusValue(selectedSubmission.verdict)} />
                <Button variant="ghost" size="sm" onClick={() => setSelectedSubmission(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[hsl(230,25%,4%)]">
              <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">
                {selectedSubmission.code}
              </pre>
            </div>
            <div className="p-4 border-t border-border/50 flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Score: </span>
                <span className={cn("font-medium", selectedSubmission.verdict === "Accepted" ? "text-neon-green" : "text-red-400")}>
                  {selectedSubmission.passed}/{selectedSubmission.total} test cases
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Verdict: </span>
                <span className="font-medium">{selectedSubmission.verdict}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
