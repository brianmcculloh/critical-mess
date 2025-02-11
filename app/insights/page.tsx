"use client";

import React, { useEffect, useState } from "react";
import HostComparison from "@/components/HostComparison";
import { Popcorn, Star, Users, Flame } from "lucide-react";
import MovieDisparity from "@/components/MovieDisparity";
import TopTen from "@/components/TopTen";

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
  top_5_highest_rated: any[];
  top_5_lowest_rated: any[];
  top_5_heat_meter_highest: any[];
  top_5_heat_meter_lowest: any[];
}

interface MovieAnalytics {
  movie_instance_id: string;
  tomatometer_popcorn_gap: number;
}

const InsightsPage: React.FC = () => {
  const [hostAnalytics, setHostAnalytics] = useState<HostAnalytics[]>([]);
  const [movieAnalytics, setMovieAnalytics] = useState<MovieAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    const [hostResponse, movieResponse] = await Promise.all([
      fetch("/api/insights/hosts").then((res) => res.json()),
      fetch("/api/insights/movies").then((res) => res.json()),
    ]);

    setHostAnalytics(hostResponse);
    setMovieAnalytics(movieResponse);
    setLoading(false);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading ? (
        <p>Loading insights...</p>
      ) : (
        <>

          <HostComparison
            title="Benevolence Meter"
            description="Each host's combined average rating for all episodes."
            dataKey="average_rating"
            data={hostAnalytics.map(host => ({ host_name: host.host_name, value: host.average_rating }))}
            icon={<Star />}
          />

          <HostComparison
            title="Critic Alignment"
            description="Another name for this chart: Pretentious Meter."
            dataKey="tomatometer_alignment"
            data={hostAnalytics.map(host => ({ host_name: host.host_name, value: host.tomatometer_alignment }))}
            isDisparity={true}
            icon={<TomatoIcon />}
          />

          <HostComparison
            title="Popcorn People Alignment"
            description="See how deeply each of us resonates with the common idiot."
            dataKey="popcornmeter_alignment"
            data={hostAnalytics.map(host => ({ host_name: host.host_name, value: host.popcornmeter_alignment }))}
            isDisparity={true}
            icon={<Popcorn />}
          />

          <HostComparison
            title="Listener Alignment"
            description="This is the most important chart we have. We love you."
            dataKey="user_alignment"
            data={hostAnalytics.map(host => ({ host_name: host.host_name, value: host.user_alignment }))}
            isDisparity={true}
            icon={<Users />}
          />

          <HostComparison
            title="Heat Meter"
            description="Which host is out here straight cooking every episode?"
            dataKey="heat_meter"
            data={hostAnalytics.map(host => ({
              host_name: host.host_name,
              value: host.heat_meter * 100, // Convert to percentage
            }))}
            relativeYAxis={true} // Enables dynamic scaling
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
  );
};

export default InsightsPage;
