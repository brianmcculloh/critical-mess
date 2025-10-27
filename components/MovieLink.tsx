// components/MovieLink.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Video, ThumbsUp } from "lucide-react"; // For non-admin mode
import FloatingText from "@/components/FloatingText";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Movie {
  id: number;
  title: string;
  poster_url?: string;
  url?: string | null;
}

interface MovieLinkProps {
  movie: Movie;
  isAdmin: boolean;
  // Optional callback to notify parent on URL update
  onUrlUpdate?: () => void;
  showMovieLink?: boolean;
}

const MovieLink: React.FC<MovieLinkProps> = ({ movie, isAdmin, onUrlUpdate, showMovieLink = true }) => {
  const [editing, setEditing] = useState(false);
  const [urlValue, setUrlValue] = useState(movie.url || "");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Save the URL to the database when editing finishes
  const saveUrl = async () => {
    if (urlValue !== movie.url) {
      const { error } = await supabase
        .from("movies")
        .update({ url: urlValue })
        .eq("id", movie.id);
      if (error) {
        console.error("Error updating URL:", error);
      } else {
        if (onUrlUpdate) onUrlUpdate();
        // Trigger notifications: show FloatingText and Alert
        setShowFeedback(false);
        setTimeout(() => {
          setShowFeedback(true);
          setShowAlert(true);
        }, 0);
      }
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveUrl();
    }
  };

  // Auto-hide the alert after 4 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  if (isAdmin) {
    return (
      <>
        <div
          className="relative group"
          onClick={showMovieLink ? () => setEditing(true) : undefined}
        >
          {movie.poster_url && (
            <Image
              src={movie.poster_url}
              alt={movie.title}
              width={500}
              height={400}
              className={`mt-2 rounded-lg w-full transition ${
                showMovieLink ? "cursor-pointer hover:brightness-50" : "cursor-default"
              }`}
            />
          )}
          {editing ? (
            <>
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              <input
                ref={inputRef}
                type="text"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onBlur={saveUrl}
                onKeyDown={handleKeyDown}
                placeholder="Paste URL here..."
                className="border font-bold w-4/5 h-10 rounded absolute inset-0 m-auto px-2 py-[5px] text-center text-base bg-white dark:bg-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-white"
              />
            </>
          ) : (
            showMovieLink && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-50 cursor-pointer pointer-events-none md:block hidden">
                <span className="text-white font-bold">Click to edit link</span>
              </div>
            )
          )}
        </div>
        {/* Floating text feedback */}
        <FloatingText
          show={showFeedback}
          message="Saved!"
          onComplete={() => setShowFeedback(false)}
        />
        {/* Bottom-right toast notification */}
        {showAlert && (
          <div className="fixed bottom-4 right-4 rounded-lg shadow-lg z-50">
            <Alert className="shadow-lg bg-yellow text-black">
              <ThumbsUp color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
              <AlertTitle>Saved!</AlertTitle>
              <AlertDescription>Link updated</AlertDescription>
            </Alert>
          </div>
        )}
      </>
    );
  } else {
    // Non-admin mode.
    const imageContent = movie.poster_url ? (
      <Image
        src={movie.poster_url}
        alt={movie.title}
        width={500}
        height={400}
        className={`mt-2 rounded-lg w-full transition ${
          showMovieLink && movie.url ? "cursor-pointer hover:brightness-50" : "cursor-default"
        }`}
      />
    ) : null;

    if (movie.url && showMovieLink) {
      return (
        <div className="relative">
          <a
            href={movie.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative group block"
          >
            {imageContent}
            {/* Always visible play button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg relative">
                <div className="w-0 h-0 border-l-[16px] border-l-black border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent translate-x-0.5"></div>
              </div>
            </div>
            {/* Hover overlay with text - hidden on touch devices */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-50 pointer-events-none hidden md:flex">
              <span className="text-white font-bold flex items-center gap-2">
                <span>Watch on YouTube</span>
                <Video className="w-5 h-5" />
              </span>
            </div>
          </a>
        </div>
      );
    } else {
      // If showMovieLink is false or there's no URL, render the image without interaction.
      return <div className="relative">{imageContent}</div>;
    }
  }
};

export default MovieLink;
