"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

const HOSTS = ["nick", "brian", "gris", "ben"] as const;
type Host = (typeof HOSTS)[number];

interface HostSelectorProps {
  movieId: number;
  initialSelection?: Host | null;
  onSelectionUpdate: (selectedHost: Host) => void;
}

const HostSelector: React.FC<HostSelectorProps> = ({ movieId, initialSelection, onSelectionUpdate }) => {
  const [selectedHost, setSelectedHost] = useState<Host | null>(initialSelection || null);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

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

  const handleSelectHost = async (host: Host) => {
    if (selectedHost === host || !clientId) return; // Prevent reselecting the same host
    setLoading(true);

    try {
      const { error } = await supabase
        .from("user_host_votes")
        .upsert({ client_id: clientId, movie_id: movieId, host }, { onConflict: "client_id, movie_id" });

      if (error) throw error;
      setSelectedHost(host);
      onSelectionUpdate(host); // Update UI with new selection
    } catch (error) {
      console.error("🚨 Error saving host selection:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 flex gap-2">
      {HOSTS.map((host) => (
        <button
          key={host}
          className={`px-3 py-1 rounded-lg transition-colors border-2
            ${selectedHost === host ? "border-primary bg-primary/40" : "border-primary/10 hover:border-primary bg-primary/10"}
            ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={() => handleSelectHost(host)}
          disabled={loading}
        >
          {host.charAt(0).toUpperCase() + host.slice(1)}
        </button>
      
      
      ))}
    </div>
  );
};

export default HostSelector;
