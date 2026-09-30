export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function timeAgo(ts) {
  const diff = Date.now() - (typeof ts === "number" ? ts : new Date(ts).getTime());
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export const DATASETS = [
  { id: "ireland",  label: "Ireland Constellation", flag: "🇮🇪" },
  { id: "mi",       label: "MI Constellation",       flag: "🇺🇸" },
  { id: "germany",  label: "Germany Constellation",  flag: "🇩🇪" },
  { id: "uk",       label: "UK Constellation",       flag: "🇬🇧" },
  { id: "finance",  label: "Finance Analytics",      flag: "💹"  },
  { id: "customer", label: "Customer Analytics",     flag: "👥"  },
];

export const AGENT_PIPELINE = [
  { id: "planner",   label: "Planner",    icon: "🧠" },
  { id: "metadata",  label: "Metadata",   icon: "🔍" },
  { id: "data",      label: "Data",       icon: "⚡" },
  { id: "analytics", label: "Analytics",  icon: "📊" },
];

export const SUGGESTED_QUERIES = [
  "Show subscriber count for May 2026",
  "Explain revenue decline last quarter",
  "Compare Residential vs SME segments",
  "What are the top churn drivers?",
  "Show revenue trend for 2026",
  "Analyze channel performance",
];
