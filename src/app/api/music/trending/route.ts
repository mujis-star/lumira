import { NextResponse } from 'next/server';
import { SEED_MUSIC_TRACKS } from '@/lib/musicLibrary';

export async function GET() {
  try {
    const licensedApiKey = process.env.LUMIRA_MUSIC_API_KEY;
    const licensedApiUrl = process.env.LUMIRA_MUSIC_API_URL;

    if (licensedApiKey && licensedApiUrl) {
      try {
        const externalRes = await fetch(`${licensedApiUrl}/trending`, {
          headers: {
            Authorization: `Bearer ${licensedApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        if (externalRes.ok) {
          const externalData = await externalRes.json();
          return NextResponse.json({ tracks: externalData.tracks || [] });
        }
      } catch (err) {
        console.warn('External licensed trending tracks failed, falling back:', err);
      }
    }

    const trending = [...SEED_MUSIC_TRACKS].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
    return NextResponse.json({ tracks: trending });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trending tracks', details: String(error) }, { status: 500 });
  }
}
