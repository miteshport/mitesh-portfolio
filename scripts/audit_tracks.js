const fs = require('fs');
const content = fs.readFileSync('src/data/soundroomTracks.ts', 'utf8');

const idRegex = /id:\s*"([^"]+)"/g;
let match;
const ids = [];
while ((match = idRegex.exec(content)) !== null) {
  if (!['user-vault', 'titans', 'symphony', 'sessions', 'sufi', 'live-radio'].includes(match[1])) {
    ids.push(match[1]);
  }
}

console.log('Total track ID entries found:', ids.length);
const uniqueIds = new Set(ids);
console.log('Unique track IDs:', uniqueIds.size);

const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
console.log('Duplicates found across folders:', Array.from(new Set(duplicates)));
