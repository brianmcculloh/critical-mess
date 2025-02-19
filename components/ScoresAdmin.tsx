"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { usePathname } from "next/navigation";

interface ScoresAdminProps {
  movie: {
    id: number;
    critic_rating?: number | null;
    audience_rating?: number | null;
    nick_rating?: number | null;
    brian_rating?: number | null;
    gris_rating?: number | null;
    ben_rating?: number | null;
  };
}

const HOSTS = ["nick", "brian", "gris", "ben"] as const;

const ScoresAdmin: React.FC<ScoresAdminProps> = ({ movie }) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [updatedMovie, setUpdatedMovie] = useState(movie);
  const pathname = usePathname();
  const isAdminPage = pathname === "/admin";

  const saveAdminRating = async (field: string, value: string) => {
    setEditingField(null);
    if (value.trim() === "" || isNaN(Number(value))) return;
    
    try {
      const { error } = await supabase
        .from("movies")
        .update({ [field]: Number(value) })
        .eq("id", movie.id);
      if (error) throw error;
      
      setUpdatedMovie((prev) => ({ ...prev, [field]: Number(value) })); // Update state to reflect changes immediately
    } catch (error) {
      console.error(`🚨 Error updating ${field} rating:`, error);
    }
  };

  // Helper function to format the score
  const formatScore = (score: number | null | undefined) => {
    return score !== undefined && score !== null ? `${score}%` : "N/A";
  };

  return (
    <div className="mt-3">
      {[
        { label: "Critic Score", field: "critic_rating", value: updatedMovie.critic_rating },
        { label: "Audience Score", field: "audience_rating", value: updatedMovie.audience_rating },
        ...HOSTS.map((host) => ({
          label: `${host.charAt(0).toUpperCase() + host.slice(1)}'s Score`,
          field: `${host}_rating`,
          value: updatedMovie[`${host}_rating`],
        })),
      ].map(({ label, field, value }) => (
        <p key={field}>
          {label}:{" "}
          {isAdminPage && editingField === field ? (
            <input
              type="number"
              className="border rounded px-2 py-1 w-16 text-center"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onBlur={() => saveAdminRating(field, tempValue)}
              onKeyDown={(e) => e.key === "Enter" && saveAdminRating(field, tempValue)}
              autoFocus
            />
          ) : (
            <span onClick={() => { if (isAdminPage) { setEditingField(field); setTempValue(value?.toString() ?? ""); }}} className={isAdminPage ? "cursor-pointer font-bold" : "font-bold"}>
              {formatScore(value)}
            </span>
          )}
        </p>
      ))}
    </div>
  );
};

export default ScoresAdmin;