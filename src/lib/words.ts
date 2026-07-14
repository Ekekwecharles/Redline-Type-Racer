export const WORD_POOL = [
  "throttle", "gearbox", "asphalt", "nitro", "chrome", "exhaust", "clutch", "redline",
  "drift", "piston", "circuit", "apex", "tarmac", "engine", "turbo", "brake", "spark",
  "chassis", "fender", "ignition", "horsepower", "rev", "skid", "lap", "pitstop",
  "downshift", "overtake", "checkered", "velocity", "traction", "cylinder", "dashboard",
  "headlight", "carbon", "suspension", "cockpit", "racetrack", "speedway", "slipstream",
  "handbrake", "tailwind", "momentum", "adrenaline", "finish", "sprint", "surge", "glide",
  "roar", "blaze", "streak", "dash", "bolt", "zoom", "charge", "rocket", "flash", "grip",
  "curve", "straightaway", "hairpin", "paddock", "garage", "fuel", "tire", "windshield",
  "mirror", "signal", "lane", "merge", "accelerate", "cruise", "idle", "stall", "backfire",
  "supercharge", "boost", "warp", "drive", "race", "ride", "wheel",
];

export function genText(n: number): string {
  const words: string[] = [];
  for (let i = 0; i < n; i++) {
    words.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
  }
  return words.join(" ");
}
