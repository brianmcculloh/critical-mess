"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ScoresUserProps {
  movieId: number;
  setUserRating: (rating: number | null) => void;
}

const ScoresUser: React.FC<ScoresUserProps> = ({ movieId, setUserRating }) => {
  const [userRating, setUserRatingState] = useState<number | null>(null);
  const [avgUserRating, setAvgUserRating] = useState<number | null>(null);
  const [numUserRatings, setNumUserRatings] = useState<number>(0);
  const [editingUserRating, setEditingUserRating] = useState(false);

  useEffect(() => {
    const fetchUserAndAvgRating = async () => {
      const clientId = localStorage.getItem("client_id");
      if (!clientId) return;

      const { data: userData } = await supabase
        .from("user_ratings")
        .select("rating")
        .eq("movie_id", movieId)
        .eq("client_id", clientId)
        .maybeSingle();

      if (userData) {
        setUserRatingState(userData.rating);
        setUserRating(userData.rating);
      }

      const { data: avgData } = await supabase
        .from("user_ratings")
        .select("rating")
        .eq("movie_id", movieId);
      
      if (avgData && avgData.length > 0) {
        const avgRating = avgData.reduce((sum, entry) => sum + entry.rating, 0) / avgData.length;
        setAvgUserRating(avgRating);
        setNumUserRatings(avgData.length);
      }
    };
    
    fetchUserAndAvgRating();
  }, [movieId]);

  const saveUserRating = async () => {
    if (userRating === null || userRating < 0 || userRating > 100) return;
    setEditingUserRating(false);
    const clientId = localStorage.getItem("client_id");
    if (!clientId) return;
    
    try {
      const { data } = await supabase
        .from("user_ratings")
        .select("rating")
        .eq("client_id", clientId)
        .eq("movie_id", movieId);

      if (!data || data.length === 0) {
        await supabase.from("user_ratings").insert({
          client_id: clientId,
          movie_id: movieId,
          rating: userRating
        });
      } else {
        await supabase.from("user_ratings").update({ rating: userRating }).eq("client_id", clientId).eq("movie_id", movieId);
      }
      
      const { data: avgData } = await supabase
        .from("user_ratings")
        .select("rating")
        .eq("movie_id", movieId);
      
      if (avgData && avgData.length > 0) {
        const avgRating = avgData.reduce((sum, entry) => sum + entry.rating, 0) / avgData.length;
        setAvgUserRating(avgRating);
        setNumUserRatings(avgData.length);
      }
    } catch (error) {
      console.error("🚨 Error saving user rating:", error);
    }
  };

  return (
    <div className="mt-3">
      <p>
        Your Score:{" "}
        {editingUserRating ? (
          <input
            type="number"
            className="border rounded px-2 py-1 w-16 text-center"
            value={userRating ?? ""}
            onChange={(e) => setUserRatingState(Number(e.target.value))}
            onBlur={saveUserRating}
            onKeyDown={(e) => e.key === "Enter" && saveUserRating()}
            autoFocus
          />
        ) : (
          <span onClick={() => setEditingUserRating(true)} className="cursor-pointer font-bold">
            {userRating !== null ? `${userRating}%` : "N/A"}
          </span>
        )}
      </p>
      <p>
        Average User Score:{" "}
        <strong>{avgUserRating !== null ? `${avgUserRating.toFixed(1)}%` : "N/A"}</strong> ({numUserRatings} ratings)
      </p>
    </div>
  );
};

export default ScoresUser;
