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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchQueueMovies = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("id, title, year, poster_url, critic_rating, audience_rating, created_at")
        .eq("status", "queue")
        .order("created_at", { ascending: false }); // ✅ Sort by created_at DESC

      if (error) {
        console.error("Error fetching queue movies:", error.message || error);
      } else {
        // ✅ Group by title for suggestion count
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
          className="w-full xs:w-4/5 max-w-none max-h-screen overflow-y-auto"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogTitle>All Queued Movies</DialogTitle>
          <DialogDescription>
            These are movies waiting for their turn. Upvote your favorites!
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
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QueuedMovies;
