export const MEMBER_COLORS = [
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#84cc16", // lime
];

export const MEMBER_EMOJIS = [
  "🦊", "🐸", "🐙", "🦄", "🐼", "🦋", "🐳", "🦉", "🐨", "🐝", "🦖", "🐢",
];

export function pickColor(index: number) {
  return MEMBER_COLORS[((index % MEMBER_COLORS.length) + MEMBER_COLORS.length) % MEMBER_COLORS.length];
}

export function pickEmoji(index: number) {
  return MEMBER_EMOJIS[((index % MEMBER_EMOJIS.length) + MEMBER_EMOJIS.length) % MEMBER_EMOJIS.length];
}

export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "group"}-${suffix}`;
}

export function fmtDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function fmtScore(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n.toFixed(1)).toString();
}

export function fmtSigned(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const rounded = Number(n.toFixed(1));
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

export function average(nums: number[]): number | null {
  const clean = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

export function fmtRuntime(min: number | null | undefined) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Score → a fun color for badges/rings, red (bad) to green (great).
export function scoreColor(score: number | null | undefined) {
  if (score === null || score === undefined) return "#a1a1aa";
  if (score >= 8) return "#22c55e";
  if (score >= 6.5) return "#84cc16";
  if (score >= 5) return "#eab308";
  if (score >= 3) return "#f97316";
  return "#ef4444";
}

export function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
