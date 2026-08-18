const cp = require('child_process');
const fs = require('fs');

let code = cp.execSync('git show 27dc71d:src/data/soundroomTracks.ts').toString('utf8');

// Update interfaces
code = code.replace(
  'export interface SoundTrack {',
  'export interface SoundTrack {\n  youtubeId?: string;\n  streamUrl?: string;\n  isLiveStream?: boolean;'
);

code = code.replace(
  'channel: "user-vault" | "titans" | "symphony" | "sessions" | "sufi";',
  'channel: string;'
);

code = code.replace(
  'id: "user-vault" | "titans" | "symphony" | "sessions" | "sufi";',
  'id: string;'
);

const liveChannel = `  {
    id: "live-radio",
    title: "Live 24/7 Radio",
    subtitle: "Endless Non-Stop Global Streams",
    description: "Live 24/7 web radio stations featuring Bollywood, Retro Hindi, Punjabi, and Lofi.",
    maestros: ["Live Radio DJs", "Radio City", "SomaFM", "Nightwave Plaza"],
    themeColor: "#ef4444",
    tracks: [
      {
        id: "live-bollywood-hits",
        title: "Bollywood Hits 24/7 (Live)",
        artist: "Radio Bollywood Live",
        album: "24/7 Global Live Feed",
        channel: "live-radio",
        isLiveStream: true,
        streamUrl: "https://stream.zeno.fm/f3wvbbqmdg8uv",
        duration: 0,
        artwork: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop",
      },
      {
        id: "live-retro-hindi",
        title: "Retro 90s Bollywood Classics (Live)",
        artist: "Retro Hindi Station",
        album: "24/7 Global Live Feed",
        channel: "live-radio",
        isLiveStream: true,
        streamUrl: "https://stream.zeno.fm/yn9um4n98k8uv",
        duration: 0,
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400&auto=format&fit=crop",
      },
      {
        id: "live-punjabi-hits",
        title: "Punjabi Radio Hits (Live)",
        artist: "Desi Punjabi Stream",
        album: "24/7 Global Live Feed",
        channel: "live-radio",
        isLiveStream: true,
        streamUrl: "https://stream.zeno.fm/k22222y8e0zuv",
        duration: 0,
        artwork: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=400&auto=format&fit=crop",
      },
      {
        id: "live-somafm-groove",
        title: "Groove Salad (Chill Highway)",
        artist: "SomaFM San Francisco",
        album: "24/7 Global Live Feed",
        channel: "live-radio",
        isLiveStream: true,
        streamUrl: "https://ice2.somafm.com/groovesalad-128-mp3",
        duration: 0,
        artwork: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400&auto=format&fit=crop",
      },
      {
        id: "live-nightwave",
        title: "Nightwave Plaza (Synthwave Drive)",
        artist: "Nightwave Plaza Tokyo",
        album: "24/7 Global Live Feed",
        channel: "live-radio",
        isLiveStream: true,
        streamUrl: "https://radio.plaza.one/mp3",
        duration: 0,
        artwork: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop",
      },
    ],
  },
];`;

code = code.trim().replace(/\];$/, liveChannel);
fs.writeFileSync('src/data/soundroomTracks.ts', code, { encoding: 'utf8' });
if (fs.existsSync('temp_old_tracks.ts')) fs.unlinkSync('temp_old_tracks.ts');
console.log('Done! Clean UTF-8 written with all 112 tracks + Live Radio.');
