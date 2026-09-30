import { useState } from "react";

// ── Inline SVG Icons ──────────────────────────────────────────────────────
const Icon = ({ children, size = 16, ...props }) => (
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

const SettingsIcon = (p) => (
  <Icon size={14} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </Icon>
);
const CopyIcon = (p) => (
  <Icon size={13} {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </Icon>
);
const TrashIcon = (p) => (
  <Icon size={13} {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </Icon>
);

// Chart type mini-icons (for grid)
const CHART_TYPES = [
  {
    type: "bar",
    label: "Bar",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity="0.4" />
        <rect x="10" y="6" width="4" height="15" rx="1" fill="currentColor" opacity="0.6" />
        <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" opacity="0.8" />
      </svg>
    ),
  },
  {
    type: "line",
    label: "Line",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="3 18 8 12 13 15 21 5" />
      </svg>
    ),
  },
  {
    type: "area",
    label: "Area",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 20 L3 18 L8 12 L13 15 L21 5 L21 20 Z" fill="currentColor" opacity="0.15" />
        <polyline points="3 18 8 12 13 15 21 5" />
      </svg>
    ),
  },
  {
    type: "donut",
    label: "Donut",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="8" opacity="0.3" />
        <path d="M12 4 A8 8 0 0 1 20 12" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    type: "waterfall",
    label: "Waterfall",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="5" width="3" height="7" rx="0.5" opacity="0.5" />
        <rect x="7" y="9" width="3" height="5" rx="0.5" opacity="0.3" />
        <rect x="12" y="7" width="3" height="3" rx="0.5" opacity="0.5" />
        <rect x="17" y="3" width="3" height="13" rx="0.5" opacity="0.7" />
        <line x1="2" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
  },
  {
    type: "funnel",
    label: "Funnel",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 4 L21 4 L16 10 L16 18 L8 18 L8 10 Z" fill="currentColor" opacity="0.15" />
      </svg>
    ),
  },
  {
    type: "stacked_bar",
    label: "Stacked",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="10" width="4" height="5" opacity="0.3" />
        <rect x="3" y="15" width="4" height="6" opacity="0.6" />
        <rect x="10" y="5" width="4" height="7" opacity="0.3" />
        <rect x="10" y="12" width="4" height="9" opacity="0.6" />
        <rect x="17" y="3" width="4" height="9" opacity="0.3" />
        <rect x="17" y="12" width="4" height="9" opacity="0.6" />
      </svg>
    ),
  },
  {
    type: "kpi_card",
    label: "KPI",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9" opacity="0.3" />
        <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.6" />
        <line x1="12" y1="3" x2="12" y2="6" />
      </svg>
    ),
  },
];

export default function WidgetConfigPanel({
  widget,
  onUpdate,
  onClose,
  onDelete,
  onDuplicate,
}) {
  if (!widget) return null;

  const handleUpdate = (field, value) => {
    onUpdate(widget.id, { [field]: value });
  };

  const handleChartTypeChange = (newType) => {
    onUpdate(widget.id, { chart: { ...widget.chart, type: newType } });
  };

  const inputStyle = {
    width: "100%",
    padding: "8px 10px",
    background: "#1a2235",
    border: "1px solid #1e3a5f",
    borderRadius: 6,
    color: "#f1f5f9",
    fontSize: 12,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div
      style={{
        width: 280,
        flexShrink: 0,
        height: "100%",
        background: "#0f172a",
        borderLeft: "1px solid #1e3a5f",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        boxShadow: "-4px 0 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 16px",
          borderBottom: "1px solid #1e3a5f",
          background: "#060d1a",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <SettingsIcon />
          Widget Properties
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 15,
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

      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          flex: 1,
        }}
      >
        {/* ── Title ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Title
          </div>
          <input
            type="text"
            value={widget.title || ""}
            onChange={(e) => handleUpdate("title", e.target.value)}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#1e3a5f"; }}
          />
        </div>

        {/* ── Chart Type ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Chart Type
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {CHART_TYPES.map((ct) => {
              const isActive = widget.chart?.type === ct.type;
              return (
                <button
                  key={ct.type}
                  onClick={() => handleChartTypeChange(ct.type)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    padding: "8px 4px",
                    background: isActive ? "rgba(59,130,246,0.15)" : "#111827",
                    border: `1px solid ${isActive ? "#3b82f6" : "#1e3a5f"}`,
                    borderRadius: 6,
                    cursor: "pointer",
                    color: isActive ? "#60a5fa" : "#94a3b8",
                    transition: "all 0.15s",
                    outline: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#253650";
                      e.currentTarget.style.background = "#1a2235";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "#1e3a5f";
                      e.currentTarget.style.background = "#111827";
                    }
                  }}
                >
                  {ct.icon}
                  <span style={{ fontSize: 9, fontWeight: 600 }}>{ct.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Size ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Size
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, color: "#475569", marginBottom: 3 }}>Width</label>
              <input type="number" value={widget.width || 0} onChange={(e) => handleUpdate("width", Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, color: "#475569", marginBottom: 3 }}>Height</label>
              <input type="number" value={widget.height || 0} onChange={(e) => handleUpdate("height", Number(e.target.value))} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* ── Position ── */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
            Position
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, color: "#475569", marginBottom: 3 }}>X</label>
              <input type="number" value={widget.x || 0} onChange={(e) => handleUpdate("x", Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 10, color: "#475569", marginBottom: 3 }}>Y</label>
              <input type="number" value={widget.y || 0} onChange={(e) => handleUpdate("y", Number(e.target.value))} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 16,
            borderTop: "1px solid #1e3a5f",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button
            onClick={() => onDuplicate(widget.id)}
            style={{
              width: "100%",
              padding: "9px 0",
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 8,
              color: "#60a5fa",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
          >
            <CopyIcon /> Duplicate Widget
          </button>
          <button
            onClick={() => onDelete(widget.id)}
            style={{
              width: "100%",
              padding: "9px 0",
              background: "transparent",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              color: "#f87171",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <TrashIcon /> Delete Widget
          </button>
        </div>
      </div>
    </div>
  );
}
