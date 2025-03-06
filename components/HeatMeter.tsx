"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const HOSTS = ["nick", "brian", "gris", "ben"] as const;
type Host = (typeof HOSTS)[number];

interface HeatMeterProps {
  movieId: number;
}

const HeatMeter: React.FC<HeatMeterProps> = ({ movieId }) => {
  const [votes, setVotes] = useState<Record<Host, number>>({
    nick: 0,
    brian: 0,
    gris: 0,
    ben: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_host_votes")
          .select("host")
          .eq("movie_id", movieId);

        if (error) throw error;

        if (data) {
          const newVotes: Record<Host, number> = { nick: 0, brian: 0, gris: 0, ben: 0 };
          data.forEach((entry: { host: string }) => {
            if (newVotes[entry.host as Host] !== undefined) {
              newVotes[entry.host as Host] += 1;
            }
          });
          setVotes(newVotes);
        }
      } catch (error) {
        console.error("🚨 Error fetching heat meter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVotes();
  }, [movieId]);

  return (
    <div className="mt-4 p-4 border rounded-lg">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="flex flex-col gap-2 mt-2">
          {HOSTS.map((host) => (
            <div key={host} className="flex items-center justify-between gap-3">
              <div className="font-medium capitalize w-[40px]">{host}</div>
              <div className="w-48 rounded-full h-4 bg-secondary">
                <div
                  className="bg-primary h-4 rounded-full"
                  style={{ width: `${(votes[host] / Math.max(...Object.values(votes), 1)) * 100}%` }}
                ></div>
              </div>
              <span>{votes[host]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeatMeter;
