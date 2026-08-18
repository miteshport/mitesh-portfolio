const fs = require('fs');
const content = fs.readFileSync('src/data/soundroomTracks.ts', 'utf8');
const channels = ['user-vault', 'titans', 'symphony', 'sessions', 'sufi', 'live-radio'];
let total = 0;
channels.forEach(ch => {
  const matches = content.match(new RegExp(`channel: "${ch}"`, 'g')) || [];
  console.log(`Channel [${ch}]: ${matches.length} tracks`);
  total += matches.length;
});
console.log(`Total tracks in soundroomTracks.ts: ${total}`);
