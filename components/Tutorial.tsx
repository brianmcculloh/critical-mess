"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/MovieCard";
import { supabase } from "@/lib/supabaseClient";
import SpeechBubble from "@/components/SpeechBubble";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

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
  suggestion_count?: number | null;
  status?: string;
  episode?: number | null;
}

interface TutorialProps {
  onClose: () => void;
}

type ArrowDirection = "top" | "bottom";

// Define a type for each speech bubble in lock mode.
interface BubbleData {
  targetId: string;
  message: string;
  arrowDirection: ArrowDirection;
  position: { top: number; left: number } | null;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [exampleMovie, setExampleMovie] = useState<Movie | null>(null);
  // "dialog" shows the initial tutorial dialog; "lock" is the overlay step.
  const [tutorialStep, setTutorialStep] = useState<"dialog" | "lock">("dialog");

  // Speech bubbles for the lock mode.
  const [bubbles, setBubbles] = useState<BubbleData[]>([
    {
      targetId: "movie-search-local",
      message: "Search all of our episodes",
      arrowDirection: "top", // bubble below element, arrow pointing up
      position: null,
    },
    {
      targetId: "sorting",
      message: "Sort the results",
      arrowDirection: "top", // will be updated to "bottom" for above element
      position: null,
    },
    {
      targetId: "add-movie",
      message: "Suggest movies for us to discuss",
      arrowDirection: "top",
      position: null,
    },
    {
      targetId: "login",
      message: "Stay anonymous or create an account",
      arrowDirection: "top",
      position: null,
    },
  ]);

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

  // Compute bubble positions when entering lock mode.
  useEffect(() => {
    if (tutorialStep === "lock") {
      setTimeout(() => {
        setBubbles((prevBubbles) =>
          prevBubbles.map((bubble) => {
            const targetElement = document.getElementById(bubble.targetId);
            if (targetElement) {
              const rect = targetElement.getBoundingClientRect();
              // For "#sorting", display the bubble above the element.
              if (bubble.targetId === "sorting") {
                return {
                  ...bubble,
                  position: { top: rect.top - 70, left: rect.left + rect.width / 2 },
                  arrowDirection: "bottom", // arrow points downward since bubble is above
                };
              }
              // Default: display bubble below the element.
              return {
                ...bubble,
                position: { top: rect.bottom + 20, left: rect.left + rect.width / 2 },
                arrowDirection: "top",
              };
            }
            return bubble;
          })
        );
      }, 100);
    }
  }, [tutorialStep]);

  return (
    <>
      {tutorialStep === "dialog" && (
        <Dialog
          open
          onOpenChange={(open) => {
            // Prevent closing on outside clicks.
            if (!open) {
              // Do nothing.
            }
          }}
        >
          <DialogContent
            className="max-h-screen fixed"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Welcome to the Mess Hall!
              </DialogTitle>
              <DialogDescription>
                Every episode has its own movie card&mdash;rate the film and pick the host you most resonated with! Here's an example:
              </DialogDescription>
            </DialogHeader>
            {exampleMovie ? (
              <div className="grid custom-grid gap-4 relative">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-not-allowed">
                        <MovieCard
                          movie={{
                            ...exampleMovie,
                            suggestion_count: exampleMovie.suggestion_count ?? 0,
                            status: exampleMovie.status ?? "episode",
                          }}
                          editable={true}
                          disabled={true}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      className="bg-white text-black text-2xl font-bold"
                      side="top"
                      sideOffset={-160}
                    >
                      <span>
                        This is just an example.<br />Click "Got It!" when you're ready.
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* Original absolute-positioned speech bubbles */}
                <div className="absolute top-[479px] -left-[150px]">
                  <SpeechBubble message="Add your score here!" arrowDirection="right" />
                </div>
                <div className="absolute top-[556px] -right-[315px]">
                  <SpeechBubble message="Pick which host you liked most!" arrowDirection="left" />
                </div>
              </div>
            ) : (
              <p>Loading example movie...</p>
            )}
            <div className="mt-2 flex justify-end absolute bottom-[10px] right-[10px]">
              {/* Transition to lock mode */}
              <Button
                onClick={() => setTutorialStep("lock")}
                className="text-lg font-bold text-black focus:outline-none focus:ring-0"
              >
                Got it!
              </Button>

            </div>
          </DialogContent>
        </Dialog>
      )}

      {tutorialStep === "lock" && (
        // Transparent full-screen overlay that closes the tutorial on any click.
        <div className="fixed inset-0 z-50 bg-transparent" onClick={onClose}>
          {bubbles.map(
            (bubble, index) =>
              bubble.position && (
                <div
                  key={index}
                  style={{
                    position: "absolute",
                    top: bubble.position.top,
                    left: bubble.position.left,
                    transform: "translateX(-50%)",
                  }}
                >
                  <SpeechBubble message={bubble.message} arrowDirection={bubble.arrowDirection} />
                </div>
              )
          )}
        </div>
      )}
    </>
  );
};

export default Tutorial;
