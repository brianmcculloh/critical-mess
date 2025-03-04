"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Separator } from "@/components/ui/separator";
import Score from "./Score";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface Movie {
  id: number;
  critic_rating?: number | null;
  audience_rating?: number | null;
  disparity?: number | null;
  user_rating?: number | null;
  avg_user_rating?: number | null;
  nick_rating?: number | null;
  brian_rating?: number | null;
  gris_rating?: number | null;
  ben_rating?: number | null;
}

interface ScoresDisplayProps {
  movie: Movie;
  isAdmin: boolean;
  setUserRating?: (rating: number | null) => void;
  showRTRatings?: boolean;
  showHostRatings?: boolean;
  showUserRatings?: boolean;
  disabled?: boolean;
}

const ScoresDisplay: React.FC<ScoresDisplayProps> = ({
  movie,
  isAdmin,
  setUserRating,
  showRTRatings = true,
  showHostRatings = true,
  showUserRatings = true,
  disabled = false,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [updatedMovie, setUpdatedMovie] = useState<Movie>(movie);
  const [userRating, setUserRatingState] = useState<number | null>(null);
  const [avgUserRating, setAvgUserRating] = useState<number | null>(null);
  const [numUserRatings, setNumUserRatings] = useState<number>(0);
  const [disparity, setDisparity] = useState<number | null>(movie.disparity || null);

  const calculateAndUpdateDisparity = async (
    critic: number | null,
    audience: number | null
  ) => {
    if (critic !== null && audience !== null) {
      const newDisparity = Math.abs(critic - audience);
      setDisparity(newDisparity);

      // Update disparity in DB
      await supabase.from("movies").update({ disparity: newDisparity }).eq("id", movie.id);
    }
  };

  useEffect(() => {
    const fetchUserRatings = async () => {
      const clientId = localStorage.getItem("client_id");
      if (!clientId) return;

      const { data: userData } = await supabase
        .from("user_ratings")
        .select("rating")
        .eq("movie_id", movie.id)
        .eq("client_id", clientId)
        .maybeSingle();

      if (userData) {
        setUserRatingState(userData.rating);
        setUserRating && setUserRating(userData.rating);
      }

      const { data: avgData } = await supabase
        .from("user_ratings")
        .select("rating")
        .eq("movie_id", movie.id);

      if (avgData) {
        if (avgData.length > 0) {
          const avgRating = avgData.reduce((sum, entry) => sum + entry.rating, 0) / avgData.length;
          setAvgUserRating(avgRating);
          setNumUserRatings(avgData.length);
        } else {
          setAvgUserRating(null);
          setNumUserRatings(0);
        }
      }
    };

    fetchUserRatings();
  }, [movie.id, setUserRating]);

  const saveRating = async (field: string, value: number) => {
    if (isAdmin) {
      await supabase.from("movies").update({ [field]: value }).eq("id", movie.id);
      const updatedCritic = field === "critic_rating" ? value : updatedMovie.critic_rating;
      const updatedAudience = field === "audience_rating" ? value : updatedMovie.audience_rating;

      setUpdatedMovie((prev) => ({ ...prev, [field]: value }));
      await calculateAndUpdateDisparity(updatedCritic ?? null, updatedAudience ?? null);
    } else {
      const clientId = localStorage.getItem("client_id");
      if (!clientId) return;
      await supabase
        .from("user_ratings")
        .upsert({ client_id: clientId, movie_id: movie.id, rating: value }, { onConflict: "client_id,movie_id" });
      setUserRatingState(value);
      setUserRating && setUserRating(value);

      const { data: avgData } = await supabase
        .from("user_ratings")
        .select("rating")
        .eq("movie_id", movie.id);

      if (avgData) {
        if (avgData.length > 0) {
          const avgRating = avgData.reduce((sum, entry) => sum + entry.rating, 0) / avgData.length;
          setAvgUserRating(avgRating);
          setNumUserRatings(avgData.length);
        } else {
          setAvgUserRating(null);
          setNumUserRatings(0);
        }
      }
    }
  };

  const getAvgRatingColorClass = () => {
    if (avgUserRating === null) return "text-black/40 dark:text-white/40";
    return avgUserRating < 60 ? "text-green-500" : "text-primary";
  };

  return (
    <div className="mt-1">
      {/* Rotten Tomatoes Ratings Section */}
      {showRTRatings && (
        <div className="relative flex gap-2 items-stretch mb-3 mt-3">
          <div className="bg-accent px-3 py-3 rounded-lg flex-1 relative">
            <Score
              label="Tomatometer"
              field="critic_rating"
              value={updatedMovie.critic_rating}
              editingField={editingField}
              setEditingField={setEditingField}
              setTempValue={() => {}}
              saveRating={saveRating}
              isEditable={isAdmin}
              disabled={disabled}
            />
          </div>

          {updatedMovie.critic_rating !== null &&
            updatedMovie.audience_rating !== null &&
            disparity !== undefined &&
            disparity !== null && (
              <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 bg-card rounded-full w-12 h-12 flex flex-col items-center justify-center gap-0">
                <span className="text-[10px] uppercase text-black/60 dark:text-white/60 leading-none">
                  Gap
                </span>
                <span className="leading-none text-xl font-bold">{disparity}</span>
              </div>
            )}

          <div className="bg-accent px-3 py-3 rounded-lg flex-1 relative">
            <Score
              label="Popcornmeter"
              field="audience_rating"
              value={updatedMovie.audience_rating}
              editingField={editingField}
              setEditingField={setEditingField}
              setTempValue={() => {}}
              saveRating={saveRating}
              isEditable={isAdmin}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Host Scores Section */}
      {showHostRatings && (
        <div className="flex gap-2 flex-wrap items-start">
          {["Nick", "Brian", "Gris", "Ben"].map((host, index, array) => (
            <React.Fragment key={host}>
              <Score
                label={host}
                field={`${host.toLowerCase()}_rating`}
                value={updatedMovie[`${host.toLowerCase()}_rating` as keyof Movie]}
                editingField={editingField}
                setEditingField={setEditingField}
                setTempValue={() => {}}
                saveRating={saveRating}
                isEditable={isAdmin}
                disabled={disabled}
              />
              {index < array.length - 1 && <Separator orientation="vertical" className="h-10" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* User Rating Section */}
      {showUserRatings && !isAdmin && (
        <>
          <Separator className="my-2" />
          <div className="flex gap-2 items-start">
            <Score
              label="You"
              field="user_rating"
              value={userRating}
              editingField={editingField}
              setEditingField={setEditingField}
              setTempValue={() => {}}
              saveRating={saveRating}
              forceEditable
              disabled={disabled}
            />
            <Separator orientation="vertical" className="h-10" />
            {disabled ? (
              <div className="flex-1 relative flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 font-semibold">Users</div>
                <div>
                  {avgUserRating !== null ? (
                    <>
                      <strong className={`text-base ${getAvgRatingColorClass()}`}>
                        {`${avgUserRating.toFixed(1)}%`}
                      </strong>
                      {numUserRatings > 0 && (
                        <span className="text-xs text-black/40 dark:text-white/40 ml-1">
                          ({numUserRatings})
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-black/40 dark:text-white/40 font-normal">n/a</span>
                  )}
                </div>
              </div>
            ) : (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex-1 relative flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 font-semibold">Users</div>
                      <div>
                        {avgUserRating !== null ? (
                          <>
                            <strong className={`text-base ${getAvgRatingColorClass()}`}>
                              {`${avgUserRating.toFixed(1)}%`}
                            </strong>
                            {numUserRatings > 0 && (
                              <span className="text-xs text-black/40 dark:text-white/40 ml-1">
                                ({numUserRatings})
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-black/40 dark:text-white/40 font-normal">n/a</span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                    <span>Average score for all of our listeners</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ScoresDisplay;
