"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // Redirect to login after sign-up
    router.push("/login");
  };

  const handleBackHome = async () => {
    router.push("/");
  };

  const handleLogin = async () => {
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">Create an Account</h1>
      <form onSubmit={handleSignup} className="mt-4 flex flex-col gap-4">
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-primary text-black px-4 py-2 rounded">
          Sign Up
        </button>
      </form>
      <button
        onClick={handleLogin}
        className="mt-4 text-sm hover:underline"
      >
        Login Instead
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

export default SignupPage;
