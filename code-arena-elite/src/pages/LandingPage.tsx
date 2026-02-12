import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { CodeBackground } from "@/components/ui/CodeBackground";
import { 
  ArrowRight, 
  Code2, 
  Trophy, 
  Users, 
  Zap, 
  Target,
  TrendingUp,
  Shield,
  ChevronRight
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "500+ Coding Challenges",
    description: "From basic algorithms to complex system design problems, curated by industry experts.",
  },
  {
    icon: Zap,
    title: "Real-time Code Execution",
    description: "Run your code instantly with our high-performance distributed judge system.",
  },
  {
    icon: Trophy,
    title: "Competitive Leaderboards",
    description: "Compete with developers worldwide and climb the global rankings.",
  },
  {
    icon: Target,
    title: "Interview Preparation",
    description: "Practice problems from top tech companies like Google, Meta, and Amazon.",
  },
  {
    icon: Users,
    title: "Active Community",
    description: "Join discussions, share solutions, and learn from thousands of developers.",
  },
  {
    icon: Shield,
    title: "Secure & Fair",
    description: "Anti-cheat detection and plagiarism checking ensure fair competition.",
  },
];

const topCoders = [
  { rank: 1, name: "AlgorithmMaster", points: 15420, solved: 487, avatar: "AM" },
  { rank: 2, name: "CodeNinja", points: 14890, solved: 465, avatar: "CN" },
  { rank: 3, name: "ByteWarrior", points: 14350, solved: 451, avatar: "BW" },
  { rank: 4, name: "DataStructPro", points: 13920, solved: 438, avatar: "DP" },
  { rank: 5, name: "RecursiveKing", points: 13500, solved: 425, avatar: "RK" },
];

export default function LandingPage() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        <CodeBackground />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        <div className="container relative mx-auto px-4 lg:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-sm font-medium text-primary">
                Join 50,000+ developers competing daily
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Practice.{" "}
              <span className="gradient-text">Compete.</span>
              <br />
              Master Coding.
            </h1>

            {/* Subheading */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Sharpen your algorithmic skills, solve challenging problems, and prove your expertise 
              on the ultimate competitive programming platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/problems">
                <Button size="lg" className="btn-neon bg-primary text-primary-foreground px-8 py-6 text-lg gap-2 group">
                  Start Coding
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-border hover:bg-muted/50">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-border/50 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <div>
                <p className="text-3xl md:text-4xl font-bold gradient-text">500+</p>
                <p className="text-muted-foreground text-sm mt-1">Coding Problems</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold gradient-text">50K+</p>
                <p className="text-muted-foreground text-sm mt-1">Active Users</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold gradient-text">1M+</p>
                <p className="text-muted-foreground text-sm mt-1">Submissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">level up</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed to take your coding skills from beginner to expert.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-blue group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Climb the{" "}
                <span className="gradient-text">global rankings</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Compete with developers from around the world. Solve problems, earn points, 
                and showcase your skills on our global leaderboard.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Real-time ranking updates",
                  "Weekly and monthly competitions",
                  "Badges and achievements",
                  "Profile showcasing solved problems",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/leaderboard">
                <Button variant="outline" className="gap-2 group">
                  View Full Leaderboard
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Top Performers</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Live
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {topCoders.map((coder) => (
                  <div
                    key={coder.rank}
                    className="px-4 py-3 flex items-center gap-4 table-row-hover"
                  >
                    <div className="w-8 flex justify-center">
                      {coder.rank === 1 ? (
                        <span className="text-2xl">🥇</span>
                      ) : coder.rank === 2 ? (
                        <span className="text-2xl">🥈</span>
                      ) : coder.rank === 3 ? (
                        <span className="text-2xl">🥉</span>
                      ) : (
                        <span className="text-muted-foreground font-medium">#{coder.rank}</span>
                      )}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {coder.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{coder.name}</p>
                      <p className="text-xs text-muted-foreground">{coder.solved} problems solved</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{coder.points.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent" />
        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="glass-card p-12 md:p-16 text-center max-w-4xl mx-auto animated-border">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to start your coding journey?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of developers who are improving their skills every day. 
              Create your free account and start solving problems now.
            </p>
            <Link to="/register">
              <Button size="lg" className="btn-neon bg-primary text-primary-foreground px-10 py-6 text-lg gap-2">
                Create Free Account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
