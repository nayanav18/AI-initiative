import React from 'react';

function parseBold(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function formatContent(content) {
  if (!content) return null;

  const rawText = typeof content === 'string' ? content : String(content);
  const lines = rawText.split('\n');
  const result = [];
  let currentBullets = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      result.push(
        <ul key={`ul-${result.length}`} style={{ margin: '6px 0', paddingLeft: '20px' }}>
          {currentBullets.map((item, idx) => (
            <li key={idx} style={{ margin: '2px 0' }}>
              {parseBold(item)}
            </li>
          ))}
        </ul>
      );
      currentBullets = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[*•-]\s+(.*)$/);
    if (bulletMatch) {
      currentBullets.push(bulletMatch[1]);
    } else {
      flushBullets();
      if (trimmed === '') {
        if (result.length > 0 && result[result.length - 1]?.type !== 'div') {
          result.push(<div key={`space-${index}`} style={{ height: '8px' }} />);
        }
      } else {
        result.push(
          <p key={`p-${index}`} style={{ margin: '4px 0', lineHeight: '1.6' }}>
            {parseBold(line)}
          </p>
        );
      }
    }
  });

  flushBullets();
  return result;
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function MessageBubble({ message }) {
  if (!message) return null;
  const isUser = message.role === 'user';
  const time = formatTime(message.created_at);

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`message-avatar ${isUser ? 'user-avatar' : 'assistant-avatar'}`}>
        {isUser ? 'U' : '✦'}
      </div>
      <div>
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {formatContent(message.content)}
        </div>
        {time && (
          <div
            className="message-time"
            style={{ textAlign: isUser ? 'right' : 'left' }}
          >
            {time}
          </div>
        )}
      </div>
    </div>
  );
}
