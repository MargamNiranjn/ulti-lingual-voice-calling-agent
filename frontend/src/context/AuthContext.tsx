"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  registerUser: (username: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const router = useRouter();

  useEffect(() => {
    // Check local storage for token and fetch current user profile
    async function loadUser() {
      const token = localStorage.getItem("leadsense_token");
      if (token) {
        try {
          const res = await api.get("/api/auth/me");
          setUser(res.data);
        } catch (err) {
          console.error("Failed to load user profile", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();

    // Load theme setting
    const savedTheme = localStorage.getItem("leadsense_theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light-theme");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("leadsense_theme", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  };

  const login = async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    const res = await api.post("/api/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const { access_token, role } = res.data;
    localStorage.setItem("leadsense_token", access_token);
    setUser({ username, email: "", role });
    router.push("/dashboard");
    
    // Fetch complete user profile in background
    try {
      const profile = await api.get("/api/auth/me");
      setUser(profile.data);
    } catch (err) {
      console.error(err);
    }
  };

  const registerUser = async (username: string, email: string, password: string, role: string) => {
    await api.post("/api/auth/register", { username, email, password, role });
  };

  const logout = () => {
    localStorage.removeItem("leadsense_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        registerUser,
        logout,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
