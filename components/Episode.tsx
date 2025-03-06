import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import FloatingText from "@/components/FloatingText";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

interface EpisodeProps {
  movieId: number;
  initialEpisode: number;
  onEpisodeChange?: (value: number) => void;
  skipDatabaseSave?: boolean;
  triggerSuggestedMoviesRefresh?: () => void;
  onStartEditing?: () => void; // ✅ Added
  onStopEditing?: () => void;  // ✅ Added
}

interface Movie {
  id: number;
  title: string;
  year?: number;
  poster_url?: string;
  critic_rating?: number | null;
  audience_rating?: number | null;
  user_rating?: number | null;
  user_selected_host?: string | null;
  created_at?: string;
  suggestion_count?: number | null;
  status?: string;
  episode?: number | null;
}

interface UpdateData {
  episode: number;
  status: string;
}

const Episode: React.FC<EpisodeProps> = ({
  movieId,
  initialEpisode,
  onEpisodeChange,
  skipDatabaseSave = false,
  triggerSuggestedMoviesRefresh,
  onStartEditing,
  onStopEditing
}) => {
  const [episode, setEpisode] = useState<number>(initialEpisode);
  const [editing, setEditing] = useState<boolean>(false);
  const [tempEpisode, setTempEpisode] = useState<string>(initialEpisode.toString());
  const [originalEpisode, setOriginalEpisode] = useState<string>(initialEpisode.toString());
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState<boolean>(false);
  // New state for the bottom-right toast alert
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const pathname = usePathname();
  const isAdmin = pathname === "/admin";
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setEpisode(initialEpisode);
    setOriginalEpisode(initialEpisode.toString());
    setTempEpisode(initialEpisode.toString());
  }, [initialEpisode]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  // Auto-hide the toast alert after 4 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleStartEditing = () => {
    setEditing(true);
    if (onStartEditing) onStartEditing(); // ✅ Notify parent
  };
  
  const handleFinishEditing = async () => {
    await handleSave();
    if (onStopEditing) onStopEditing(); // ✅ Notify parent
  };
  
  // ✅ Handle input changes with validation (0-10000 only)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (/^\d*$/.test(inputValue)) {
      const normalizedValue = inputValue.replace(/^0+(?=\d)/, ""); // Remove leading zeros
      const numericValue = Number(normalizedValue);

      if (numericValue <= 10000) {
        setTempEpisode(normalizedValue);
      }
    }
  };

  // ✅ Save only if valid number between 0 and 10000
  const handleSave = async () => {
    const numericValue = Number(tempEpisode);
    if (
      tempEpisode.trim() !== "" &&
      !isNaN(numericValue) &&
      numericValue >= 0 &&
      numericValue <= 10000
    ) {
      // If value hasn't changed, exit editing without saving.
      if (numericValue === episode) {
        setEditing(false);
        return;
      }

      // Check for duplicate episode numbers
      if (numericValue > 0) {
        const { data, error } = await supabase
          .from("movies")
          .select("id")
          .eq("episode", numericValue);
        if (error) {
          console.error("Error checking for duplicate episode:", error);
        } else if (data && data.length > 0) {
          const duplicateExists = (data as Movie[]).some((movie) => movie.id !== movieId);
          if (duplicateExists) {
            setShowDuplicateAlert(true);
            setTimeout(() => setShowDuplicateAlert(false), 3000);
            setTempEpisode(originalEpisode);
            setEditing(false);
            return;
          }
        }
      }

      // Update state after passing validation
      setEpisode(numericValue);
      setOriginalEpisode(tempEpisode);
      setEditing(false);

      if (onEpisodeChange) {
        onEpisodeChange(numericValue);
      }

      if (!skipDatabaseSave && movieId) {
        const updateData: UpdateData = { episode: numericValue, status: "episode" };
        if (numericValue === 0) updateData.status = "queue";
      
        const { data: updatedMovie, error: updateError } = await supabase
          .from("movies")
          .update(updateData)
          .eq("id", movieId)
          .select(); // ✅ Select updated row for reference
      
        if (updateError) {
          console.error("❌ Error updating episode:", updateError);
        } else {
          // ✅ If updated movie's status is "episode", delete all others with the same ID
          if (updateData.status === "episode" && updatedMovie && updatedMovie.length > 0) {
            const { error: deleteError } = await supabase
              .from("movies")
              .delete()
              .eq("id", movieId)
              .neq("movie_instance_id", updatedMovie[0].movie_instance_id); // ✅ Keep the updated row
      
            if (deleteError) {
              console.error("❌ Error deleting duplicate episodes:", deleteError);
            }
            if (triggerSuggestedMoviesRefresh) triggerSuggestedMoviesRefresh();
          }
          // Trigger the FloatingText and the bottom-right toast alert
          setShowFeedback(false);
          setTimeout(() => {
            setShowFeedback(true);
            setShowAlert(true);
          }, 0);
        }
      }
      
    } else {
      setEditing(false); // Close input if invalid
    }
  };

  if (episode === 0 && !isAdmin) return null;

  return (
    <>
      {showDuplicateAlert && (
        <Alert className="shadow-lg bg-yellow text-black absolute top-8 w-5/6 left-1/2 transform -translate-x-1/2 z-50">
          <TriangleAlert color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
          <AlertTitle>Duplicate Found</AlertTitle>
          <AlertDescription>Episode number already in use</AlertDescription>
        </Alert>
      )}
      <div
        className={`absolute bottom-2 left-2 transition-all bg-white text-default dark:bg-black border border-black rounded-md px-3 py-2 text-sm ${
          isAdmin ? "hover:border-primary dark:hover:border-white cursor-pointer" : ""
        }`}
        onClick={() => isAdmin && handleStartEditing()}
      >
        <div className="relative flex items-center justify-center">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              className="border font-bold w-20 rounded -bottom-[8px] -left-[12px] absolute px-2 py-[5px] text-center text-base bg-white dark:bg-black focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-white"
              value={tempEpisode}
              onChange={handleInputChange} // ✅ Use validated input handler
              onBlur={handleFinishEditing} // ✅ Trigger onStopEditing
              onKeyDown={(e) => e.key === "Enter" && handleFinishEditing()} // ✅ Trigger onStopEditing
              autoFocus
            />
          ) : (
            <span className="font-normal">
              Episode <span className="font-bold">{episode}</span>
            </span>
          )}
          <FloatingText
            show={showFeedback}
            message="Saved!"
            onComplete={() => setShowFeedback(false)}
          />
        </div>
      </div>

      {/* Bottom-right toast notification */}
      {showAlert && (
        <div className="fixed bottom-4 right-4 rounded-lg shadow-lg z-50">
          <Alert className="shadow-lg bg-yellow text-black">
            <TriangleAlert color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
            <AlertTitle>Saved!</AlertTitle>
            <AlertDescription>Episode updated</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default Episode;
