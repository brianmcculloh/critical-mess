"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Move fetchUser function outside useEffect so we can reuse it
  const fetchUser = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      const { data: userData, error } = await supabase
        .from("users")
        .select("id, email, is_admin")
        .eq("id", sessionData.session.user.id)
        .single();

      if (!error && userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          isAdmin: userData.is_admin,
        });
      }
    }
    setLoading(false);
  };

  // 🔹 Fetch user on mount
  useEffect(() => {
    fetchUser();

    // Listen for authentication state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchUser();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await fetchUser(); // ✅ Now fetchUser is accessible here
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
