import { useState, useEffect } from "react";

// ── Inline SVG Icons ──────────────────────────────────────────────────────
const Icon = ({ children, size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
    {...props}
  >
    {children}
  </svg>
);

const CHART_TYPES = [
  {
    id: "bar",
    label: "Bar Chart",
    desc: "Compare values across categories",
    icon: (
      <Icon>
        <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="10" y="6" width="4" height="15" rx="1" fill="currentColor" opacity="0.5" />
        <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" opacity="0.7" />
      </Icon>
    ),
  },
  {
    id: "line",
    label: "Line Chart",
    desc: "Show trends over time",
    icon: (
      <Icon>
        <polyline points="3 18 8 12 13 15 21 5" stroke="currentColor" strokeWidth="2" />
        <circle cx="8" cy="12" r="1.5" fill="currentColor" />
        <circle cx="13" cy="15" r="1.5" fill="currentColor" />
        <circle cx="21" cy="5" r="1.5" fill="currentColor" />
      </Icon>
    ),
  },
  {
    id: "area",
    label: "Area Chart",
    desc: "Filled line showing volume",
    icon: (
      <Icon>
        <path d="M3 20 L3 18 L8 12 L13 15 L21 5 L21 20 Z" fill="currentColor" opacity="0.2" />
        <polyline points="3 18 8 12 13 15 21 5" stroke="currentColor" strokeWidth="2" />
      </Icon>
    ),
  },
  {
    id: "donut",
    label: "Donut Chart",
    desc: "Show proportions of a whole",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
        <path d="M12 3 A9 9 0 0 1 21 12" stroke="currentColor" strokeWidth="3" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1" opacity="0.2" />
      </Icon>
    ),
  },
  {
    id: "waterfall",
    label: "Waterfall",
    desc: "Show cumulative effect",
    icon: (
      <Icon>
        <rect x="2" y="4" width="3" height="8" rx="0.5" fill="currentColor" opacity="0.5" />
        <rect x="7" y="8" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.3" />
        <rect x="12" y="6" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.5" />
        <rect x="17" y="3" width="3" height="14" rx="0.5" fill="currentColor" opacity="0.7" />
        <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </Icon>
    ),
  },
  {
    id: "funnel",
    label: "Funnel",
    desc: "Show conversion stages",
    icon: (
      <Icon>
        <path d="M3 4 L21 4 L16 10 L16 18 L8 18 L8 10 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
        <line x1="5" y1="7" x2="19" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </Icon>
    ),
  },
  {
    id: "stacked_bar",
    label: "Stacked Bar",
    desc: "Compare composition",
    icon: (
      <Icon>
        <rect x="3" y="10" width="4" height="5" rx="0" fill="currentColor" opacity="0.3" />
        <rect x="3" y="15" width="4" height="6" rx="0" fill="currentColor" opacity="0.6" />
        <rect x="10" y="5" width="4" height="7" rx="0" fill="currentColor" opacity="0.3" />
        <rect x="10" y="12" width="4" height="9" rx="0" fill="currentColor" opacity="0.6" />
        <rect x="17" y="3" width="4" height="9" rx="0" fill="currentColor" opacity="0.3" />
        <rect x="17" y="12" width="4" height="9" rx="0" fill="currentColor" opacity="0.6" />
      </Icon>
    ),
  },
  {
    id: "kpi_card",
    label: "KPI Card",
    desc: "Single metric highlight",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.6" />
        <line x1="12" y1="3" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="18" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
      </Icon>
    ),
  },
];

export default function ChartTypePicker({ currentType, onSelect, onClose, position }) {
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 900,
        }}
      />
      {/* Picker popup */}
      <div
        style={{
          position: "fixed",
          top: position?.y || 100,
          left: position?.x || 100,
          width: 360,
          background: "#0f172a",
          border: "1px solid #1e3a5f",
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          zIndex: 950,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
            Change Chart Type
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              fontSize: 16,
              padding: "2px 4px",
              transition: "color 0.15s",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f1f5f9"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
          >
            ✕
          </button>
        </div>

        {/* Chart type grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {CHART_TYPES.map((ct) => {
            const isActive = ct.id === currentType;
            const isHovered = ct.id === hoveredId;
            return (
              <button
                key={ct.id}
                onClick={() => onSelect(ct.id)}
                onMouseEnter={() => setHoveredId(ct.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 12px",
                  background: isActive
                    ? "rgba(59,130,246,0.12)"
                    : isHovered
                    ? "rgba(30,58,95,0.3)"
                    : "#060d1a",
                  border: `1px solid ${isActive ? "#3b82f6" : isHovered ? "#253650" : "#111827"}`,
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: isActive ? "0 0 8px rgba(59,130,246,0.25)" : "none",
                  textAlign: "left",
                  outline: "none",
                  color: isActive ? "#60a5fa" : "#94a3b8",
                }}
              >
                <div style={{ color: isActive ? "#60a5fa" : "#64748b", marginTop: 1 }}>
                  {ct.icon}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#60a5fa" : "#f1f5f9", marginBottom: 2 }}>
                    {ct.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>
                    {ct.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
