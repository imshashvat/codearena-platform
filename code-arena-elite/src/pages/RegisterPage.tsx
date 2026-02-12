import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Code2, ArrowRight, Mail, Lock, User, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const failedRequirements = passwordRequirements.filter(
      (req) => !req.test(formData.password)
    );
    if (failedRequirements.length > 0) {
      setError("Password does not meet requirements");
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-accent/10 via-card to-primary/10 items-center justify-center p-12">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.03]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
        
        <div className="relative text-center max-w-md">
          <div className="mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-accent/10 mb-6">
              <Code2 className="h-16 w-16 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Join the community</h2>
            <p className="text-muted-foreground">
              Start solving problems and track your progress as you grow.
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              "Access 500+ coding challenges",
              "Track your solving progress",
              "Compete on global leaderboards",
              "Earn badges and achievements",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 glass-card p-3">
                <div className="p-1 rounded-full bg-primary/20">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-12">
            <Code2 className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">
              Code<span className="text-primary">Arena</span>
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create an account</h1>
            <p className="text-muted-foreground">
              Start your competitive programming journey
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  placeholder="codingmaster"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10 bg-muted/50 border-border focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 bg-muted/50 border-border focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 bg-muted/50 border-border focus:border-primary"
                />
              </div>
              {formData.password && (
                <div className="space-y-1 pt-2">
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.label}
                      className={`flex items-center gap-2 text-xs ${
                        req.test(formData.password)
                          ? "text-neon-green"
                          : "text-muted-foreground"
                      }`}
                    >
                      <div
                        className={`h-1 w-1 rounded-full ${
                          req.test(formData.password) ? "bg-neon-green" : "bg-muted-foreground"
                        }`}
                      />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 bg-muted/50 border-border focus:border-primary"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-neon bg-primary text-primary-foreground py-5 gap-2 mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
