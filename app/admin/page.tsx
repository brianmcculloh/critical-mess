"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import MovieSearchDialog from "@/components/MovieSearchDialog";
import MovieSearchLocal from "@/components/MovieSearchLocal";
import MovieCard from "@/components/MovieCard";
import SuggestedMovies from "@/components/SuggestedMovies";
import Sorting from "@/components/Sorting";
import StatusToggle from "@/components/StatusToggle";
import Insights from "@/components/Insights";
import { fetchMovies } from "@/lib/movieUtils";
import TopHundred from "@/components/TopHundred";
import SkeletonMovieCard from "@/components/SkeletonMovieCard";

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

const AdminPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isAddingMovie, setIsAddingMovie] = useState(false);
  // Local loading state for fetching movies
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sorting and Status state
  const [sortKey, setSortKey] = useState<string>("episode");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewStatus, setViewStatus] = useState<"episode" | "queue">("episode");

  const refreshMovies = async () => {
    await fetchMovies(setMovies, setLoading);
  };

  const triggerRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
    refreshMovies();
  };

  useEffect(() => {
    const loadMovies = async () => {
      await fetchMovies(setMovies, setLoading);
    };
    loadMovies();
  }, [refreshKey]);

  // Filter + Sort movies based on viewStatus, sortKey, and sortOrder
  useEffect(() => {
    const filtered = movies
      .filter((movie) => movie.status === viewStatus)
      .sort((a, b) => {
        const key = sortKey as keyof Movie;
        let valueA: number | string = a[key] ?? 0;
        let valueB: number | string = b[key] ?? 0;

        if (key === "title") {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          return sortOrder === "asc"
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
        }

        if (key === "created_at") {
          valueA = a.created_at ? new Date(a.created_at).getTime() : 0;
          valueB = b.created_at ? new Date(b.created_at).getTime() : 0;
        }

        const numA =
          typeof valueA === "number" ? valueA : parseFloat(valueA.toString()) || 0;
        const numB =
          typeof valueB === "number" ? valueB : parseFloat(valueB.toString()) || 0;

        return sortOrder === "asc" ? numA - numB : numB - numA;
      });

    setFilteredMovies(filtered);
  }, [movies, sortKey, sortOrder, viewStatus]);

  const handleSortChange = (newSortKey: string, newSortOrder: "asc" | "desc") => {
    setSortKey(newSortKey);
    setSortOrder(newSortOrder);
  };

  // Implement local search filtering based on title or year
  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredMovies(movies.filter((movie) => movie.status === viewStatus));
      return;
    }

    const filtered = movies
      .filter((movie) => movie.status === viewStatus)
      .filter((movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (movie.year && movie.year.toString().includes(searchTerm))
      );

    setFilteredMovies(filtered);
  };

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  return (
    <>
      <div className="flex gap-2 items-center flex-wrap">
        {/* Add MovieSearchLocal before Sorting */}
        <MovieSearchLocal onSearch={handleSearch} />
        <Sorting
          onSortChange={handleSortChange}
          currentSortKey={sortKey}
          currentSortOrder={sortOrder}
        />
        <StatusToggle status={viewStatus} onToggle={setViewStatus} />
        <div className="flex gap-1 xs:gap-1 items-center flex-wrap">
          <MovieSearchDialog
            fetchMovies={refreshMovies}
            triggerRefresh={triggerRefresh}
            isAdmin={true}
          />
          <SuggestedMovies refreshKey={refreshKey} />
          <Insights />
          <TopHundred />
        </div>
      </div>

      <div className="relative mt-2 xs:mt-4">
        {isAddingMovie && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 pointer-events-none">
            <p className="text-white font-semibold">Adding movie...</p>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(16)].map((_, index) => (
              <SkeletonMovieCard key={index} />
            ))}
          </div>
        ) : (
          <div
            className={`grid custom-grid gap-4 transition-opacity ${
              isAddingMovie ? "opacity-50 pointer-events-none" : "opacity-100"
            }`}
          >
            {filteredMovies.map((movie) => (
              <div key={movie.id} className="relative">
                <MovieCard
                  movie={{
                    ...movie,
                    suggestion_count: movie.suggestion_count ?? 0,
                    status: movie.status ?? ""
                  }}
                  editable={true}
                  onDelete={refreshMovies}
                  onEpisodeChange={triggerRefresh}
                  showDelete={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPage;
