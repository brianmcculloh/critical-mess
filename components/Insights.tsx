"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import HostComparison from "@/components/HostComparison";
import { useAuth } from "@/contexts/AuthContext";
import { Popcorn, Star, Users, Flame, Sparkles } from "lucide-react";
import MovieDisparity from "@/components/MovieDisparity";
import TopTen from "@/components/TopTen";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ✅ Your custom TomatoIcon remains the same
const TomatoIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.5"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2c0 1-1 3-4 3 2 0 4 1 4 3 0-2 2-3 4-3-3 0-4-2-4-3zM5 8c-1 1-3 5-1 9s7 5 12 3 7-6 5-10c-2-4-7-4-9-3-2-1-7-1-9 3z"
    />
  </svg>
);

interface HostAnalytics {
  host_name: string;
  average_rating: number;
  tomatometer_alignment: number;
  popcornmeter_alignment: number;
  user_alignment: number;
  heat_meter: number;
}

const InsightsPage: React.FC = () => {
  const { user } = useAuth();
  const [hostAnalytics, setHostAnalytics] = useState<HostAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // New state for storing the user's patron level
  const [patronLevel, setPatronLevel] = useState<number>(0);

  const fetchInsights = async () => {
    setLoading(true);
    const [hostResponse] = await Promise.all([
      fetch("/api/insights/hosts").then((res) => res.json()),
    ]);
    setHostAnalytics(hostResponse);
    setLoading(false);
  };

  // Fetch insights on mount
  useEffect(() => {
    fetchInsights();
  }, []);

  // Fetch the current user's patron_level from your users table
  useEffect(() => {
    const fetchPatronLevel = async () => {
      // Depending on your Supabase client version, you might call:
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data, error } = await supabase
          .from("users")
          .select("patron_level")
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Error fetching patron level:", error);
        } else if (data) {
          setPatronLevel(data.patron_level);
        }
      }
    };
    fetchPatronLevel();
  }, []);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <TooltipProvider delayDuration={0}>
        {patronLevel > 0 || user?.isAdmin ? (
          // For patrons: wrap the button in a DialogTrigger so it opens the dialog.
          <DialogTrigger asChild>
            <Button className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white">
              <span className="hidden xs:block">Insights</span>
              <Sparkles className="transform w-5 h-5" />
            </Button>
          </DialogTrigger>
        ) : (
          // For non-patrons: render a normal button (enabled so pointer events work)
          // that does nothing when clicked, and show a tooltip.
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={(e) => e.preventDefault()}
                className="cursor-not-allowed transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
              >
                Insights
                <Sparkles className="transform w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-black text-white text-xs rounded-lg px-3 py-2 shadow-lg"
            >
              Patrons only
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>

      <DialogContent
        className="w-full lg:w-5/6 max-w-[1600px] max-h-screen overflow-y-auto"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle>Insights</DialogTitle>
        <DialogDescription>
          View various analytics and comparisons about our hosts.
        </DialogDescription>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <p>Loading insights...</p>
          ) : (
            <>
              <HostComparison
                title="Benevolence Meter"
                description="Each host's combined average rating for all episodes."
                dataKey="average_rating"
                data={hostAnalytics.map((host) => ({
                  host_name: host.host_name,
                  value: host.average_rating,
                }))}
                icon={<Star />}
              />

              <HostComparison
                title="Critic Alignment"
                description="Another name for this chart: Pretentious Meter."
                dataKey="tomatometer_alignment"
                data={hostAnalytics.map((host) => ({
                  host_name: host.host_name,
                  value: host.tomatometer_alignment,
                }))}
                isDisparity={true}
                icon={<TomatoIcon />}
              />

              <HostComparison
                title="Popcorn People Alignment"
                description="See how deeply each of us resonates with the common idiot."
                dataKey="popcornmeter_alignment"
                data={hostAnalytics.map((host) => ({
                  host_name: host.host_name,
                  value: host.popcornmeter_alignment,
                }))}
                isDisparity={true}
                icon={<Popcorn />}
              />

              <HostComparison
                title="Listener Alignment"
                description="This is the most important chart we have. We love you."
                dataKey="user_alignment"
                data={hostAnalytics.map((host) => ({
                  host_name: host.host_name,
                  value: host.user_alignment,
                }))}
                isDisparity={true}
                icon={<Users />}
              />

              <HostComparison
                title="Heat Meter"
                description="Which host is out here straight cooking every episode?"
                dataKey="heat_meter"
                data={
                  hostAnalytics
                    .filter((host) => host.host_name.toLowerCase() !== "ben")
                    .map((host) => ({
                      host_name: host.host_name,
                      value: host.heat_meter * 100,
                    }))
                }
                relativeYAxis={true}
                icon={<Flame />}
              />

              <MovieDisparity />

              <TopTen host="nick" showLowest={false} />
              <TopTen host="brian" showLowest={false} />
              <TopTen host="gris" showLowest={false} />
              <TopTen host="ben" showLowest={false} />

              <TopTen host="nick" showLowest={true} />
              <TopTen host="brian" showLowest={true} />
              <TopTen host="gris" showLowest={true} />
              <TopTen host="ben" showLowest={true} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsightsPage;
