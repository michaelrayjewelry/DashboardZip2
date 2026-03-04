/**
 * Centralized API client for all AI tool interactions.
 *
 * Every component that needs Claude goes through this single module.
 * The actual Anthropic call happens server-side in /api/chat — the
 * API key never leaves the server.
 */

export async function chatWithClaude({ system, messages, maxTokens = 1000 }) {
  const resp = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || `API error ${resp.status}`);
  }

  const data = await resp.json();
  // Anthropic returns { content: [{ type: "text", text: "..." }] }
  const raw = data.content?.map((b) => b.text || "").join("") || "";
  return raw;
}

/**
 * Send a message and parse a JSON response from Claude.
 * Falls back gracefully if the model doesn't return valid JSON.
 */
export async function chatWithClaudeJSON({ system, messages, maxTokens = 1000, fallback = {} }) {
  const raw = await chatWithClaude({ system, messages, maxTokens });
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { message: raw, ...fallback };
  }
}
