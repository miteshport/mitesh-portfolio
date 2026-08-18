const fs = require('fs');

// Read existing page to preserve track definitions and helper hooks
let content = fs.readFileSync('src/app/radio/page.tsx', 'utf8');

// Update glassCardStyle padding and sizing for responsive viewports
content = content.replace(
  /padding: "1\.3rem 1\.5rem",/g,
  'padding: "clamp(0.85rem, 2.5vw, 1.35rem)",'
);

content = content.replace(
  /width: "min\(23vh, 165px\)",\s*height: "min\(23vh, 165px\)",/g,
  'width: "clamp(120px, 22vh, 175px)", height: "clamp(120px, 22vh, 175px)",'
);

// Update transport controls gap
content = content.replace(
  /gap: "1\.1rem",/g,
  'gap: "clamp(0.35rem, 2vw, 0.95rem)",'
);

// Update container maxWidth and height
content = content.replace(
  /maxWidth: "450px",\s*height: "min\(86vh, 670px\)",\s*minHeight: "550px",/g,
  'maxWidth: "430px", height: "min(84dvh, 640px)", minHeight: "480px",'
);

fs.writeFileSync('src/app/radio/page.tsx', content, 'utf8');
console.log('src/app/radio/page.tsx updated with responsive Fold 4 music player layout!');
