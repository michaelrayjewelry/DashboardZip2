import { NextResponse } from "next/server";

const DEFAULT_MODEL = "nano-banana-2/text-to-image";

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

  try {
    // Use the official SDK (handles auth, User-Agent, polling, and retries)
    const { higgsfield, config } = await import("@higgsfield/client/v2");

    config({ credentials: `${key}:${secret}` });

    const modelId = model || DEFAULT_MODEL;
    const result = await higgsfield.subscribe(modelId, {
      input: {
        prompt: prompt.trim(),
        aspect_ratio: aspect_ratio || "1:1",
        resolution: resolution || "2K",
      },
      withPolling: true,
    });

    if (result.status === "nsfw") {
      return NextResponse.json(
        { error: "Content was flagged by moderation. Credits refunded.", status: "nsfw", request_id: result.request_id },
        { status: 422 }
      );
    }

    if (result.status === "failed") {
      return NextResponse.json(
        { error: "Image generation failed", status: "failed", request_id: result.request_id },
        { status: 500 }
      );
    }

    if (result.status === "completed") {
      return NextResponse.json({
        status: "completed",
        request_id: result.request_id,
        images: result.images || [],
        video: result.video || null,
      });
    }

    // Unexpected status — return what we have
    return NextResponse.json(
      { error: "Generation did not complete.", request_id: result.request_id, status: result.status },
      { status: 202 }
    );
  } catch (err) {
    console.error("Higgsfield error:", err.message);

    // Surface specific SDK error types
    const status = err.statusCode || err.status || 502;
    return NextResponse.json(
      { error: err.message || "Failed to reach Higgsfield API" },
      { status: Math.min(status, 599) }
    );
  }
}
