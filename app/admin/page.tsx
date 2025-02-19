"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import MovieSearch from "@/components/MovieSearch";
import { supabase } from "@/lib/supabaseClient";
import DeleteMovieModal from "@/components/DeleteMovieModal";
import MovieCard from "@/components/MovieCard";
import Header from "@/components/Header";
import { fetchMovies } from "@/lib/movieUtils";

const AdminPage: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  
  const [movies, setMovies] = useState<any[]>([]);
  const [isAddingMovie, setIsAddingMovie] = useState(false);

  // ✅ Fetch movies from Supabase
  useEffect(() => {
    const loadMovies = async () => {
      await fetchMovies(setMovies, setIsAddingMovie);
    };
    loadMovies();
  }, []);

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleMovieSearchSelect = async () => {
    console.log("🟡 handleMovieSearchSelect triggered! Setting isAddingMovie = true");
    setIsAddingMovie(true);
  };

  const handleDeleteMovie = async () => {
    // Call fetchMovies with the necessary arguments
    await fetchMovies(setMovies, setIsAddingMovie);
  };

  return (
    <div className="p-6">
      <Header />
      <MovieSearch
        onSelectMovie={handleMovieSearchSelect}
        fetchMovies={() => fetchMovies(setMovies, setIsAddingMovie)}
        isAdmin={true} // Pass true for admin behavior
      />

      <h2 className="text-xl font-semibold mt-6">Saved Movies</h2>

      {/* ✅ Wrap movie grid in a relative div for overlay */}
      <div className="relative mt-4">
        {/* ✅ Disable grid visually when adding a movie */}
        {isAddingMovie && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 pointer-events-none">
            <p className="text-white font-semibold">Adding movie...</p>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity ${isAddingMovie ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          {movies.map((movie) => (
            <div key={movie.id} className="relative">
              <DeleteMovieModal movieId={movie.id} movieTitle={movie.title} onDelete={handleDeleteMovie} />
              <MovieCard movie={movie} editable={true} isAdmin={true} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
