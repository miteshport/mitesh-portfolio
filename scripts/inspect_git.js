const cp = require('child_process');
const out = cp.execSync('git show a21deed:src/components/F1GameCanvas.tsx', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const start = out.indexOf('buildSkylineTexture');
if (start !== -1) {
  console.log(out.substring(start - 20, start + 2500));
} else {
  console.log('Not found');
}
