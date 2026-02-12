// FRONTEND: src/pages/LoginPage.tsx

import { useState } from "react";
import { Link, useNavigate, useLocation, type Location } from "react-router-dom";

import api from "@/lib/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Code2, ArrowRight, Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {

      // ✅ REAL LOGIN API
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const token = res.data.token;

      if (!token) {
        throw new Error("No token received");
      }

      // Save token via AuthContext
      login(token);

      toast.success("Welcome back!");

      const redirectTo =
        (location.state as { from?: Location })?.from?.pathname ||
        "/dashboard";

      navigate(redirectTo);

    } catch (err: any) {

      console.error("Login error:", err);

      setError(
        err?.response?.data?.message ||
        "Invalid email or password"
      );

    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">

      {/* Left Panel */}
      <div className="flex-1 flex items-center justify-center p-8">

        <div className="w-full max-w-md">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-12">
            <Code2 className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">
              Code<span className="text-primary">Arena</span>
            </span>
          </Link>


          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back
            </h1>

            <p className="text-muted-foreground">
              Sign in to continue your coding journey
            </p>
          </div>


          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">


            {/* Email */}
            <div className="space-y-2">

              <Label>Email</Label>

              <div className="relative">

                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />

              </div>

            </div>


            {/* Password */}
            <div className="space-y-2">

              <div className="flex justify-between">

                <Label>Password</Label>

                <span className="text-xs text-primary">
                  Forgot password?
                </span>

              </div>

              <div className="relative">

                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />

              </div>

            </div>


            {/* Button */}
            <Button
              type="submit"
              className="w-full bg-primary py-5 gap-2"
              disabled={isLoading}
            >

              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}

            </Button>

          </form>


          {/* Register Link */}
          <div className="mt-8 text-center text-sm text-muted-foreground">

            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-primary font-medium"
            >
              Create one
            </Link>

          </div>

        </div>
      </div>


      {/* Right Panel */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary/10 via-card to-accent/10 items-center justify-center p-12">

        <div className="relative text-center max-w-md">

          <div className="mb-8">

            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
              <Code2 className="h-16 w-16 text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-4">
              Level up your coding skills
            </h2>

            <p className="text-muted-foreground">
              Join thousands of developers practicing every day.
            </p>

          </div>

        </div>
      </div>

    </div>
  );
}
