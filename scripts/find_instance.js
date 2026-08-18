const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function findWorkingInstance() {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.privacydev.net',
    'https://piped-api.lunar.icu',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.ducks.party',
    'https://api-piped.mha.fi'
  ];

  const testId = 'tmFz2jWsvx4';
  for (const api of instances) {
    console.log('Testing instance:', api);
    try {
      const data = await fetchJson(`${api}/streams/${testId}`);
      if (data && data.audioStreams && data.audioStreams.length > 0) {
        console.log('FOUND WORKING PIPED INSTANCE:', api);
        console.log('Title:', data.title);
        console.log('Audio Streams count:', data.audioStreams.length);
        console.log('Audio stream sample URL:', data.audioStreams[0].url);
        return;
      }
    } catch (e) {
      console.log('Failed:', api, e.message);
    }
  }
}

findWorkingInstance();
