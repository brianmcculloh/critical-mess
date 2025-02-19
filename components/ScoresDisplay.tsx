"use client";

import React from "react";
import ScoresAdmin from "./ScoresAdmin";
import ScoresUser from "./ScoresUser";

interface Movie {
  id: number;
  critic_rating?: number | null;
  audience_rating?: number | null;
  user_rating?: number | null;
  avg_user_rating?: number | null;
  nick_rating?: number | null;
  brian_rating?: number | null;
  gris_rating?: number | null;
  ben_rating?: number | null;
}

interface ScoresDisplayProps {
  movie: Movie;
  isAdmin: boolean;
  setUserRating: (rating: number | null) => void;
}

const ScoresDisplay: React.FC<ScoresDisplayProps> = ({ movie, isAdmin, setUserRating }) => {
  return (
    <div className="mt-3">
      <ScoresAdmin movie={movie} />
      {!isAdmin && <ScoresUser movieId={movie.id} setUserRating={setUserRating} />}
    </div>
  );
};

export default ScoresDisplay;
