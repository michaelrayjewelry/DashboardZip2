import { NextResponse } from "next/server";

const HIGGSFIELD_BASE = "https://platform.higgsfield.ai";
const DEFAULT_MODEL = "nano-banana-2/text-to-image";
const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 2000;

function getAuthHeader() {
  const key = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_API_SECRET;
  if (!key || !secret) return null;
  return `Key ${key}:${secret}`;
}

export async function POST(request) {
  const auth = getAuthHeader();
  if (!auth) {
    return NextResponse.json(
      { error: "HIGGSFIELD_API_KEY and HIGGSFIELD_API_SECRET are not configured. Add them in your Vercel project settings → Environment Variables." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, aspect_ratio, resolution, model } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const modelId = model || DEFAULT_MODEL;

  try {
    // 1. Submit generation request
    const submitResp = await fetch(`${HIGGSFIELD_BASE}/${modelId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        aspect_ratio: aspect_ratio || "1:1",
        resolution: resolution || "2K",
      }),
    });

    if (!submitResp.ok) {
      const errText = await submitResp.text();
      console.error(`Higgsfield submit ${submitResp.status}:`, errText);
      return NextResponse.json(
        { error: `Higgsfield API error: ${submitResp.status}` },
        { status: submitResp.status }
      );
    }

    const submitData = await submitResp.json();
    const { request_id, status_url } = submitData;

    if (!request_id) {
      return NextResponse.json({ error: "No request_id returned from Higgsfield" }, { status: 502 });
    }

    // If already completed (unlikely but possible)
    if (submitData.status === "completed" && submitData.images?.length) {
      return NextResponse.json({
        status: "completed",
        request_id,
        images: submitData.images,
      });
    }

    // 2. Poll for completion
    const pollUrl = status_url || `${HIGGSFIELD_BASE}/requests/${request_id}/status`;

    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const pollResp = await fetch(pollUrl, {
        headers: { Authorization: auth },
      });

      if (!pollResp.ok) {
        console.error(`Higgsfield poll ${pollResp.status}`);
        continue;
      }

      const pollData = await pollResp.json();

      if (pollData.status === "completed") {
        return NextResponse.json({
          status: "completed",
          request_id,
          images: pollData.images || [],
          video: pollData.video || null,
        });
      }

      if (pollData.status === "failed") {
        return NextResponse.json(
          { error: "Image generation failed", status: "failed", request_id },
          { status: 500 }
        );
      }

      if (pollData.status === "nsfw") {
        return NextResponse.json(
          { error: "Content was flagged by moderation. Credits refunded.", status: "nsfw", request_id },
          { status: 422 }
        );
      }

      // Still queued or in_progress — keep polling
    }

    // Timed out — return the request_id so client can poll manually
    return NextResponse.json(
      { error: "Generation timed out. Use request_id to check status later.", request_id, status: "timeout" },
      { status: 202 }
    );
  } catch (err) {
    console.error("Higgsfield fetch failed:", err.message);
    return NextResponse.json(
      { error: "Failed to reach Higgsfield API" },
      { status: 502 }
    );
  }
}
