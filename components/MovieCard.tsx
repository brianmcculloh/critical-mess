"use client";

import React, { useState, useEffect } from "react";
import HostSelector from "@/components/HostSelector";
import HeatMeter from "@/components/HeatMeter";
import ScoresDisplay from "@/components/ScoresDisplay";
import { Separator } from "@/components/ui/separator";
import DeleteMovieModal from "@/components/DeleteMovieModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import Episode from "@/components/Episode";
import MovieLink from "@/components/MovieLink";

interface Movie {
  id: number;
  title: string;
  year?: number;
  poster_url?: string;
  critic_rating?: number | null;
  audience_rating?: number | null;
  user_rating?: number | null;
  nick_rating?: number | null;
  brian_rating?: number | null;
  gris_rating?: number | null;
  ben_rating?: number | null;
  suggestion_count: number;
  status: string;
  episode?: number | null;
}

interface MovieCardProps {
  movie: Movie;
  editable?: boolean;
  disabled?: boolean;
  showRTRatings?: boolean;
  showHostRatings?: boolean;
  showUserRatings?: boolean;
  showDelete?: boolean;
  showEpisode?: boolean;
  showMovieLink?: boolean;
  showSuggestedBy?: boolean;
  onClick?: (movie: Movie) => void;
  onDelete?: () => void;
  showUpvoteButton?: boolean;
  onUpvoteSuccess?: () => void;
  skipEpisodeDatabaseSave?: boolean;
  onEpisodeChange?: (value: number) => void;
  triggerSuggestedMoviesRefresh?: () => void;
  onStartEpisodeEdit?: () => void;
  onStopEpisodeEdit?: () => void;
  userRating?: number | null; // <-- new optional prop
  suggestionCount?: number | null; // <-- new optional prop
  userHasSuggested?: boolean; // <-- new optional prop
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  editable = false,
  disabled = false,
  showRTRatings = true,
  showHostRatings = true,
  showUserRatings = true,
  showDelete = false,
  showEpisode = true,
  showMovieLink = true,
  showSuggestedBy = false,
  onDelete,
  showUpvoteButton = false,
  onUpvoteSuccess,
  skipEpisodeDatabaseSave = false,
  onEpisodeChange,
  triggerSuggestedMoviesRefresh,
  onStartEpisodeEdit,
  onStopEpisodeEdit,
  userRating: userRatingProp,
  suggestionCount: suggestionCountProp, // <-- new prop
  userHasSuggested: userHasSuggestedProp, // <-- new prop
}) => {
  const [userRating, setUserRating] = useState<number | null>(userRatingProp !== undefined ? userRatingProp : (movie.user_rating || null));
  const [heatMeterKey, setHeatMeterKey] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [canUpvote, setCanUpvote] = useState(userHasSuggestedProp !== undefined ? !userHasSuggestedProp : false);
  const [suggestionCount, setSuggestionCount] = useState<number | null>(suggestionCountProp !== undefined ? suggestionCountProp : (movie.suggestion_count || null));

  const pathname = usePathname();
  const isAdmin = pathname === "/admin";

  const fetchSuggestionCount = async () => {
    try {
      const { count, error } = await supabase
        .from("movies")
        .select("*", { count: "exact", head: true })
        .eq("id", movie.id)
        .eq("status", "suggested");

      if (error) console.error("❌ Error fetching suggestion count:", error);
      if (count !== null) setSuggestionCount(count);
    } catch (error) {
      console.error("🔥 Unexpected error fetching suggestion count:", error);
    }
  };

  useEffect(() => {
    if (userRatingProp !== undefined) {
      setUserRating(userRatingProp);
    }
  }, [userRatingProp]);

  useEffect(() => {
    if (suggestionCountProp !== undefined) {
      setSuggestionCount(suggestionCountProp);
    }
  }, [suggestionCountProp]);
  useEffect(() => {
    if (userHasSuggestedProp !== undefined) {
      setCanUpvote(!userHasSuggestedProp);
    }
  }, [userHasSuggestedProp]);

  useEffect(() => {
    if (suggestionCountProp !== undefined && userHasSuggestedProp !== undefined) return;
    // Only fetch if not provided by props
    const checkUserSuggestion = async () => {
      const clientId = localStorage.getItem("client_id");
      if (!clientId) return;

      const { data, error } = await supabase
        .from("movies")
        .select("id")
        .eq("id", movie.id)
        .eq("client_id", clientId)
        .eq("status", "suggested");

      if (error) console.error("❌ Error checking user suggestion:", error);
      if (!error && (!data || data.length === 0)) setCanUpvote(true);
    };

    if (showUpvoteButton) {
      checkUserSuggestion();
      fetchSuggestionCount();
    }
  }, [movie.id, showUpvoteButton, suggestionCountProp, userHasSuggestedProp]);

  const handleHostSelectionUpdate = () => setHeatMeterKey((prevKey) => prevKey + 1);

  const handleUpvote = async () => {
    try {
      const clientId = localStorage.getItem("client_id");
      if (!clientId) throw new Error("Client ID not found");

      const movieData = {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        poster_url: movie.poster_url,
        created_at: new Date().toISOString(),
        client_id: clientId,
        status: "suggested",
      };

      const { error } = await supabase.from("movies").insert([movieData]);
      if (error) console.error("❌ Error during upvote insertion:", error);

      setCanUpvote(false);
      fetchSuggestionCount();
      if (onUpvoteSuccess) onUpvoteSuccess();
    } catch (error) {
      console.error("🔥 Error upvoting movie:", error);
    }
  };

  return (
    <div className="relative p-4 border text-card-foreground rounded-lg shadow bg-card">
      <h3 className={`mb-3 flex items-center ${isAdmin ? "pr-7" : ""}`}>
        {movie.title.trim().length > 26 ? (
          <div className="flex-1 overflow-hidden">
            <div className="inline-flex whitespace-nowrap animate-marquee">
              {/* First copy of the title plus gap */}
              <div className="flex-shrink-0 inline-flex items-center">
                <span className="text-2xl font-light">{movie.title.trim()}</span>
                <span className="inline-block w-4" aria-hidden="true"></span>
              </div>
              {/* Second copy */}
              <div className="flex-shrink-0 inline-flex items-center">
                <span className="text-2xl font-light">{movie.title.trim()}</span>
                <span className="inline-block w-4" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        ) : (
          <span className="flex-1 text-2xl font-light">{movie.title}</span>
        )}
        {!isAdmin && 
          <span className="ml-2 text-xs text-gray-500">
            ({movie.year || "n/a"})
          </span>
        }

        <style jsx>{`
          @keyframes marqueeAnimation {
            0% {
              transform: translateX(0);
            }
            25% {
              transform: translateX(0);
            }
            75% {
              transform: translateX(-50%);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-marquee {
            animation: marqueeAnimation 12s linear infinite;
          }
        `}</style>
      </h3>

      {movie.poster_url && (
        <div className="relative mt-2 rounded-lg w-full">
          <MovieLink movie={movie} showMovieLink={showMovieLink} isAdmin={isAdmin} onUrlUpdate={() => {/* Optionally refresh or update state */}} />
          {showEpisode && (
            <Episode 
              movieId={movie.id} 
              initialEpisode={movie.episode ?? 0} 
              skipDatabaseSave={skipEpisodeDatabaseSave}
              onEpisodeChange={onEpisodeChange}
              triggerSuggestedMoviesRefresh={triggerSuggestedMoviesRefresh}
              onStartEditing={onStartEpisodeEdit}
              onStopEditing={onStopEpisodeEdit}
            />
          )}
        </div>
      )}

      {showSuggestedBy && (
        <div className="flex items-center justify-between mt-2 h-8">
          <div className="text-xs">
            {(movie.status === "suggested" || movie.status === "queue") && suggestionCount !== null && suggestionCount > 0 && (
              <span>Suggested by {suggestionCount} {suggestionCount === 1 ? "person" : "people"}</span>
            )}
          </div>
          {showUpvoteButton && canUpvote && !isAdmin && (
            <Button onClick={handleUpvote} className="relative h-7 pr-8 text-black">
              Upvote
              <ArrowUp className="absolute right-3 transform w-5 h-5" />
            </Button>
          )}
        </div>
      )}

      {(showRTRatings || showHostRatings || showUserRatings) && (
        <ScoresDisplay
          movie={movie}
          disabled={disabled}
          isAdmin={isAdmin}
          setUserRating={setUserRating}
          showRTRatings={showRTRatings}
          showHostRatings={showHostRatings}
          showUserRatings={showUserRatings}
          userRating={userRating} // <-- pass to ScoresDisplay
        />
      )}

      {editable && !isAdmin && (
        <>
          <Separator className="mt-4" />
          <HostSelector
            movieId={movie.id}
            initialSelection={null}
            onSelectionUpdate={handleHostSelectionUpdate}
            disabled={disabled}
          />
          {/*<HeatMeter key={heatMeterKey} movieId={movie.id} />*/ /* This will show a full-blown bar graph below the selector */}
        </>
      )}

      {showDelete && isAdmin && (
        <DeleteMovieModal
          movieId={movie.id}
          movieTitle={movie.title}
          onDelete={() => {
            if (onDelete) onDelete();
            setIsDeleteModalOpen(false);
          }}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
};

export default MovieCard;
