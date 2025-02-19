import { supabase } from "@/lib/supabaseClient";

export const fetchMovies = async (setMovies: React.Dispatch<React.SetStateAction<any[]>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
  setLoading(true);
  try {
    const { data, error } = await supabase.from("movies").select("*");
    if (error) throw error;
    setMovies(data || []);
  } catch (error) {
    console.error("🚨 Error fetching movies:", error);
  } finally {
    setLoading(false);
  }
};