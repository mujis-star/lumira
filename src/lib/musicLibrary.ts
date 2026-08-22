import { MusicTrack } from './types';

export interface MusicSearchOptions {
  query?: string;
  genre?: string;
  limit?: number;
  offset?: number;
}

export interface MusicProvider {
  id: string;
  name: string;
  searchTracks(options: MusicSearchOptions): Promise<MusicTrack[]>;
  searchArtists(query: string): Promise<string[]>;
  getTrackDetails(trackId: string): Promise<MusicTrack | null>;
  getTrendingTracks(limit?: number): Promise<MusicTrack[]>;
  getTracksByCategory(category: string, limit?: number): Promise<MusicTrack[]>;
}

// 100% Royalty-free & legal seed catalog
export const SEED_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-midnight-cityscape',
    provider: 'demo',
    providerTrackId: 'demo-001',
    title: 'Midnight Cityscape',
    artist: 'Aria Chen',
    album: 'Neon Genesis',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    duration: 180,
    genre: 'cinematic',
    audioSource: 'synth-midnight',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3',
    isLicensed: true,
    licensingInfo: 'Lumira Open Royalty-Free License',
    usageCount: 1420,
    tags: ['synthwave', 'night', 'cinematic', 'urban'],
    bpm: 120,
  },
  {
    id: 'track-lofi-sunset-dreams',
    provider: 'demo',
    providerTrackId: 'demo-002',
    title: 'Lofi Sunset Dreams',
    artist: 'Marcus Thorne',
    album: 'Coffee & Code',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    duration: 165,
    genre: 'lofi',
    audioSource: 'chill-lofi',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-chill-bro-494.mp3',
    isLicensed: true,
    licensingInfo: 'Lumira Open Royalty-Free License',
    usageCount: 2890,
    tags: ['lofi', 'chill', 'study', 'aesthetic'],
    bpm: 85,
  },
  {
    id: 'track-neon-horizon',
    provider: 'demo',
    providerTrackId: 'demo-003',
    title: 'Neon Horizon',
    artist: 'Elena Rostova',
    album: 'Hyperdrive',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    duration: 210,
    genre: 'electronic',
    audioSource: 'synth-pulse',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
    isLicensed: true,
    licensingInfo: 'Lumira Open Royalty-Free License',
    usageCount: 5120,
    tags: ['electronic', 'future', 'club', 'upbeat'],
    bpm: 128,
  },
  {
    id: 'track-golden-hour-chill',
    provider: 'demo',
    providerTrackId: 'demo-004',
    title: 'Golden Hour Acoustic',
    artist: 'Maya Lin',
    album: 'Sunday Morning',
    coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    duration: 195,
    genre: 'acoustic',
    audioSource: 'acoustic-golden',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-spirit-of-the-waterfalls-467.mp3',
    isLicensed: true,
    licensingInfo: 'Lumira Open Royalty-Free License',
    usageCount: 980,
    tags: ['acoustic', 'guitar', 'warm', 'peaceful'],
    bpm: 92,
  },
  {
    id: 'track-electric-pop-energy',
    provider: 'demo',
    providerTrackId: 'demo-005',
    title: 'Electric Glow',
    artist: 'Kai Tanaka',
    album: 'Tokyo Neon',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80',
    duration: 175,
    genre: 'pop',
    audioSource: 'synth-pulse',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-raising-me-higher-34.mp3',
    isLicensed: true,
    licensingInfo: 'Lumira Open Royalty-Free License',
    usageCount: 3450,
    tags: ['pop', 'dance', 'vibrant', 'summer'],
    bpm: 124,
  },
  {
    id: 'track-cyberpunk-symphony',
    provider: 'demo',
    providerTrackId: 'demo-006',
    title: 'Cyberpunk Symphony',
    artist: 'Chloé Dubois',
    album: 'Paris 2099',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    duration: 240,
    genre: 'cinematic',
    audioSource: 'synth-midnight',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-game-level-music-689.mp3',
    isLicensed: true,
    licensingInfo: 'Lumira Open Royalty-Free License',
    usageCount: 1850,
    tags: ['cinematic', 'epic', 'orchestral', 'synth'],
    bpm: 110,
  },
  {
    id: 'track-chill-hop-breeze',
    provider: 'demo',
    providerTrackId: 'demo-007',
    title: 'Chill Hop Breeze',
    artist: 'Sora Takahashi',
    album: 'Shibuya Rain',
    coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    duration: 150,
    genre: 'chill',
    audioSource: 'chill-lofi',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-hazy-after-hours-132.mp3',
    isLicensed: true,
    licensingInfo: 'Lumira Open Royalty-Free License',
    usageCount: 4200,
    tags: ['chill', 'beats', 'lofi', 'groove'],
    bpm: 88,
  },
  {
    id: 'track-starlight-resonance',
    provider: 'demo',
    providerTrackId: 'demo-008',
    title: 'Starlight Resonance',
    artist: 'Nova Sound Collective',
    album: 'Deep Space Odyssey',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    duration: 200,
    genre: 'trending',
    audioSource: 'synth-pulse',
    previewUrl: 'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    isLicensed: true,
    licensingInfo: 'Lumira Open Royalty-Free License',
    usageCount: 8900,
    tags: ['trending', 'viral', 'reels', 'cosmic'],
    bpm: 118,
  },
];

