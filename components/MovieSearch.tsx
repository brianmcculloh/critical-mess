import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Search } from "lucide-react";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const API_URL = "https://api.themoviedb.org/3/search/movie";

interface Movie {
  id: number;
  title: string;
  release_date?: string;
  backdrop_path?: string;
  poster_url?: string;
  year?: number;
  critic_rating?: number | null;
  audience_rating?: number | null;
  status?: string;
}

interface MovieSearchProps {
  onSelectMovie: (movie: Movie) => void;
  fetchMovies: () => Promise<void>;
  isAdmin: boolean;
}

const MovieSearch: React.FC<MovieSearchProps> = ({ onSelectMovie, fetchMovies, isAdmin }) => {
  const [query, setQuery] = useState<string>("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
        const mappedMovies = response.data.results.map((movie) => ({
          id: movie.id,
          title: movie.title,
          release_date: movie.release_date,
          year: movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : undefined,
          backdrop_path: movie.backdrop_path,
          poster_url: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`
            : undefined,
          critic_rating: null,
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

  return (
    <div className="relative max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
        <input
          type="text"
          className="w-full p-2 pl-10 border rounded-lg focus:outline-none"
          placeholder="Search for a movie..."
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
                onSelectMovie(movie);
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