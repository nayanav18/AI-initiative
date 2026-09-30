/**
 * BuilderPage.jsx — Power BI-style Dashboard Builder
 *
 * Features:
 * - Drag & resize widgets on a free-form canvas (react-rnd)
 * - Select a widget to view/edit properties in a side panel
 * - Change chart types dynamically (same data, different visualization)
 * - Toolbar with Add, Delete, Duplicate, Undo/Redo, Grid Snap, Save/Load
 * - Save/Load named dashboards to localStorage
 * - Add widgets from saved insights
 * - Empty state guidance
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import MiniChart from "./MiniChart";
import SmartChart from "./SmartChart";
import BuilderToolbar from "./BuilderToolbar";
import WidgetConfigPanel from "./WidgetConfigPanel";
import ChartTypePicker from "./ChartTypePicker";
import { uid } from "../utils/helpers";

// ── Grid snap size ────────────────────────────────────────────────────────
const GRID_SIZE = 20;

// ── History helpers (undo / redo) ─────────────────────────────────────────
const MAX_HISTORY = 40;

function useHistory(initial) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initial);
  const [future, setFuture] = useState([]);

  const push = useCallback(
    (newState) => {
      setPast((p) => [...p.slice(-MAX_HISTORY), present]);
      setPresent(newState);
      setFuture([]);
    },
    [present]
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    setFuture((f) => [present, ...f]);
    setPresent(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    setPast((p) => [...p, present]);
    setPresent(future[0]);
    setFuture((f) => f.slice(1));
  }, [future, present]);

  // Sync with external source
  const replace = useCallback((newState) => {
    setPresent(newState);
    setPast([]);
    setFuture([]);
  }, []);

  return {
    state: present,
    set: push,
    replace,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

// ── Saved Dashboards key ──────────────────────────────────────────────────
const DASHBOARDS_KEY = "enterprise_saved_dashboards";

function loadSavedDashboards() {
  try {
    const raw = localStorage.getItem(DASHBOARDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistDashboards(list) {
  localStorage.setItem(DASHBOARDS_KEY, JSON.stringify(list));
}

// ── Main Component ────────────────────────────────────────────────────────
export default function BuilderPage({ analyticsItems, setAnalyticsItems }) {
  // History-backed widget state
  const history = useHistory(analyticsItems);

  // Keep parent in sync
  useEffect(() => {
    setAnalyticsItems(history.state);
  }, [history.state, setAnalyticsItems]);

  // Sync from parent when external changes occur (e.g. adding from Insights)
  const prevItemsRef = useRef(analyticsItems);
  useEffect(() => {
    if (analyticsItems !== prevItemsRef.current && analyticsItems !== history.state) {
      history.replace(analyticsItems);
    }
    prevItemsRef.current = analyticsItems;
  }, [analyticsItems, history]);

  // Selection
  const [selectedId, setSelectedId] = useState(null);
  const selectedWidget = history.state.find((w) => w.id === selectedId) || null;

  // UI toggles
  const [gridEnabled, setGridEnabled] = useState(true);
  const [dashboardTitle, setDashboardTitle] = useState("Untitled Dashboard");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [chartPickerWidgetId, setChartPickerWidgetId] = useState(null);
  const [chartPickerPos, setChartPickerPos] = useState({ x: 0, y: 0 });

  // Canvas ref for click-outside deselection
  const canvasRef = useRef(null);

  // Saved dashboards
  const [savedDashboards, setSavedDashboards] = useState(loadSavedDashboards);

  const items = history.state;

  // ── Widget CRUD ─────────────────────────────────────────────────────────
  const updateWidget = useCallback(
    (widgetId, updates) => {
      history.set(
        items.map((w) => (w.id === widgetId ? { ...w, ...updates } : w))
      );
    },
    [items, history]
  );

  const deleteWidget = useCallback(
    (widgetId) => {
      history.set(items.filter((w) => w.id !== widgetId));
      if (selectedId === widgetId) setSelectedId(null);
    },
    [items, history, selectedId]
  );

  const duplicateWidget = useCallback(
    (widgetId) => {
      const src = items.find((w) => w.id === widgetId);
      if (!src) return;
      const newWidget = {
        ...src,
        id: uid(),
        x: src.x + 30,
        y: src.y + 30,
        title: src.title + " (copy)",
      };
      history.set([...items, newWidget]);
      setSelectedId(newWidget.id);
    },
    [items, history]
  );

  const clearAll = useCallback(() => {
    if (items.length === 0) return;
    history.set([]);
    setSelectedId(null);
  }, [items, history]);

  // ── Chart type change ───────────────────────────────────────────────────
  const changeChartType = useCallback(
    (widgetId, newType) => {
      history.set(
        items.map((w) =>
          w.id === widgetId
            ? { ...w, chart: { ...w.chart, type: newType } }
            : w
        )
      );
      setChartPickerWidgetId(null);
    },
    [items, history]
  );

  // ── Save / Load ─────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  const confirmSave = useCallback(
    (name) => {
      const dashboard = {
        id: uid(),
        name: name || dashboardTitle,
        items: items,
        savedAt: Date.now(),
      };
      const updated = [dashboard, ...savedDashboards.filter((d) => d.name !== name)];
      setSavedDashboards(updated);
      persistDashboards(updated);
      setDashboardTitle(name || dashboardTitle);
      setShowSaveDialog(false);
    },
    [items, savedDashboards, dashboardTitle]
  );

  const handleLoad = useCallback(() => {
    setShowLoadDialog(true);
  }, []);

  const confirmLoad = useCallback(
    (dashboard) => {
      history.replace(dashboard.items);
      setDashboardTitle(dashboard.name);
      setSelectedId(null);
      setShowLoadDialog(false);
    },
    [history]
  );

  const deleteSavedDashboard = useCallback(
    (dashboardId) => {
      const updated = savedDashboards.filter((d) => d.id !== dashboardId);
      setSavedDashboards(updated);
      persistDashboards(updated);
    },
    [savedDashboards]
  );

  // ── Canvas click to deselect ────────────────────────────────────────────
  const handleCanvasClick = useCallback(
    (e) => {
      if (e.target === canvasRef.current) {
        setSelectedId(null);
        setChartPickerWidgetId(null);
      }
    },
    []
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Delete" && selectedId) {
        deleteWidget(selectedId);
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setChartPickerWidgetId(null);
        setShowSaveDialog(false);
        setShowLoadDialog(false);
        setShowAddPanel(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        history.redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedId) {
        e.preventDefault();
        duplicateWidget(selectedId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, deleteWidget, duplicateWidget, history]);

  // ── Render ──────────────────────────────────────────────────────────────
  const panelOpen = selectedWidget !== null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#060d1a",
        overflow: "hidden",
      }}
    >
      {/* ── Toolbar ── */}
      <BuilderToolbar
        dashboardTitle={dashboardTitle}
        onTitleChange={setDashboardTitle}
        onAddWidget={() => setShowAddPanel(true)}
        onDeleteSelected={() => selectedId && deleteWidget(selectedId)}
        onDuplicateSelected={() => selectedId && duplicateWidget(selectedId)}
        onSave={handleSave}
        onLoad={handleLoad}
        onClearAll={clearAll}
        onToggleGrid={() => setGridEnabled((g) => !g)}
        gridEnabled={gridEnabled}
        hasSelection={!!selectedId}
        widgetCount={items.length}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />

      {/* ── Main area: canvas + config panel ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* ── Canvas ── */}
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            flex: 1,
            position: "relative",
            overflow: "auto",
            background: gridEnabled
              ? `
                repeating-linear-gradient(0deg, transparent, transparent ${GRID_SIZE - 1}px, rgba(30,58,95,0.15) ${GRID_SIZE - 1}px, rgba(30,58,95,0.15) ${GRID_SIZE}px),
                repeating-linear-gradient(90deg, transparent, transparent ${GRID_SIZE - 1}px, rgba(30,58,95,0.15) ${GRID_SIZE - 1}px, rgba(30,58,95,0.15) ${GRID_SIZE}px)
              `
              : "none",
            backgroundColor: "#0a0f1c",
            minHeight: "100%",
          }}
        >
          {/* ── Empty state ── */}
          {items.length === 0 && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "#475569",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4, color: "#3b82f6" }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" opacity="0.2" />
                  <rect x="10" y="6" width="4" height="15" rx="1" fill="currentColor" opacity="0.35" />
                  <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" opacity="0.5" />
                </svg>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                Dashboard Builder
              </div>
              <div style={{ fontSize: 13, color: "#475569", maxWidth: 340 }}>
                Add widgets from your Saved Insights, or ask questions in Chat
                and save insights to build your dashboard here.
              </div>
              <div
                style={{
                  marginTop: 20,
                  fontSize: 12,
                  color: "#3b82f6",
                  opacity: 0.7,
                }}
              >
                Click <strong>+ Add Widget</strong> in the toolbar to get
                started
              </div>
            </div>
          )}

          {/* ── Widget cards ── */}
          {items.map((item, index) => {
            const isSelected = item.id === selectedId;
            return (
              <Rnd
                key={item.id}
                size={{ width: item.width || 480, height: item.height || 340 }}
                position={{ x: item.x || 50, y: item.y || 50 }}
                bounds="parent"
                dragGrid={gridEnabled ? [GRID_SIZE, GRID_SIZE] : undefined}
                resizeGrid={gridEnabled ? [GRID_SIZE, GRID_SIZE] : undefined}
                minWidth={240}
                minHeight={180}
                onDragStop={(e, d) => {
                  updateWidget(item.id, { x: d.x, y: d.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  updateWidget(item.id, {
                    width: parseInt(ref.style.width, 10),
                    height: parseInt(ref.style.height, 10),
                    x: position.x,
                    y: position.y,
                  });
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(item.id);
                  setChartPickerWidgetId(null);
                }}
                style={{ zIndex: isSelected ? 10 : 1 }}
              >
                <div
                  style={{
                    background: "#0f172a",
                    border: `2px solid ${isSelected ? "#3b82f6" : "#1e3a5f"}`,
                    borderRadius: 12,
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    boxShadow: isSelected
                      ? "0 0 0 1px rgba(59,130,246,0.3), 0 8px 32px rgba(0,0,0,0.4)"
                      : "0 2px 8px rgba(0,0,0,0.3)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    cursor: "grab",
                  }}
                >
                  {/* ── Widget header ── */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderBottom: "1px solid #1e3a5f",
                      flexShrink: 0,
                      background: isSelected
                        ? "rgba(59,130,246,0.05)"
                        : "transparent",
                    }}
                  >
                    {/* Title */}
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: isSelected ? "#93c5fd" : "#94a3b8",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {item.title || "Untitled Widget"}
                    </div>

                    {/* Chart type badge (clickable to change) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setChartPickerWidgetId(
                          chartPickerWidgetId === item.id ? null : item.id
                        );
                        setChartPickerPos({ x: rect.left, y: rect.bottom + 4 });
                      }}
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#64748b",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid #253650",
                        borderRadius: 6,
                        padding: "2px 8px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                        marginLeft: 8,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#3b82f6";
                        e.currentTarget.style.color = "#93c5fd";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#253650";
                        e.currentTarget.style.color = "#64748b";
                      }}
                      title="Change chart type"
                    >
                      {item.chart?.type || "bar"}
                      <span style={{ fontSize: 8 }}>▾</span>
                    </button>

                    {/* Quick delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWidget(item.id);
                      }}
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "0 4px",
                        marginLeft: 6,
                        flexShrink: 0,
                        lineHeight: 1,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#374151";
                      }}
                      title="Remove widget"
                    >
                      ✕
                    </button>
                  </div>

                  {/* ── Chart content ── */}
                  <div
                    style={{
                      flex: 1,
                      padding: 12,
                      minHeight: 0,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      {item.chart ? (
                        <SmartChart
                          chart={item.chart}
                          compact
                        />
                      ) : (
                        <div
                          style={{
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#374151",
                            fontSize: 12,
                          }}
                        >
                          No chart data
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Rnd>
            );
          })}
        </div>

        {/* ── Widget Config Panel ── */}
        {panelOpen && (
          <WidgetConfigPanel
            widget={selectedWidget}
            onUpdate={updateWidget}
            onClose={() => setSelectedId(null)}
            onDelete={deleteWidget}
            onDuplicate={duplicateWidget}
          />
        )}
      </div>

      {/* ── Chart Type Picker popup ── */}
      {chartPickerWidgetId && (
        <ChartTypePicker
          currentType={
            items.find((w) => w.id === chartPickerWidgetId)?.chart?.type || "bar"
          }
          onSelect={(type) => changeChartType(chartPickerWidgetId, type)}
          onClose={() => setChartPickerWidgetId(null)}
          position={chartPickerPos}
        />
      )}

      {/* ── Save Dialog ── */}
      {showSaveDialog && (
        <SaveDialog
          initialName={dashboardTitle}
          onSave={confirmSave}
          onClose={() => setShowSaveDialog(false)}
        />
      )}

      {/* ── Load Dialog ── */}
      {showLoadDialog && (
        <LoadDialog
          dashboards={savedDashboards}
          onLoad={confirmLoad}
          onDelete={deleteSavedDashboard}
          onClose={() => setShowLoadDialog(false)}
        />
      )}

      {/* ── Add Widget Panel ── */}
      {showAddPanel && (
        <AddWidgetPanel
          onClose={() => setShowAddPanel(false)}
          onAddBlank={(chartType) => {
            const newWidget = {
              id: uid(),
              title: `New ${chartType} widget`,
              chart: {
                type: chartType,
                title: `New ${chartType} chart`,
                data: [
                  { label: "Sample A", value: 40 },
                  { label: "Sample B", value: 65 },
                  { label: "Sample C", value: 30 },
                  { label: "Sample D", value: 55 },
                  { label: "Sample E", value: 45 },
                ],
              },
              x: 60 + items.length * 20,
              y: 60 + items.length * 20,
              width: 480,
              height: 340,
            };
            history.set([...items, newWidget]);
            setSelectedId(newWidget.id);
            setShowAddPanel(false);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Save Dialog ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
function SaveDialog({ initialName, onSave, onClose }) {
  const [name, setName] = useState(initialName || "");
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111827",
          border: "1px solid #1e3a5f",
          borderRadius: 16,
          padding: 24,
          width: 380,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 16,
          }}
        >
          💾 Save Dashboard
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
          placeholder="Dashboard name..."
          autoFocus
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "#0f172a",
            border: "1px solid #1e3a5f",
            borderRadius: 10,
            color: "#f1f5f9",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #1e3a5f",
              background: "transparent",
              color: "#64748b",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: name.trim()
                ? "linear-gradient(135deg,#1d4ed8,#7c3aed)"
                : "#1e293b",
              color: name.trim() ? "#fff" : "#374151",
              fontSize: 12,
              fontWeight: 600,
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Load Dialog ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
function LoadDialog({ dashboards, onLoad, onDelete, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111827",
          border: "1px solid #1e3a5f",
          borderRadius: 16,
          padding: 24,
          width: 440,
          maxHeight: "70vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 16,
          }}
        >
          📂 Load Dashboard
        </div>

        {dashboards.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#475569",
              padding: "32px 0",
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            No saved dashboards yet
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {dashboards.map((d) => (
              <div
                key={d.id}
                style={{
                  background: "#0f172a",
                  border: "1px solid #1e3a5f",
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onClick={() => onLoad(d)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.background = "rgba(59,130,246,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e3a5f";
                  e.currentTarget.style.background = "#0f172a";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#e2e8f0",
                      marginBottom: 3,
                    }}
                  >
                    {d.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569" }}>
                    {d.items.length} widget{d.items.length !== 1 ? "s" : ""} ·{" "}
                    {new Date(d.savedAt).toLocaleDateString()}{" "}
                    {new Date(d.savedAt).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(d.id);
                  }}
                  style={{
                    fontSize: 12,
                    color: "#374151",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 6px",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#374151";
                  }}
                  title="Delete saved dashboard"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #1e3a5f",
              background: "transparent",
              color: "#64748b",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Add Widget Panel ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
const CHART_SVGS = {
  bar: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="12" width="4" height="9" rx="1" opacity="0.3" /><rect x="10" y="6" width="4" height="15" rx="1" opacity="0.5" /><rect x="17" y="3" width="4" height="18" rx="1" opacity="0.7" /></svg>,
  line: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 18 8 12 13 15 21 5" /><circle cx="8" cy="12" r="1.5" fill="currentColor" /><circle cx="21" cy="5" r="1.5" fill="currentColor" /></svg>,
  area: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 20 L3 18 L8 12 L13 15 L21 5 L21 20 Z" fill="currentColor" opacity="0.15" /><polyline points="3 18 8 12 13 15 21 5" /></svg>,
  donut: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="8" opacity="0.3" /><path d="M12 4 A8 8 0 0 1 20 12" /></svg>,
  waterfall: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="5" width="3" height="7" rx="0.5" opacity="0.5" /><rect x="7" y="9" width="3" height="5" rx="0.5" opacity="0.3" /><rect x="12" y="7" width="3" height="3" rx="0.5" opacity="0.5" /><rect x="17" y="3" width="3" height="13" rx="0.5" opacity="0.7" /></svg>,
  funnel: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4 L21 4 L16 10 L16 18 L8 18 L8 10 Z" fill="currentColor" opacity="0.15" /></svg>,
  stacked_bar: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="10" width="4" height="5" opacity="0.3" /><rect x="3" y="15" width="4" height="6" opacity="0.6" /><rect x="10" y="5" width="4" height="7" opacity="0.3" /><rect x="10" y="12" width="4" height="9" opacity="0.6" /><rect x="17" y="3" width="4" height="9" opacity="0.3" /><rect x="17" y="12" width="4" height="9" opacity="0.6" /></svg>,
  kpi_card: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" opacity="0.3" /><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.6" /><line x1="12" y1="3" x2="12" y2="6" /></svg>,
};

const BLANK_CHART_TYPES = [
  { type: "bar", label: "Bar Chart" },
  { type: "line", label: "Line Chart" },
  { type: "area", label: "Area Chart" },
  { type: "donut", label: "Donut Chart" },
  { type: "waterfall", label: "Waterfall" },
  { type: "funnel", label: "Funnel" },
  { type: "stacked_bar", label: "Stacked Bar" },
  { type: "kpi_card", label: "KPI Card" },
];

function AddWidgetPanel({ onClose, onAddBlank }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111827",
          border: "1px solid #1e3a5f",
          borderRadius: 16,
          padding: 24,
          width: 440,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 6,
          }}
        >
          ➕ Add Widget
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            marginBottom: 18,
          }}
        >
          Choose a chart type to add a new widget with sample data. You can also
          add widgets from <strong style={{ color: "#60a5fa" }}>Saved Insights</strong>.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {BLANK_CHART_TYPES.map((ct) => (
            <button
              key={ct.type}
              onClick={() => onAddBlank(ct.type)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                background: "#0f172a",
                border: "1px solid #1e3a5f",
                borderRadius: 10,
                color: "#e2e8f0",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#3b82f6";
                e.currentTarget.style.background = "rgba(59,130,246,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1e3a5f";
                e.currentTarget.style.background = "#0f172a";
              }}
            >
              <span style={{ color: "#64748b" }}>{CHART_SVGS[ct.type] || ct.type}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{ct.label}</div>
              </div>
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #1e3a5f",
              background: "transparent",
              color: "#64748b",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