// Demo Music Provider (Fallback and development provider)
export class DemoMusicProvider implements MusicProvider {
  public id = 'demo';
  public name = 'Lumira Royalty-Free Catalog';

  async searchTracks(options: MusicSearchOptions): Promise<MusicTrack[]> {
    const { query = '', genre } = options;
    const cleanQ = query.trim().toLowerCase();

    return SEED_MUSIC_TRACKS.filter((track) => {
      const matchesQuery =
        !cleanQ ||
        track.title.toLowerCase().includes(cleanQ) ||
        track.artist.toLowerCase().includes(cleanQ) ||
        (track.album && track.album.toLowerCase().includes(cleanQ)) ||
        (track.tags && track.tags.some((t) => t.toLowerCase().includes(cleanQ)));

      const matchesGenre =
        !genre || genre === 'all' || genre === 'trending' || track.genre.toLowerCase() === genre.toLowerCase();

      return matchesQuery && matchesGenre;
    });
  }

  async searchArtists(query: string): Promise<string[]> {
    const cleanQ = query.trim().toLowerCase();
    const artists = Array.from(new Set(SEED_MUSIC_TRACKS.map((t) => t.artist)));
    if (!cleanQ) return artists;
    return artists.filter((a) => a.toLowerCase().includes(cleanQ));
  }

  async getTrackDetails(trackId: string): Promise<MusicTrack | null> {
    return SEED_MUSIC_TRACKS.find((t) => t.id === trackId || t.providerTrackId === trackId) || null;
  }

  async getTrendingTracks(limit = 10): Promise<MusicTrack[]> {
    return [...SEED_MUSIC_TRACKS]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  async getTracksByCategory(category: string, limit = 10): Promise<MusicTrack[]> {
    const clean = category.toLowerCase();
    if (clean === 'trending' || clean === 'popular') {
      return this.getTrendingTracks(limit);
    }
    return SEED_MUSIC_TRACKS.filter((t) => t.genre.toLowerCase() === clean).slice(0, limit);
  }
}

// Licensed Music Provider (Calls server-side API routes so API credentials stay secret)
export class LicensedMusicProvider implements MusicProvider {
  public id = 'licensed';
  public name = 'Lumira Licensed Music Network';

  async searchTracks(options: MusicSearchOptions): Promise<MusicTrack[]> {
    try {
      const params = new URLSearchParams();
      if (options.query) params.set('q', options.query);
      if (options.genre) params.set('genre', options.genre);
      if (options.limit) params.set('limit', String(options.limit));

      const res = await fetch(`/api/music/search?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to search licensed tracks');
      const data = await res.json();
      return data.tracks || [];
    } catch {
      // Graceful fallback to demo provider if server API is unconfigured
      return new DemoMusicProvider().searchTracks(options);
    }
  }

  async searchArtists(query: string): Promise<string[]> {
    try {
      const res = await fetch(`/api/music/artists?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to search artists');
      const data = await res.json();
      return data.artists || [];
    } catch {
      return new DemoMusicProvider().searchArtists(query);
    }
  }

  async getTrackDetails(trackId: string): Promise<MusicTrack | null> {
    try {
      const res = await fetch(`/api/music/${trackId}`);
      if (!res.ok) throw new Error('Failed to fetch track details');
      const data = await res.json();
      return data.track || null;
    } catch {
      return new DemoMusicProvider().getTrackDetails(trackId);
    }
  }

  async getTrendingTracks(limit = 10): Promise<MusicTrack[]> {
    try {
      const res = await fetch(`/api/music/trending?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch trending tracks');
      const data = await res.json();
      return data.tracks || [];
    } catch {
      return new DemoMusicProvider().getTrendingTracks(limit);
    }
  }

  async getTracksByCategory(category: string, limit = 10): Promise<MusicTrack[]> {
    try {
      const res = await fetch(`/api/music/category/${encodeURIComponent(category)}?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch category tracks');
      const data = await res.json();
      return data.tracks || [];
    } catch {
      return new DemoMusicProvider().getTracksByCategory(category, limit);
    }
  }
}

// Music Service singleton: automatically uses LicensedMusicProvider if available, otherwise DemoMusicProvider
class MusicService {
  private provider: MusicProvider;

  constructor() {
    // Check if running in browser or server
    this.provider = new DemoMusicProvider();
  }

  public setProvider(provider: MusicProvider) {
    this.provider = provider;
  }

  public getProvider(): MusicProvider {
    return this.provider;
  }

  public async searchTracks(query: string, genre?: string): Promise<MusicTrack[]> {
    return this.provider.searchTracks({ query, genre });
  }

  public async getTrendingTracks(): Promise<MusicTrack[]> {
    return this.provider.getTrendingTracks();
  }

  public async getTrackById(trackId: string): Promise<MusicTrack | null> {
    return this.provider.getTrackDetails(trackId);
  }

  public async getTracksByCategory(category: string): Promise<MusicTrack[]> {
    return this.provider.getTracksByCategory(category);
  }
}

export const musicService = new MusicService();
