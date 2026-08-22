import { NextResponse } from 'next/server';
import { SEED_MUSIC_TRACKS } from '@/lib/musicLibrary';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').toLowerCase().trim();
    const genre = (searchParams.get('genre') || '').toLowerCase().trim();

    // Check if external provider API credentials are configured in environment variables
    const licensedApiKey = process.env.LUMIRA_MUSIC_API_KEY;
    const licensedApiUrl = process.env.LUMIRA_MUSIC_API_URL;

    if (licensedApiKey && licensedApiUrl) {
      // Proxy request to external licensed provider server-side securely
      try {
        const externalRes = await fetch(
          `${licensedApiUrl}/search?query=${encodeURIComponent(query)}&genre=${encodeURIComponent(genre)}`,
          {
            headers: {
              Authorization: `Bearer ${licensedApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (externalRes.ok) {
          const externalData = await externalRes.json();
          return NextResponse.json({ tracks: externalData.tracks || [] });
        }
      } catch (err) {
        console.warn('External licensed music provider failed, falling back to royalty-free catalog:', err);
      }
    }

    // Default: Return royalty-free / demo catalog matching query
    const filtered = SEED_MUSIC_TRACKS.filter((t) => {
      const matchesQ =
        !query ||
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        (t.album && t.album.toLowerCase().includes(query));

      const matchesGenre = !genre || genre === 'all' || genre === 'trending' || t.genre.toLowerCase() === genre;

      return matchesQ && matchesGenre;
    });

    return NextResponse.json({ tracks: filtered });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to search music tracks', details: String(error) }, { status: 500 });
  }
}
