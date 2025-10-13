"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import HostComparison from "@/components/HostComparison";
import { useAuth } from "@/contexts/AuthContext";
import { Popcorn, Star, Users, Flame, Sparkles } from "lucide-react";
import MovieDisparity from "@/components/MovieDisparity";
import TopTen from "@/components/TopTen";
import HostConsensus from "@/components/HostConsensus";
import HostOutlier from "@/components/HostOutlier";
import { PATRON_PAYWALL_ENABLED } from "@/lib/featureFlags";
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

  // New state for controlling tooltip visibility on disabled button
  const [tooltipOpen, setTooltipOpen] = useState(false);

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

  // Handle click on disabled Insights button for non-patrons.
  const handleDisabledClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTooltipOpen(true);
  }, []);

  // Close tooltip when clicking anywhere else on the document.
  useEffect(() => {
    const handleDocumentClick = () => {
      if (tooltipOpen) {
        setTooltipOpen(false);
      }
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [tooltipOpen]);

  // Patron gating logic - controlled by global feature flag
  const hasAccess = !PATRON_PAYWALL_ENABLED || patronLevel > 0 || user?.isAdmin;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <TooltipProvider delayDuration={0}>
        {hasAccess ? (
          // For patrons: wrap the button in a DialogTrigger so it opens the dialog.
          <DialogTrigger asChild>
            <Button className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white">
              <span className="hidden xs:block">Insights</span>
              <Sparkles className="transform w-5 h-5" />
            </Button>
          </DialogTrigger>
        ) : (
          // For non-patrons: render a button that shows a tooltip on click.
          <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <TooltipTrigger asChild>
              <Button
                onClick={handleDisabledClick}
                className="cursor-not-allowed transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
              >
                Insights
                <Sparkles className="transform w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-black text-white text-xs rounded-lg px-3 py-2 shadow-lg w-96"
            >
              Become a Patreon patron to view things like host average ratings, hosts ranked by how closely they align with the critical and audience ratings, hosts ranked by heat meter, and many more insights about our episodes!
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>

      <DialogContent
        className="w-full lg:w-5/6 max-w-[1600px] mt-6 max-h-[calc(100vh-3rem)] overflow-y-auto"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle>Insights</DialogTitle>
        <DialogDescription>
          We're deep in a Hot Pocket now! Discover insights, preferences, and patterns about our hosts.
        </DialogDescription>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <p>Loading insights...</p>
          ) : (
            <>
              <HostComparison
                title="Benevolence Meter"
                description="Combined average rating for all episodes, by host."
                dataKey="average_rating"
                data={hostAnalytics.map((host) => ({
                  host_name: host.host_name,
                  value: host.average_rating,
                }))}
                icon={<Star />}
              />

              <HostComparison
                title="Critic Alignment"
                description="How far above or below is each host to the Tomatometer? The smaller the number, the greater the alignment."
                dataKey="tomatometer_alignment"
                data={hostAnalytics.map((host) => ({
                  host_name: host.host_name,
                  value: host.tomatometer_alignment,
                }))}
                isDisparity={true}
                icon={<TomatoIcon className="w-10 h-10" />}
              />

              <HostComparison
                title="Popcorn People Alignment"
                description="How far above or below is each host to the Popcornmeter? The smaller the number, the greater the alignment."
                dataKey="popcornmeter_alignment"
                data={hostAnalytics.map((host) => ({
                  host_name: host.host_name,
                  value: host.popcornmeter_alignment,
                }))}
                isDisparity={true}
                icon={<Popcorn className="w-8 h-8" />}
              />

              <HostComparison
                title="Listener Alignment"
                description="How far above or below is each host to our listeners? The smaller the number, the greater the alignment."
                dataKey="user_alignment"
                data={hostAnalytics.map((host) => ({
                  host_name: host.host_name,
                  value: host.user_alignment,
                }))}
                isDisparity={true}
                icon={<Users className="w-8 h-8" />}
              />

              <HostComparison
                title="Heat Meter"
                description="A look at how much the listeners resonate with each host."
                dataKey="heat_meter"
                data={
                  hostAnalytics.map((host) => ({
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

              <HostConsensus showLowest={true} />
              <HostConsensus showLowest={false} />

              <HostOutlier />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsightsPage;
