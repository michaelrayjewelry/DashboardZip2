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

/**
 * Generate an image using the Higgsfield API (Nano Banana model).
 *
 * The actual Higgsfield call happens server-side in /api/generate-image —
 * API credentials never leave the server.
 *
 * @param {object} opts
 * @param {string} opts.prompt - Text description of the image to generate
 * @param {string} [opts.aspectRatio="1:1"] - Aspect ratio (1:1, 16:9, 9:16, 4:3, 3:4)
 * @param {string} [opts.resolution="1080p"] - Resolution (720p or 1080p)
 * @param {string} [opts.model] - Override the default model (nano-banana-2/text-to-image)
 * @returns {Promise<{ status: string, images: Array<{url: string}>, request_id: string }>}
 */
export async function generateImage({ prompt, aspectRatio = "1:1", resolution = "1080p", model } = {}) {
  const resp = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      aspect_ratio: aspectRatio,
      resolution,
      ...(model ? { model } : {}),
    }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error || `Image generation failed (${resp.status})`);
  }

  return data;
}

/**
 * Generate a 3D model from an image using the Meshy API.
 *
 * The actual Meshy call happens server-side in /api/meshy-3d —
 * API credentials never leave the server.
 *
 * @param {object} opts
 * @param {string} opts.imageUrl - Base64 data URI or publicly accessible image URL
 * @param {boolean} [opts.enablePbr=true] - Generate PBR maps (metallic, roughness, normal)
 * @param {string} [opts.topology="triangle"] - Mesh topology
 * @param {number} [opts.targetPolycount=30000] - Target polygon count
 * @returns {Promise<{ status: string, task_id: string, model_urls: object, thumbnail_url: string, texture_urls: Array }>}
 */
export async function generateMeshy3D({ imageUrl, enablePbr = true, topology = "triangle", targetPolycount = 30000 } = {}) {
  const resp = await fetch("/api/meshy-3d", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      enable_pbr: enablePbr,
      topology,
      target_polycount: targetPolycount,
    }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error || `3D generation failed (${resp.status})`);
  }

  return data;
}
