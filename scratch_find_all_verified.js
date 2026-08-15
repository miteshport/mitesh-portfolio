const https = require('https');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

function searchYouTube(query) {
  return new Promise((resolve) => {
    const q = encodeURIComponent(query);
    const options = {
      hostname: 'www.youtube.com',
      path: `/results?search_query=${q}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = [...data.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)];
        const ids = [...new Set(matches.map(m => m[1]))];
        resolve(ids.slice(0, 10));
      });
    }).on('error', () => resolve([]));
  });
}

function checkEmbed(videoId) {
  return new Promise((resolve) => {
    const target = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
    https.get(`https://www.youtube.com/oembed?url=${target}&format=json`, (res) => {
      let d = '';
      res.on('data', chunk => d += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const j = JSON.parse(d);
            resolve({ videoId, valid: true, title: j.title });
          } catch {
            resolve({ videoId, valid: true, title: '' });
          }
        } else {
          resolve({ videoId, valid: false, code: res.statusCode });
        }
      });
    }).on('error', () => resolve({ videoId, valid: false }));
  });
}

async function findVerifiedID(query) {
  const ids = await searchYouTube(query);
  for (const id of ids) {
    const check = await checkEmbed(id);
    if (check.valid) {
      return { query, videoId: id, title: check.title };
    }
  }
  return { query, videoId: null, title: 'NOT_FOUND' };
}

const songList = [
  { key: 'dilse', query: 'Dil Se Re AR Rahman lyrical audio' },
  { key: 'khwaja', query: 'Khwaja Mere Khwaja AR Rahman Jodhaa Akbar audio' },
  { key: 'yehjo', query: 'Yeh Jo Des Hai Tera Swades audio' },
  { key: 'albela', query: 'Albela Sajan Aayo Re Hum Dil De Chuke Sanam audio' },
  { key: 'tadap', query: 'Tadap Tadap Ke Hum Dil De Chuke Sanam audio' },
  { key: 'silsila', query: 'Silsila Ye Chahat Ka Devdas audio' },
  { key: 'dola', query: 'Dola Re Dola Devdas audio' },
  { key: 'musafir', query: 'Musafir Hoon Yaaron Kishore Kumar audio' },
  { key: 'tujhse', query: 'Tujhse Naraz Nahin Zindagi Masoom audio' },
  { key: 'spider2099', query: 'Spider-Man 2099 Miguel OHara Daniel Pemberton official' },
  { key: 'amidreaming', query: 'Am I Dreaming Metro Boomin audio' },
  { key: 'gladiator', query: 'Now We Are Free Hans Zimmer Gladiator audio' },
  { key: 'paulsdream', query: 'Pauls Dream Hans Zimmer Dune audio' },
  { key: 'daylight', query: 'On The Nature of Daylight Max Richter official audio' },
  { key: 'nightsong', query: 'Night Song Nusrat Fateh Ali Khan Michael Brook audio' },
  { key: 'terebina_zindagi', query: 'Tere Bina Zindagi Se Aandhi Kishore Lata audio' },
  { key: 'lagjagale', query: 'Lag Ja Gale Lata Mangeshkar audio' },
  { key: 'tumko', query: 'Tum Ko Dekha Toh Yeh Khayal Aaya Jagjit Singh audio' },
  { key: 'aanewalapal', query: 'Aane Wala Pal Jane Wala Hai Kishore Kumar audio' },
  { key: 'kuchto', query: 'Kuch To Log Kahenge Kishore Kumar audio' },
  { key: 'chingari', query: 'Chingari Koi Bhadke Kishore Kumar audio' },
];

async function run() {
  const verifiedMap = {};
  for (const s of songList) {
    const res = await findVerifiedID(s.query);
    verifiedMap[s.key] = res;
    console.log(`[${res.videoId ? 'VERIFIED' : 'FAILED'}] ${s.key} -> ${res.videoId} ("${res.title}")`);
    await sleep(700); // polite delay to avoid throttling
  }

  fs.writeFileSync('scratch_verified_map.json', JSON.stringify(verifiedMap, null, 2));
  console.log('\nSaved verified map to scratch_verified_map.json');
}

run();
