import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatView from "./components/ChatView";
import InsightsView from "./components/InsightsView";
import DashboardPage from "./pages/DashboardPage";
import BuilderPage from "./components/BuilderPage";
import { useChat } from "./hooks/useChat";
import { DATASETS, uid } from "./utils/helpers";
import { api } from "./utils/api";
export default function App() {
 const [activeNav, setActiveNav]           = useState("chat");
 const [selectedDataset, setSelectedDataset] = useState(DATASETS[0]);
 const [sidebarOpen, setSidebarOpen]       = useState(true);

 // Load saved insights from LocalStorage on mount
 const [savedInsights, setSavedInsights]   = useState(() => {
   const saved = localStorage.getItem("enterprise_saved_insights");
   return saved ? JSON.parse(saved) : [];
 });

 const [prefillQuery, setPrefillQuery]     = useState("");

 // Load dashboard builder items from LocalStorage on mount
 const [analyticsItems, setAnalyticsItems] = useState(() => {
   const saved = localStorage.getItem("enterprise_builder_items");
   return saved ? JSON.parse(saved) : [];
 });

 // Sync savedInsights to LocalStorage whenever it changes
 useEffect(() => {
   localStorage.setItem("enterprise_saved_insights", JSON.stringify(savedInsights));
 }, [savedInsights]);

 // Sync analyticsItems to LocalStorage whenever it changes
 useEffect(() => {
   localStorage.setItem("enterprise_builder_items", JSON.stringify(analyticsItems));
 }, [analyticsItems]);

 const {
   conversations, activeConv, activeConvId,
   messages, loading, agentSteps,
   newChat, openConv, sendMessage, deleteConv,
 } = useChat({ selectedDataset });
 const handleSaveInsight = (msg) => {
   // Capture the structured analytics data (chart JSON) if it exists, 
   // falling back to content if it doesn't.
   const insightData = msg.analytics || msg.content;
   console.log("FULL MSG", msg);
  console.log("INSIGHT DATA", insightData);
  console.log("CHART", insightData?.chart);
   const insight = {
     id: uid(),
     query: msg.query || "Untitled",
     dataset: msg.dataset || selectedDataset.label,
     data: insightData,
     ts: Date.now(),
   };
   setSavedInsights((prev) => [insight, ...prev]);
   api.saveInsight({
     conversation_id: activeConvId,
     query: insight.query,
     analytics: insightData,
     dataset_id: selectedDataset.id,
   }).catch(() => {});
 };
 const handleDeleteInsight = (id) => {
   setSavedInsights((prev) => prev.filter((ins) => ins.id !== id));
   api.deleteInsight(id).catch(() => {});
 };
 const handleAddToBuilder = (insight) => {
  if (!insight.data?.chart) return;

  setAnalyticsItems((prev) => [
    ...prev,
    {
      id: uid(),
      title: insight.query,
      chart: insight.data.chart,
      x: 50,
      y: 50,
      width: 500,
      height: 350,
    },
  ]);

  // Open Builder automatically
  setActiveNav("builder");
};
 const handleSend = (query) => {
   if (!activeConvId) newChat();
   sendMessage(query);
 };
 // Called when user clicks "Ask this" on a dashboard question
 const handleDashboardAsk = (query) => {
   setPrefillQuery(query);
   setActiveNav("chat");
   if (!activeConvId) newChat();
   // Small delay so ChatView has mounted before sending
   setTimeout(() => {
     sendMessage(query);
     setPrefillQuery("");
   }, 100);
 };
 return (
<div style={{
     display: "flex", height: "100vh",
     overflow: "hidden", background: "#060d1a",
   }}>
<style>{`
       @keyframes spin  { to { transform: rotate(360deg); } }
       @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
       * { box-sizing: border-box; }
       input::placeholder { color: #374151; }
       button { transition: all 0.15s; }
     `}</style>
     {/* ── Sidebar ── */}
     <Sidebar
       isOpen={sidebarOpen}
       onToggle={() => setSidebarOpen((prev) => !prev)}
       activeNav={activeNav}
       setActiveNav={(nav) => {
         setActiveNav(nav);
         if (nav === "chat" && !activeConvId && conversations.length > 0) {
           openConv(conversations[0].id);
         }
       }}
       selectedDataset={selectedDataset}
       setSelectedDataset={setSelectedDataset}
       conversations={conversations}
       activeConvId={activeConvId}
       openConv={openConv}
       newChat={newChat}
       deleteConv={deleteConv}
       savedInsightsCount={savedInsights.length}
     />
     {/* ── Floating button to open sidebar when closed on other tabs ── */}
     {!sidebarOpen && activeNav !== "chat" && (
       <button
         onClick={() => setSidebarOpen(true)}
         title="Open sidebar"
         style={{
           position: "fixed",
           top: 10,
           left: 10,
           zIndex: 100,
           background: "#0f172a",
           border: "1px solid #1e3a5f",
           borderRadius: 8,
           padding: "6px 10px",
           color: "#94a3b8",
           cursor: "pointer",
           display: "flex",
           alignItems: "center",
           gap: 6,
           fontSize: 12,
           fontWeight: 500,
           boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
           transition: "all 0.15s",
         }}
         onMouseEnter={(e) => {
           e.currentTarget.style.color = "#f1f5f9";
           e.currentTarget.style.borderColor = "#3b82f6";
         }}
         onMouseLeave={(e) => {
           e.currentTarget.style.color = "#94a3b8";
           e.currentTarget.style.borderColor = "#1e3a5f";
         }}
       >
         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
           <rect x="3" y="3" width="18" height="18" rx="2" />
           <path d="M9 3v18" />
           <path d="M14 9l3 3-3 3" />
         </svg>
         <span>Sidebar</span>
       </button>
     )}
     {/* ── Main content ── */}
     <main style={{
       flex: 1, overflow: "hidden",
       display: "flex", flexDirection: "column",
     }}>
       {/* Chat / History */}
       {(activeNav === "chat" || activeNav === "history") && (
         <ChatView
           messages={messages}
           loading={loading}
           agentSteps={agentSteps}
           activeConv={activeConv}
           selectedDataset={selectedDataset}
           onSend={handleSend}
           onNewChat={newChat}
           onSaveInsight={handleSaveInsight}
           sidebarOpen={sidebarOpen}
           onToggleSidebar={() => setSidebarOpen(true)}
         />
       )}
       {/* Insights */}
       {activeNav === "insights" && (
<div style={{ flex: 1, overflowY: "auto" }}>
<InsightsView
             insights={savedInsights}
             onDelete={handleDeleteInsight}
             onAddToBuilder={handleAddToBuilder}
           />
</div>
)}
    {activeNav === "builder" && (
      <div style={{ flex: 1, overflowY: "auto" }}>
        <BuilderPage 
        analyticsItems={analyticsItems}
        setAnalyticsItems={setAnalyticsItems}
        />
    </div>
    )}
      
       {/* ── Dashboard (persona-based) ── */}
       {activeNav === "dashboards" && (
<div style={{ flex: 1, overflowY: "auto" }}>
<DashboardPage
             onAskQuestion={handleDashboardAsk}
           />
</div>
       )}
</main>
</div>
 );
}