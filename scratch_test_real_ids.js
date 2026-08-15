const https = require('https');

const candidates = [
  { name: 'Tere Bina Guru', id: 'YD0bPWGyURk' },
  { name: 'Cornfield Chase', id: '1V_xRb0x9aw' },
  { name: 'Stay Interstellar', id: 'CAe122b5x7o' },
  { name: 'Am I Dreaming', id: 'kY31Wn6G99g' },
  { name: 'Spider-Man 2099', id: 'gT8wN400W2o' },
  { name: 'Albela Sajan Aayo Re', id: 'Jm3X1w4cM-o' },
];

function check(c) {
  return new Promise((resolve) => {
    const target = encodeURIComponent(`https://www.youtube.com/watch?v=${c.id}`);
    https.get(`https://www.youtube.com/oembed?url=${target}&format=json`, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const j = JSON.parse(d);
          console.log(`✅ ${c.name} (${c.id}) -> "${j.title}"`);
          resolve(true);
        } else {
          console.log(`❌ ${c.name} (${c.id}) -> Status ${res.statusCode}`);
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
