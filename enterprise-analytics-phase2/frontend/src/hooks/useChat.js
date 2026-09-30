import { useState, useCallback } from "react";
import { api } from "../utils/api";
import { uid, AGENT_PIPELINE } from "../utils/helpers";

/**
 * useChat — manages all conversation state and agent pipeline animation.
 *
 * The backend runs agents server-side; the frontend animates the pipeline
 * optimistically while the API call is in flight.
 */
export function useChat({ selectedDataset }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState({});

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConv?.messages || [];

  // Animate agent steps optimistically
  const animatePipeline = useCallback(async () => {
    const steps = {};
    for (let i = 0; i < AGENT_PIPELINE.length; i++) {
      const agent = AGENT_PIPELINE[i];
      steps[agent.id] = "running";
      setAgentSteps({ ...steps });
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
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

      let convId = overrideConvId || activeConvId;
      if (!convId) {
        convId = uid();
        setConversations((prev) => [
          { id: convId, title: query.slice(0, 42), messages: [], ts: Date.now(), dataset: selectedDataset },
          ...prev,
        ]);
        setActiveConvId(convId);
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId && c.title === "New Chat" ? { ...c, title: query.slice(0, 42) } : c
          )
        );
      }

      const userMsg = { role: "user", content: query, ts: Date.now() };
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c))
      );

      setLoading(true);
      setAgentSteps({});

      // Get history for this conversation
      const currentConv = conversations.find((c) => c.id === convId);
      const history = (currentConv?.messages || []).map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : query,
      }));

      const [, result] = await Promise.all([
        animatePipeline(),
        api
          .chat({
            query,
            dataset_id: selectedDataset.id,
            conversation_id: convId,
            history,
          })
          .catch((err) => ({ error: err.message })),
      ]);

      setAgentSteps({});
      setLoading(false);

      const isStructured = !result.error && result.what_happened;
      const assistantMsg = {
        role: "assistant",
        content: isStructured ? result : result.error || "An error occurred.",
        isStructured,
        dataset: selectedDataset.label,
        ts: Date.now(),
        query,
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
  };
}
