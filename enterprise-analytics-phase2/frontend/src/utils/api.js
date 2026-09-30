/**
 * API client — calls the FastAPI backend.
 * Falls back to the Anthropic API directly if VITE_API_URL is not set
 * (useful for rapid prototyping without a backend).
 */

const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json();
}

export const api = {
  chat: (body) =>
    request("/api/v1/chat", { method: "POST", body: JSON.stringify(body) }),

  listDatasets: () =>
    request("/api/v1/datasets"),

  listInsights: () =>
    request("/api/v1/insights"),

  saveInsight: (body) =>
    request("/api/v1/insights", { method: "POST", body: JSON.stringify(body) }),

  deleteInsight: (id) =>
    request(`/api/v1/insights/${id}`, { method: "DELETE" }),
};
