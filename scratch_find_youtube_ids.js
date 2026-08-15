const https = require('https');

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
        // Match /watch?v=
        const matches = [...data.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)];
        const ids = [...new Set(matches.map(m => m[1]))];
        resolve(ids.slice(0, 8));
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

async function findBestTrack(songQuery) {
  const ids = await searchYouTube(songQuery);
  for (const id of ids) {
    const check = await checkEmbed(id);
    if (check.valid) {
      return { songQuery, videoId: id, title: check.title };
    }
  }
  return { songQuery, videoId: null };
}

async function run() {
  const songs = [
    "Atif Aslam Tajdar e Haram Coke Studio Season 8",
    "Bol Hu Soch Nescafe Basement",
    "Nusrat Fateh Ali Khan Michael Brook Mustt Mustt",
    "Lucky Ali O Sanam acoustic",
    "Rehna Tu Delhi 6 AR Rahman",
    "Dil Se Re AR Rahman",
    "Khwaja Mere Khwaja AR Rahman",
    "Albela Sajan Aayo Re Hum Dil De Chuke Sanam",
    "Tadap Tadap Ke Hum Dil De Chuke Sanam",
    "Silsila Ye Chahat Ka Devdas",
    "Dola Re Dola Devdas",
    "Musafir Hoon Yaaron Kishore Kumar",
    "Tujhse Naraz Nahin Zindagi Masoom",
    "Spider-Man 2099 Miguel OHara Daniel Pemberton",
    "Am I Dreaming Metro Boomin Spider-Verse",
    "Now We Are Free Gladiator Hans Zimmer",
    "Pauls Dream Dune Hans Zimmer",
    "On The Nature of Daylight Max Richter",
  ];

  for (const s of songs) {
    const r = await findBestTrack(s);
    console.log(`✅ ${r.songQuery} -> ${r.videoId} ("${r.title}")`);
  }
}

run();
