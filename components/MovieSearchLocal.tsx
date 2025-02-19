"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";

interface MovieSearchLocalProps {
  onSearch: (searchTerm: string) => void;
}

const MovieSearchLocal: React.FC<MovieSearchLocalProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    onSearch(searchTerm.trim());
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleBlur = () => {
    handleSearch();
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch(""); // Reset search results
  };

  return (
    <div className="flex items-center gap-2">
      {/* Search input wrapper */}
      <div className="relative">
        {/* Search icon */}
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" />
        
        {/* Input field with padding to accommodate icon */}
        <input
          type="text"
          className="border rounded w-96 p-2 pl-10 focus:outline-none"
          placeholder="Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      </div>
  
      {searchTerm && (
        <button
          onClick={handleClear}
          className="px-4 py-2 rounded-lg font-medium transition bg-secondary text-secondary-foreground hover:bg-secondary/70"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default MovieSearchLocal;
