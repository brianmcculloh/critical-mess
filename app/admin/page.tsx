"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import MovieSearchDialog from "@/components/MovieSearchDialog";
import MovieCard from "@/components/MovieCard";
import SuggestedMovies from "@/components/SuggestedMovies";
import Sorting from "@/components/Sorting";
import StatusToggle from "@/components/StatusToggle";
import { fetchMovies } from "@/lib/movieUtils";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [isAddingMovie, setIsAddingMovie] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ Sorting and Status state
  const [sortKey, setSortKey] = useState<string>("episode");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewStatus, setViewStatus] = useState<"episode" | "queue">("episode");

  const refreshMovies = async () => {
    await fetchMovies(setMovies, setIsAddingMovie);
  };

  const triggerRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
    refreshMovies();
  };

  useEffect(() => {
    const loadMovies = async () => {
      await fetchMovies(setMovies, setIsAddingMovie);
    };
    loadMovies();
  }, [refreshKey]);

  // ✅ Filter + Sort movies based on toggle
  useEffect(() => {
    const filtered = movies
      .filter((movie) => movie.status === viewStatus)
      .sort((a, b) => {
        const key = sortKey as keyof typeof a;
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

        const numA = typeof valueA === "number" ? valueA : parseFloat(valueA.toString()) || 0;
        const numB = typeof valueB === "number" ? valueB : parseFloat(valueB.toString()) || 0;

        return sortOrder === "asc" ? numA - numB : numB - numA;
      });

    setFilteredMovies(filtered);
  }, [movies, sortKey, sortOrder, viewStatus]); // ✅ React to viewStatus

  const handleSortChange = (newSortKey: string, newSortOrder: "asc" | "desc") => {
    setSortKey(newSortKey);
    setSortOrder(newSortOrder);
  };

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <>
      <div className="flex gap-4 items-center">
        <MovieSearchDialog
          fetchMovies={refreshMovies}
          triggerRefresh={triggerRefresh}
          isAdmin={true}
        />
        <StatusToggle status={viewStatus} onToggle={setViewStatus} /> {/* ✅ Add Toggle */}
        <Sorting
          onSortChange={handleSortChange}
          currentSortKey={sortKey}
          currentSortOrder={sortOrder}
        />
        <SuggestedMovies refreshKey={refreshKey} />
        <Button
          onClick={() => router.push("/insights")}
          className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
        >
          Insights
          <Sparkles className="transform w-5 h-5" />
        </Button>
      </div>

      <div className="relative mt-4">
        {isAddingMovie && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 pointer-events-none">
            <p className="text-white font-semibold">Adding movie...</p>
          </div>
        )}

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
      </div>
    </>
  );
};

export default AdminPage;
