const fs = require('fs');

let pageCode = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Update Telemetry initial state in page.tsx
pageCode = pageCode.replace(
  /const \[telemetry, setTelemetry\] = useState<TelemetryData>\(\{[\s\S]*?\}\);/,
  `const [telemetry, setTelemetry] = useState<TelemetryData>({
    speed: 200,
    gear: 5,
    rpm: 10500,
    lapTime: 0,
    isBoosting: false,
    isDrifting: false,
    isFlying: false,
    isLightsOut: false,
    onKerb: false,
    currentSector: 1,
    sectorsCrossed: 0,
    score: 0,
    multiplier: 1,
    turboBoost: 0,
    isMachTurbo: false,
    nearMissCount: 0,
  });`
);

// 2. Update Launch Gantry prompt subtext
pageCode = pageCode.replace(
  'STEER: MOUSE / TOUCH · MERGE: MATCH NUMBERS · GOAL: 2048 BOOST',
  'STEER: MOUSE / TOUCH  ·  COLLECT: CYAN ENERGY  ·  DODGE: RED HAZARDS'
);

// 3. Update spatial score and turbo badge in SpatialHUD
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
            {telemetry.isMachTurbo ? (
              <div
                style={{
                  padding: "0.18rem 0.6rem",
                  borderRadius: "6px",
                  background: "rgba(56, 189, 248, 0.25)",
                  border: "1px solid rgba(56, 189, 248, 0.8)",
                  color: "#38bdf8",
                  fontWeight: 800,
                  fontSize: "0.70rem",
                  boxShadow: "0 0 16px rgba(56, 189, 248, 0.5)",
                }}
              >
                ⚡ MACH AFTERBURNER
              </div>
            ) : telemetry.multiplier > 1 ? (
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
            ) : null}
          </div>
        }`;

pageCode = pageCode.replace(
  /bottomRightExtra=\{[\s\S]*?\}\s*\}\s*\/>\s*<\/main>/,
  `${unboxedScore}\n      />\n    </main>`
);

fs.writeFileSync('src/app/page.tsx', pageCode, 'utf8');
console.log('src/app/page.tsx updated with Road Fighter state and instructions!');
