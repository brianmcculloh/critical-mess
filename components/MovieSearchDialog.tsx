"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert, Clapperboard, Check, ThumbsUp } from "lucide-react";
import MovieSearch from "@/components/MovieSearch";
import MovieCard from "@/components/MovieCard";
import { supabase } from "@/lib/supabaseClient";

const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
const OMDB_API_URL = "http://www.omdbapi.com/";

interface Movie {
  id: number;
  title: string;
  release_date?: string;
  year?: number;
  poster_url?: string;
  backdrop_path?: string;
  critic_rating?: number | null;
  audience_rating?: number | null;
  user_rating?: number | null;
  user_selected_host?: string | null;
  created_at?: string;
  suggestion_count?: number | null;
  status?: string;
  episode?: number;
}

interface MovieSearchDialogProps {
  fetchMovies: () => Promise<void>;
  triggerRefresh: () => void;
  triggerSuggestedMoviesRefresh: () => void;
  isAdmin: boolean;
  selectedHost?: string;
}

import { usePathname } from 'next/navigation';

const MovieSearchDialog: React.FC<MovieSearchDialogProps> = ({
  fetchMovies,
  triggerRefresh,
  triggerSuggestedMoviesRefresh,
  isAdmin,
  selectedHost,
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [stagedEpisode, setStagedEpisode] = useState<number>(0);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [showAlreadyExistsAlert, setShowAlreadyExistsAlert] = useState(false);
  const [showListFullAlert, setShowListFullAlert] = useState(false);
  const [showHostMovieExistsAlert, setShowHostMovieExistsAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isEditingEpisode, setIsEditingEpisode] = useState(false);

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => setShowSuccessAlert(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  const handleMovieSelection = (movie: Movie) => {
    setSelectedMovie({
      ...movie,
      episode: stagedEpisode,
      status: movie.status ?? (isAdmin ? "episode" : "suggested"),
    });
  };

  const fetchCriticRating = async (title: string) => {
    try {
      const response = await axios.get(OMDB_API_URL, {
        params: { apikey: OMDB_API_KEY, t: title },
      });
      const { Ratings } = response.data;
      const criticRating = Ratings?.find(
        (rating: any) => rating.Source === "Rotten Tomatoes"
      )?.Value;
      return criticRating ? parseInt(criticRating) : null;
    } catch (error) {
      console.error("❌ Error fetching critic rating from OMDB:", error);
      return null;
    }
  };

  const pathname = usePathname();

  const handleAddMovie = async () => {
    if (!selectedMovie) return;
      
    try {
      if (pathname === "/tophundred") {
        // Fetch existing movies for the selected host (fetch title and rank)
        const { data: existingMovies, error: fetchError } = await supabase
          .from("top_hundred_movies")
          .select("title, rank")
          .eq("host", selectedHost)
          .order("rank", { ascending: true });
        
        if (fetchError) throw fetchError;
    
        // 1) Check if the host already has 100 movies
        if (existingMovies && existingMovies.length >= 100) {
          setShowListFullAlert(true);
          setTimeout(() => setShowListFullAlert(false), 4000);
          return;
        }
    
        // 2) Check for duplicates (if the movie title already exists)
        if (existingMovies && existingMovies.some(movie => movie.title === selectedMovie.title)) {
          setShowHostMovieExistsAlert(true);
          setTimeout(() => setShowHostMovieExistsAlert(false), 4000);
          return;
        }
    
        // Find the lowest available rank for the host
        let availableRank = 1;
        const takenRanks = new Set(existingMovies.map(movie => movie.rank));
        while (takenRanks.has(availableRank) && availableRank <= 100) {
          availableRank++;
        }
    
        // Insert movie into the correct rank position
        const { data, error } = await supabase.from("top_hundred_movies").insert([
          {
            title: selectedMovie.title,
            year: selectedMovie.release_date
              ? parseInt(selectedMovie.release_date.slice(0, 4))
              : selectedMovie.year || null,
            host: selectedHost,
            rank: availableRank,
          }
        ]).select();
    
        if (error) throw error;
    
        triggerRefresh();
        setShowSuccessAlert(true);
        setSelectedMovie(null);
        setShowOverlay(false);
        return;

      } else {

        const clientId = localStorage.getItem("client_id");
        if (!clientId && !isAdmin) throw new Error("Client ID not found");
    
        // ✅ 1. Check if the movie already exists as an episode (for both admin and non-admin)
        const { data: existingEpisodes, error: episodeFetchError } = await supabase
          .from("movies")
          .select("id")
          .eq("title", selectedMovie.title)
          .eq("status", "episode");

        if (episodeFetchError) throw episodeFetchError;

        if (existingEpisodes && existingEpisodes.length > 0) {
          setShowAlreadyExistsAlert(true);
          setTimeout(() => setShowAlreadyExistsAlert(false), 4000);
          return;
        }

        // ✅ 2. If NOT admin, check for duplicate suggestions
        if (!isAdmin) {
          const { data: existingSuggestions, error: suggestionFetchError } = await supabase
            .from("movies")
            .select("id")
            .eq("title", selectedMovie.title)
            .eq("status", "suggested")
            .eq("client_id", clientId);

          if (suggestionFetchError) throw suggestionFetchError;

          if (existingSuggestions && existingSuggestions.length > 0) {
            setShowDuplicateAlert(true);
            setTimeout(() => setShowDuplicateAlert(false), 4000);
            return;
          }
        }

        let criticRating = null;
        if (isAdmin) {
          criticRating = await fetchCriticRating(selectedMovie.title);
        }
    
        const movieData = {
          id: selectedMovie.id,
          title: selectedMovie.title,
          year: selectedMovie.release_date
            ? parseInt(selectedMovie.release_date.slice(0, 4))
            : selectedMovie.year || null,
          poster_url: selectedMovie.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${selectedMovie.backdrop_path}`
            : selectedMovie.poster_url || null,
          critic_rating: isAdmin ? criticRating : null,
          audience_rating: null,
          episode: stagedEpisode,
          created_at: new Date().toISOString(),
          client_id: !isAdmin ? clientId : null,
          status: isAdmin ? (stagedEpisode > 0 ? "episode" : "queue") : "suggested",
        };
    
        const { data, error } = await supabase.from("movies").insert([movieData]).select();
        if (error) throw error;
    
        if (data && data.length > 0) {
          // If admin adds a movie with "episode" status,
          // delete all other rows with a matching movie id (using "id")
          // but keep the newly inserted row (matching movie_instance_id).
          if (isAdmin && movieData.status === "episode") {
            const insertedRow = data[0];
            const { error: deleteError } = await supabase
              .from("movies")
              .delete()
              .match({ id: selectedMovie.id })
              .neq("movie_instance_id", insertedRow.movie_instance_id);
            if (deleteError) {
              console.error("Error deleting duplicate rows:", deleteError);
            }
          }
          setSelectedMovie(null);
          setStagedEpisode(0);
          setShowOverlay(false);
          if (isAdmin) {
            triggerRefresh();
          } else {
            triggerSuggestedMoviesRefresh();
          }
          setShowSuccessAlert(true);
        }
      }
    } catch (error: any) {
      console.error("🚨 Error adding movie:", error?.message || error);
    }
  };  
  
  return (
    <>
      {showSuccessAlert && (
        <div className="fixed bottom-4 right-4 rounded-lg shadow-lg z-50">
          <Alert className="shadow-lg bg-accent">
            <ThumbsUp className="absolute left-3 top-1/2 transform w-5 h-5" />
            <AlertTitle>Bing!</AlertTitle>
            <AlertDescription>
              {isAdmin ? "New movie added" : "Thanks for suggesting that!"}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
        <DialogTrigger asChild>
          <Button onClick={() => setShowOverlay(true)}>
            {isAdmin ? "Add a Movie" : "Suggest a Movie"}
            <Clapperboard className="transform w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          {showDuplicateAlert && (
            <Alert className="shadow-lg bg-accent absolute -top-20 w-5/6 left-1/2 transform -translate-x-1/2">
              <TriangleAlert className="absolute left-3 top-1/2 transform w-5 h-5" />
              <AlertTitle>We got it.</AlertTitle>
              <AlertDescription>
                You've already suggested that. We promise we'll take a look!
              </AlertDescription>
            </Alert>
          )}
          {showAlreadyExistsAlert && (
            <Alert className="shadow-lg bg-accent absolute -top-20 w-5/6 left-1/2 transform -translate-x-1/2">
              <TriangleAlert className="absolute left-3 top-1/2 transform w-5 h-5" />
              <AlertTitle>Episode already exists!</AlertTitle>
              <AlertDescription>
                {isAdmin
                  ? "Please search for a different movie."
                  : "You seem to have great taste, because we've already done an episode on that!"}
              </AlertDescription>
            </Alert>
          )}
          {showHostMovieExistsAlert && (
            <Alert className="shadow-lg bg-accent absolute -top-20 w-5/6 left-1/2 transform -translate-x-1/2">
              <TriangleAlert className="absolute left-3 top-1/2 transform w-5 h-5" />
              <AlertTitle>Movie already exists</AlertTitle>
              <AlertDescription>
                You've already added that movie to your top 100 list.
              </AlertDescription>
            </Alert>
          )}
          {showListFullAlert && (
            <Alert className="shadow-lg bg-accent absolute -top-20 w-5/6 left-1/2 transform -translate-x-1/2">
              <TriangleAlert className="absolute left-3 top-1/2 transform w-5 h-5" />
              <AlertTitle>List is full</AlertTitle>
              <AlertDescription>
                You've already added 100 movies to your list. Delete one to make room.
              </AlertDescription>
            </Alert>
          )}
          <DialogTitle>
            {isAdmin ? "Add a Movie to the List" : "Got something for us?"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin
              ? "Add a new movie directly to the official Critical Mess list."
              : "Did you find a critical mess out in the wild? Add it to our legendary list!"}
          </DialogDescription>
          <div className="p-4">
            <MovieSearch
              onSelectMovie={handleMovieSelection}
              fetchMovies={fetchMovies}
              isAdmin={isAdmin}
            />
            {selectedMovie && (
              <div className="mt-4 relative">
                <MovieCard
                  movie={{
                    ...selectedMovie,
                    suggestion_count: selectedMovie?.suggestion_count ?? 0,
                    status: selectedMovie.status ?? "",
                  }}
                  editable={false}
                  showRTRatings={false}
                  showHostRatings={false}
                  showUserRatings={false} 
                  showDelete={false}
                  skipEpisodeDatabaseSave={true}
                  onEpisodeChange={setStagedEpisode}
                  onStartEpisodeEdit={() => setIsEditingEpisode(true)}   // ✅ New prop
                  onStopEpisodeEdit={() => setIsEditingEpisode(false)}   // ✅ New prop
                />
                <Button onClick={handleAddMovie} className="mt-4 transition" disabled={isEditingEpisode}>
                  {pathname === "/tophundred" ? "Add To List" : isAdmin ? "Add This Movie" : "Suggest This"}
                  <Check className="transform w-5 h-5" />
                </Button>

              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MovieSearchDialog;
