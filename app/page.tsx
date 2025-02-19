/* TODO
Analytics panel
-most and least aligned with critics
-most and least aligned with audience
-highest and lowest total average rating
User movie submissions
  -throttle current user from submitting a movie more than once
View all movies currently on our list
View submissions

*/

"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import MovieCard from "@/components/MovieCard";
import Header from "@/components/Header";
import Sorting from "@/components/Sorting";
import SkeletonMovieCard from "@/components/SkeletonMovieCard";
import MovieSearchLocal from "@/components/MovieSearchLocal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MovieSearch from "@/components/MovieSearch"; // Assuming this is the component used for API search
import { fetchMovies } from "@/lib/movieUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert, ThumbsUp } from "lucide-react"; // Assuming this is the icon used in the alert


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
}

const HomePage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string>("date_added");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    const loadMovies = async () => {
      await fetchMovies(setMovies, setLoading);
      setFilteredMovies(movies); // Ensure filteredMovies is set after fetching
    };
    loadMovies();
  }, []);

  useEffect(() => {
    setFilteredMovies(movies);
  }, [movies]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredMovies(movies); // Show all movies if search is empty
      return;
    }

    const filtered = movies.filter((movie) =>
      movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movie.year && movie.year.toString().includes(searchTerm))
    );

    setFilteredMovies(filtered);
  };

  // Function to handle movie selection
  const handleMovieSelect = async (movie: Movie) => {
    // Check if the movie is already in the list
    const isAlreadyAdded = movies.some((m) => m.id === movie.id);
    if (isAlreadyAdded) {
      alert("This movie is already added.");
      return;
    }
    setSelectedMovie(movie);
  };

  const handleConfirmSuggestion = async () => {
    if (!selectedMovie) return;

    try {
      // Close the dialog before performing async operations
      setShowOverlay(false);

      const movieData = {
        title: selectedMovie.title,
        year: selectedMovie.year,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("movie_suggestions").insert([movieData]);
      if (error) throw error;
      setSelectedMovie(null);
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 4000); // Hide alert after 4 seconds
    } catch (error) {
      if (error instanceof Error) {
        console.error("🚨 Error suggesting movie:", error.message);
      } else {
        console.error("🚨 Error suggesting movie:", error);
      }
    }
  };

  // Sorting function
  const handleSortChange = (newSortKey: string, newSortOrder: "asc" | "desc") => {
    setSortKey(newSortKey);
    setSortOrder(newSortOrder);
  
    setFilteredMovies((prevMovies) => {
      return [...prevMovies].sort((a, b) => {
        const key = newSortKey as keyof Movie;
        let valueA: number | string = a[key] ?? 0;
        let valueB: number | string = b[key] ?? 0;
  
        // Special case for sorting by title
        if (key === "title") {
          const titleA = a.title.toLowerCase();
          const titleB = b.title.toLowerCase();
          if (titleA < titleB) return newSortOrder === "asc" ? -1 : 1;
          if (titleA > titleB) return newSortOrder === "asc" ? 1 : -1;
          return 0;
        }
  
        // Special case for sorting by created_at
        if (key === "created_at") {
          valueA = a.created_at ? new Date(a.created_at).getTime() : 0;
          valueB = b.created_at ? new Date(b.created_at).getTime() : 0;
        }
  
        // Ensure both values are numbers for comparison
        const numA = typeof valueA === "number" ? valueA : parseFloat(valueA.toString()) || 0;
        const numB = typeof valueB === "number" ? valueB : parseFloat(valueB.toString()) || 0;
  
        return newSortOrder === "asc" ? numA - numB : numB - numA;
      });
    });
  };

  return (
    <div className="p-6">
      <Header />
      {showSuccessAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm">
          <Alert className="shadow-lg animate-slide-down bg-secondary">
            <ThumbsUp className="absolute left-3 top-1/2 transform w-5 h-5" />
            <AlertTitle>Bing!</AlertTitle>
            <AlertDescription>Thanks for the suggestion&mdash;it might be discussed on a future episode!</AlertDescription>
          </Alert>
        </div>
      )}
      <div className="flex gap-4 mt-4 pb-4 items-center">
        <MovieSearchLocal onSearch={handleSearch} />
        <Sorting onSortChange={handleSortChange} />
        <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowOverlay(true)}>Suggest a Movie</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Suggest a Movie</DialogTitle>
            <DialogDescription>Search for a movie to suggest for us to discuss:</DialogDescription>
            <div className="p-4">
              <MovieSearch
                onSelectMovie={setSelectedMovie}
                fetchMovies={() => fetchMovies(setMovies, setLoading)}
                isAdmin={false}
              />
              {selectedMovie && (
                <div className="mt-4">
                  <MovieCard movie={selectedMovie} editable={false} showRatings={false} />
                  <Button onClick={handleConfirmSuggestion} className="mt-4">Confirm Suggestion</Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <SkeletonMovieCard key={index} />
          ))}
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMovies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} editable={true} />
          ))}
        </div>
      ) : (
        <p className="text-zinc-500">No matching movies found.</p>
      )}
    </div>
  );

};

export default HomePage;
