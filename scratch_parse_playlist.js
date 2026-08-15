const fs = require('fs');
const path = 'C:\\Users\\imite\\.gemini\\antigravity\\brain\\d627afbb-b017-4c7a-a6dc-01002c845d8e\\.system_generated\\steps\\3750\\content.md';
const content = fs.readFileSync(path, 'utf8');

// Find all videoId occurrences
const ids = new Set();
const matches = content.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
for (const m of matches) {
  ids.add(m[1]);
}
console.log('Found unique videoIds:', Array.from(ids));
