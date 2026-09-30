import { useState, useCallback, useEffect } from "react";
import { api } from "../utils/api";
import { uid, AGENT_PIPELINE } from "../utils/helpers";
import {
  isConversationalQuery,
  getConversationalReply,
  isChartRequested,
  generateLocalAnalytics,
} from "../utils/conversationEngine";

const CONVERSATIONS_STORAGE_KEY = "enterprise_chat_conversations";

function loadSavedConversations() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * useChat — manages conversation state with localStorage persistence,
 * chronological grouping support, deletion, conversational gating,
 * on-demand chart rendering, and offline local fallback.
 */
export function useChat({ selectedDataset }) {
  const [conversations, setConversations] = useState(loadSavedConversations);
  const [activeConvId, setActiveConvId] = useState(() => {
    const saved = loadSavedConversations();
    return saved.length > 0 ? saved[0].id : null;
  });
  const [loading, setLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState({});

  // Sync conversations to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.warn("Failed to persist conversations:", e);
    }
  }, [conversations]);

  const deleteConv = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveConvId((curr) => {
      if (curr === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return curr;
    });
  }, [conversations]);

  const clearAllConvs = useCallback(() => {
    setConversations([]);
    setActiveConvId(null);
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConv?.messages || [];

  // Animate agent steps optimistically (only for analysis queries)
  const animatePipeline = useCallback(async () => {
    const steps = {};
    for (let i = 0; i < AGENT_PIPELINE.length; i++) {
      const agent = AGENT_PIPELINE[i];
      steps[agent.id] = "running";
      setAgentSteps({ ...steps });
      await new Promise((r) => setTimeout(r, 250 + Math.random() * 200));
      steps[agent.id] = "done";
      setAgentSteps({ ...steps });
    }
  }, []);

  const newChat = useCallback(() => {
    const id = uid();
    setConversations((prev) => [
      { id, title: "New Chat", messages: [], ts: Date.now(), dataset: selectedDataset },
      ...prev,
    ]);
    setActiveConvId(id);
    setAgentSteps({});
    return id;
  }, [selectedDataset]);

  const openConv = useCallback((id) => {
    setActiveConvId(id);
    setAgentSteps({});
  }, []);

  const sendMessage = useCallback(
    async (query, overrideConvId) => {
      if (!query.trim() || loading) return;

      const trimmedQuery = query.trim();

      let convId = overrideConvId || activeConvId;
      if (!convId) {
        convId = uid();
        setConversations((prev) => [
          { id: convId, title: trimmedQuery.slice(0, 42), messages: [], ts: Date.now(), dataset: selectedDataset },
          ...prev,
        ]);
        setActiveConvId(convId);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId && c.title === "New Chat" ? { ...c, title: trimmedQuery.slice(0, 42) } : c
          )
        );
      }

      // Add user message
      const userMsg = { role: "user", content: trimmedQuery, ts: Date.now() };
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c))
      );

      // ── 1. Check for Conversational Query (greetings, hi, hello, help) ──
      if (isConversationalQuery(trimmedQuery)) {
        setLoading(true);
        // Small natural typing delay without firing the 4-agent analytics pipeline
        await new Promise((r) => setTimeout(r, 200));
        const conversationalText = getConversationalReply(trimmedQuery, selectedDataset.label);

        const assistantMsg = {
          role: "assistant",
          content: conversationalText,
          isConversational: true,
          isStructured: false,
          dataset: selectedDataset.label,
          ts: Date.now(),
          query: trimmedQuery,
          agentSteps: [],
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c
          )
        );
        setLoading(false);
        return;
      }

      // ── 2. Analysis Query ──
      setLoading(true);
      setAgentSteps({});

      const wantsChart = isChartRequested(trimmedQuery);

      // Get history for context
      const currentConv = conversations.find((c) => c.id === convId);
      const history = (currentConv?.messages || []).map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : trimmedQuery,
      }));

      let result = null;

      try {
        const [, apiResult] = await Promise.all([
          animatePipeline(),
          api
            .chat({
              query: trimmedQuery,
              dataset_id: selectedDataset.id,
              conversation_id: convId,
              history,
            })
            .catch((err) => ({ error: err.message })),
        ]);

        // If backend returned a valid result
        if (apiResult && !apiResult.error && (apiResult.what_happened || apiResult.reply || apiResult.is_conversational)) {
          // If backend identified it as conversational
          if (apiResult.is_conversational) {
            result = {
              isConversational: true,
              reply: apiResult.reply || apiResult.response,
            };
          } else {
            result = apiResult;
            // Respect chart gating: if user did NOT ask for a chart, strip out the chart
            if (!wantsChart && result.chart) {
              result.chart = null;
            }
          }
        } else {
          // Backend offline or error (e.g. testing on laptop without backend running)
          // Fall back gracefully to our accurate domain analytics engine!
          console.info("Using local analytics engine fallback for local testing");
          result = generateLocalAnalytics(trimmedQuery, selectedDataset);
        }
      } catch (err) {
        console.warn("Backend unavailable, using local analytics engine:", err);
        result = generateLocalAnalytics(trimmedQuery, selectedDataset);
      }

      setAgentSteps({});
      setLoading(false);

      if (result.isConversational) {
        const assistantMsg = {
          role: "assistant",
          content: result.reply,
          isConversational: true,
          isStructured: false,
          dataset: selectedDataset.label,
          ts: Date.now(),
          query: trimmedQuery,
          agentSteps: [],
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c
          )
        );
        return;
      }

      const isStructured = !result.error && Boolean(result.what_happened);
      const assistantMsg = {
        role: "assistant",
        content: isStructured ? result : result.error || "An error occurred.",
        isStructured,
        dataset: selectedDataset.label,
        ts: Date.now(),
        query: trimmedQuery,
        agentSteps: result.agent_steps || [],
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c
        )
      );
    },
    [loading, activeConvId, conversations, selectedDataset, animatePipeline]
  );

  return {
    conversations,
    activeConv,
    activeConvId,
    messages,
    loading,
    agentSteps,
    newChat,
    openConv,
    sendMessage,
    deleteConv,
    clearAllConvs,
  };
}
