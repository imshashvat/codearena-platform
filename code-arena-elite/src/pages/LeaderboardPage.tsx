import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Medal, Search, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data
const leaderboardData = [
  { rank: 1, username: "AlgorithmMaster", points: 15420, solved: 487, streak: 42, avatar: "AM" },
  { rank: 2, username: "CodeNinja", points: 14890, solved: 465, streak: 38, avatar: "CN" },
  { rank: 3, username: "ByteWarrior", points: 14350, solved: 451, streak: 35, avatar: "BW" },
  { rank: 4, username: "DataStructPro", points: 13920, solved: 438, streak: 30, avatar: "DP" },
  { rank: 5, username: "RecursiveKing", points: 13500, solved: 425, streak: 28, avatar: "RK" },
  { rank: 6, username: "BinarySearcher", points: 12890, solved: 412, streak: 25, avatar: "BS" },
  { rank: 7, username: "GraphExplorer", points: 12450, solved: 398, streak: 22, avatar: "GE" },
  { rank: 8, username: "DPWizard", points: 11980, solved: 385, streak: 20, avatar: "DW" },
  { rank: 9, username: "HeapMaster", points: 11520, solved: 372, streak: 18, avatar: "HM" },
  { rank: 10, username: "TreeTraverser", points: 11100, solved: 360, streak: 15, avatar: "TT" },
  { rank: 11, username: "StackOverflow", points: 10680, solved: 348, streak: 14, avatar: "SO" },
  { rank: 12, username: "QueueHandler", points: 10250, solved: 335, streak: 12, avatar: "QH" },
];

const currentUser = {
  rank: 1284,
  username: "CodeMaster",
  points: 3450,
  solved: 127,
  streak: 7,
  avatar: "CM",
};

const timeFilters = ["all-time", "monthly", "weekly"] as const;

export default function LeaderboardPage() {
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all-time" | "monthly" | "weekly">("all-time");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredUsers = leaderboardData.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-3xl">🥇</span>;
    if (rank === 2) return <span className="text-3xl">🥈</span>;
    if (rank === 3) return <span className="text-3xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <span>
              Global <span className="gradient-text">Leaderboard</span>
            </span>
          </h1>
          <p className="text-muted-foreground">
            Top performers competing for coding supremacy
          </p>
        </div>

        {/* Current User Rank */}
        <div className="glass-card p-6 mb-6 animated-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {currentUser.avatar}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Ranking</p>
                <p className="text-2xl font-bold">#{currentUser.rank.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{currentUser.points.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Points</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{currentUser.solved}</p>
                <p className="text-xs text-muted-foreground">Solved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-neon-orange">{currentUser.streak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50 border-border"
              />
            </div>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {timeFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium capitalize transition-colors",
                    timeFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted/50"
                  )}
                >
                  {filter.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {leaderboardData.slice(0, 3).map((user, index) => (
            <div
              key={user.rank}
              className={cn(
                "glass-card p-6 text-center transition-all duration-300 hover:-translate-y-1",
                index === 0 && "md:order-2 hover:shadow-glow-blue",
                index === 1 && "md:order-1",
                index === 2 && "md:order-3"
              )}
            >
              <div className="mb-4">{getRankDisplay(user.rank)}</div>
              <div
                className={cn(
                  "h-16 w-16 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-xl",
                  index === 0 && "bg-primary/20 text-primary",
                  index === 1 && "bg-secondary/50 text-secondary-foreground",
                  index === 2 && "bg-neon-orange/20 text-neon-orange"
                )}
              >
                {user.avatar}
              </div>
              <h3 className="font-semibold text-lg mb-1">{user.username}</h3>
              <p className="text-2xl font-bold text-primary mb-2">
                {user.points.toLocaleString()}
              </p>
              <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                <span>{user.solved} solved</span>
                <span>{user.streak} day streak</span>
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">
                    Rank
                  </th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Points
                  </th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Solved
                  </th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.rank}
                    className={cn(
                      "table-row-hover",
                      user.rank <= 3 && "bg-primary/[0.02]"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center justify-center w-10">
                        {getRankDisplay(user.rank)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm",
                            user.rank === 1 && "bg-primary/20 text-primary",
                            user.rank === 2 && "bg-secondary/50 text-secondary-foreground",
                            user.rank === 3 && "bg-neon-orange/20 text-neon-orange",
                            user.rank > 3 && "bg-muted text-muted-foreground"
                          )}
                        >
                          {user.avatar}
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-primary">
                        {user.points.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-right text-muted-foreground">
                      {user.solved}
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-neon-orange font-medium">
                        {user.streak} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing top {filteredUsers.length} users
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
    </MainLayout>
  );
}
