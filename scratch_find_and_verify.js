const https = require('https');

// Search and verify helper using public Invidious or YouTube oEmbed
async function verifyYT(videoId) {
  return new Promise((resolve) => {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ valid: true, title: json.title, author: json.author_name });
          } catch {
            resolve({ valid: true });
          }
        } else {
          resolve({ valid: false, code: res.statusCode });
        }
      });
    }).on('error', () => resolve({ valid: false }));
  });
}

// Test list of candidates
const candidates = [
  // User playlist candidates
  { name: 'Coffee Cold', id: 'tmFz2jWsvx4' },
  { name: 'Tu Jhoom', id: '7D4vNcK6D38' },
  { name: 'Pasoori', id: '5Eqb_-j3FDA' },
  { name: 'Afreen Afreen', id: 'kw4tT7SCmaY' },
  { name: 'Namo Namo', id: 'dx4Teh-nv3A' },
  { name: 'Iktara', id: 'fSS_R91Nimw' },
  { name: 'Kal Ho Naa Ho', id: 'g0eO74UmRBs' },
  { name: 'Time Inception', id: 'RxabLA7UQ9k' },
  { name: 'Can You Hear The Music', id: '4JZ-o3iAJv4' },
];

async function run() {
  for (const c of candidates) {
    const res = await verifyYT(c.id);
    console.log(`${c.name} (${c.id}): ${res.valid ? '✅ ' + res.title : '❌ FAILED (' + res.code + ')'}`);
  }
}

run();
