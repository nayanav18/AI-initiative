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

export function groupConversationsByDate(conversations) {
  if (!conversations || conversations.length === 0) return [];
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    previous30Days: [],
    older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOf7Days = startOfToday - 7 * 86400000;
  const startOf30Days = startOfToday - 30 * 86400000;

  conversations.forEach((conv) => {
    const ts = typeof conv.ts === "number" ? conv.ts : new Date(conv.ts || Date.now()).getTime();
    if (ts >= startOfToday) {
      groups.today.push(conv);
    } else if (ts >= startOfYesterday) {
      groups.yesterday.push(conv);
    } else if (ts >= startOf7Days) {
      groups.previous7Days.push(conv);
    } else if (ts >= startOf30Days) {
      groups.previous30Days.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return [
    { label: "Today", items: groups.today },
    { label: "Yesterday", items: groups.yesterday },
    { label: "Previous 7 Days", items: groups.previous7Days },
    { label: "Previous 30 Days", items: groups.previous30Days },
    { label: "Older", items: groups.older },
  ].filter((g) => g.items.length > 0);
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
