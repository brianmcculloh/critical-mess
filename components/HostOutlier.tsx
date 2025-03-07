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
  LabelList,
} from "recharts";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabaseClient";
import { TreePalm } from "lucide-react";

interface HostOutlierData {
  title: string;
  outlier_deviation: number;
  outlier_host: string;
}

const HostOutlier: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const axisColor = isDarkMode ? "#BBB" : "#333";

  const [movieData, setMovieData] = useState<HostOutlierData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutlierData = async () => {
      setLoading(true);
      // Query the movie_analytics table joined with movies to get the title.
      const { data, error } = await supabase
        .from("movie_analytics")
        .select(`
          outlier_deviation,
          outlier_host,
          movies (
            title
          )
        `)
        .not("outlier_deviation", "is", null)
        .order("outlier_deviation", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching outlier data:", error);
        setLoading(false);
        return;
      }

      const processedData = data.map((row: any) => ({
        title: row.movies.title,
        outlier_deviation: row.outlier_deviation,
        outlier_host: row.outlier_host,
      }));
      setMovieData(processedData);
      setLoading(false);
    };

    fetchOutlierData();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 rounded shadow-md uppercase bg-black text-white">
          <p className="text-sm">
            {payload[0].payload.title.toUpperCase()} – {payload[0].payload.outlier_host.toUpperCase()}: {`${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border bg-transparent">
      <CardHeader>
        <div className="flex items-start gap-2">
          <TreePalm className="w-10 h-10" />
          <div>
            <CardTitle>On An Island</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Top 10 episodes ranked by the furthest away one host was from the other three.
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
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#333" : "#CCC"} />
              <XAxis type="number" tick={{ fill: axisColor }} domain={["auto", "auto"]} />
              <YAxis
                type="category"
                dataKey="title"
                tick={{ fill: axisColor, fontSize: "13px" }}
                width={150}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                }}
              />
              <Bar dataKey="outlier_deviation" radius={[0, 5, 5, 0]} fill="hsl(var(--primary))" barSize={20}>
                {movieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(42, 82%, ${Math.max(
                      20,
                      49.8 - (index * (30 / movieData.length))
                    )}%)`}
                  />
                ))}
                <LabelList 
                  dataKey="outlier_host" 
                  position="right" 
                  fill={axisColor}
                  offset={10}
                  formatter={(value: any) => value.toUpperCase()}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default HostOutlier;
