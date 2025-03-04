import { supabase } from "@/lib/supabaseClient";

// Define your Movie interface
export interface Movie {
  id: number;
  title: string;
  year?: number;
  poster_url?: string;
  critic_rating?: number | null;
  audience_rating?: number | null;
  user_rating?: number | null;
  user_selected_host?: string | null;
  created_at?: string;
  suggestion_count?: number | null;
  status?: string;
  episode?: number | null;
}

export const fetchMovies = async (
  setMovies: React.Dispatch<React.SetStateAction<Movie[]>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setLoading(true);
  try {
    // Pass the generic to supabase to help with typing
    const { data, error } = await supabase.from("movies").select("*");
    setMovies((data as Movie[]) || []);

    if (error) throw error;
    setMovies(data || []);
  } catch (error) {
    console.error("🚨 Error fetching movies:", error);
  } finally {
    setLoading(false);
  }
};
