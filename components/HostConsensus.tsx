"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabaseClient";
import { Smile, Frown } from "lucide-react";

interface HostConsensusProps {
  showLowest?: boolean; // If true, show episodes with lowest consensus (i.e. most consensus); else, show episodes with highest consensus (least consensus).
}

const HostConsensus: React.FC<HostConsensusProps> = ({ showLowest = true }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 rounded shadow-md uppercase bg-black text-white">
          <p className="text-sm">
            {payload[0].payload.title.toUpperCase()}:{" "}
            {`${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const axisColor = isDarkMode ? "rgb(242, 242, 242)" : "#333";

  // State to store our processed data.
  const [movieData, setMovieData] = useState<
    { title: string; consensus: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConsensusData = async () => {
      setLoading(true);
      // We assume that movie_analytics has been populated with a consensus value,
      // and that it joins to movies to provide the title.
      // Adjust the select query to match your actual schema.
      const { data, error } = await supabase
        .from("movie_analytics")
        .select(`
          consensus,
          movies (
            title
          )
        `)
        .order("consensus", { ascending: showLowest }) // if showLowest, lowest consensus (most consensus) first; otherwise highest.
        .limit(10);

      if (error) {
        console.error("Error fetching consensus data:", error);
        setLoading(false);
        return;
      }

      // Map data to our desired shape.
      const processedData = data.map((row: any) => ({
        title: row.movies.title,
        consensus: row.consensus,
      }));
      setMovieData(processedData);
      setLoading(false);
    };

    fetchConsensusData();
  }, [showLowest]);

  return (
    <Card className="border bg-transparent">
      <CardHeader>
        <div className="flex items-start gap-2">
          {showLowest ? (
            <Smile className="w-10 h-10" />
          ) : (
            <Frown className="w-10 h-10" />
          )}
          <div>
            <CardTitle>
              {showLowest ? "Least Disagreement" : "Most Disagreement"}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Top 10 episodes ranked by how much we {showLowest ? "agreed" : "disagreed"} with each other. The higher the number, the more diverse our opinions were.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={movieData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#333333" : "#CCC"} />
              {/* Set the minimum to 0 and maximum remains auto */}
              <XAxis type="number" tick={{ fill: axisColor }} domain={[0, "auto"]} />
              <YAxis
                type="category"
                dataKey="title"
                tick={{ fill: axisColor, fontSize: "13px" }}
                width={150}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: isDarkMode
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              />
              <Bar dataKey="consensus" radius={[0, 5, 5, 0]} fill="hsl(var(--primary))" barSize={20}>
                {movieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(42, 82%, ${Math.max(
                      20,
                      49.8 - (index * (30 / movieData.length))
                    )}%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default HostConsensus;
