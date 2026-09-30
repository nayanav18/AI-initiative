import { useState } from "react";

// ── Inline SVG Icons ──────────────────────────────────────────────────────
const Icon = ({ children, size = 14, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

const PlusIcon = (p) => (
  <Icon {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);
const TrashIcon = (p) => (
  <Icon {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </Icon>
);
const CopyIcon = (p) => (
  <Icon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </Icon>
);
const UndoIcon = (p) => (
  <Icon {...p}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
  </Icon>
);
const RedoIcon = (p) => (
  <Icon {...p}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </Icon>
);
const GridIcon = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </Icon>
);
const SaveIcon = (p) => (
  <Icon {...p}>
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </Icon>
);
const FolderIcon = (p) => (
  <Icon {...p}>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </Icon>
);
const XCircleIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </Icon>
);

// ── Toolbar Component ─────────────────────────────────────────────────────
export default function BuilderToolbar({
  dashboardTitle = "Untitled Dashboard",
  onTitleChange,
  onAddWidget,
  onDeleteSelected,
  onDuplicateSelected,
  onSave,
  onLoad,
  onClearAll,
  onToggleGrid,
  gridEnabled = true,
  hasSelection = false,
  widgetCount = 0,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(dashboardTitle);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (onTitleChange && titleInput.trim()) {
      onTitleChange(titleInput.trim());
    } else {
      setTitleInput(dashboardTitle);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 48,
        background: "#111827",
        borderBottom: "1px solid #1e3a5f",
        padding: "0 16px",
        gap: 6,
        flexShrink: 0,
      }}
    >
      {/* ── Left: Title ── */}
      <div style={{ display: "flex", alignItems: "center", minWidth: 0, marginRight: 12 }}>
        {isEditingTitle ? (
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSubmit();
              if (e.key === "Escape") { setIsEditingTitle(false); setTitleInput(dashboardTitle); }
            }}
            autoFocus
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f1f5f9",
              background: "#0f172a",
              border: "1px solid #3b82f6",
              borderRadius: 6,
              padding: "4px 10px",
              outline: "none",
              width: 180,
            }}
          />
        ) : (
          <div
            onClick={() => { setTitleInput(dashboardTitle); setIsEditingTitle(true); }}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#f1f5f9",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 200,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title="Click to edit title"
          >
            {dashboardTitle}
          </div>
        )}
      </div>

      {/* ── Separator ── */}
      <div style={{ width: 1, height: 24, background: "#1e3a5f", flexShrink: 0 }} />

      {/* ── Add Widget ── */}
      <ToolbarButton icon={<PlusIcon />} label="Add Widget" onClick={onAddWidget} primary />

      {/* ── Separator ── */}
      <div style={{ width: 1, height: 24, background: "#1e3a5f", flexShrink: 0 }} />

      {/* ── Selection actions ── */}
      <ToolbarButton icon={<TrashIcon />} label="Delete" onClick={onDeleteSelected} disabled={!hasSelection} />
      <ToolbarButton icon={<CopyIcon />} label="Duplicate" onClick={onDuplicateSelected} disabled={!hasSelection} />

      {/* ── Separator ── */}
      <div style={{ width: 1, height: 24, background: "#1e3a5f", flexShrink: 0 }} />

      {/* ── Undo / Redo ── */}
      <ToolbarButton icon={<UndoIcon />} label="Undo" onClick={onUndo} disabled={!canUndo} />
      <ToolbarButton icon={<RedoIcon />} label="Redo" onClick={onRedo} disabled={!canRedo} />

      {/* ── Separator ── */}
      <div style={{ width: 1, height: 24, background: "#1e3a5f", flexShrink: 0 }} />

      {/* ── Grid Toggle ── */}
      <ToolbarButton icon={<GridIcon />} label="Grid" onClick={onToggleGrid} active={gridEnabled} />

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Widget count ── */}
      <span style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap", marginRight: 4 }}>
        {widgetCount} widget{widgetCount !== 1 ? "s" : ""}
      </span>

      {/* ── Save / Load / Clear ── */}
      <ToolbarButton icon={<FolderIcon />} label="Load" onClick={onLoad} />
      <ToolbarButton icon={<SaveIcon />} label="Save" onClick={onSave} primary />

      <div style={{ width: 1, height: 24, background: "#1e3a5f", flexShrink: 0 }} />

      <ToolbarButton icon={<XCircleIcon />} label="Clear" onClick={onClearAll} danger disabled={widgetCount === 0} />
    </div>
  );
}

// ── Reusable toolbar button ───────────────────────────────────────────────
function ToolbarButton({ icon, label, onClick, disabled, primary, danger, active }) {
  const getColor = () => {
    if (disabled) return "#374151";
    if (danger) return "#ef4444";
    if (active) return "#60a5fa";
    if (primary) return "#fff";
    return "#94a3b8";
  };

  const getBg = () => {
    if (primary && !disabled) return "linear-gradient(135deg,#1d4ed8,#7c3aed)";
    if (active) return "rgba(59,130,246,0.12)";
    return "transparent";
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 10px",
        borderRadius: 6,
        border: active ? "1px solid rgba(59,130,246,0.3)" : danger && !disabled ? "1px solid rgba(239,68,68,0.2)" : "1px solid transparent",
        background: getBg(),
        color: getColor(),
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.15s",
        whiteSpace: "nowrap",
        flexShrink: 0,
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !primary && !active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          e.currentTarget.style.color = "#f1f5f9";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !primary && !active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = getColor();
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
