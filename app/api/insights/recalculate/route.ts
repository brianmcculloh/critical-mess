import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST() {
  const { error } = await supabase.rpc("recalculate_host_analytics");
  const { error: movieError } = await supabase.rpc("recalculate_movie_analytics");

  if (error || movieError) {
    return NextResponse.json(
      { error: error?.message || movieError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Recalculation successful" }, { status: 200 });
}