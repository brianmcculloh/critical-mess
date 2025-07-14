// components/QueueMovies.tsx

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/MovieCard";
import { SquareChartGantt } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface Movie {
  id: number;
  title: string;
  year?: number;
  poster_url?: string;
  critic_rating?: number | null;
  audience_rating?: number | null;
  created_at?: string;
  suggestion_count: number;
  status: string;
}

const QueuedMovies: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [userRatings, setUserRatings] = useState<Record<number, number | null>>({});
  const [suggestionCounts, setSuggestionCounts] = useState<Record<number, number>>({});
  const [userSuggestions, setUserSuggestions] = useState<Record<number, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchQueueMovies = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("id, title, year, poster_url, critic_rating, audience_rating, created_at")
        .eq("status", "queue")
        .order("title", { ascending: true });

      if (error) {
        console.error("Error fetching queue movies:", error.message || error);
      } else {
        const groupedMovies = Object.values(
          data.reduce((acc: any, movie: any) => {
            const key = movie.title;
            if (!acc[key]) {
              acc[key] = { ...movie, suggestion_count: 1 };
            } else {
              acc[key].suggestion_count += 1;
            }
            return acc;
          }, {})
        ) as Movie[];

        setMovies(groupedMovies);

        // Batch fetch user ratings for all movies
        const clientId = localStorage.getItem("client_id");
        const movieIds = groupedMovies.map((m) => m.id);
        if (clientId && movieIds.length > 0) {
          // User ratings
          const { data: ratingsData, error: ratingsError } = await supabase
            .from("user_ratings")
            .select("movie_id, rating")
            .in("movie_id", movieIds)
            .eq("client_id", clientId);
          if (ratingsError) {
            console.error("Error fetching user ratings:", ratingsError.message || ratingsError);
          } else if (ratingsData) {
            const ratingsMap: Record<number, number | null> = {};
            ratingsData.forEach((row: any) => {
              ratingsMap[row.movie_id] = row.rating;
            });
            setUserRatings(ratingsMap);
          }

          // Suggestion counts
          const { data: suggestionData, error: suggestionError, count } = await supabase
            .from("movies")
            .select("id", { count: "exact", head: false })
            .in("id", movieIds)
            .eq("status", "suggested");
          if (suggestionError) {
            console.error("Error fetching suggestion counts:", suggestionError.message || suggestionError);
          } else if (suggestionData) {
            // Count suggestions per movie id
            const countMap: Record<number, number> = {};
            suggestionData.forEach((row: any) => {
              countMap[row.id] = (countMap[row.id] || 0) + 1;
            });
            setSuggestionCounts(countMap);
          }

          // User suggestions (has this user suggested this movie?)
          const { data: userSuggestData, error: userSuggestError } = await supabase
            .from("movies")
            .select("id")
            .in("id", movieIds)
            .eq("client_id", clientId)
            .eq("status", "suggested");
          if (userSuggestError) {
            console.error("Error fetching user suggestions:", userSuggestError.message || userSuggestError);
          } else if (userSuggestData) {
            const userSuggestMap: Record<number, boolean> = {};
            userSuggestData.forEach((row: any) => {
              userSuggestMap[row.id] = true;
            });
            setUserSuggestions(userSuggestMap);
          }
        } else {
          setUserRatings({});
          setSuggestionCounts({});
          setUserSuggestions({});
        }
      }
    } catch (err) {
      console.error("Unexpected error fetching queue movies:", err);
    }
  };

  useEffect(() => {
    fetchQueueMovies();
  }, [refreshKey]);

  const handleUpvoteSuccess = () => fetchQueueMovies();

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative h-10 px-3 xs:px-4">
                  <SquareChartGantt className="transform !w-5 !h-5" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent className="bg-black">
              <span>Our legendary future episode queue</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent
          className="w-full xs:w-4/5 max-w-none mt-6 max-h-[calc(100vh-3rem)] overflow-y-auto"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogTitle>All Queued Movies <span className="text-xs text-gray-600 dark:text-gray-400 font-normal">({movies.length})</span></DialogTitle>
          <DialogDescription>
            These are movies waiting for their turn. Upvote your favorites! (List is in alphabetical order. Future episode order has not been determined.)
          </DialogDescription>
          <div className="grid custom-grid gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={{
                  ...movie,
                  suggestion_count: movie.suggestion_count ?? 0,
                  status: movie.status ?? "queue",
                }}
                editable={false} 
                showRTRatings={true}
                showHostRatings={false}
                showUserRatings={false}
                showUpvoteButton={true}
                onUpvoteSuccess={handleUpvoteSuccess}
                showDelete={false} 
                showEpisode={false}
                showSuggestedBy={true}
                userRating={userRatings[movie.id] ?? null}
                suggestionCount={suggestionCounts[movie.id] ?? 0}
                userHasSuggested={userSuggestions[movie.id] ?? false}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QueuedMovies;
