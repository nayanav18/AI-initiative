import { useState, useMemo } from "react";
import { DATASETS, groupConversationsByDate } from "../utils/helpers";

// ── SVG Icons ─────────────────────────────────────────────────────────────
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

const PanelLeftCloseIcon = (p) => (
  <Icon size={16} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="M14 9l-3 3 3 3" />
  </Icon>
);

const PlusIcon = (p) => (
  <Icon size={15} {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

const MessageSquareIcon = (p) => (
  <Icon size={15} {...p}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </Icon>
);

const ClockIcon = (p) => (
  <Icon size={15} {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </Icon>
);

const LightbulbIcon = (p) => (
  <Icon size={15} {...p}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15 9a3 3 0 00-6 0c0 2 1.5 3 2 4h2c.5-1 2-2 2-4z" />
  </Icon>
);

const LayoutDashboardIcon = (p) => (
  <Icon size={15} {...p}>
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </Icon>
);

const BarChart3Icon = (p) => (
  <Icon size={15} {...p}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </Icon>
);

const TrashIcon = (p) => (
  <Icon size={13} {...p}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
  </Icon>
);

const NAV = [
  { id: "chat", icon: <MessageSquareIcon />, label: "Chat" },
  { id: "history", icon: <ClockIcon />, label: "History" },
  { id: "insights", icon: <LightbulbIcon />, label: "Insights" },
  { id: "builder", icon: <LayoutDashboardIcon />, label: "Builder" },
  { id: "dashboards", icon: <BarChart3Icon />, label: "Dashboards" },
];

export default function Sidebar({
  isOpen = true,
  onToggle,
  activeNav,
  setActiveNav,
  selectedDataset,
  setSelectedDataset,
  conversations = [],
  activeConvId,
  openConv,
  newChat,
  deleteConv,
  savedInsightsCount = 0,
}) {
  const [showDatasetMenu, setShowDatasetMenu] = useState(false);
  const [hoveredConvId, setHoveredConvId] = useState(null);

  // Group conversations chronologically (ChatGPT / Copilot style)
  const groupedConvs = useMemo(
    () => groupConversationsByDate(conversations),
    [conversations]
  );

  return (
    <aside
      style={{
        width: isOpen ? "260px" : "0px",
        minWidth: isOpen ? "260px" : "0px",
        flexShrink: 0,
        background: "#07111f",
        borderRight: isOpen ? "1px solid #0d1f35" : "none",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "relative",
        transition: "width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        zIndex: 50,
        boxSizing: "border-box",
      }}
    >
      {/* ── Top Header: Brand & Collapse Icon ── */}
      <div
        style={{
          padding: "14px 14px 12px",
          borderBottom: "1px solid #0d1f35",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            ⬡
          </div>
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Analytics AI
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#3b82f6",
                fontWeight: 600,
                letterSpacing: "0.08em",
                whiteSpace: "nowrap",
              }}
            >
              ENTERPRISE · VODAFONE
            </div>
          </div>
        </div>

        {/* Sidebar Close Icon (like ChatGPT) */}
        <button
          onClick={onToggle}
          title="Close sidebar"
          style={{
            background: "transparent",
            border: "none",
            color: "#64748b",
            cursor: "pointer",
            padding: "5px",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f1f5f9";
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#64748b";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <PanelLeftCloseIcon />
        </button>
      </div>

      {/* ── New Chat Button ── */}
      <div style={{ padding: "12px 12px 6px", flexShrink: 0 }}>
        <button
          onClick={() => {
            newChat();
            setActiveNav("chat");
          }}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: 8,
            background: "linear-gradient(135deg,#1d4ed8,#7c3aed)",
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 2px 8px rgba(29,78,216,0.3)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
        >
          <PlusIcon /> New Chat
        </button>
      </div>

      {/* ── Main Navigation ── */}
      <div style={{ padding: "4px 8px", flexShrink: 0 }}>
        {NAV.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 8,
              border: "none",
              background: activeNav === item.id ? "rgba(59,130,246,0.12)" : "transparent",
              color: activeNav === item.id ? "#60a5fa" : "#64748b",
              fontSize: 13,
              fontWeight: activeNav === item.id ? 600 : 500,
              cursor: "pointer",
              marginBottom: 2,
              textAlign: "left",
              borderLeft: activeNav === item.id ? "2px solid #3b82f6" : "2px solid transparent",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (activeNav !== item.id) {
                e.currentTarget.style.color = "#cbd5e1";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeNav !== item.id) {
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.id === "insights" && savedInsightsCount > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  background: "rgba(59,130,246,0.18)",
                  color: "#60a5fa",
                  borderRadius: 999,
                  padding: "1px 6px",
                  fontWeight: 600,
                }}
              >
                {savedInsightsCount}
              </span>
            )}
            {item.id === "history" && conversations.length > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  background: "rgba(100,116,139,0.18)",
                  color: "#94a3b8",
                  borderRadius: 999,
                  padding: "1px 6px",
                  fontWeight: 600,
                }}
              >
                {conversations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Conversation History List (ChatGPT / Copilot Style) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 8px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {conversations.length === 0 ? (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              color: "#374151",
              fontSize: 12,
            }}
          >
            No chat history yet
          </div>
        ) : (
          groupedConvs.map((group) => (
            <div key={group.label}>
              {/* Group Title (e.g. Today, Yesterday, Previous 7 Days) */}
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "4px 8px 6px",
                }}
              >
                {group.label}
              </div>

              {/* Conversations under this group */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const isHovered = hoveredConvId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onMouseEnter={() => setHoveredConvId(conv.id)}
                      onMouseLeave={() => setHoveredConvId(null)}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: 8,
                        background: isActive
                          ? "rgba(59,130,246,0.12)"
                          : isHovered
                          ? "rgba(255,255,255,0.03)"
                          : "transparent",
                        borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                        transition: "all 0.15s",
                      }}
                    >
                      <button
                        onClick={() => {
                          openConv(conv.id);
                          setActiveNav("chat");
                        }}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          border: "none",
                          background: "transparent",
                          color: isActive ? "#93c5fd" : "#94a3b8",
                          fontSize: 12,
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          overflow: "hidden",
                          outline: "none",
                        }}
                      >
                        <MessageSquareIcon size={13} style={{ opacity: isActive ? 1 : 0.6 }} />
                        <span
                          style={{
                            fontWeight: isActive ? 600 : 400,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {conv.title || "Untitled Chat"}
                        </span>
                      </button>

                      {/* Delete button (shows on hover or active, like ChatGPT) */}
                      {deleteConv && (isHovered || isActive) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConv(conv.id);
                          }}
                          title="Delete chat"
                          style={{
                            padding: "4px 8px",
                            background: "transparent",
                            border: "none",
                            color: "#475569",
                            cursor: "pointer",
                            fontSize: 12,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "color 0.15s",
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#475569"; }}
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Dataset Selector at Bottom ── */}
      <div style={{ padding: 12, borderTop: "1px solid #0d1f35", position: "relative", flexShrink: 0 }}>
        <div
          style={{
            fontSize: 9,
            color: "#475569",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Active Dataset
        </div>
        <button
          onClick={() => setShowDatasetMenu(!showDatasetMenu)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "#0f172a",
            border: "1px solid #1e3a5f",
            borderRadius: 8,
            cursor: "pointer",
            color: "#e2e8f0",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span>{selectedDataset.flag}</span>
          <span
            style={{
              flex: 1,
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {selectedDataset.label}
          </span>
          <span style={{ color: "#64748b", fontSize: 9 }}>▾</span>
        </button>

        {showDatasetMenu && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 4px)",
              left: 12,
              right: 12,
              background: "#0f172a",
              border: "1px solid #1e3a5f",
              borderRadius: 10,
              boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            {DATASETS.map((ds) => (
              <button
                key={ds.id}
                onClick={() => {
                  setSelectedDataset(ds);
                  setShowDatasetMenu(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "9px 14px",
                  background:
                    ds.id === selectedDataset.id
                      ? "rgba(59,130,246,0.1)"
                      : "transparent",
                  border: "none",
                  color: ds.id === selectedDataset.id ? "#60a5fa" : "#94a3b8",
                  fontSize: 12,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{ds.flag}</span>
                <span>{ds.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
