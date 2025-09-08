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

type ArrowDirection = "top" | "bottom" | "left" | "right";

// Define a type for each speech bubble in lock mode.
interface BubbleData {
  targetId: string;
  message: string;
  arrowDirection: ArrowDirection;
  position: { top: number; left: number } | null;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  // Add mobile detection state
  const [isMobile, setIsMobile] = useState(false);
  // Add small viewport detection for tutorial positioning
  const [isSmallViewport, setIsSmallViewport] = useState(false);

  // Track if the tutorial has been shown before
  const [hasSeenTutorial, setHasSeenTutorial] = useState<boolean>(false);

  useEffect(() => {
    // Function to check window width
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1180 - 1);
    };
    const checkSmallViewport = () => {
      setIsSmallViewport(window.innerWidth <= 1248);
    };
    checkMobile();
    checkSmallViewport();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("resize", checkSmallViewport);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("resize", checkSmallViewport);
    };
  }, []);

  // Check localStorage for tutorial flag on mount
  useEffect(() => {
    const seen = localStorage.getItem("hasSeenTutorial");
    setHasSeenTutorial(!!seen);
  }, []);

  // When tutorial is closed, set flag in localStorage
  const handleClose = () => {
    localStorage.setItem("hasSeenTutorial", "true");
    onClose();
  };

  // Hide tutorial on mobile or if already seen by rendering null in JSX, not by early return

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
              
              // Handle small viewport positioning (≤ 1248px)
              if (isSmallViewport) {
                // For "movie-search-local" (search input), position above
                if (bubble.targetId === "movie-search-local") {
                  return {
                    ...bubble,
                    position: { top: rect.top - 70, left: rect.left + rect.width / 2 },
                    arrowDirection: "bottom", // arrow points downward since bubble is above
                  };
                }
                // For "add-movie" (suggest button), position to the right to avoid cutoff
                if (bubble.targetId === "add-movie") {
                  return {
                    ...bubble,
                    position: { top: (rect.top + rect.height / 2) - 22, left: rect.right + 185 },
                    arrowDirection: "left", // arrow points left since bubble is to the right
                  };
                }
                // For "#sorting", display the bubble above the element.
                if (bubble.targetId === "sorting") {
                  return {
                    ...bubble,
                    position: { top: rect.top - 70, left: rect.left + rect.width / 2 },
                    arrowDirection: "bottom", // arrow points downward since bubble is above
                  };
                }
              }
              
              // Default behavior for larger viewports
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
  }, [tutorialStep, isSmallViewport]);

  return (isMobile || hasSeenTutorial) ? null : (
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
            className="max-h-screen fixed max-w-[440px] w-full"
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
              <div className="relative flex justify-center">
                <div className="w-full">
                  <div className="grid custom-grid tutorial-grid gap-4 w-full">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-not-allowed w-full max-w-[390px] mx-auto">
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
                            This is just an example.<br />Click "Got It!" to continue.
                          </span>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                {/* Move speech bubbles outside the grid */}
                <div className="absolute top-[441px] -left-[163px]">
                  <SpeechBubble message="Add your score here!" arrowDirection="right" />
                </div>
                <div className="absolute top-[518px] -right-[372px]">
                  <SpeechBubble message="Pick which host you vibed with most!" arrowDirection="left" />
                </div>
              </div>
            ) : (
              <p>Loading example movie...</p>
            )}
            <div className="mt-2 flex justify-end absolute bottom-[5px] right-[10px]">
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
        <div className="fixed inset-0 z-50 bg-transparent" onClick={handleClose}>
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
