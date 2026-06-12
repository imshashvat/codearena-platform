import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  solved: number;
  submissions: number;
  totalPoints: number;
  rank: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard");
        setLeaderboard(res.data || []);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredUsers = leaderboard.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginated = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const myEntry = leaderboard.find((u) => u.name === user?.name);

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="text-3xl">🥇</span>;
    if (rank === 2) return <span className="text-3xl">🥈</span>;
    if (rank === 3) return <span className="text-3xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getAvatar = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <span>Global <span className="gradient-text">Leaderboard</span></span>
          </h1>
          <p className="text-muted-foreground">
            Top performers competing for coding supremacy
          </p>
        </div>

        {/* Current User Rank */}
        {myEntry ? (
          <div className="glass-card p-6 mb-6 animated-border">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {getAvatar(myEntry.name)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Ranking</p>
                  <p className="text-2xl font-bold">#{myEntry.rank.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{myEntry.totalPoints.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{myEntry.solved}</p>
                  <p className="text-xs text-muted-foreground">Solved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{myEntry.submissions}</p>
                  <p className="text-xs text-muted-foreground">Submissions</p>
                </div>
              </div>
            </div>
          </div>
        ) : !loading && (
          <div className="glass-card p-6 mb-6 text-center text-muted-foreground text-sm">
            Submit solutions to appear on the leaderboard!
          </div>
        )}

        {/* Search */}
        <div className="glass-card p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-10 bg-background/50 border-border"
            />
          </div>
        </div>

        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {leaderboard.slice(0, 3).map((u, index) => (
              <div
                key={u.userId}
                className={cn(
                  "glass-card p-6 text-center transition-all duration-300 hover:-translate-y-1",
                  index === 0 && "md:order-2 hover:shadow-glow-blue",
                  index === 1 && "md:order-1",
                  index === 2 && "md:order-3"
                )}
              >
                <div className="mb-4">{getRankDisplay(u.rank)}</div>
                <div
                  className={cn(
                    "h-16 w-16 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-xl",
                    index === 0 && "bg-primary/20 text-primary",
                    index === 1 && "bg-secondary/50 text-secondary-foreground",
                    index === 2 && "bg-neon-orange/20 text-neon-orange"
                  )}
                >
                  {getAvatar(u.name)}
                </div>
                <h3 className="font-semibold text-lg mb-1">{u.name}</h3>
                <p className="text-2xl font-bold text-primary mb-2">
                  {u.totalPoints.toLocaleString()}
                </p>
                <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                  <span>{u.solved} solved</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">Rank</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Solved</th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Submissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <Clock className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading leaderboard...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {search ? "No users match your search." : "No submissions yet. Be the first on the board!"}
                    </td>
                  </tr>
                ) : (
                  paginated.map((u) => (
                    <tr
                      key={u.userId}
                      className={cn(
                        "table-row-hover",
                        u.name === user?.name && "bg-primary/5 border-primary/20",
                        u.rank <= 3 && "bg-primary/[0.02]"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex items-center justify-center w-10">
                          {getRankDisplay(u.rank)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm",
                              u.rank === 1 && "bg-primary/20 text-primary",
                              u.rank === 2 && "bg-secondary/50 text-secondary-foreground",
                              u.rank === 3 && "bg-neon-orange/20 text-neon-orange",
                              u.rank > 3 && "bg-muted text-muted-foreground"
                            )}
                          >
                            {getAvatar(u.name)}
                          </div>
                          <span className={cn("font-medium", u.name === user?.name && "text-primary")}>
                            {u.name}
                            {u.name === user?.name && (
                              <span className="ml-2 text-xs text-primary/70">(you)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-semibold text-primary">
                          {u.totalPoints.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4 text-right text-muted-foreground">{u.solved}</td>
                      <td className="p-4 text-right text-muted-foreground">{u.submissions}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {paginated.length} of {filteredUsers.length} users
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
    </MainLayout>
  );
}
