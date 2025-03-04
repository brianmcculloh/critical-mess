import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabaseClient";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TopTenProps {
  host: "nick" | "brian" | "gris" | "ben";
  showLowest?: boolean;
}

const TopTen: React.FC<TopTenProps> = ({ host, showLowest = false }) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 rounded shadow-md uppercase bg-black text-white">
          <p className="text-sm">{payload[0].payload.title.toUpperCase()}: {`${payload[0].value.toFixed(2)}`}</p>
        </div>
      );
    }
    return null;
  };

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const axisColor = isDarkMode ? "#BBB" : "#333";

  const [movieData, setMovieData] = useState<{ title: string; rating: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopTenMovies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("movies")
        .select(`title, ${host}_rating`)
        .eq("status", "episode")
        .order(host + "_rating", { ascending: showLowest })
        .limit(10);

      if (error) {
        console.error("Error fetching top ten movies:", error);
        setLoading(false);
        return;
      }

      const processedData = data.map((movie: Record<string, any>) => ({
        title: movie.title,
        rating: movie[`${host}_rating`] || 0,
      }));

      setMovieData(processedData);
      setLoading(false);
    };

    fetchTopTenMovies();
  }, [host, showLowest]);

  return (
    <Card className="border bg-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          {showLowest ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          <div>
            <CardTitle>{host.charAt(0).toUpperCase() + host.slice(1)}'s {showLowest ? "Bottom" : "Top"} Ten</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">A look at {host.charAt(0).toUpperCase() + host.slice(1)}'s {showLowest ? "lowest" : "highest"} rated movies.</p>
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
              <XAxis type="number" tick={{ fill: axisColor }} domain={[0, 100]} />
              <YAxis type="category" dataKey="title" tick={{ fill: axisColor }} width={150} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)" }} />
              <Bar dataKey="rating" radius={[0, 5, 5, 0]} fill="hsl(var(--primary))" barSize={20}>
                {movieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(0, 0%, ${Math.max(20, 49.8 - (index * (30 / movieData.length)))}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TopTen;
