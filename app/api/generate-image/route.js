import { NextResponse } from "next/server";

const HIGGSFIELD_BASE = "https://platform.higgsfield.ai";
const DEFAULT_MODEL = "higgsfield-ai/soul/standard";
const MAX_POLL_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 2000;

export async function POST(request) {
  const key = process.env.HIGGSFIELD_API_KEY;
  const secret = process.env.HIGGSFIELD_API_SECRET;

  if (!key || !secret) {
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

  const auth = `Key ${key}:${secret}`;
  const modelId = model || DEFAULT_MODEL;

  try {
    // ── Step 1: Submit generation request ──
    const submitResp = await fetch(`${HIGGSFIELD_BASE}/${modelId}`, {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        aspect_ratio: aspect_ratio || "1:1",
        resolution: resolution || "1080p",
      }),
    });

    if (!submitResp.ok) {
      const errText = await submitResp.text();
      console.error(`Higgsfield submit ${submitResp.status}:`, errText);
      return NextResponse.json(
        { error: `Higgsfield API error: ${submitResp.status}` },
        { status: submitResp.status >= 400 && submitResp.status < 600 ? submitResp.status : 502 }
      );
    }

    const submitData = await submitResp.json();

    // If completed immediately
    if (submitData.status === "completed" && submitData.images?.length) {
      return NextResponse.json({
        status: "completed",
        request_id: submitData.request_id,
        images: submitData.images,
        video: submitData.video || null,
      });
    }

    const requestId = submitData.request_id;
    if (!requestId) {
      console.error("Higgsfield missing request_id:", JSON.stringify(submitData));
      return NextResponse.json(
        { error: "Unexpected Higgsfield response — no request_id returned" },
        { status: 502 }
      );
    }

    // ── Step 2: Poll status endpoint ──
    const pollUrl = submitData.status_url || `${HIGGSFIELD_BASE}/requests/${requestId}/status`;

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
          request_id: requestId,
          images: pollData.images || [],
          video: pollData.video || null,
        });
      }

      if (pollData.status === "failed") {
        return NextResponse.json(
          { error: pollData.error || "Image generation failed", request_id: requestId, status: "failed" },
          { status: 500 }
        );
      }

      if (pollData.status === "nsfw") {
        return NextResponse.json(
          { error: "Content was flagged by moderation. Credits refunded.", request_id: requestId, status: "nsfw" },
          { status: 422 }
        );
      }

      // queued or in_progress — keep polling
    }

    // Timed out
    return NextResponse.json(
      { error: "Generation timed out. Try again.", request_id: requestId, status: "timeout" },
      { status: 202 }
    );
  } catch (err) {
    console.error("Higgsfield error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to reach Higgsfield API" },
      { status: 502 }
    );
  }
}
