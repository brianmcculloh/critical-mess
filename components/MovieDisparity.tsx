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
import { TrendingUpDown } from "lucide-react";

const MovieDisparity: React.FC = () => {
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

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const axisColor = isDarkMode ? "#BBB" : "#333";

  const [movieData, setMovieData] = useState<
    { title: string; gap: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDisparities = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("movies")
        .select("title, critic_rating, audience_rating")
        .eq("status", "episode");

      if (error) {
        console.error("Error fetching movie disparities:", error);
        setLoading(false);
        return;
      }

      const processedData = data
        .map((movie) => ({
          title: movie.title,
          gap: Math.abs((movie.critic_rating || 0) - (movie.audience_rating || 0)),
        }))
        .sort((a, b) => b.gap - a.gap); // Sort by largest gap

      setMovieData(processedData);
      setLoading(false);
    };

    fetchMovieDisparities();
  }, []);

  // Compute the chart height based on the number of data items (50px per item)
  const perItemHeight = 33;
  const chartHeight =
    movieData.length > 0 ? movieData.length * perItemHeight : 300;

  return (
    <Card className="border bg-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUpDown className="w-6 h-6" />
          <div>
            <CardTitle>Mind The Gap</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              All of our episodes, ranked by the critic/audience disparity.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          // Wrap the chart in a container with maxHeight and overflow-y-auto.
          <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={movieData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? "#333" : "#CCC"}
                />
                <XAxis type="number" tick={{ fill: axisColor }} />
                <YAxis
                  type="category"
                  dataKey="title"
                  tick={{ fill: axisColor }}
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
                <Bar dataKey="gap" radius={[0, 5, 5, 0]} fill="hsl(var(--primary))" barSize={20}>
                  {movieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(0, 0%, ${Math.max(
                        20,
                        49.8 - (index * (30 / movieData.length))
                      )}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MovieDisparity;
