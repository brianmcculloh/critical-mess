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
import HotPocketGenerator from "@/components/HotPocketGenerator";

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
      
        if (key === "title") {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          return sortOrder === "asc"
            ? titleA.localeCompare(titleB)
            : titleB.localeCompare(titleA);
        }
      
        if (key === "episode") {
          const episodeA = a.episode ?? 0;
          const episodeB = b.episode ?? 0;
      
          if (episodeA !== episodeB) {
            return sortOrder === "asc" ? episodeA - episodeB : episodeB - episodeA;
          }
      
          // If episodes are the same, fall back to created_at (most recent first)
          const createdAtA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const createdAtB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return createdAtB - createdAtA; // always newest first
        }
      
        if (key === "created_at") {
          const createdAtA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const createdAtB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return sortOrder === "asc" ? createdAtA - createdAtB : createdAtB - createdAtA;
        }
      
        let valueA: number | string = a[key] ?? 0;
        let valueB: number | string = b[key] ?? 0;
      
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
      const sorted = movies
        .filter((movie) => movie.status === viewStatus)
        .sort((a, b) => {
          if (sortKey === "title") {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();
            return sortOrder === "asc"
              ? titleA.localeCompare(titleB)
              : titleB.localeCompare(titleA);
          }
    
          if (sortKey === "episode") {
            const episodeA = a.episode ?? 0;
            const episodeB = b.episode ?? 0;
            if (episodeA !== episodeB) {
              return sortOrder === "asc" ? episodeA - episodeB : episodeB - episodeA;
            }
            const createdAtA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const createdAtB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return createdAtB - createdAtA;
          }
    
          if (sortKey === "created_at") {
            const createdAtA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const createdAtB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return sortOrder === "asc"
              ? createdAtA - createdAtB
              : createdAtB - createdAtA;
          }
    
          let valueA = a[sortKey as keyof Movie] ?? 0;
          let valueB = b[sortKey as keyof Movie] ?? 0;
    
          const numA =
            typeof valueA === "number" ? valueA : parseFloat(valueA.toString()) || 0;
          const numB =
            typeof valueB === "number" ? valueB : parseFloat(valueB.toString()) || 0;
    
          return sortOrder === "asc" ? numA - numB : numB - numA;
        });
    
      setFilteredMovies(sorted);
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
      <div className="flex gap-2 items-center flex-wrap justify-between">
        <div className="flex gap-1 xs:gap-1 items-center flex-wrap">
          {/* Add MovieSearchLocal before Sorting */}
          <MovieSearchLocal onSearch={handleSearch} />
          <Sorting
            onSortChange={handleSortChange}
            currentSortKey={sortKey}
            currentSortOrder={sortOrder}
          />
          <div className="flex gap-1/2 flex-wrap flex-col">
            <StatusToggle status={viewStatus} onToggle={setViewStatus} />
            <div className="text-xs text-gray-600 dark:text-gray-400">{filteredMovies.length} movies returned</div>
          </div>
        </div>
        <div className="flex gap-1 xs:gap-1 items-center flex-wrap">
          <MovieSearchDialog
            fetchMovies={refreshMovies}
            triggerRefresh={triggerRefresh}
            isAdmin={true}
          />
          <SuggestedMovies refreshKey={refreshKey} />
          <HotPocketGenerator />
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
        ) : filteredMovies.length > 0 ? (
          <div
            className={`grid custom-grid gap-4 transition-opacity ${
              isAddingMovie ? "opacity-50 pointer-events-none" : "opacity-100"
            }`}
          >
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
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
            ))}
          </div>
        ) : (
          <p>No matching movies found.</p>
        )}
      </div>
    </>
  );
};

export default AdminPage;
