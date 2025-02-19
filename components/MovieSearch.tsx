import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { supabase } from "@/lib/supabaseClient";
import { Search, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const API_URL = "https://api.themoviedb.org/3/search/movie";
const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
const OMDB_API_URL = "http://www.omdbapi.com/";


interface Movie {
  id: number;
  title: string;
  release_date?: string;
  backdrop_path?: string;
  poster_url?: string; // Add this field
  year?: number; // Add this field
  critic_rating?: number | null;
  audience_rating?: number | null;
}

interface MovieSearchProps {
  onSelectMovie: (movie: Movie) => void;
  fetchMovies: () => Promise<void>;
  isAdmin: boolean; // New prop to determine behavior
}

const MovieSearch: React.FC<MovieSearchProps> = ({ onSelectMovie, fetchMovies, isAdmin }) => {
  const [query, setQuery] = useState<string>("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setMovies([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await axios.get<{ results: Movie[] }>(API_URL, {
          params: { api_key: API_KEY, query },
        });
        // Map the API response to the Movie interface
        const mappedMovies = response.data.results.map((movie) => ({
          id: movie.id,
          title: movie.title,
          release_date: movie.release_date,
          year: movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : undefined,
          backdrop_path: movie.backdrop_path,
          poster_url: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w200${movie.backdrop_path}`
            : undefined,
          critic_rating: null, // Assuming these are not available from the API
          audience_rating: null,
        }));
        setMovies(mappedMovies);
      } catch (error) {
        console.error("❌ Error fetching movies from TMDB:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceRef.current!);
  }, [query]);

  const fetchCriticRating = async (title: string) => {
    try {
      const response = await axios.get(OMDB_API_URL, {
        params: { apikey: OMDB_API_KEY, t: title },
      });
      const { Ratings } = response.data;
      const criticRating = Ratings?.find((rating: any) => rating.Source === "Rotten Tomatoes")?.Value;
      return criticRating ? parseInt(criticRating) : null;
    } catch (error) {
      console.error("❌ Error fetching critic rating from OMDB:", error);
      return null;
    }
  };

  const checkIfMovieExists = async (movieId: number) => {
    const { data, error } = await supabase.from("movies").select("id").eq("id", movieId);
    if (error) {
      console.error("❌ Error checking for duplicate movie:", error);
    }
    return data && data.length > 0;
  };

  const handleMovieSelect = async (movie: Movie) => {
    if (isAdmin) {
      // Admin behavior: Add to movies table
      const exists = await checkIfMovieExists(movie.id);
      if (exists) {
        console.warn("⚠️ Movie already exists:", movie.title);
        setShowDuplicateAlert(true);
        setTimeout(() => setShowDuplicateAlert(false), 4000);
        return;
      }

      const criticRating = await fetchCriticRating(movie.title);
      onSelectMovie({ ...movie, critic_rating: criticRating });

      try {
        const { data, error } = await supabase
          .from("movies")
          .insert([
            {
              id: movie.id,
              title: movie.title,
              year: movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : null,
              poster_url: movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w200${movie.backdrop_path}`
                : null,
              critic_rating: criticRating,
              audience_rating: null,
            },
          ])
          .select();

        if (error) throw error;
        console.log("✅ Movie saved successfully!", data);

        if (data && data.length > 0) {
          onSelectMovie(data[0]);
          fetchMovies();
        }
      } catch (error) {
        console.error("🚨 Error saving movie to Supabase:", error);
      }
    } else {
      // Non-admin behavior: Just select the movie
      onSelectMovie(movie);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {showDuplicateAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm">
          <Alert className="shadow-lg animate-slide-down bg-secondary">
            <TriangleAlert className="absolute left-3 top-1/2 transform w-5 h-5" />
            <AlertTitle>Duplicate Movie</AlertTitle>
            <AlertDescription>This movie already exists in the database.</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
        <input
          type="text"
          className="w-full p-3 pl-10 border rounded-lg focus:outline-none"
          placeholder="Add a movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {movies.length > 0 && (
        <ul className="absolute w-full bg-card border mt-1 rounded-lg shadow-lg z-30">
          {movies.slice(0, 5).map((movie) => (
            <li
              key={movie.id}
              className="p-3 cursor-pointer hover:bg-muted"
              onClick={() => {
                handleMovieSelect(movie);
                setMovies([]);
                setQuery("");
              }}
            >
              {movie.title} ({movie.release_date?.slice(0, 4)})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MovieSearch;