const https = require('https');

async function testFetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const testId = 'tmFz2jWsvx4';
  const instances = [
    `https://invidious.nerdvpn.de/api/v1/videos/${testId}`,
    `https://yewtu.be/api/v1/videos/${testId}`,
    `https://pipedapi.kavin.rocks/streams/${testId}`
  ];

  for (const inst of instances) {
    console.log('Testing instance:', inst);
    try {
      const res = await testFetch(inst);
      if (res && (res.adaptiveFormats || res.audioStreams)) {
        console.log('SUCCESS with instance:', inst);
        const audioStreams = res.adaptiveFormats ? res.adaptiveFormats.filter(f => f.type && f.type.startsWith('audio/')) : res.audioStreams;
        console.log('Found audio streams count:', audioStreams ? audioStreams.length : 0);
        if (audioStreams && audioStreams[0]) {
          console.log('Sample stream URL:', audioStreams[0].url ? audioStreams[0].url.substring(0, 80) : 'none');
        }
        break;
      }
    } catch (e) {
      console.log('Failed instance:', inst, e.message);
    }
  }
}

main();
