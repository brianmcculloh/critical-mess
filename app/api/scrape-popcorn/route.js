// app/api/scrape-popcorn/route.js
import axios from 'axios';
import { load } from 'cheerio';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const movieUrl = searchParams.get('movieUrl');
  if (!movieUrl) {
    return new Response(
      JSON.stringify({ error: 'movieUrl query parameter required' }),
      { status: 400 }
    );
  }
  try {
    const { data } = await axios.get(movieUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });

    const $ = load(data);
    
    // Select the rt-text element with slot="audienceScore"
    const audienceScoreRaw = $('rt-text[slot="audienceScore"]').text().trim();
    
    // Remove the "%" sign and extra whitespace
    const audienceScoreCleaned = audienceScoreRaw.replace('%', '').trim();
    const parsedScore = parseFloat(audienceScoreCleaned);
    const audienceScore = isNaN(parsedScore) ? null : parsedScore;
    
    return new Response(JSON.stringify({ audienceScore }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in scraper API:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
