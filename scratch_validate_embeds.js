const https = require('https');
const fs = require('fs');

const soundroomCode = fs.readFileSync('src/data/soundroomTracks.ts', 'utf8');

// Extract all youtubeId values from soundroomTracks.ts
const regex = /youtubeId:\s*"([^"]+)"/g;
const ids = [];
let m;
while ((m = regex.exec(soundroomCode)) !== null) {
  ids.push(m[1]);
}

console.log(`Found ${ids.length} total YouTube IDs in soundroomTracks.ts.`);

function checkEmbed(videoId) {
  return new Promise((resolve) => {
    const target = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
    const url = `https://www.youtube.com/oembed?url=${target}&format=json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ videoId, status: 'OK', title: json.title, author: json.author_name });
          } catch {
            resolve({ videoId, status: 'OK' });
          }
        } else {
          resolve({ videoId, status: `FAIL_${res.statusCode}` });
        }
      });
    }).on('error', (err) => resolve({ videoId, status: `ERR_${err.message}` }));
  });
}

async function run() {
  console.log('Testing all 112 YouTube IDs for embed permission...');
  const results = [];
  // Run with gentle concurrency
  for (let i = 0; i < ids.length; i += 10) {
    const chunk = ids.slice(i, i + 10);
    const resChunk = await Promise.all(chunk.map(checkEmbed));
    results.push(...resChunk);
  }

  const passed = results.filter(r => r.status === 'OK');
  const failed = results.filter(r => r.status !== 'OK');

  console.log(`\n========================================`);
  console.log(`EMBED AUDIT RESULT: ${passed.length} / ${results.length} PASSED`);
  console.log(`========================================\n`);

  if (failed.length > 0) {
    console.log('BLOCKED / DEAD IDs:');
    failed.forEach(f => console.log(`- ${f.videoId} (${f.status})`));
  } else {
    console.log('ALL 112 TRACKS ARE 100% EMBEDDABLE AND VERIFIED!');
  }
}

run();
