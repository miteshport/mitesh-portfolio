const https = require('https');

// Test YouTube standard watch URL redirect
function testWatch(id) {
  return new Promise((resolve) => {
    https.get(`https://www.youtube.com/watch?v=${id}`, (res) => {
      resolve({ id, status: res.statusCode });
    }).on('error', (e) => resolve({ id, error: e.message }));
  });
}

async function run() {
  const ids = ['a18py61_C_Q', 'tW48OI7wa2A', 'cA_G_GZ2L2k', '1Vko01D77Fg', 'RxabLA7UQ9k'];
  for (const id of ids) {
    const r = await testWatch(id);
    console.log(id, r.status);
  }
}
run();
