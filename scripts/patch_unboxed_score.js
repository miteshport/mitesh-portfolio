const fs = require('fs');

let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');

const unboxedScore = `        bottomRightExtra={
          <div
            style={{
              fontFamily: "var(--font-mono, monospace)",
              display: "flex",
              alignItems: "baseline",
              gap: "0.75rem",
              fontSize: "clamp(0.68rem, 1.1vw, 0.78rem)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#ffffff",
              pointerEvents: "none",
            }}
          >
            <div>
              <span style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "0.62rem" }}>SCORE </span>
              <span style={{ fontSize: "1.3rem", fontWeight: 850, letterSpacing: "-0.02em", color: "#ffffff" }}>
                {telemetry.score.toLocaleString()}
              </span>
            </div>
            {telemetry.multiplier > 1 && (
              <div
                style={{
                  padding: "0.15rem 0.5rem",
                  borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.16)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  color: "#38bdf8",
                  fontWeight: 750,
                  fontSize: "0.68rem",
                }}
              >
                x{telemetry.multiplier} STREAK
              </div>
            )}
          </div>
        }`;

pageCode = pageCode.replace(
  /bottomRightExtra=\{[\s\S]*?\}\s*\}\s*\/>\s*<\/main>/,
  `${unboxedScore}\n      />\n    </main>`
);

fs.writeFileSync('src/app/page.tsx', pageCode, 'utf8');
console.log('src/app/page.tsx updated with clean unboxed spatial score');
