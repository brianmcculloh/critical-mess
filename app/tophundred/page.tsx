"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import MovieSearchDialog from "@/components/MovieSearchDialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

const hosts = ["combined", "nick", "brian", "gris", "ben"];

interface Movie {
  id: number;
  title: string;
  year?: number;
  total_score?: number;
}

const TopHundred: React.FC = () => {
  const { user } = useAuth();
  const [selectedHost, setSelectedHost] = useState("combined");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingMovieId, setDeletingMovieId] = useState<number | null>(null);
  const [movieHosts, setMovieHosts] = useState<Record<string, string>>({});

  // Caches to store fetched movies and host mappings per host.
  const [cachedMovies, setCachedMovies] = useState<Record<string, Movie[]>>({});
  const [cachedMovieHosts, setCachedMovieHosts] = useState<Record<string, Record<string, string>>>({});

  // Helper function to invalidate the combined view cache.
  const invalidateCombinedCache = () => {
    setCachedMovies((prev) => {
      const newCache = { ...prev };
      delete newCache["combined"];
      return newCache;
    });
  };

  const fetchMovies = useCallback(async () => {
    // If we've already fetched movies for this host, use them.
    if (cachedMovies[selectedHost]) {
      setMovies(cachedMovies[selectedHost]);
      if (selectedHost === "combined" && cachedMovieHosts[selectedHost]) {
        setMovieHosts(cachedMovieHosts[selectedHost]);
      }
      setLoading(false);
      return;
    }
    
    setLoading(true);
    let query;
    if (selectedHost === "combined") {
      query = supabase
        .from("combined_top_hundred")
        .select("*")
        .order("total_score", { ascending: false })
        .limit(100);
    } else {
      query = supabase
        .from("top_hundred_movies")
        .select("*")
        .eq("host", selectedHost)
        .order("rank", { ascending: true })
        .limit(100);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching top 100 movies:", error);
    } else {
      setMovies(data || []);
      // Cache the movies for the selected host.
      setCachedMovies((prev) => ({ ...prev, [selectedHost]: data || [] }));
      
      if (selectedHost === "combined") {
        const { data: allMovies, error: allMoviesError } = await supabase
          .from("top_hundred_movies")
          .select("title, host");
        if (allMoviesError) {
          console.error("Error fetching all movies for hosts:", allMoviesError);
        }
        if (allMovies) {
          const hostMap: Record<string, string[]> = {};
          allMovies.forEach(({ title, host }) => {
            if (!hostMap[title]) hostMap[title] = [];
            if (!hostMap[title].includes(host)) hostMap[title].push(host);
          });
          const movieHostsData = Object.fromEntries(
            Object.entries(hostMap).map(([title, hosts]) => [title, hosts.join(", ")])
          );
          setMovieHosts(movieHostsData);
          // Cache the movie-host mapping for combined view.
          setCachedMovieHosts((prev) => ({ ...prev, [selectedHost]: movieHostsData }));
        }
      }
    }
    setLoading(false);
  }, [selectedHost, cachedMovies, cachedMovieHosts]);

  useEffect(() => {
    fetchMovies();
  }, [selectedHost, fetchMovies]);

  // Wrap fetchMovies to also invalidate combined cache.
  const refreshMovies = async () => {
    invalidateCombinedCache();
    await fetchMovies();
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || selectedHost === "combined") return;
    
    // Reorder movies based on drag-and-drop.
    const reorderedMovies = [...movies];
    const [movedMovie] = reorderedMovies.splice(result.source.index, 1);
    reorderedMovies.splice(result.destination.index, 0, movedMovie);
    
    // Update UI immediately and update the cache.
    setMovies(reorderedMovies);
    setCachedMovies((prev) => {
      const newCache = { ...prev, [selectedHost]: reorderedMovies };
      // Invalidate the combined cache.
      delete newCache["combined"];
      return newCache;
    });
    
    const movieIds = reorderedMovies.map((movie) => movie.id);
    
    try {
      const { error } = await supabase.rpc("update_host_rankings_by_ids", {
        host_name: selectedHost,
        movie_ids: movieIds,
      });
      if (error) {
        console.error("🚨 Error updating ranks:", error.message);
        return;
      }
    } catch (error) {
      console.error("🚨 Drag-and-drop update error:", error);
    }
  };

  const handleDeleteMovie = async (movieId: number) => {
    if (selectedHost === "combined") return;
  
    try {
      setDeletingMovieId(movieId);
  
      // Remove the movie from the current host.
      await supabase.from("top_hundred_movies").delete().eq("id", movieId);
  
      // Reorder the rankings after deletion.
      const { error } = await supabase.rpc("update_host_rankings", {
        host_name: selectedHost,
      });
      if (error) {
        console.error("🚨 Error updating ranks:", error.message);
        return;
      }

      // Invalidate cache for the current host and combined view.
      setCachedMovies((prev) => {
        const newCache = { ...prev };
        delete newCache[selectedHost];
        delete newCache["combined"];
        return newCache;
      });
      
      await fetchMovies();
    } catch (error) {
      console.error("🚨 Error deleting movie:", error);
    } finally {
      setDeletingMovieId(null);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card className="border bg-transparent">
        <CardHeader>
          <CardTitle>Certified Ranch-Blasted&trade; Movies</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.isAdmin 
              ? "View and edit the top 100 favorite movies for each host here." 
              : "Check out our individual and combined top 100 favorite movies of all time!"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between">
            <div className="flex gap-2 mb-4">
              {hosts.map((host) => (
                <Button
                  key={host}
                  onClick={() => setSelectedHost(host)}
                  className={`px-4 py-2 rounded-md transition-all ${
                    selectedHost === host
                      ? "bg-black text-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-white"
                      : "bg-accent text-black dark:text-white hover:text-white hover:bg-black dark:hover:bg-white dark:hover:text-black"
                  }`}
                >
                  {host.charAt(0).toUpperCase() + host.slice(1)}
                </Button>
              ))}
            </div>

            {/* Only show the Add Movie button for admins and non-combined views */}
            {selectedHost !== "combined" && user?.isAdmin && (
              <MovieSearchDialog 
                  fetchMovies={refreshMovies} 
                  triggerRefresh={refreshMovies} 
                  triggerSuggestedMoviesRefresh={() => {}} 
                  isAdmin={true} 
                  selectedHost={selectedHost} 
              />
            )}
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : selectedHost !== "combined" ? (
            user?.isAdmin ? (
              // For admins, enable drag-and-drop reordering.
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="movies">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {movies.map((movie, index) => (
                        <Draggable key={movie.id} draggableId={movie.id.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                cursor: snapshot.isDragging ? "grabbing" : "grab",
                              }}
                              className={`flex items-center gap-3 p-3 border justify-between rounded-md bg-card transition-opacity duration-300 ${
                                deletingMovieId === movie.id ? "opacity-20" : "opacity-100"
                              }`}
                            >
                              <div className="flex gap-3">
                                <span className="font-bold w-6">{index + 1}</span>
                                <span>{movie.title} ({movie.year})</span>
                              </div>
                              {user?.isAdmin && (
                                <button
                                  className="ml-2 p-2"
                                  onClick={() => handleDeleteMovie(movie.id)}
                                  disabled={deletingMovieId === movie.id}
                                >
                                  <Trash2 size={20} className="text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white transition" />
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : (
              // Non-admin users see a static list.
              <div className="space-y-2">
                {movies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="flex items-center gap-3 p-3 border justify-between rounded-md bg-card"
                  >
                    <div className="flex gap-3">
                      <span className="font-bold w-6">{index + 1}</span>
                      <span>{movie.title} ({movie.year})</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // The "combined" view remains static for all users.
            <div className="space-y-2">
              {movies.map((movie, index) => (
                <div
                  key={movie.id}
                  className="flex items-center gap-3 p-3 border rounded-md bg-card"
                >
                  <span className="font-bold w-6">{index + 1}</span>
                  <span>{movie.title} ({movie.year})</span>
                  <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">
                    {movieHosts[movie.title] || "Unknown"}
                  </span>
                  <span className="text-primary">{movie.total_score}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TopHundred;
