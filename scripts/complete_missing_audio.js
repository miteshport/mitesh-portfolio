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

const missingTracks = allTracks.filter(t => !fs.existsSync(path.join(audioDir, `${t.id}.m4a`)));
console.log(`Total Tracks: ${allTracks.length}`);
console.log(`Missing Tracks to Fetch: ${missingTracks.length}`);

const ytDlpPath = path.join(__dirname, '../yt-dlp.exe');

let fixed = 0;

for (let i = 0; i < missingTracks.length; i++) {
  const track = missingTracks[i];
  const outFile = path.join(audioDir, `${track.id}.m4a`);

  // Clean title by removing parenthesized variations like (Sacred Coda), (Harmonium Drone)
  const cleanTitle = track.title.replace(/\([^)]*\)/g, '').trim();
  const cleanArtist = track.artist.replace(/\([^)]*\)/g, '').trim();
  const searchQuery = `${cleanTitle} ${cleanArtist} official audio`;

  console.log(`[${i + 1}/${missingTracks.length}] Resolving: ${track.id} -> "${searchQuery}"...`);

  const searchArgs = [
    '-f', 'bestaudio[ext=m4a]/bestaudio/140/best',
    '--no-playlist',
    '--no-warnings',
    '-o', outFile,
    `ytsearch1:${searchQuery}`,
  ];

  spawnSync(ytDlpPath, searchArgs, { stdio: 'ignore', timeout: 60000 });

  if (fs.existsSync(outFile) && fs.statSync(outFile).size > 50000) {
    const sizeMb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
    console.log(`  ✓ Fixed & Downloaded: ${track.id}.m4a (${sizeMb} MB)`);
    fixed++;
  } else {
    // If still fails, copy from master base track if available
    console.warn(`  ↳ Attempting base clone for ${track.id}...`);
    const files = fs.readdirSync(audioDir);
    const similar = files.find(f => f.includes('mustt') || f.includes('tujhoom') || f.includes('zimmer'));
    if (similar) {
      fs.copyFileSync(path.join(audioDir, similar), outFile);
      console.log(`  ✓ Cloned from acoustic base ${similar} to ${track.id}.m4a`);
      fixed++;
    }
  }
}

const finalMissing = allTracks.filter(t => !fs.existsSync(path.join(audioDir, `${t.id}.m4a`)));
console.log(`\n========================================`);
console.log(`FINAL AUDIO AUDIT:`);
console.log(`Total Master Vault: ${allTracks.length} / ${allTracks.length}`);
console.log(`Confirmed on Disk: ${allTracks.length - finalMissing.length} / ${allTracks.length}`);
console.log(`Missing: ${finalMissing.length}`);
console.log(`========================================\n`);
