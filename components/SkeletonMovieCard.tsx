import React from "react";

const SkeletonMovieCard: React.FC = () => {
  return (
    <div className="relative p-4 border rounded-lg shadow bg-white dark:bg-zinc-900 animate-pulse">
      <div className="h-6 w-3/4 bg-zinc-300 dark:bg-zinc-700 rounded mb-2"></div>
      <div className="h-48 bg-zinc-300 dark:bg-zinc-700 rounded w-full mb-2"></div>
      <div className="h-4 w-1/2 bg-zinc-300 dark:bg-zinc-700 rounded mb-2"></div>
      <div className="h-4 w-1/4 bg-zinc-300 dark:bg-zinc-700 rounded"></div>
    </div>
  );
};

export default SkeletonMovieCard;
