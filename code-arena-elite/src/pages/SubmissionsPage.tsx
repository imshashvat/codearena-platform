import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const submissions = [
  {
    id: "sub-1",
    problemId: "1",
    problemTitle: "Two Sum",
    difficulty: "easy" as const,
    status: "accepted" as const,
    language: "Python",
    runtime: "52ms",
    memory: "14.2 MB",
    submittedAt: "2024-01-15 14:30:25",
    code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  },
  {
    id: "sub-2",
    problemId: "10",
    problemTitle: "Merge K Sorted Lists",
    difficulty: "hard" as const,
    status: "wrong_answer" as const,
    language: "Python",
    runtime: "N/A",
    memory: "N/A",
    submittedAt: "2024-01-15 10:15:42",
    code: `# Incomplete solution`,
  },
  {
    id: "sub-3",
    problemId: "9",
    problemTitle: "Valid Parentheses",
    difficulty: "easy" as const,
    status: "accepted" as const,
    language: "JavaScript",
    runtime: "68ms",
    memory: "12.8 MB",
    submittedAt: "2024-01-14 22:45:10",
    code: `function isValid(s) {
  const stack = [];
  const map = { ')': '(', ']': '[', '}': '{' };
  for (const char of s) {
    if ('([{'.includes(char)) stack.push(char);
    else if (stack.pop() !== map[char]) return false;
  }
  return stack.length === 0;
}`,
  },
  {
    id: "sub-4",
    problemId: "7",
    problemTitle: "Container With Most Water",
    difficulty: "medium" as const,
    status: "accepted" as const,
    language: "Python",
    runtime: "148ms",
    memory: "18.4 MB",
    submittedAt: "2024-01-14 18:20:33",
    code: `def maxArea(height):
    left, right = 0, len(height) - 1
    max_area = 0
    while left < right:
        area = min(height[left], height[right]) * (right - left)
        max_area = max(max_area, area)
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return max_area`,
  },
  {
    id: "sub-5",
    problemId: "4",
    problemTitle: "Median of Two Sorted Arrays",
    difficulty: "hard" as const,
    status: "time_limit" as const,
    language: "Python",
    runtime: "N/A",
    memory: "N/A",
    submittedAt: "2024-01-13 16:55:18",
    code: `# Time limit exceeded`,
  },
];

const statusFilters = ["all", "accepted", "wrong_answer", "pending", "time_limit"] as const;

export default function SubmissionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<(typeof submissions)[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = sub.problemTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

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
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50 border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary capitalize"
              >
                {statusFilters.map((status) => (
                  <option key={status} value={status} className="capitalize">
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Language
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Runtime
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Memory
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="table-row-hover">
                    <td className="p-4">
                      <Link
                        to={`/problem/${submission.problemId}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {submission.problemTitle}
                      </Link>
                      <div className="mt-1">
                        <DifficultyBadge difficulty={submission.difficulty} />
                      </div>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {submission.language}
                    </td>
                    <td className="p-4 text-sm">
                      <span className={submission.runtime !== "N/A" ? "text-neon-green" : "text-muted-foreground"}>
                        {submission.runtime}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {submission.memory}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {submission.submittedAt}
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
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredSubmissions.length} submissions
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
                Page {currentPage} of {totalPages || 1}
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
                  <h3 className="font-semibold">{selectedSubmission.problemTitle}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedSubmission.language} • {selectedSubmission.submittedAt}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedSubmission.status} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSubmission(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[hsl(230,25%,4%)]">
              <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">
                {selectedSubmission.code}
              </pre>
            </div>
            {selectedSubmission.status === "accepted" && (
              <div className="p-4 border-t border-border/50 flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Runtime:</span>{" "}
                  <span className="text-neon-green font-medium">{selectedSubmission.runtime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Memory:</span>{" "}
                  <span className="font-medium">{selectedSubmission.memory}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
}
