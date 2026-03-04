import { NextResponse } from "next/server";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured. Add it in your Vercel project settings → Environment Variables." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { system, messages, max_tokens, model } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  try {
    const resp = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || DEFAULT_MODEL,
        max_tokens: max_tokens || 1000,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error(`Anthropic API ${resp.status}:`, errorText);
      return NextResponse.json(
        { error: `Anthropic API error: ${resp.status}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Anthropic fetch failed:", err.message);
    return NextResponse.json(
      { error: "Failed to reach Anthropic API" },
      { status: 502 }
    );
  }
}
