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

const HOSTS = ["nick", "brian", "gris"/*, "ben"*/] as const;
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
  const [selectedHost, setSelectedHost] = useState<Host | null>(
    initialSelection || null
  );
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [feedbackStates, setFeedbackStates] = useState<Record<Host, boolean>>({
    nick: false,
    brian: false,
    gris: false,
    /*ben: false,*/
  });
  // New state to control the bottom-right alert
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    let storedClientId = localStorage.getItem("client_id");
    if (!storedClientId) {
      storedClientId = uuidv4();
      localStorage.setItem("client_id", storedClientId);
    }
    setClientId(storedClientId);
  }, []);

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

  // Hide the alert after 4 seconds
  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleSelectHost = async (host: Host) => {
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
      // Reset and then trigger the FloatingText for this host
      setFeedbackStates((prev) => ({ ...prev, [host]: false }));
      setTimeout(
        () => setFeedbackStates((prev) => ({ ...prev, [host]: true })),
        0
      );
      setSelectedHost(host);
      onSelectionUpdate(host);
      // Trigger the bottom-right alert notification
      setShowAlert(true);
    } catch (error) {
      console.error("🚨 Error saving host selection:", error);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="p-2">
      {/* Host selection buttons */}
      <div className="mt-3 flex gap-2 justify-stretch">
        {HOSTS.map((host) => (
          <div className="relative inline-block grow" key={host}>
            <button
              className={`px-3 py-1 rounded-lg transition-colors border-2 w-full ${
                selectedHost === host
                  ? "border-primary bg-primary/40"
                  : `border-primary/10 ${
                      disabled ? "" : "hover:border-primary"
                    } bg-primary/10`
              } ${disabled ? "cursor-not-allowed" : ""}`}
              onClick={() => {
                if (!disabled && !loading) handleSelectHost(host);
              }}
              disabled={loading || disabled}
            >
              {host.charAt(0).toUpperCase() + host.slice(1)}
            </button>

            <FloatingText
              show={feedbackStates[host]}
              message="Saved!"
              onComplete={() =>
                setFeedbackStates((prev) => ({ ...prev, [host]: false }))
              }
            />
          </div>
        ))}
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
            <ThumbsUp color="black" className="absolute left-3 top-1/2 transform w-5 h-5" />
            <AlertTitle>Saved!</AlertTitle>
            <AlertDescription>
              Host selection updated
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
};

export default HostSelector;
