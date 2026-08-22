import { NextResponse } from 'next/server';
import { SEED_MUSIC_TRACKS } from '@/lib/musicLibrary';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const licensedApiKey = process.env.LUMIRA_MUSIC_API_KEY;
    const licensedApiUrl = process.env.LUMIRA_MUSIC_API_URL;

    if (licensedApiKey && licensedApiUrl) {
      try {
        const externalRes = await fetch(`${licensedApiUrl}/tracks/${encodeURIComponent(id)}`, {
          headers: {
            Authorization: `Bearer ${licensedApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (externalRes.ok) {
          const externalData = await externalRes.json();
          return NextResponse.json({ track: externalData.track });
        }
      } catch (err) {
        console.warn('External licensed track details failed, falling back:', err);
      }
    }

    const track = SEED_MUSIC_TRACKS.find((t) => t.id === id || t.providerTrackId === id);
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json({ track });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch track', details: String(error) }, { status: 500 });
  }
}
