"use client";

import React, { useEffect, useState } from "react";
import MovieCard from "@/components/MovieCard";
import Sorting from "@/components/Sorting";
import SkeletonMovieCard from "@/components/SkeletonMovieCard";
import MovieSearchLocal from "@/components/MovieSearchLocal";
import MovieSearchDialog from "@/components/MovieSearchDialog";
import { fetchMovies } from "@/lib/movieUtils";
import SuggestedMovies from "@/components/SuggestedMovies";
import QueuedMovies from "@/components/QueuedMovies";
import TopHundred from "@/components/TopHundred";
import Insights from "@/components/Insights";
import HotPocketGenerator from "@/components/HotPocketGenerator";
import { useAuth } from "@/contexts/AuthContext";
import Tutorial from "@/components/Tutorial";
import Image from "next/image";

interface Movie {
  id: number;
  title: string;
  year?: number;
  poster_url?: string;
  critic_rating?: number | null;
  audience_rating?: number | null;
  user_rating?: number | null;
  user_selected_host?: string | null;
  created_at?: string;
  suggestion_count?: number | null;
  status?: string;
  episode?: number | null;
}

const HomePage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string>("episode");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [refreshKey, setRefreshKey] = useState(0);
  const [suggestedMoviesRefreshKey, setSuggestedMoviesRefreshKey] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const { user } = useAuth();
  const [patronLevel, setPatronLevel] = useState<number>(0);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // Fetch the current user's patron_level from your users table
  useEffect(() => {
    // If you have a backend call to fetch patron level, do it here. For now, default to 0 for non-patrons.
    setPatronLevel(0);
  }, [user]);

  const triggerRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const triggerSuggestedMoviesRefresh = () => {
    setSuggestedMoviesRefreshKey((prevKey) => prevKey + 1);
  };

  useEffect(() => {
    const loadMovies = async () => {
      await fetchMovies(setMovies, setLoading);
      handleSortChange("episode", "desc"); // ✅ Apply default sort after fetching
    };
    loadMovies();
  }, [refreshKey]);

  useEffect(() => {
    // Filter movies by 'episode' status and sort by episode descending
    const episodeMovies = movies
      .filter((movie) => movie.status === "episode")
      .sort((a, b) => (b.episode ?? 0) - (a.episode ?? 0)); // ✅ Default sort: episode desc
  
    setFilteredMovies(episodeMovies);
  }, [movies]);
  
  useEffect(() => {
    // Always show the tutorial for debugging
    setShowTutorial(true);
    // const hasVisited = localStorage.getItem("hasVisited");
    // if (!hasVisited || hasVisited === "false") {
    //   setShowTutorial(true);
    // }
  }, []);
  
  useEffect(() => {
    if (showTutorial) {
      // Delay setting this until *after* tutorial is actually visible
      localStorage.setItem("hasVisited", "true");
    }
  }, [showTutorial]);  

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredMovies(movies.filter((movie) => movie.status === "episode"));
      return;
    }

    const filtered = movies
      .filter((movie) => movie.status === "episode") // Ensure only episodes show
      .filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (movie.year && movie.year.toString().includes(searchTerm))
      );

    setFilteredMovies(filtered);
  };

  const handleSortChange = (newSortKey: string, newSortOrder: "asc" | "desc") => {
    setSortKey(newSortKey);
    setSortOrder(newSortOrder);

    setFilteredMovies((prevMovies) => {
      return [...prevMovies].sort((a, b) => {
        const key = newSortKey as keyof Movie;
        let valueA: number | string = a[key] ?? 0;
        let valueB: number | string = b[key] ?? 0;

        if (key === "title") {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          return newSortOrder === "asc"
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
        }

        if (key === "created_at") {
          valueA = a.created_at ? new Date(a.created_at).getTime() : 0;
          valueB = b.created_at ? new Date(b.created_at).getTime() : 0;
        }

        const numA = typeof valueA === "number" ? valueA : parseFloat(valueA.toString()) || 0;
        const numB = typeof valueB === "number" ? valueB : parseFloat(valueB.toString()) || 0;

        return newSortOrder === "asc" ? numA - numB : numB - numA;
      });
    });
  };

  return (
    <>
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      <div className="flex gap-1 xs:gap-2 mt-2 xs:mt-4 pb-2 xs:pb-2items-center flex-wrap justify-between">
        <div className="flex gap-1 xs:gap-1 items-center flex-wrap">
          <MovieSearchLocal onSearch={handleSearch} />
          <Sorting onSortChange={handleSortChange} currentSortKey={sortKey} currentSortOrder={sortOrder} />
          <div className="text-xs text-gray-600 dark:text-gray-400">{filteredMovies.length} movies</div>
        </div>
        <div className="flex gap-1 xs:gap-1 items-center flex-wrap">
          <MovieSearchDialog
            fetchMovies={() => fetchMovies(setMovies, setLoading)}
            triggerRefresh={triggerRefresh}
            triggerSuggestedMoviesRefresh={triggerSuggestedMoviesRefresh}
            isAdmin={false}
          />
          <SuggestedMovies refreshKey={suggestedMoviesRefreshKey} />
          <QueuedMovies refreshKey={refreshKey} />
          {/* Hot Pocket Generator Button for patrons only, with tooltip for non-patrons */}
          <HotPocketGenerator />
          <Insights />
          <TopHundred />
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(16)].map((_, index) => (
            <SkeletonMovieCard key={index} />
          ))}
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid custom-grid gap-4">
          {filteredMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={{
                ...movie,
                suggestion_count: movie.suggestion_count ?? 0,
                status: movie.status ?? ""
              }}
              editable={true}
            />
          ))}
        </div>
      ) : (
        <p>No matching movies found.</p>
      )}
    </>
  );
};

export default HomePage;
