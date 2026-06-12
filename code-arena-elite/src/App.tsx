import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProblemsPage from "./pages/ProblemsPage";
import ProblemSolvePage from "./pages/ProblemSolvePage";
import SubmissionsPage from "./pages/SubmissionsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminPage from "./pages/AdminPage";
import ContestsPage from "./pages/ContestsPage";
import ContestRoomPage from "./pages/ContestRoomPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/problems" element={<ProtectedRoute><ProblemsPage /></ProtectedRoute>} />
            <Route path="/problem/:id" element={<ProtectedRoute><ProblemSolvePage /></ProtectedRoute>} />
            <Route path="/submissions" element={<ProtectedRoute><SubmissionsPage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/contests" element={<ProtectedRoute><ContestsPage /></ProtectedRoute>} />
            <Route path="/contests/:id" element={<ProtectedRoute><ContestRoomPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
