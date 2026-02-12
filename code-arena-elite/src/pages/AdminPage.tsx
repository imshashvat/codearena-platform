import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Shield,
  Code2,
  FileCode,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock data
const initialProblems = [
  { id: "1", title: "Two Sum", difficulty: "easy" as const, points: 10, testCases: 15 },
  { id: "2", title: "Add Two Numbers", difficulty: "medium" as const, points: 25, testCases: 12 },
  { id: "3", title: "Longest Substring", difficulty: "medium" as const, points: 30, testCases: 20 },
  { id: "4", title: "Median of Two Sorted Arrays", difficulty: "hard" as const, points: 50, testCases: 25 },
  { id: "5", title: "Valid Parentheses", difficulty: "easy" as const, points: 15, testCases: 10 },
];

const tabs = [
  { id: "problems", label: "Problems", icon: FileCode },
  { id: "testcases", label: "Test Cases", icon: Code2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("problems");
  const [problems, setProblems] = useState(initialProblems);
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: "",
    difficulty: "easy" as "easy" | "medium" | "hard",
    points: 10,
    description: "",
  });

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setProblems(problems.filter((p) => p.id !== id));
    toast.success("Problem deleted successfully");
  };

  const handleAddProblem = () => {
    if (!newProblem.title) {
      toast.error("Please enter a problem title");
      return;
    }

    const id = (problems.length + 1).toString();
    setProblems([
      ...problems,
      { id, ...newProblem, testCases: 0 },
    ]);
    setShowAddModal(false);
    setNewProblem({ title: "", difficulty: "easy", points: 10, description: "" });
    toast.success("Problem added successfully");
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <span>
                Admin <span className="gradient-text">Panel</span>
              </span>
            </h1>
            <p className="text-muted-foreground">
              Manage problems, test cases, and platform settings
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Problems Tab */}
        {activeTab === "problems" && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search problems..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background/50 border-border"
                />
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="btn-neon bg-primary text-primary-foreground gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Problem
              </Button>
            </div>

            {/* Problems List */}
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        ID
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Title
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Difficulty
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Points
                      </th>
                      <th className="p-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Test Cases
                      </th>
                      <th className="p-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredProblems.map((problem) => (
                      <tr key={problem.id} className="table-row-hover">
                        <td className="p-4 text-muted-foreground">#{problem.id}</td>
                        <td className="p-4 font-medium">{problem.title}</td>
                        <td className="p-4">
                          <DifficultyBadge difficulty={problem.difficulty} />
                        </td>
                        <td className="p-4">
                          <span className="text-primary font-semibold">+{problem.points}</span>
                        </td>
                        <td className="p-4 text-muted-foreground">{problem.testCases} cases</td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(problem.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Test Cases Tab */}
        {activeTab === "testcases" && (
          <div className="glass-card p-12 text-center">
            <Code2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Test Case Management</h3>
            <p className="text-muted-foreground mb-4">
              Select a problem to manage its test cases
            </p>
            <Button variant="outline" className="gap-2">
              Go to Problems
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-semibold">Platform Settings</h3>
            <div className="grid gap-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="siteName">Platform Name</Label>
                <Input
                  id="siteName"
                  defaultValue="CodeArena"
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSubmissions">Max Submissions Per Day</Label>
                <Input
                  id="maxSubmissions"
                  type="number"
                  defaultValue="100"
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="executionTimeout">Execution Timeout (seconds)</Label>
                <Input
                  id="executionTimeout"
                  type="number"
                  defaultValue="10"
                  className="bg-muted/50 border-border"
                />
              </div>
              <Button className="w-fit btn-neon bg-primary text-primary-foreground gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Problem Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative glass-card w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-semibold">Add New Problem</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Problem Title</Label>
                <Input
                  id="title"
                  value={newProblem.title}
                  onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                  placeholder="e.g., Two Sum"
                  className="bg-muted/50 border-border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    value={newProblem.difficulty}
                    onChange={(e) =>
                      setNewProblem({
                        ...newProblem,
                        difficulty: e.target.value as "easy" | "medium" | "hard",
                      })
                    }
                    className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newProblem.points}
                    onChange={(e) =>
                      setNewProblem({ ...newProblem, points: parseInt(e.target.value) || 0 })
                    }
                    className="bg-muted/50 border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Problem Description</Label>
                <Textarea
                  id="description"
                  value={newProblem.description}
                  onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                  placeholder="Enter problem description..."
                  rows={4}
                  className="bg-muted/50 border-border resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-border/50">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddProblem}
                className="btn-neon bg-primary text-primary-foreground gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Problem
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
