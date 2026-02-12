import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Mock problem data
const problem = {
  id: "1",
  title: "Two Sum",
  difficulty: "easy" as const,
  points: 10,
  description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
  examples: [
    {
      input: "nums = [2,7,11,15], target = 9",
      output: "[0,1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      input: "nums = [3,2,4], target = 6",
      output: "[1,2]",
      explanation: "",
    },
    {
      input: "nums = [3,3], target = 6",
      output: "[0,1]",
      explanation: "",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  tags: ["Array", "Hash Table"],
};

const defaultCode = `def two_sum(nums, target):
    # Write your solution here
    pass

# Test your solution
print(two_sum([2, 7, 11, 15], 9))`;

const languages = [
  { id: "python", name: "Python", extension: "py" },
  { id: "javascript", name: "JavaScript", extension: "js" },
  { id: "typescript", name: "TypeScript", extension: "ts" },
  { id: "java", name: "Java", extension: "java" },
  { id: "cpp", name: "C++", extension: "cpp" },
];

export default function ProblemSolvePage() {
  const { id } = useParams();
  const [code, setCode] = useState(defaultCode);
  const [language, setLanguage] = useState("python");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<"accepted" | "wrong_answer" | "error" | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "solutions" | "submissions">("description");

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    setVerdict(null);

    // Simulate code execution
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setOutput("[0, 1]\n\nExecution time: 45ms\nMemory: 12.4 MB");
    setIsRunning(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setOutput(null);
    setVerdict(null);

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setVerdict("accepted");
    setOutput("All test cases passed!\n\n✓ Test case 1: Passed\n✓ Test case 2: Passed\n✓ Test case 3: Passed\n✓ Hidden test cases: Passed\n\nRuntime: 52ms (faster than 89%)\nMemory: 14.2 MB (less than 67%)");
    toast.success("Congratulations! All test cases passed!");
    setIsSubmitting(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const handleResetCode = () => {
    setCode(defaultCode);
    toast.info("Code reset to default");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link to="/problems" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Problems</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="font-semibold">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">+{problem.points} pts</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Problem Description */}
        <div className="w-1/2 border-r border-border/50 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-border/50">
            {[
              { id: "description", label: "Description", icon: BookOpen },
              { id: "solutions", label: "Solutions", icon: Lightbulb },
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

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === "description" && (
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="text-foreground whitespace-pre-wrap mb-6">
                  {problem.description}
                </div>

                <h3 className="text-lg font-semibold mb-4">Examples</h3>
                {problem.examples.map((example, i) => (
                  <div key={i} className="glass-card p-4 mb-4 font-mono text-sm">
                    <div className="mb-2">
                      <span className="text-muted-foreground">Input:</span>{" "}
                      <span className="text-foreground">{example.input}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-muted-foreground">Output:</span>{" "}
                      <span className="text-neon-green">{example.output}</span>
                    </div>
                    {example.explanation && (
                      <div className="text-muted-foreground">
                        <span>Explanation:</span> {example.explanation}
                      </div>
                    )}
                  </div>
                ))}

                <h3 className="text-lg font-semibold mb-4">Constraints</h3>
                <ul className="space-y-1 mb-6">
                  {problem.constraints.map((constraint, i) => (
                    <li key={i} className="text-sm font-mono text-muted-foreground">
                      • {constraint}
                    </li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
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
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-1/2 flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-card/30">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleResetCode}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
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
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
          </div>

          {/* Output Console */}
          <div className="h-48 border-t border-border/50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-card/30 border-b border-border/50">
              <span className="text-sm font-medium">Console</span>
              {verdict && (
                <div className="flex items-center gap-2">
                  {verdict === "accepted" ? (
                    <span className="flex items-center gap-1 text-neon-green text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Accepted
                    </span>
                  ) : verdict === "wrong_answer" ? (
                    <span className="flex items-center gap-1 text-neon-red text-sm">
                      <XCircle className="h-4 w-4" />
                      Wrong Answer
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-neon-red text-sm">
                      <XCircle className="h-4 w-4" />
                      Error
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-auto bg-[hsl(230,25%,4%)]">
              {isRunning || isSubmitting ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" />
                  {isSubmitting ? "Submitting..." : "Running..."}
                </div>
              ) : output ? (
                <pre className="text-foreground whitespace-pre-wrap">{output}</pre>
              ) : (
                <span className="text-muted-foreground">
                  Click "Run" to test your code or "Submit" to submit your solution
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-border/50 bg-card/30">
            <Button
              variant="outline"
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Run
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting}
              className="btn-neon bg-primary text-primary-foreground gap-2"
            >
              <Send className="h-4 w-4" />
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
