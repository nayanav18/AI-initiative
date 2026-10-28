/**
 * Centralized API service.
 *
 * All backend communication goes through this module.
 * Uses the Vite proxy so no hardcoded backend URLs.
 * Never exposes backend configuration to the frontend.
 */

const API_BASE = '/api';

class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || `Request failed with status ${status}`);
    this.status = status;
    this.code = body?.code || 'UNKNOWN';
    this.body = body;
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Unable to connect to the server. Please check your connection.',
    });
  }

  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = { code: 'PARSE_ERROR', message: response.statusText };
    }
    throw new ApiError(response.status, body?.detail || body);
  }

  return response.json();
}

// ---- Chat ----

export async function sendMessage(message, conversationId = null) {
  const payload = { message };
  if (conversationId) {
    payload.conversation_id = conversationId;
  }
  return request('/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---- Conversations ----

export async function getConversations() {
  return request('/conversations');
}

export async function getConversation(conversationId) {
  return request(`/conversations/${conversationId}`);
}

export async function deleteConversation(conversationId) {
  return request(`/conversations/${conversationId}`, {
    method: 'DELETE',
  });
}

// ---- System ----

export async function getBigQueryStatus() {
  return request('/system/bigquery-status');
}

export async function getHealth() {
  try {
    const res = await fetch('/health');
    return res.json();
  } catch {
    return { status: 'unreachable' };
  }
}
