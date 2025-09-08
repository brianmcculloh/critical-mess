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
import { useAuth } from "@/contexts/AuthContext";

// Environment variables remain unchanged
const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
const OMDB_API_URL = "https://www.omdbapi.com/";

// Extend the props to include an optional flag indicating we're coming from TopHundred.
interface MovieSearchDialogProps {
  fetchMovies: () => Promise<void>;
  triggerRefresh: () => void;
  triggerSuggestedMoviesRefresh?: () => void;
  isAdmin: boolean;
  selectedHost?: string;
  fromTopHundred?: boolean; // new flag
}

const MovieSearchDialog: React.FC<MovieSearchDialogProps> = ({
  fetchMovies,
  triggerRefresh,
  triggerSuggestedMoviesRefresh,
  isAdmin,
  selectedHost,
  fromTopHundred = false, // default false if not provided
}) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any | null>(null);
  const [stagedEpisode, setStagedEpisode] = useState<number>(0);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [showAlreadyExistsAlert, setShowAlreadyExistsAlert] = useState(false);
  const [showListFullAlert, setShowListFullAlert] = useState(false);
  const [showHostMovieExistsAlert, setShowHostMovieExistsAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isEditingEpisode, setIsEditingEpisode] = useState(false);
  const { user } = useAuth();
  const [addingMovie, setAddingMovie] = useState(false);

  useEffect(() => {
    if (showSuccessAlert) {
      const timer = setTimeout(() => setShowSuccessAlert(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessAlert]);

  const handleMovieSelection = (movie: any) => {
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

  const handleAddMovie = async () => {
    if (!selectedMovie) return;
    setAddingMovie(true);
      
    try {
      if (fromTopHundred) {
        // Logic for TopHundred:
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
        const { error } = await supabase.from("top_hundred_movies").insert([
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
        // Normal (suggestion) flow:
        const clientId = isAdmin ? user?.id : localStorage.getItem("client_id");
        if (!clientId) throw new Error("Client ID not found");

        // 1. Check if the movie already exists for this user.
        const { data: existingMovie, error: movieFetchError } = await supabase
          .from("movies")
          .select("id")
          .eq("title", selectedMovie.title)
          .eq("client_id", clientId);
        if (movieFetchError) throw movieFetchError;
        if (existingMovie && existingMovie.length > 0) {
          setShowDuplicateAlert(true);
          setTimeout(() => setShowDuplicateAlert(false), 4000);
          return;
        }

        // 2. If admin, fetch critic rating.
        let criticRating = null;
        if (isAdmin) {
          criticRating = await fetchCriticRating(selectedMovie.title);
        }

        // 3. Get the audience (popcornmeter) score via your scraper.
        const rtUrl = selectedMovie.rtUrl || `https://www.rottentomatoes.com/m/${selectedMovie.title.toLowerCase().replace(/\s+/g, '_')}`;
        let audienceRating = null;
        try {
          const res = await fetch(`/api/scrape-popcorn?movieUrl=${encodeURIComponent(rtUrl)}`);
          const json = await res.json();
          if (json && json.audienceScore) {
            audienceRating = Number(json.audienceScore);
          }
        } catch (err) {
          console.error("Error fetching audience score:", err);
        }

        // 4. Prepare the movieData payload.
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
          audience_rating: audienceRating,
          episode: stagedEpisode,
          created_at: new Date().toISOString(),
          client_id: clientId,
          status: isAdmin ? (stagedEpisode > 0 ? "episode" : "queue") : "suggested",
        };

        // 5. Insert the new movie record.
        const { data, error } = await supabase.from("movies").insert([movieData]).select();
        if (error) throw error;

        if (data && data.length > 0) {
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
          // Calculate and update disparity when the movie is first added,
          // provided both critic_rating and audience_rating are not null.
          if (!fromTopHundred) {
            const critic = movieData.critic_rating;
            const audience = movieData.audience_rating;
            if (critic !== null && audience !== null) {
              const disparity = Math.abs(critic - audience);
              await supabase.from("movies").update({ disparity }).eq("id", data[0].id);
            }
          }
          setSelectedMovie(null);
          setStagedEpisode(0);
          setShowOverlay(false);
          if (isAdmin) {
            triggerRefresh();
          } else {
            triggerSuggestedMoviesRefresh?.();
          }
          setShowSuccessAlert(true);
        }
      }
    } catch (error: any) {
      console.error("🚨 Error adding movie:", error?.message || error);
    } finally {
      setAddingMovie(false);
    }
  };
  
  return (
    <>
      {showSuccessAlert && (
        <div className="fixed bottom-4 right-4 rounded-lg shadow-lg z-50">
          <Alert className="shadow-lg bg-yellow text-black">
            <ThumbsUp color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
            <AlertTitle>Bing!</AlertTitle>
            <AlertDescription>
              {isAdmin ? "New movie added" : "Thanks for the suggestion!"}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
        <DialogTrigger asChild>
          <Button onClick={() => setShowOverlay(true)} className="text-black dark:drop-shadow-lg" id="add-movie">
            {isAdmin ? "Add a Movie" : "Suggest a Movie"}
            <Clapperboard className="transform w-5 h-5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          {showDuplicateAlert && (
            <Alert className="shadow-lg bg-yellow text-black absolute -top-20 w-5/6 left-1/2 transform -translate-x-1/2">
              <TriangleAlert color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
              <AlertTitle>We got it.</AlertTitle>
              <AlertDescription>
                You've already suggested that. We promise we'll take a look!
              </AlertDescription>
            </Alert>
          )}
          {showAlreadyExistsAlert && (
            <Alert className="shadow-lg bg-yellow text-black absolute -top-20 w-5/6 left-1/2 transform -translate-x-1/2">
              <TriangleAlert color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
              <AlertTitle>Episode already exists!</AlertTitle>
              <AlertDescription>
                {isAdmin
                  ? "Please search for a different movie."
                  : "You seem to have great taste, because we've already done an episode on that!"}
              </AlertDescription>
            </Alert>
          )}
          {showHostMovieExistsAlert && (
            <Alert className="shadow-lg bg-yellow text-black absolute -top-20 w-5/6 left-1/2 transform -translate-x-1/2">
              <TriangleAlert color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
              <AlertTitle>Movie already exists</AlertTitle>
              <AlertDescription>
                You've already added that movie to your top 100 list.
              </AlertDescription>
            </Alert>
          )}
          {showListFullAlert && (
            <Alert className="shadow-lg bg-yellow text-black absolute -top-20 w-5/6 left-1/2 transform -translate-x-1/2">
              <TriangleAlert color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
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
          <MovieSearch
            onSelectMovie={handleMovieSelection}
            fetchMovies={fetchMovies}
            isAdmin={isAdmin}
          />
          {selectedMovie && (
            <div className="relative max-w-md">
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
                showEpisode={fromTopHundred ? false : true}
                showMovieLink={fromTopHundred ? false : true}
                skipEpisodeDatabaseSave={true}
                onEpisodeChange={setStagedEpisode}
                onStartEpisodeEdit={() => setIsEditingEpisode(true)}
                onStopEpisodeEdit={() => setIsEditingEpisode(false)}
              />
              <Button 
                onClick={handleAddMovie} 
                className="mt-4 transition text-black" 
                disabled={isEditingEpisode || addingMovie}
              >
                {fromTopHundred 
                  ? "Add To List" 
                  : isAdmin 
                    ? (addingMovie ? "Loading..." : "Add This Movie") 
                    : (addingMovie ? "Loading..." : "Suggest This")
                }
                <Check className="transform w-5 h-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MovieSearchDialog;
