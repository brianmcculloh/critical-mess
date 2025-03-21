"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Trash2 } from "lucide-react";

interface DeleteMovieModalProps {
  movieId: number; // pass the movie id
  movieTitle: string;
  onDelete: () => void;
  onClose: () => void;
}

export default function DeleteMovieModal({
  movieId,
  movieTitle,
  onDelete,
  onClose,
}: DeleteMovieModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    // First delete the movie from the movies table by its id
    const { error: movieError } = await supabase
      .from("movies")
      .delete()
      .eq("id", movieId);
    
    if (movieError) {
      console.error("Error deleting movie:", movieError);
    } else {
      // Then delete all corresponding rows in user_host_votes
      const { error: hostVotesError } = await supabase
        .from("user_host_votes")
        .delete()
        .eq("movie_id", movieId);
      if (hostVotesError) {
        console.error("Error deleting host votes:", hostVotesError);
      }

      // And delete all corresponding rows in user_ratings
      const { error: ratingsError } = await supabase
        .from("user_ratings")
        .delete()
        .eq("movie_id", movieId);
      if (ratingsError) {
        console.error("Error deleting user ratings:", ratingsError);
      }

      onDelete(); // Update UI after deletion
      onClose();
    }

    setLoading(false);
    setOpen(false); // Close modal
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="absolute top-5 right-3.5 z-20">
          <Trash2
            size={20}
            className="text-black/30 hover:text-black dark:text-white/30 dark:hover:text-white transition"
          />
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card p-6 rounded-lg shadow-lg w-80 z-50">
          <Dialog.Title className="text-lg font-semibold">
            Delete Movie?
          </Dialog.Title>
          <Dialog.Description className="mt-2">
            Are you sure you want to delete <strong>{movieTitle}</strong>? This action cannot be undone.
          </Dialog.Description>

          <div className="mt-4 flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg transition-colors bg-secondary hover:bg-secondary/70 text-secondary-foreground"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg transition-colors bg-primary hover:bg-primary/70 text-black"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
