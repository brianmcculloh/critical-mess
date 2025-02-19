"use client";

import React, { useState } from "react";
import Image from "next/image";
import HostSelector from "@/components/HostSelector";
import HeatMeter from "@/components/HeatMeter";
import ScoresDisplay from "@/components/ScoresDisplay";

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
}

interface MovieCardProps {
  movie: Movie;
  editable?: boolean;
  isAdmin?: boolean;
  showRatings?: boolean; // New prop to control ratings display
  onClick?: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, editable = false, isAdmin = false, showRatings = true, onClick }) => {
  const [userRating, setUserRating] = useState<number | null>(movie.user_rating || null);
  const [heatMeterKey, setHeatMeterKey] = useState(0);

  const handleHostSelectionUpdate = () => {
    setHeatMeterKey((prevKey) => prevKey + 1);
  };

  return (
    <div className="relative p-4 border text-card-foreground rounded-lg shadow bg-card">
      <h3 className="text-lg pr-7">
        <strong>{movie.title}</strong> ({movie.year || "N/A"})
      </h3>

      {movie.poster_url && (
        <Image
          src={movie.poster_url}
          alt={movie.title}
          width={200}
          height={300}
          className="mt-2 rounded-lg w-full"
        />
      )}

      {showRatings && (
        <ScoresDisplay movie={movie} isAdmin={isAdmin} setUserRating={setUserRating} />
      )}

      {editable && !isAdmin && (
        <>
          <HostSelector movieId={movie.id} initialSelection={null} onSelectionUpdate={handleHostSelectionUpdate} />
          <HeatMeter key={heatMeterKey} movieId={movie.id} />
        </>
      )}
    </div>
  );
};

export default MovieCard;