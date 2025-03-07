"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Trash2, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import MovieSearchDialog from "@/components/MovieSearchDialog";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

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
  const [cachedMovieHosts, setCachedMovieHosts] = useState<
    Record<string, Record<string, string>>
  >({});

  // State to control dialog open/close.
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New state for the current user's patron level.
  const [patronLevel, setPatronLevel] = useState<number>(0);

  // Fetch the current user's patron_level from the users table.
  useEffect(() => {
    const fetchPatronLevel = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        const { data, error } = await supabase
          .from("users")
          .select("patron_level")
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Error fetching patron level:", error);
        } else if (data) {
          setPatronLevel(data.patron_level);
        }
      }
    };
    fetchPatronLevel();
  }, []);

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
            Object.entries(hostMap).map(([title, hosts]) => [
              title,
              hosts.join(", "),
            ])
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

  const refreshMovies = async () => {
    setCachedMovies((prev) => {
      const newCache = { ...prev };
      // Invalidate the cache for the current selected host and the combined view.
      delete newCache[selectedHost];
      delete newCache["combined"];
      return newCache;
    });
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <TooltipProvider delayDuration={0}>
        {patronLevel > 0 || user?.isAdmin ? (
          <DialogTrigger asChild>
            <Button className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white">
              <span className="hidden xs:block">Top 100</span>
              <Rocket className="transform w-5 h-5" />
            </Button>
          </DialogTrigger>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={(e) => e.preventDefault()}
                className="cursor-not-allowed transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
              >
                Top 100
                <Rocket className="transform w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-black text-white text-xs rounded-lg px-3 py-2 shadow-lg w-96"
            >
              Become a Patreon patron to view the official Critical Mess Top 100 movies of all time, as well as each host's individual top 100 movies!
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
      <DialogContent
        className="max-w-3xl w-full max-h-screen overflow-y-auto p-4"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle>Certified Ranch-Blasted™ Movies</DialogTitle>
        <DialogDescription>
          {user?.isAdmin
            ? "View and edit the top 100 favorite movies for each host here."
            : "Check out our individual and combined top 100 favorite movies of all time!"}
        </DialogDescription>
        <div className="flex justify-between flex-wrap">
          <div className="flex gap-2 mb-4 flex-wrap">
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
              isAdmin={true}
              selectedHost={selectedHost}
              fromTopHundred={true}
            />
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : selectedHost !== "combined" ? (
          user?.isAdmin ? (
            // For admins, enable drag-and-drop reordering.
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable
                droppableId="movies"
                renderClone={(provided, snapshot, rubric) => {
                  // Use the rubric.source.index to get the movie for the clone
                  const movie = movies[rubric.source.index];
                  return (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        cursor: snapshot.isDragging ? "grabbing" : "grab",
                      }}
                      className="flex items-center gap-1 p-2 xs:gap-3 xs:p-3 border justify-between rounded-md bg-card transition-opacity duration-300"
                    >
                      <div className="flex gap-3">
                        <span className="font-bold w-6">
                          {rubric.source.index + 1}
                        </span>
                        <span>
                          {movie.title} <span className="text-gray-400 dark:text-gray-500 text-xs">({movie.year})</span>
                        </span>
                      </div>
                      {user?.isAdmin && (
                        <button
                          className="ml-2 p-2"
                          onClick={() => handleDeleteMovie(movie.id)}
                          disabled={deletingMovieId === movie.id}
                        >
                          <Trash2
                            size={20}
                            className="text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white transition"
                          />
                        </button>
                      )}
                    </div>
                  );
                }}
              >
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {movies.map((movie, index) => (
                      <Draggable
                        key={movie.id}
                        draggableId={movie.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              cursor: snapshot.isDragging ? "grabbing" : "grab",
                            }}
                            className={`flex items-center gap-1 p-2 xs:gap-3 xs:p-3 border justify-between rounded-md bg-card transition-opacity duration-300 ${
                              deletingMovieId === movie.id ? "opacity-20" : "opacity-100"
                            }`}
                          >
                            <div className="flex gap-3">
                              <span className="font-bold w-6">{index + 1}</span>
                              <span>
                                {movie.title} <span className="text-gray-400 dark:text-gray-500 text-xs">({movie.year})</span>
                              </span>
                            </div>
                            {user?.isAdmin && (
                              <button
                                className="ml-2 p-2"
                                onClick={() => handleDeleteMovie(movie.id)}
                                disabled={deletingMovieId === movie.id}
                              >
                                <Trash2
                                  size={20}
                                  className="text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white transition"
                                />
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
                  className="flex items-center gap-1 p-2 xs:gap-3 xs:p-3 border justify-between rounded-md bg-card"
                >
                  <div className="flex gap-3">
                    <span className="font-bold w-6">{index + 1}</span>
                    <span>
                      {movie.title} <span className="text-gray-400 dark:text-gray-500 text-xs">({movie.year})</span>
                    </span>
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
                className="flex items-center gap-1 p-2 xs:gap-3 xs:p-3 border rounded-md bg-card"
              >
                <span className="font-bold w-6">{index + 1}</span>
                <span>
                  {movie.title} <span className="text-gray-400 dark:text-gray-500 text-xs">({movie.year})</span>
                </span>
                <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">
                  {movieHosts[movie.title] || "Unknown"}
                </span>
                <span className="text-primary">{movie.total_score}</span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TopHundred;
