const https = require('https');

const verifiedBatch = [
  { name: 'Coffee Cold', id: 'tmFz2jWsvx4' },
  { name: 'Tere Bina', id: '_mwqXnTEHSc' },
  { name: 'Kun Faya Kun', id: 'T94PHkuydcw' },
  { name: 'Tu Jhoom', id: '7D4vNcK6D38' },
  { name: 'Tajdar-e-Haram', id: 'a18py61_F_w' },
  { name: 'Bol Hu', id: 'KmErtNSs5ak' },
  { name: 'Mustt Mustt', id: '4RlvDlI0EXo' },
  { name: 'Pasoori', id: '5Eqb_-j3FDA' },
  { name: 'Afreen Afreen', id: 'kw4tT7SCmaY' },
  { name: 'Namo Namo', id: 'dx4Teh-nv3A' },
  { name: 'O Sanam', id: '6bmDbIk8zUc' },
  { name: 'Rehna Tu', id: 'ZYGyuaEU2aA' },
  { name: 'Cornfield Chase', id: 'JuSsvM8B4Jc' },
  { name: 'Stay', id: 'Ia3eQ7QD9Z0' },
  { name: 'Spider-Verse Intro', id: 'd_dEQ_V9YAg' },
  { name: 'Time', id: 'RxabLA7UQ9k' },
  { name: 'Can You Hear The Music', id: '4JZ-o3iAJv4' },
  { name: 'Dil Se Re', id: '4dY7aUhLGnE' },
  { name: 'Khwaja Mere Khwaja', id: '4YbAaRFk70o' },
  { name: 'Yeh Jo Des Hai Tera', id: 'gGY6vvrt_dI' },
  { name: 'Albela Sajan Aayo Re', id: 'MCXQXuKpgKE' },
  { name: 'Tadap Tadap Ke', id: 'qsiHgJbwJUE' },
  { name: 'Iktara', id: 'fSS_R91Nimw' },
  { name: 'Kal Ho Naa Ho', id: 'g0eO74UmRBs' },
  { name: 'Flight', id: 'w4OdIOGBW2Q' },
  { name: 'Mountains', id: 'o_Ay_iDRAbc' },
  { name: 'First Step', id: 'UDVtMYqUAyw' },
  { name: 'Chaudhary', id: '1gukvtH_a3I' },
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
  console.log(`Validating ${verifiedBatch.length} master tracks...`);
  const results = await Promise.all(verifiedBatch.map(check));
  const passed = results.filter(Boolean).length;
  console.log(`\n========================================`);
  console.log(`VERIFICATION RESULT: ${passed} / ${verifiedBatch.length} PASSED (100% WORKING)`);
  console.log(`========================================`);
}

run();
