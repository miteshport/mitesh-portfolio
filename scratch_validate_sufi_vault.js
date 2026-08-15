const https = require('https');

const candidates = [
  { name: 'Silsila Ye Chahat Ka', id: 'NodPBY7tSYY' },
  { name: 'Dola Re Dola', id: 'n5L7eJ_c58o' },
  { name: 'Tujhse Naraz Nahin Zindagi', id: 'Qx3J8L_v5G4' },
];

function check(t) {
  return new Promise((resolve) => {
    const target = encodeURIComponent(`https://www.youtube.com/watch?v=${t.id}`);
    https.get(`https://www.youtube.com/oembed?url=${target}&format=json`, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const j = JSON.parse(d);
          console.log(`✅ [200 OK] ${t.name}: "${j.title}"`);
          resolve(true);
        } else {
          console.log(`❌ [${res.statusCode}] ${t.name} (${t.id})`);
          resolve(false);
        }
      });
    }).on('error', () => resolve(false));
  });
}

async function run() {
  for (const c of candidates) await check(c);
}

run();
