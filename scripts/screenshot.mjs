// Puppeteer screenshot script for live canvas audit
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'screenshots');

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-angle=d3d11'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 20000 });

// Wait for 3D canvas to fully render (model load + first frames)
await new Promise(r => setTimeout(r, 4000));

// Screenshot 1 - Default center position
await page.screenshot({ path: path.join(OUT_DIR, '01_default.png'), fullPage: false });
console.log('✅ Screenshot 1: Default');

// Screenshot 2 - Move mouse to left to steer left
await page.mouse.move(300, 450);
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: path.join(OUT_DIR, '02_steer_left.png'), fullPage: false });
console.log('✅ Screenshot 2: Steer Left');

// Screenshot 3 - Move mouse to right to steer right
await page.mouse.move(1140, 450);
await new Promise(r => setTimeout(r, 1500));
await page.screenshot({ path: path.join(OUT_DIR, '03_steer_right.png'), fullPage: false });
console.log('✅ Screenshot 3: Steer Right');

// Screenshot 4 - Center, lights out mode
await page.mouse.move(720, 450);
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: path.join(OUT_DIR, '04_center.png'), fullPage: false });
console.log('✅ Screenshot 4: Center');

await browser.close();
console.log('\n🏎️ All screenshots saved to screenshots/');
