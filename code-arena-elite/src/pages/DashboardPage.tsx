import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/ui/StatsCard";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Trophy,
  Target,
  TrendingUp,
  ChevronRight,
  Clock,
  Zap,
} from "lucide-react";

// Mock data - Replace with API calls
const userStats = {
  solved: 127,
  rank: 1284,
  points: 3450,
  streak: 7,
};

const recentSubmissions = [
  {
    id: "1",
    problemTitle: "Two Sum",
    difficulty: "easy" as const,
    status: "accepted" as const,
    language: "Python",
    submittedAt: "2 hours ago",
  },
  {
    id: "2",
    problemTitle: "Merge K Sorted Lists",
    difficulty: "hard" as const,
    status: "wrong_answer" as const,
    language: "JavaScript",
    submittedAt: "5 hours ago",
  },
  {
    id: "3",
    problemTitle: "Valid Parentheses",
    difficulty: "easy" as const,
    status: "accepted" as const,
    language: "Python",
    submittedAt: "1 day ago",
  },
  {
    id: "4",
    problemTitle: "LRU Cache",
    difficulty: "medium" as const,
    status: "accepted" as const,
    language: "Python",
    submittedAt: "2 days ago",
  },
];

const suggestedProblems = [
  { id: "1", title: "Binary Tree Level Order Traversal", difficulty: "medium" as const, points: 30 },
  { id: "2", title: "Longest Substring Without Repeating", difficulty: "medium" as const, points: 35 },
  { id: "3", title: "Maximum Subarray", difficulty: "easy" as const, points: 15 },
];

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">CodeMaster</span>
          </h1>
          <p className="text-muted-foreground">
            You're on a {userStats.streak}-day solving streak! Keep it up.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Problems Solved"
            value={userStats.solved}
            icon={<Code2 className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
            glowColor="blue"
          />
          <StatsCard
            title="Global Rank"
            value={`#${userStats.rank.toLocaleString()}`}
            icon={<Trophy className="h-5 w-5" />}
            trend={{ value: 45, isPositive: true }}
            glowColor="purple"
          />
          <StatsCard
            title="Total Points"
            value={userStats.points.toLocaleString()}
            icon={<Target className="h-5 w-5" />}
            trend={{ value: 8, isPositive: true }}
            glowColor="green"
          />
          <StatsCard
            title="Solving Streak"
            value={`${userStats.streak} days`}
            icon={<Zap className="h-5 w-5" />}
            glowColor="orange"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Submissions */}
          <div className="lg:col-span-2 glass-card">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Recent Submissions</h2>
              </div>
              <Link to="/submissions">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="divide-y divide-border/50">
              {recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="p-4 flex items-center gap-4 table-row-hover"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/problem/${submission.id}`}
                      className="font-medium hover:text-primary transition-colors truncate block"
                    >
                      {submission.problemTitle}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <DifficultyBadge difficulty={submission.difficulty} />
                      <span className="text-xs text-muted-foreground">
                        {submission.language}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={submission.status} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {submission.submittedAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Problems */}
          <div className="glass-card">
            <div className="p-4 border-b border-border/50 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Suggested For You</h2>
            </div>
            <div className="p-4 space-y-4">
              {suggestedProblems.map((problem) => (
                <Link
                  key={problem.id}
                  to={`/problem/${problem.id}`}
                  className="block glass-card p-4 hover:-translate-y-0.5 transition-all hover:shadow-glow-blue"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-sm mb-2">{problem.title}</h3>
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </div>
                    <div className="text-right">
                      <span className="text-primary font-semibold">
                        +{problem.points}
                      </span>
                      <p className="text-xs text-muted-foreground">pts</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="p-4 pt-0">
              <Link to="/problems">
                <Button variant="outline" className="w-full gap-2">
                  Browse All Problems
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Progress Chart Placeholder */}
        <div className="mt-6 glass-card p-6">
          <h2 className="font-semibold mb-4">Solving Progress</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
              <p className="text-2xl font-bold text-neon-green">45</p>
              <p className="text-xs text-muted-foreground mt-1">Easy</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-neon-orange/5 border border-neon-orange/20">
              <p className="text-2xl font-bold text-neon-orange">62</p>
              <p className="text-xs text-muted-foreground mt-1">Medium</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-neon-red/5 border border-neon-red/20">
              <p className="text-2xl font-bold text-neon-red">20</p>
              <p className="text-xs text-muted-foreground mt-1">Hard</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
