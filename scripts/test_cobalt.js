const https = require('https');

function testCobalt(url) {
  const data = JSON.stringify({
    url: url,
    downloadMode: 'audio',
    audioFormat: 'mp3'
  });

  const req = https.request('https://api.cobalt.tools', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0'
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Cobalt response status:', res.statusCode);
      console.log('Cobalt response body:', body);
    });
  });

  req.on('error', (e) => console.log('Cobalt error:', e.message));
  req.write(data);
  req.end();
}

testCobalt('https://www.youtube.com/watch?v=tmFz2jWsvx4');
