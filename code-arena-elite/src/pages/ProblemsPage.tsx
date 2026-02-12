// FRONTEND: src/pages/ProblemsPage.tsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "@/lib/axios";

import { MainLayout } from "@/components/layout/MainLayout";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Search,
  Filter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";


// ========================
// Types
// ========================

interface Problem {
  _id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
}



// ========================
// Component
// ========================

export default function ProblemsPage() {

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] =
    useState<"all" | "easy" | "medium" | "hard">("all");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;



  // ========================
  // Fetch Problems
  // ========================

  useEffect(() => {

    const fetchProblems = async () => {
      try {

        const res = await api.get("/problems");

        setProblems(res.data);

      } catch (err) {
        console.error("Failed to load problems", err);
      }
      finally {
        setLoading(false);
      }
    };

    fetchProblems();

  }, []);




  // ========================
  // Filters
  // ========================

  const filteredProblems = problems.filter((problem) => {

    const matchesSearch =
      problem.title.toLowerCase().includes(search.toLowerCase());

    const matchesDifficulty =
      difficulty === "all" || problem.difficulty === difficulty;

    return matchesSearch && matchesDifficulty;

  });




  // ========================
  // Pagination
  // ========================

  const totalPages = Math.ceil(filteredProblems.length / itemsPerPage);

  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );




  // ========================
  // Loading State
  // ========================

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-20 text-center text-muted-foreground">
          Loading problems...
        </div>
      </MainLayout>
    );
  }




  // ========================
  // UI
  // ========================

  return (
    <MainLayout>

      <div className="container mx-auto px-4 lg:px-8 py-8">


        {/* Header */}
        <div className="mb-8">

          <h1 className="text-3xl font-bold mb-2">
            Coding <span className="gradient-text">Problems</span>
          </h1>

          <p className="text-muted-foreground">
            Browse and solve {problems.length}+ algorithmic challenges
          </p>

        </div>



        {/* Filters */}
        <div className="glass-card p-4 mb-6">

          <div className="flex flex-col lg:flex-row gap-4">


            {/* Search */}
            <div className="relative flex-1">

              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background/50 border-border"
              />

            </div>



            {/* Difficulty */}
            <div className="flex items-center gap-2">

              <Filter className="h-4 w-4 text-muted-foreground" />

              <div className="flex rounded-lg overflow-hidden border border-border">

                {["all", "easy", "medium", "hard"].map((d) => (

                  <button
                    key={d}
                    onClick={() => setDifficulty(d as any)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium capitalize transition-colors",

                      difficulty === d
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {d}
                  </button>

                ))}

              </div>

            </div>

          </div>

        </div>




        {/* Table */}
        <div className="glass-card overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full">


              <thead>

                <tr className="border-b border-border/50">

                  <th className="p-4 text-left text-xs text-muted-foreground w-12">
                    Status
                  </th>

                  <th className="p-4 text-left text-xs text-muted-foreground">
                    Title
                  </th>

                  <th className="p-4 text-left text-xs text-muted-foreground">
                    Difficulty
                  </th>

                  <th className="p-4 text-right text-xs text-muted-foreground">
                    Points
                  </th>

                </tr>

              </thead>




              <tbody className="divide-y divide-border/50">

                {paginatedProblems.map((problem) => (

                  <tr key={problem._id} className="table-row-hover">


                    <td className="p-4">
                      <CheckCircle className="h-5 w-5 text-neon-green opacity-50" />
                    </td>


                    <td className="p-4">

                      <Link
                        to={`/problem/${problem._id}`}
                        className="font-medium hover:text-primary"
                      >
                        {problem.title}
                      </Link>

                    </td>


                    <td className="p-4">
                      <DifficultyBadge difficulty={problem.difficulty} />
                    </td>


                    <td className="p-4 text-right">

                      <span className="font-semibold text-primary">
                        +{problem.points}
                      </span>

                    </td>


                  </tr>

                ))}

              </tbody>


            </table>

          </div>




          {/* Pagination */}
          <div className="p-4 border-t border-border/50 flex justify-between items-center">


            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
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
