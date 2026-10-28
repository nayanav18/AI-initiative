import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { getBigQueryStatus } from '../services/api';

const DEFAULT_SUGGESTIONS = [
  'Hello',
  'What can you do?',
  'Explain what an analytics assistant does.',
  'Tell me about the data pipeline.',
];

export default function ChatWindow({
  messages = [],
  loading = false,
  error = null,
  sidebarOpen = true,
  onToggleSidebar,
  onSendMessage,
  onDismissError,
  activeConversationId,
}) {
  const messagesEndRef = useRef(null);
  const [bqStatus, setBqStatus] = useState({ state: 'checking', message: '' });

  // Check BigQuery connection status once on mount
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await getBigQueryStatus();
        if (!isMounted) return;
        if (res.connected) {
          setBqStatus({
            state: 'connected',
            message: `BigQuery Connected (${res.dataset || 'Dataset Verified'})`,
          });
        } else {
          setBqStatus({
            state: 'disconnected',
            message: res.message || 'BigQuery Disconnected',
          });
        }
      } catch (err) {
        if (!isMounted) return;
        setBqStatus({
          state: 'disconnected',
          message: 'Connection unavailable',
        });
      }
    }

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-scroll on new message or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="chat-container">
      {/* Header */}
      <header className="chat-header">
        <div className="chat-header-left">
          {!sidebarOpen && (
            <button
              type="button"
              className="btn-sidebar-toggle"
              onClick={onToggleSidebar}
              title="Open Sidebar"
              aria-label="Open Sidebar"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          )}
          <span className="chat-header-title">Enterprise Analytics Assistant</span>
          <span className="chat-header-badge">Step 1 Milestone</span>
        </div>

        {/* BigQuery status badge */}
        <div
          className={`bq-status ${bqStatus.state}`}
          title={bqStatus.message || 'Data connection status'}
        >
          <span className="bq-status-dot" />
          <span>
            {bqStatus.state === 'connected'
              ? 'BigQuery Connected'
              : bqStatus.state === 'checking'
              ? 'Checking BigQuery…'
              : 'BigQuery Offline'}
          </span>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <span className="error-banner-text">⚠️ {error}</span>
          <button
            type="button"
            className="btn-retry"
            onClick={onDismissError}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages or Welcome View */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="welcome-icon">⚡</div>
            <h1 className="welcome-title">Enterprise Analytics AI</h1>
            <p className="welcome-subtitle">
              Your conversational data assistant. Securely explore enterprise metrics,
              query schemas, and get instant answers without writing SQL.
            </p>
            <div className="welcome-suggestions">
              {DEFAULT_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="suggestion-btn"
                  onClick={() => onSendMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="message-row assistant">
                <div className="message-avatar assistant-avatar">✦</div>
                <div className="message-bubble assistant-bubble">
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                    <span className="typing-label">Analyzing request…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSendMessage} disabled={loading} />
    </div>
  );
}
