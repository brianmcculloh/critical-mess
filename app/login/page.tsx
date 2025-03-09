"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = () => {
  const { user } = useAuth(); // Get the user from AuthContext
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // For forgot password success message

  // If already logged in, redirect to admin automatically
  useEffect(() => {
    if (user && user.isAdmin) {
      router.push("/admin");
    } else if(user) {
      router.push("/");
    }
  }, [user, router]);

  const handleBackHome = async () => {
    router.push("/");
  };

  const handleCreateAccount = async () => {
    router.push("/signup");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("🚨 Login Error:", error.message);
      setError(error.message);
      return;
    }

    console.log("✅ Login successful:", data);
    router.push("/admin"); // Ensure user is redirected after login
  };

  // Forgot password function
  const handleForgotPassword = async () => {
    setError("");
    setMessage("");
    if (!email) {
      setError("Enter your email address to reset your password.");
      return;
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) {
      console.error("🚨 Password Reset Error:", error.message);
      setError(error.message);
    } else {
      setMessage("Password reset email has been sent. Check your inbox.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-4">
        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-500">{message}</p>}
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded xs:w-96 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded xs:w-96 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-primary text-black px-4 py-2 rounded">
          Login
        </button>
      </form>
      <button
        onClick={handleForgotPassword}
        className="mt-4 text-sm hover:underline"
      >
        Forgot Password?
      </button>
      <button
        onClick={handleCreateAccount}
        className="mt-4 text-sm hover:underline"
      >
        Create An Account
      </button>
      <button
        onClick={handleBackHome}
        className="mt-4 text-sm hover:underline"
      >
        &larr; Back To Homepage
      </button>
    </div>
  );
};

export default LoginPage;
