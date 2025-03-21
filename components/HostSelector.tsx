"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import FloatingText from "@/components/FloatingText";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ThumbsUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const HOSTS = ["nick", "brian", "gris", "ben"] as const;
type Host = (typeof HOSTS)[number];

interface HostSelectorProps {
  movieId: number;
  initialSelection?: Host | null;
  onSelectionUpdate: (selectedHost: Host) => void;
  disabled?: boolean;
}

const HostSelector: React.FC<HostSelectorProps> = ({
  movieId,
  initialSelection,
  onSelectionUpdate,
  disabled = false,
}) => {
  const { user } = useAuth();
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [selectedHost, setSelectedHost] = useState<Host | null>(
    initialSelection || null
  );
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [feedbackStates, setFeedbackStates] = useState<Record<Host, boolean>>({
    nick: false,
    brian: false,
    gris: false,
    ben: false,
  });
  // State for vote counts (heat meter values)
  const [votes, setVotes] = useState<Record<Host, number>>({
    nick: 0,
    brian: 0,
    gris: 0,
    ben: 0,
  });
  // State to control the bottom-right alert
  const [showAlert, setShowAlert] = useState(false);

  // Get or create a clientId.
  useEffect(() => {
    let storedClientId = localStorage.getItem("client_id");
    if (!storedClientId) {
      storedClientId = uuidv4();
      localStorage.setItem("client_id", storedClientId);
    }
    setClientId(storedClientId);
  }, []);

  // Check current user's admin status from public.users.
  useEffect(() => {
    if (!user || !user.id) return;
    const checkIfAdmin = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Error checking admin status:", error);
      } else if (data) {
        setCurrentUserIsAdmin(data.is_admin);
      }
    };
    checkIfAdmin();
  }, [user]);

  // Fetch the selected host from user_host_votes.
  useEffect(() => {
    if (!clientId) return;
    const fetchSelectedHost = async () => {
      const { data, error } = await supabase
        .from("user_host_votes")
        .select("host")
        .eq("client_id", clientId)
        .eq("movie_id", movieId)
        .maybeSingle();

      if (error) {
        console.error("🚨 Error fetching selected host:", error);
      } else if (data) {
        setSelectedHost(data.host as Host);
      }
    };

    fetchSelectedHost();
  }, [clientId, movieId]);

  // Function to fetch vote counts (heat meter values)
  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from("user_host_votes")
        .select("host")
        .eq("movie_id", movieId);
      if (error) throw error;
      if (data) {
        const newVotes: Record<Host, number> = {
          nick: 0,
          brian: 0,
          gris: 0,
          ben: 0,
        };
        data.forEach((entry: { host: string }) => {
          if (newVotes[entry.host as Host] !== undefined) {
            newVotes[entry.host as Host] += 1;
          }
        });
        setVotes(newVotes);
      }
    } catch (error) {
      console.error("🚨 Error fetching vote counts:", error);
    }
  };

  // Fetch vote counts on mount or when movieId changes.
  useEffect(() => {
    fetchVotes();
  }, [movieId]);

  // Hide the alert after 3 seconds.
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleSelectHost = async (host: Host) => {
    // If the current user is admin, do nothing.
    if (currentUserIsAdmin) return;
    if (!clientId) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("user_host_votes")
        .upsert(
          { client_id: clientId, movie_id: movieId, host },
          { onConflict: "client_id, movie_id" }
        );

      if (error) throw error;
      // Reset and trigger the FloatingText for this host.
      setFeedbackStates((prev) => ({ ...prev, [host]: false }));
      setTimeout(
        () => setFeedbackStates((prev) => ({ ...prev, [host]: true })),
        0
      );
      setSelectedHost(host);
      onSelectionUpdate(host);
      // Trigger the bottom-right alert notification.
      setShowAlert(true);
      // Optionally update the vote counts immediately.
      fetchVotes();
    } catch (error) {
      console.error("🚨 Error saving host selection:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate the maximum vote count (avoid division by zero).
  const maxVotes = Math.max(...Object.values(votes), 1);

  const content = (
    <div className="p-2">
      {/* Host selection buttons with heat meter bars attached */}
      <div className="mt-3 flex gap-2">
        {HOSTS.map((host) => {
          // Calculate the dynamic width percentage for the heat meter bar.
          const widthPercentage = (votes[host] / maxVotes) * 100;
          return (
            <div
              className="relative flex-1 flex flex-col items-center"
              key={host}
            >
              <button
                // Added "relative" so the bar can be absolutely positioned inside.
                className={`relative px-3 py-1 rounded-lg transition-colors border-2 w-full ${
                  selectedHost === host
                    ? "border-primary bg-primary/40"
                    : `border-primary/10 ${
                        disabled || currentUserIsAdmin
                          ? ""
                          : "hover:border-primary"
                      } bg-primary/10`
                } ${
                  disabled || currentUserIsAdmin
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                onClick={() => {
                  if (!disabled && !loading && !currentUserIsAdmin)
                    handleSelectHost(host);
                }}
                disabled={loading || disabled || currentUserIsAdmin}
              >
                {host.charAt(0).toUpperCase() + host.slice(1)}
                {/* Heat meter bar: a small dynamic bar attached to the bottom */}
                <div
                  className="pointer-events-none absolute bottom-0 left-0 h-1 bg-primary rounded-bl-lg"
                  style={{ width: `${widthPercentage}%` }}
                ></div>
              </button>

              {/* Vote count: display only if votes > 0 */}
              {votes[host] > 0 && (
                <div className="mt-1 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  {votes[host]}
                </div>
              )}

              <FloatingText
                show={feedbackStates[host]}
                message="Saved!"
                onComplete={() =>
                  setFeedbackStates((prev) => ({ ...prev, [host]: false }))
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  if (disabled) {
    return content;
  }

  return (
    <>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-black text-white dark:bg-black dark:text-white text-sm rounded-lg px-3 py-2 shadow-lg"
          >
            <span>Heat Meter: which host did you resonate with?</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Bottom-right notification toast */}
      {showAlert && (
        <div className="fixed bottom-4 right-4 rounded-lg shadow-lg z-50">
          <Alert className="shadow-lg bg-yellow text-black">
            <ThumbsUp
              color="black"
              className="absolute left-3 top-1/2 transform w-5 h-5"
            />
            <AlertTitle>Saved!</AlertTitle>
            <AlertDescription>Host selection updated</AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default HostSelector;
