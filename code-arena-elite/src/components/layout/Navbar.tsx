import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Code2, Menu, X, Trophy, LayoutDashboard, FileCode,
  History, Shield, CalendarDays, User, LogOut, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/problems",    label: "Problems",     icon: FileCode      },
  { href: "/contests",    label: "Contests",     icon: CalendarDays  },
  { href: "/leaderboard", label: "Leaderboard",  icon: Trophy        },
  { href: "/dashboard",   label: "Dashboard",    icon: LayoutDashboard },
  { href: "/submissions", label: "Submissions",  icon: History       },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate("/login");
    setShowUserMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-xl border-b border-border/40" />

      <nav className="container relative mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full transition-all group-hover:bg-primary/50 group-hover:blur-xl" />
              <div className="relative w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center transition-all group-hover:border-primary/60">
                <Code2 className="h-4.5 w-4.5 text-primary" />
              </div>
            </div>
            <span className="font-bold text-[18px] tracking-tight">
              Code<span className="text-primary">Arena</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "group relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-primary bg-primary/8"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className={cn(
                    "h-3.5 w-3.5 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  {link.label}
                  {/* Active indicator bar */}
                  <span className={cn(
                    "absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-primary transition-all duration-200",
                    isActive ? "w-4" : "w-0 group-hover:w-3"
                  )} />
                </Link>
              );
            })}
          </div>

          {/* ── Desktop Auth ── */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Admin badge */}
                {user?.role === "admin" && (
                  <Link to="/admin">
                    <Button
                      variant="ghost" size="sm"
                      className="gap-1.5 text-purple-400 border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/8 hover:text-purple-300 transition-all h-8 px-3 text-xs"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Admin
                    </Button>
                  </Link>
                )}

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-[10px] font-bold">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium max-w-[80px] truncate">{user?.name || "User"}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", showUserMenu && "rotate-180")} />
                  </button>

                  {/* Dropdown */}
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                        <div className="p-1">
                          <Link
                            to="/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                          >
                            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                          </Link>
                          <Link
                            to="/submissions"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
                          >
                            <History className="h-3.5 w-3.5" /> Submissions
                          </Link>
                        </div>
                        <div className="border-t border-border/50 p-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-all"
                          >
                            <LogOut className="h-3.5 w-3.5" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="btn-neon bg-primary text-primary-foreground h-8 px-4 text-sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Menu Toggle ── */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* ── Mobile Navigation ── */}
        <div className={cn(
          "md:hidden absolute top-full left-0 right-0 border-b border-border/40 transition-all duration-300 overflow-hidden",
          "bg-background/95 backdrop-blur-xl",
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-border/40 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium">{user?.name}</span>
                  {user?.role === "admin" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">ADMIN</span>
                  )}
                </div>
                <Button variant="outline" className="w-full h-9 text-sm gap-2" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full h-9 text-sm">Sign In</Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  <Button className="w-full h-9 text-sm btn-neon bg-primary text-primary-foreground">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
