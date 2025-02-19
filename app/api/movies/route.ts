import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, year, poster_url, critic_rating, audience_rating } = await req.json();

    const { data, error } = await supabase.from("movies").insert([
      { title, year, poster_url, critic_rating, audience_rating },
    ]);

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
