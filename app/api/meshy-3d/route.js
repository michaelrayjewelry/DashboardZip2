import { NextResponse } from "next/server";

const MESHY_BASE = "https://api.meshy.ai/openapi/v1";
const MAX_POLL_ATTEMPTS = 120; // ~10 minutes at 5s intervals
const POLL_INTERVAL_MS = 5000;

export async function POST(request) {
  const apiKey = process.env.MESHY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "MESHY_API_KEY is not configured. Add it to your environment variables." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image_url, enable_pbr = true, topology = "triangle", target_polycount = 30000 } = body;

  if (!image_url || typeof image_url !== "string") {
    return NextResponse.json({ error: "image_url is required" }, { status: 400 });
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    // ── Step 1: Create Image-to-3D task ──
    const createResp = await fetch(`${MESHY_BASE}/image-to-3d`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        image_url,
        enable_pbr,
        should_remesh: true,
        topology,
        target_polycount,
      }),
    });

    if (!createResp.ok) {
      const errText = await createResp.text();
      console.error(`Meshy create task ${createResp.status}:`, errText);
      return NextResponse.json(
        { error: `Meshy API error: ${createResp.status} — ${errText}` },
        { status: createResp.status >= 400 && createResp.status < 600 ? createResp.status : 502 }
      );
    }

    const createData = await createResp.json();
    const taskId = createData.result;

    if (!taskId) {
      console.error("Meshy missing task ID:", JSON.stringify(createData));
      return NextResponse.json(
        { error: "Unexpected Meshy response — no task ID returned" },
        { status: 502 }
      );
    }

    // ── Step 2: Poll task status ──
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const pollResp = await fetch(`${MESHY_BASE}/image-to-3d/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!pollResp.ok) {
        console.error(`Meshy poll ${pollResp.status}`);
        continue;
      }

      const task = await pollResp.json();

      if (task.status === "SUCCEEDED") {
        return NextResponse.json({
          status: "SUCCEEDED",
          task_id: taskId,
          model_urls: task.model_urls || {},
          thumbnail_url: task.thumbnail_url || null,
          texture_urls: task.texture_urls || [],
          progress: 100,
        });
      }

      if (task.status === "FAILED") {
        return NextResponse.json(
          {
            error: task.task_error?.message || "3D generation failed",
            task_id: taskId,
            status: "FAILED",
          },
          { status: 500 }
        );
      }

      // PENDING or IN_PROGRESS — keep polling
    }

    // Timed out
    return NextResponse.json(
      { error: "3D generation timed out. The task may still be processing — try retrieving it later.", task_id: taskId, status: "TIMEOUT" },
      { status: 202 }
    );
  } catch (err) {
    console.error("Meshy error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to reach Meshy API" },
      { status: 502 }
    );
  }
}
