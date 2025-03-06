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
import { SmilePlus } from "lucide-react";
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
  suggestion_count: number;
  status: string;
}

const SuggestedMovies: React.FC<{ refreshKey: number }> = ({ refreshKey }) => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchSuggestedMovies = async () => {
    try {
      // ✅ Fetch movies from the 'movies' table with status 'suggested'
      const { data, error } = await supabase
        .from("movies")
        .select("id, title, year, poster_url")
        .eq("status", "suggested");

      if (error) {
        console.error("Error fetching suggested movies:", error.message || error);
      } else {
        // ✅ Group movies by title and count how many times each was suggested
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
      console.error("Unexpected error fetching suggested movies:", err);
    }
  };

  useEffect(() => {
    fetchSuggestedMovies();
  }, [refreshKey]);

  const handleDeleteMovie = (movieTitle: string) => {
    setMovies((prevMovies) => prevMovies.filter((movie) => movie.title !== movieTitle));
  };

  const handleUpvoteSuccess = () => fetchSuggestedMovies();

  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button variant="outline" className="relative h-10 px-3 xs:px-4">
                  <SmilePlus className="transform !w-5 !h-5" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent className="bg-black">
              <span>User-suggested movies</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DialogContent
          className="w-full xs:w-4/5 max-w-none max-h-screen overflow-y-auto"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogTitle>All Suggested Movies</DialogTitle>
          <DialogDescription>
            We promise we look at this list at least once a week.
          </DialogDescription>
          <div className="grid custom-grid gap-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={{
                  ...movie,
                  suggestion_count: movie.suggestion_count ?? 0,
                  status: movie.status ?? "suggested",
                }}
                editable={false}
                showRTRatings={false}
                showHostRatings={false}
                showUserRatings={false}
                onDelete={() => handleDeleteMovie(movie.title)}
                showUpvoteButton={true}
                onUpvoteSuccess={handleUpvoteSuccess}
                showDelete={true}
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

export default SuggestedMovies;
