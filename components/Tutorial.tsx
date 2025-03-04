"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/MovieCard";
import { supabase } from "@/lib/supabaseClient";
import SpeechBubble from "@/components/SpeechBubble";

interface Movie {
  id: number;
  title: string;
  year?: number;
  poster_url?: string;
  critic_rating?: number | null;
  audience_rating?: number | null;
  user_rating?: number | null;
  nick_rating?: number | null;
  brian_rating?: number | null;
  gris_rating?: number | null;
  ben_rating?: number | null;
  suggestion_count?: number | null; // Fetched data may be undefined or null.
  status?: string;
  episode?: number | null;
}

interface TutorialProps {
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [exampleMovie, setExampleMovie] = useState<Movie | null>(null);

  // Fetch a random movie with status "episode" on mount.
  useEffect(() => {
    const fetchRandomMovie = async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("status", "episode");
      if (error) {
        console.error("Error fetching movies for tutorial:", error);
        return;
      }
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setExampleMovie(data[randomIndex]);
      }
    };
    fetchRandomMovie();
  }, []);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-screen">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Welcome to the Critical Mess Hall!</DialogTitle>
          <DialogDescription>
            Every episode has its own movie card&mdash;rate the film and pick the host you most resonated with! Here's an example episode:
          </DialogDescription>
        </DialogHeader>
        {exampleMovie ? (
        <div className="grid custom-grid gap-4 relative">
            {/* Render a static, non-editable MovieCard.
                We map the movie so that suggestion_count and status have default values */}
            <MovieCard 
            movie={{
                ...exampleMovie,
                suggestion_count: exampleMovie.suggestion_count ?? 0,
                status: exampleMovie.status ?? "episode",
            }} 
            editable={true} 
            disabled={true}
            />
            
            <div className="absolute top-[465px] -left-[150px]">
                <SpeechBubble message="Add your score here!" arrowDirection="right" />
            </div>
            <div className="absolute top-[544px] -right-[315px]">
                <SpeechBubble message="Pick which host you liked most!" arrowDirection="left" />
            </div>

        </div>
        ) : (
        <p>Loading example movie...</p>
        )}
        <div className="mt-2 flex justify-end absolute bottom-[10px] right-[10px]">
          <Button onClick={onClose} className="text-lg font-bold">Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Tutorial;
