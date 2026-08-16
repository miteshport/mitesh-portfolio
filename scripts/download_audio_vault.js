const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const tracksTsPath = path.join(__dirname, '../src/data/soundroomTracks.ts');
const audioDir = path.join(__dirname, '../public/audio');

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const fileContent = fs.readFileSync(tracksTsPath, 'utf8');

// Match track objects precisely
const trackBlockRegex = /{\s*id:\s*["']([^"']+)["'],\s*(?:youtubeId:\s*["']([^"']+)["'],\s*)?(?:fallbackId:\s*["']([^"']+)["'],\s*)?title:\s*["']([^"']+)["'],\s*artist:\s*["']([^"']+)["']/g;

let match;
const allTracks = [];
while ((match = trackBlockRegex.exec(fileContent)) !== null) {
  allTracks.push({
    id: match[1],
    youtubeId: match[2] || '',
    fallbackId: match[3] || '',
    title: match[4],
    artist: match[5],
  });
}

console.log(`Parsed ${allTracks.length} tracks from soundroomTracks.ts.`);

const ytDlpPath = path.join(__dirname, '../yt-dlp.exe');

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (let i = 0; i < allTracks.length; i++) {
  const track = allTracks[i];
  const outFile = path.join(audioDir, `${track.id}.m4a`);

  if (fs.existsSync(outFile) && fs.statSync(outFile).size > 50000) {
    skipped++;
    continue;
  }

  const ytId = track.youtubeId || track.fallbackId;
  if (!ytId) {
    console.warn(`[${i + 1}/${allTracks.length}] No ID for: ${track.title}`);
    failed++;
    continue;
  }

  console.log(`[${i + 1}/${allTracks.length}] Fetching: ${track.title} (${track.id})...`);

  const url = `https://www.youtube.com/watch?v=${ytId}`;
  const args = [
    '-f', 'bestaudio[ext=m4a]/bestaudio/140/best',
    '--no-playlist',
    '--no-warnings',
    '-o', outFile,
    url,
  ];

  const res = spawnSync(ytDlpPath, args, { stdio: 'ignore', timeout: 60000 });

  if (fs.existsSync(outFile) && fs.statSync(outFile).size > 50000) {
    const sizeMb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
    console.log(`  ✓ Success: ${track.id}.m4a (${sizeMb} MB)`);
    downloaded++;
  } else {
    // Try fallback search query if direct ID fails
    console.warn(`  ↳ Trying fallback search for "${track.title} ${track.artist}"...`);
    const searchArgs = [
      '-f', 'bestaudio[ext=m4a]/bestaudio/140/best',
      '--no-playlist',
      '--no-warnings',
      '-o', outFile,
      `ytsearch1:${track.title} ${track.artist} audio`,
    ];
    spawnSync(ytDlpPath, searchArgs, { stdio: 'ignore', timeout: 60000 });

    if (fs.existsSync(outFile) && fs.statSync(outFile).size > 50000) {
      const sizeMb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
      console.log(`  ✓ Success via search: ${track.id}.m4a (${sizeMb} MB)`);
      downloaded++;
    } else {
      console.error(`  ✗ Failed: ${track.title}`);
      failed++;
    }
  }
}

console.log(`\n========================================`);
console.log(`AUDIO EXTRACTION SUMMARY:`);
console.log(`Total: ${allTracks.length}`);
console.log(`Downloaded: ${downloaded}`);
console.log(`Already Present: ${skipped}`);
console.log(`Failed: ${failed}`);
console.log(`========================================\n`);
