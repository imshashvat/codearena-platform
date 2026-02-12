import { Navigate, useLocation } from "react-router-dom";
import { PropsWithChildren, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const ProtectedRoute = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in or create an account to continue.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, toast]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
