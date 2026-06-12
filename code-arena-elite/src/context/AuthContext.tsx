import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

import api from "@/lib/axios";

/* ===============================
   Types
================================ */

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
}

interface AuthContextValue {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;

  login: (token: string) => Promise<void>;
  logout: () => void;
}

/* ===============================
   Constants
================================ */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "token";

/* ===============================
   Provider
================================ */

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {

  const [token, setToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(token);

  /* ===============================
     Load User On App Start
  ================================ */

  useEffect(() => {

    const loadUser = async () => {

      if (!token) {
        setLoading(false);
        return;
      }

      try {

        const res = await api.get("/auth/profile");

        setUser(res.data.user);

      } catch (err) {

        console.error("Auth load failed", err);

        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);

      } finally {
        setLoading(false);
      }
    };

    loadUser();

  }, [token]);

  /* ===============================
     Login
  ================================ */

  const login = async (newToken: string) => {

    localStorage.setItem(TOKEN_KEY, newToken);

    setToken(newToken);

    try {

      const res = await api.get("/auth/profile");

      setUser(res.data.user);

    } catch (err) {
      console.error("Profile fetch failed after login", err);
    }
  };

  /* ===============================
     Logout
  ================================ */

  const logout = () => {

    localStorage.removeItem(TOKEN_KEY);

    setToken(null);

    setUser(null);
  };

  /* ===============================
     Context Value
  ================================ */

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      token,
      loading,
      login,
      logout,
    }),
    [isAuthenticated, user, token, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* ===============================
   Hook
================================ */

export const useAuth = () => {

  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return ctx;
};
