import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import * as api from './services/api';

const SESSION_KEY = 'eai_active_conv';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(
    () => sessionStorage.getItem(SESSION_KEY) || null
  );
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sendingRef = useRef(false);

  // Persist active conversation ID
  useEffect(() => {
    if (activeConversationId) {
      sessionStorage.setItem(SESSION_KEY, activeConversationId);
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [activeConversationId]);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations');
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getConversation(activeConversationId);
        if (!cancelled) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        if (!cancelled) {
          if (err.status === 404) {
            setActiveConversationId(null);
            setMessages([]);
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [activeConversationId]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }, []);

  const handleSelectConversation = useCallback((id) => {
    setActiveConversationId(id);
    setError(null);
  }, []);

  const handleDeleteConversation = useCallback(async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      setError('Failed to delete conversation.');
    }
  }, [activeConversationId]);

  const handleSendMessage = useCallback(async (text) => {
    if (sendingRef.current || !text.trim()) return;
    sendingRef.current = true;
    setError(null);

    // Optimistic: add user message immediately
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const data = await api.sendMessage(text, activeConversationId);

      // If this was a new conversation, set the ID
      if (!activeConversationId && data.conversation_id) {
        setActiveConversationId(data.conversation_id);
      }

      // Replace temp message and add assistant response
      const assistantMsg = {
        id: data.message_id || 'resp-' + Date.now(),
        role: 'assistant',
        content: data.reply,
        intent: data.intent,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => {
        // Remove temp msg, add real user + assistant
        const withoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
        return [
          ...withoutTemp,
          { ...tempUserMsg, id: 'user-' + Date.now(), conversation_id: data.conversation_id },
          assistantMsg,
        ];
      });

      // Refresh conversation list
      await loadConversations();
    } catch (err) {
      setError(err.message || 'Failed to send message. Please try again.');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
      sendingRef.current = false;
    }
  }, [activeConversationId, loadConversations]);

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(prev => !prev)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
      />
      <main className="app-main">
        <ChatWindow
          messages={messages}
          loading={loading}
          error={error}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onSendMessage={handleSendMessage}
          onDismissError={() => setError(null)}
          activeConversationId={activeConversationId}
        />
      </main>
    </div>
  );
}
