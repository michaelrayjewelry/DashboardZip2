import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════
// DESIGN SYSTEM
// ═══════════════════════════════════════
const C = {
  sidebarBg: "#2E2E2A", sidebarText: "#A8A89C", sidebarActive: "#C8D8A0", sidebarActiveBg: "rgba(200,216,160,0.1)",
  bg: "#F2F1EF", section: "#F7F6F4", white: "#FFFFFF",
  black: "#1A1A18", dark: "#333330", mid: "#6E6E68", light: "#9E9E96", label: "#8A8A82",
  border: "#E6E5E2", borderInput: "#D4D3CF", borderHover: "#B8B7B2",
  coral: "#E66B6B", coralHover: "#D45A5A",
  green: "#5A8A4A", greenBg: "rgba(90,138,74,0.06)", greenBorder: "rgba(90,138,74,0.18)",
  blue: "#4A78A8", blueBg: "rgba(74,120,168,0.06)", blueBorder: "rgba(74,120,168,0.18)",
  amber: "#C89E3A", amberBg: "rgba(200,158,58,0.06)", amberBorder: "rgba(200,158,58,0.18)",
  purple: "#7A6BA8", purpleBg: "rgba(122,107,168,0.06)", purpleBorder: "rgba(122,107,168,0.18)",
  red: "#C44A4A", redBg: "rgba(196,74,74,0.06)", redBorder: "rgba(196,74,74,0.18)",
};
const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'DM Sans', 'Helvetica Neue', sans-serif";
const MONO = "'DM Mono', monospace";
const R = 8, RS = 6;

// ═══════════════════════════════════════
// PROJECT DATA
// ═══════════════════════════════════════
const DEFAULT_PROJECT = {
  id: "PRJ-2026-0041",
  name: "Crown of Thorns Ring",
  collection: "Mythos Line",
  status: "in-progress",
  stage: "cad",
  sku: "MTH-RNG-001",
  created: "Feb 23, 2026",
  updated: "Mar 3, 2026",
  client: { name: "Lord Augm3nt", email: "augm3ntllc@gmail.com", phone: "—", created: "Feb 23, 2026, 12:36 PM" },
  specs: {
    type: "Ring", name: "Crown of Thorns",
    description: "Crown of thorns design, literal depiction, literal thorn depiction, stylized thorn motif, detailed thorns, sharp thorns, crown of thorns, 14k yellow gold",
    metal: "Yellow Gold", metalKarat: "14k", finish: "High Polish", plating: "None",
    mainGemstone: "", gemstoneShape: "", gemstoneSize: "", gemstoneQuality: "", settingType: "", numStones: "", sideStones: "", totalCarat: "",
    size: "10", bandWidth: "6mm", bandThickness: "2.2mm", totalHeight: "8mm", gender: "", weight: "8.2g",
    bandStyle: "Sculptural", ringType: "Statement", designMotif: "Crown of Thorns", texture: "Organic / Thorn Detail", engraving: "", specialInstructions: "",
    castingMethod: "Lost Wax",
    productionNotes: "Thorn tips need extra attention during finishing — fragile points. Double-check wall thickness on inner band before casting. Client prefers slightly matte finish on thorn surfaces only.",
  },
  pricing: { materialCost: "$426.40", laborCost: "$435.00", markup: "45%", retail: "$1,249.03", budget: "", deposit: "" },
};

const PIPELINE = [
  { key: "concept", label: "Concept", icon: "💡" },
  { key: "design", label: "Design", icon: "✏️" },
  { key: "cad", label: "CAD", icon: "📐" },
  { key: "approval", label: "Approval", icon: "✓" },
  { key: "casting", label: "Casting", icon: "🔥" },
  { key: "setting", label: "Setting", icon: "💎" },
  { key: "finishing", label: "Finishing", icon: "✨" },
  { key: "delivery", label: "Delivery", icon: "📦" },
];

// ═══════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════

function SectionLabel({ children }) {
  return <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.label }}>{children}</div>;
}

function Section({ label, children, style = {}, rightAction, collapsed, onToggle, count, noPad }) {
  const isC = typeof collapsed === "boolean";
  return (
    <div style={{ background: C.section, borderRadius: R, border: `1px solid ${C.border}`, marginBottom: 14, ...style }}>
      {(label || rightAction) && (
        <div onClick={isC ? onToggle : undefined} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", cursor: isC ? "pointer" : "default",
          borderBottom: (!isC || !collapsed) ? `1px solid ${C.border}` : "none", userSelect: "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isC && <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><path d="M2 3L5 6L8 3" fill="none" stroke={C.light} strokeWidth="1.5" /></svg>}
            <SectionLabel>{label}</SectionLabel>
            {count !== undefined && <span style={{ fontFamily: MONO, fontSize: 10, color: C.light, background: C.white, padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}` }}>{count}</span>}
          </div>
          {rightAction}
        </div>
      )}
      {(!isC || !collapsed) && <div style={{ padding: noPad ? 0 : "20px 24px" }}>{children}</div>}
    </div>
  );
}

function Field({ label, value = "", wide, textarea, readOnly, mono }) {
  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 calc(50% - 16px)", minWidth: wide ? "100%" : 180 }}>
      <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 4 }}>{label}</div>
      {textarea ? (
        <textarea defaultValue={value} readOnly={readOnly} rows={3} style={{
          width: "100%", padding: "8px 2px", fontFamily: mono ? MONO : SANS, fontSize: 13, color: C.dark,
          background: "transparent", border: "none", borderBottom: `1px solid ${C.borderInput}`,
          outline: "none", resize: "vertical", lineHeight: 1.6, borderRadius: 0,
        }} />
      ) : (
        <input defaultValue={value} readOnly={readOnly} style={{
          width: "100%", padding: "8px 2px", fontFamily: mono ? MONO : SANS, fontSize: 13, color: C.dark,
          background: "transparent", border: "none", borderBottom: `1px solid ${C.borderInput}`,
          outline: "none", borderRadius: 0,
        }} />
      )}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div style={{ minWidth: 110 }}>
      <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: C.dark, fontWeight: 500 }}>{value || "—"}</div>
    </div>
  );
}

function Pill({ label, color, bg, border, small }) {
  return <span style={{
    fontFamily: SANS, fontSize: small ? 9 : 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
    padding: small ? "3px 8px" : "4px 12px", borderRadius: RS,
    color, background: bg, border: `1px solid ${border}`,
  }}>{label}</span>;
}

function SmallBtn({ label, onClick, primary, icon }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
      padding: icon ? "7px 14px" : "7px 18px", display: "inline-flex", alignItems: "center", gap: 6,
      background: primary ? (h ? C.coralHover : C.coral) : C.white,
      color: primary ? C.white : C.mid,
      border: primary ? "none" : `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: RS, cursor: "pointer", transition: "all 0.2s", outline: "none",
    }}>{icon}{label}</button>
  );
}

function FileCard({ name, type, size, date, status }) {
  const [h, setH] = useState(false);
  const typeIcons = {
    cad: { color: C.blue, label: "CAD" }, image: { color: C.green, label: "IMG" },
    pdf: { color: C.coral, label: "PDF" }, model: { color: C.purple, label: "3D" },
    doc: { color: C.amber, label: "DOC" }, cert: { color: C.green, label: "CERT" },
  };
  const t = typeIcons[type] || { color: C.mid, label: "FILE" };
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
      background: h ? C.white : "transparent", borderRadius: RS,
      border: `1px solid ${h ? C.borderHover : "transparent"}`, cursor: "pointer", transition: "all 0.2s",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: RS, display: "flex", alignItems: "center", justifyContent: "center",
        background: `${t.color}0C`, border: `1px solid ${t.color}20`,
      }}>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: t.color, letterSpacing: 1 }}>{t.label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.light, marginTop: 2 }}>{size} · {date}</div>
      </div>
      {status && <Pill label={status} color={status === "Current" ? C.green : C.amber} bg={status === "Current" ? C.greenBg : C.amberBg} border={status === "Current" ? C.greenBorder : C.amberBorder} />}
    </div>
  );
}

function TimelineItem({ icon, title, detail, time, accent }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "10px 0" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 14, flexShrink: 0, marginTop: 2,
        background: accent ? `${accent}0C` : C.white, border: `1px solid ${accent ? `${accent}20` : C.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: C.dark }}>{title}</div>
        {detail && <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginTop: 2 }}>{detail}</div>}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.light, flexShrink: 0, marginTop: 3 }}>{time}</span>
    </div>
  );
}

function ChatBubble({ from, message, time, isMe }) {
  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{
        maxWidth: "70%", padding: "12px 16px", borderRadius: R,
        background: isMe ? C.sidebarBg : C.white,
        border: isMe ? "none" : `1px solid ${C.border}`,
      }}>
        {!isMe && <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue, marginBottom: 4 }}>{from}</div>}
        <div style={{ fontFamily: SANS, fontSize: 13, color: isMe ? "#D4D4CC" : C.dark, lineHeight: 1.6 }}>{message}</div>
        <div style={{ fontFamily: MONO, fontSize: 9, color: isMe ? "#8A8A7E" : C.light, marginTop: 6, textAlign: "right" }}>{time}</div>
      </div>
    </div>
  );
}

function ImageSlot({ label, hasImage, src }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      width: 160, height: 160, borderRadius: RS, overflow: "hidden",
      background: hasImage ? `url(${src}) center/cover` : (h ? C.white : C.border),
      border: `1px solid ${h ? C.borderHover : C.border}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "all 0.2s", position: "relative",
    }}>
      {!hasImage && (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.2" style={{ marginBottom: 6 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
          <span style={{ fontFamily: SANS, fontSize: 9.5, color: C.light, letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</span>
        </>
      )}
    </div>
  );
}

function MaterialRow({ name, spec, qty, unit, unitCost, total }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr",
      gap: 8, padding: "10px 0", borderBottom: `1px solid ${C.border}`,
      fontFamily: SANS, fontSize: 12.5, color: C.dark, alignItems: "center",
    }}>
      <span style={{ fontWeight: 500 }}>{name}</span>
      <span style={{ color: C.mid }}>{spec}</span>
      <span style={{ fontFamily: MONO, textAlign: "right" }}>{qty}</span>
      <span style={{ color: C.light }}>{unit}</span>
      <span style={{ fontFamily: MONO, textAlign: "right" }}>${unitCost}</span>
      <span style={{ fontFamily: MONO, textAlign: "right", fontWeight: 600 }}>${total}</span>
    </div>
  );
}

function PipelineBar({ current, onChange }) {
  const idx = PIPELINE.findIndex((p) => p.key === current);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "stretch" }}>
      {PIPELINE.map((stage, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={stage.key} onClick={() => onChange?.(stage.key)} style={{
            flex: 1, textAlign: "center", padding: "10px 4px 8px",
            background: done ? C.greenBg : active ? C.blueBg : "transparent",
            border: `1px solid ${done ? C.greenBorder : active ? C.blueBorder : C.border}`,
            borderRadius: i === 0 ? `${RS}px 0 0 ${RS}px` : i === PIPELINE.length - 1 ? `0 ${RS}px ${RS}px 0` : 0,
            cursor: "pointer", transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 13, marginBottom: 3 }}>{stage.icon}</div>
            <div style={{
              fontFamily: SANS, fontSize: 8.5, fontWeight: 600,
              letterSpacing: 2, textTransform: "uppercase",
              color: done ? C.green : active ? C.blue : C.light,
            }}>{stage.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 0, overflowX: "auto" }}>
      {tabs.map((tab) => (
        <button key={tab.key} onClick={() => onSelect(tab.key)} style={{
          fontFamily: SANS, fontSize: 11, fontWeight: active === tab.key ? 600 : 400,
          letterSpacing: 2, textTransform: "uppercase", padding: "14px 20px",
          color: active === tab.key ? C.black : C.light, background: "none", border: "none",
          borderBottom: active === tab.key ? `2px solid ${C.black}` : "2px solid transparent",
          cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", outline: "none",
        }}>{tab.label}</button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// AI ASSISTANT SYSTEM PROMPT
// ═══════════════════════════════════════
const AI_SYSTEM = `You are the ZipJeweler AI assistant embedded inside a specific project folder. You help refine specs, suggest improvements, answer jewelry questions, and update project details.

You have access to the current project data which will be provided. When the user asks you to update a field, do so. When they ask design or manufacturing questions, answer with expertise.

ALWAYS respond as valid JSON:
{
  "message": "Your response",
  "updates": { "field.path": "new value" },
  "suggestedAction": "generate_render|estimate_cost|generate_3d|send_to_cad|null"
}

"updates" uses dot notation for nested fields: "specs.metal" = "White Gold", "specs.size" = "8", "pricing.budget" = "$2,000"
Only include updates when explicitly requested. Be helpful, warm, and knowledgeable.`;

// ═══════════════════════════════════════
// TOOL MODAL
// ═══════════════════════════════════════
function ToolModal({ tool, project, onClose, onGenerate }) {
  if (!tool) return null;
  const config = {
    sketch: { title: "Sketch to Jewelry", desc: "Upload a hand-drawn sketch and our AI will generate photorealistic jewelry concepts from it.", prompt: true, upload: true, btnLabel: "Generate from Sketch" },
    render: { title: "AI Render", desc: `Generate a studio-quality photorealistic render of "${project.name}" based on current specifications.`, prompt: true, upload: false, btnLabel: "Generate Render" },
    estimate: { title: "Appraise & Estimate", desc: `Calculate a detailed material and labor cost breakdown for "${project.name}" using current specs and today's metal market prices.`, prompt: false, upload: false, btnLabel: "Calculate Estimate" },
    "3d": { title: "3D Model Generator", desc: `Generate a production-ready 3D model (.STL) of "${project.name}" suitable for casting and manufacturing.`, prompt: true, upload: false, btnLabel: "Generate 3D Model" },
    marketing: { title: "Image to Marketing", desc: "Transform product images into marketing-ready campaign content with styled backgrounds and lifestyle context.", prompt: true, upload: true, btnLabel: "Generate Marketing Image" },
  }[tool] || { title: tool, desc: "", prompt: false, upload: false, btnLabel: "Run" };

  const [dragOver, setDragOver] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setDone(true); onGenerate?.(tool); }, 2200);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(30,30,28,0.18)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 50, overflowY: "auto", animation: "fadeIn 0.2s ease" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 600, marginBottom: 60, background: C.bg, borderRadius: R, border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.08)", animation: "slideUp 0.25s ease", overflow: "hidden" }}>
        <div style={{ padding: "28px 32px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase" }}>{config.title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 18, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: "20px 32px 32px" }}>
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>{config.desc}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: C.border, borderRadius: RS, overflow: "hidden", marginBottom: 18, border: `1px solid ${C.border}` }}>
            {[{ l: "Type", v: project.specs.type }, { l: "Metal", v: `${project.specs.metalKarat} ${project.specs.metal}` }, { l: "Size", v: project.specs.size }].map((s, i) => (
              <div key={i} style={{ padding: "10px 14px", background: C.white }}>
                <div style={{ fontFamily: SANS, fontSize: 8.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 2 }}>{s.l}</div>
                <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: C.dark }}>{s.v}</div>
              </div>
            ))}
          </div>

          {config.upload && (
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); }} style={{
              padding: "36px", textAlign: "center", borderRadius: RS, marginBottom: 18,
              border: `2px dashed ${dragOver ? C.green : C.border}`, background: dragOver ? C.greenBg : "transparent",
              cursor: "pointer", transition: "all 0.2s",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.green : C.light} strokeWidth="1.2" style={{ margin: "0 auto 8px" }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.light }}>Drop file here or click to upload</div>
            </div>
          )}

          {config.prompt && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 4 }}>Additional Prompt</div>
              <textarea defaultValue={project.specs.description} rows={3} style={{
                width: "100%", padding: "10px 2px", fontFamily: SANS, fontSize: 13, color: C.dark,
                background: "transparent", border: "none", borderBottom: `1px solid ${C.borderInput}`,
                outline: "none", resize: "vertical", lineHeight: 1.6,
              }} />
            </div>
          )}

          {done ? (
            <div style={{ padding: "18px", background: C.greenBg, borderRadius: RS, border: `1px solid ${C.greenBorder}`, textAlign: "center", fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.green, letterSpacing: 2, textTransform: "uppercase" }}>
              ✓ Generated — added to project files
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleGenerate} disabled={generating} style={{
                flex: 1, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                padding: "14px 24px", background: generating ? C.mid : C.coral, color: C.white,
                border: "none", borderRadius: RS, cursor: generating ? "wait" : "pointer", transition: "background 0.2s",
              }}>{generating ? "Generating…" : config.btnLabel}</button>
              <SmallBtn label="Cancel" onClick={onClose} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// AI PANEL (SLIDE-OUT)
// ═══════════════════════════════════════
function AIPanel({ project, open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: `I'm here to help with the ${project.name} project. Ask me anything — update specs, suggest design ideas, estimate costs, or troubleshoot manufacturing details.` }]);
    }
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((p) => [...p, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    const projectContext = `Current project: ${JSON.stringify({ name: project.name, specs: project.specs, stage: project.stage, pricing: project.pricing })}`;
    const newHist = [...history, { role: "user", content: text }];

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: AI_SYSTEM + "\n\n" + projectContext, messages: newHist }),
      });
      const data = await resp.json();
      const raw = data.content?.map((b) => b.text || "").join("") || "";
      let parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch { parsed = { message: raw, updates: {} }; }

      setMessages((p) => [...p, { role: "assistant", content: parsed.message, updates: parsed.updates }]);
      setHistory([...newHist, { role: "assistant", content: raw }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Connection issue — please try again." }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [input, loading, history, project]);

  if (!open) return null;

  return (
    <div style={{
      width: 380, height: "100vh", position: "fixed", right: 0, top: 0, zIndex: 60,
      background: C.white, borderLeft: `1px solid ${C.border}`,
      display: "flex", flexDirection: "column", animation: "slideIn 0.25s ease",
      boxShadow: "-10px 0 40px rgba(0,0,0,0.04)",
    }}>
      <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: C.sidebarBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 13, color: C.sidebarActive, fontWeight: 700 }}>Z</div>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.dark }}>AI Assistant</div>
            <div style={{ fontFamily: SANS, fontSize: 10, color: C.light }}>Project-aware</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 16 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
        {messages.map((m, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", padding: "4px 16px", animation: "messageIn 0.3s ease" }}>
              <div style={{
                maxWidth: "85%", padding: "10px 14px", borderRadius: R,
                background: m.role === "user" ? C.sidebarBg : C.section,
                border: m.role === "user" ? "none" : `1px solid ${C.border}`,
              }}>
                <div style={{ fontFamily: SANS, fontSize: 13, lineHeight: 1.65, color: m.role === "user" ? "#E0E0D8" : C.dark, whiteSpace: "pre-wrap" }}>{m.content}</div>
              </div>
            </div>
            {m.updates && Object.keys(m.updates).length > 0 && (
              <div style={{ padding: "2px 16px" }}>
                {Object.entries(m.updates).map(([k, v]) => (
                  <div key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 20, marginRight: 4, marginBottom: 4 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                    <span style={{ fontFamily: SANS, fontSize: 10, color: C.green, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>{k.split(".").pop()}</span>
                    <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.mid }}>→ {v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ padding: "8px 16px" }}>
            <div style={{ display: "flex", gap: 3, padding: "10px 14px", background: C.section, borderRadius: R, border: `1px solid ${C.border}`, width: "fit-content" }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: 5, height: 5, borderRadius: 3, background: C.light, animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask anything about this project…" style={{ flex: 1, fontFamily: SANS, fontSize: 13, padding: "10px 14px", color: C.dark, background: C.section, border: `1px solid ${C.border}`, borderRadius: RS, outline: "none" }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ width: 40, height: 40, borderRadius: RS, border: "none", background: input.trim() ? C.coral : C.border, color: C.white, cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" /></svg>
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// TABS
// ═══════════════════════════════════════
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "design", label: "Design & Assets" },
  { key: "specs", label: "Specifications" },
  { key: "materials", label: "Materials & Cost" },
  { key: "manufacturing", label: "Manufacturing" },
  { key: "communication", label: "Communication" },
  { key: "documents", label: "Documents" },
  { key: "timeline", label: "Timeline" },
];

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export default function ZipJewelerFullProject() {
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [activeTab, setActiveTab] = useState("overview");
  const [loaded, setLoaded] = useState(false);
  const [collapseState, setCollapse] = useState({});
  const [activeTool, setActiveTool] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);

  const toggle = (k) => setCollapse((s) => ({ ...s, [k]: !s[k] }));
  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  const handleToolGenerate = (tool) => {
    // Timeline updates handled by tool completion
  };

  return (
    <div style={{ fontFamily: SANS, background: C.bg, minHeight: "100vh", color: C.dark, display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${C.sidebarActive}; color: ${C.sidebarBg}; }
        body { -webkit-font-smoothing: antialiased; background: ${C.bg}; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes messageIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotPulse { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        textarea:focus, input:focus { border-bottom-color: ${C.mid} !important; }
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{ width: 200, minHeight: "100vh", background: C.sidebarBg, position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "28px 28px 24px" }}>
          <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.sidebarActive, letterSpacing: 6, textTransform: "uppercase", lineHeight: 1.2 }}>Zip<br />Jeweler</div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {["Projects", "Products", "Orders", "Users"].map((item) => {
            const active = item === "Projects";
            return (
              <div key={item} style={{
                padding: "11px 28px", fontFamily: SANS, fontSize: 12.5, fontWeight: active ? 600 : 400,
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer",
                color: active ? C.sidebarActive : C.sidebarText,
                background: active ? C.sidebarActiveBg : "transparent",
                borderLeft: active ? `3px solid ${C.sidebarActive}` : "3px solid transparent",
              }}>{item}</div>
            );
          })}
        </nav>

        {/* Project folder tree */}
        <div style={{ padding: "28px 28px", flex: 1, borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 20 }}>
          <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(168,168,156,0.45)", marginBottom: 14 }}>This Project</div>
          {TABS.map((tab) => (
            <div key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              padding: "7px 0", fontFamily: SANS, fontSize: 12,
              color: activeTab === tab.key ? C.sidebarActive : C.sidebarText,
              cursor: "pointer", transition: "color 0.15s",
              fontWeight: activeTab === tab.key ? 600 : 400,
            }}>{tab.label}</div>
          ))}
          {/* Sidebar tools */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 14, paddingTop: 14 }}>
            <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(168,168,156,0.45)", marginBottom: 10 }}>Tools</div>
            {[{ k: "sketch", l: "Sketch to Jewelry", i: "✏️" }, { k: "render", l: "AI Render", i: "🖼" }, { k: "estimate", l: "Cost Estimate", i: "💰" }, { k: "3d", l: "3D Model Gen", i: "🧊" }, { k: "marketing", l: "Marketing Image", i: "📷" }].map((t) => (
              <div key={t.k} onClick={() => setActiveTool(t.k)} style={{ padding: "6px 0", fontFamily: SANS, fontSize: 11.5, color: C.sidebarText, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "color 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = C.sidebarActive}
                onMouseLeave={(e) => e.currentTarget.style.color = C.sidebarText}
              ><span style={{ fontSize: 12 }}>{t.i}</span>{t.l}</div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 28px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontFamily: SANS, fontSize: 10, color: C.sidebarText, cursor: "pointer", letterSpacing: 1 }}>← All Projects</div>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{ flex: 1, marginLeft: 200, minHeight: "100vh", opacity: loaded ? 1 : 0, transition: "opacity 0.4s", marginRight: aiOpen ? 380 : 0 }}>

        {/* Header */}
        <header style={{ padding: "24px 44px", background: C.white, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: C.black, letterSpacing: 5, textTransform: "uppercase", lineHeight: 1.1 }}>{project.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginTop: 6, letterSpacing: 1 }}>
                {project.collection} &nbsp;·&nbsp; {project.sku} &nbsp;·&nbsp; Last updated {project.updated}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setAiOpen(!aiOpen)} style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                padding: "8px 16px", display: "flex", alignItems: "center", gap: 6,
                background: aiOpen ? C.sidebarBg : C.white, color: aiOpen ? C.sidebarActive : C.mid,
                border: aiOpen ? "none" : `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", transition: "all 0.2s", outline: "none",
              }}><span style={{ fontSize: 12 }}>✦</span> AI Assistant</button>
              <select value={project.status} onChange={(e) => setProject((p) => ({ ...p, status: e.target.value }))} style={{
                fontFamily: SANS, fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase",
                padding: "9px 30px 9px 16px", color: C.mid, background: C.white,
                border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
              }}>
                <option value="draft">Draft</option><option value="in-progress">In Progress</option><option value="review">In Review</option><option value="complete">Complete</option>
              </select>
              <SmallBtn label="Send Update Email" primary onClick={() => {}} />
            </div>
          </div>
          <PipelineBar current={project.stage} onChange={(s) => setProject((p) => ({ ...p, stage: s }))} />
        </header>

        {/* Tab Bar */}
        <div style={{ padding: "0 44px", background: C.white }}>
          <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div style={{ padding: "28px 44px 60px", maxWidth: 1080, animation: "slideUp 0.25s ease" }} key={activeTab}>

          {/* ════════════════════════════════════════ */}
          {/* OVERVIEW TAB (from FullProject) */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <>
              <Section label="Client" rightAction={<SmallBtn label="Edit Client" onClick={() => {}} />}>
                <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                  <InfoField label="Email" value={project.client.email} />
                  <InfoField label="Name" value={project.client.name} />
                  <InfoField label="Phone" value={project.client.phone} />
                  <InfoField label="Created" value={project.client.created} />
                </div>
              </Section>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
                {[
                  { label: "Type", value: project.specs.type },
                  { label: "Metal", value: `${project.specs.metalKarat} ${project.specs.metal}` },
                  { label: "Est. Weight", value: project.specs.weight },
                  { label: "Est. Cost", value: "$1,240" },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.section, borderRadius: R, border: `1px solid ${C.border}`, padding: "18px 20px", textAlign: "center" }}>
                    <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.black }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* AI Tools Grid */}
              <Section label="AI Tools">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { k: "sketch", i: "✏️", l: "Sketch to Jewelry", d: "Hand-drawn to photorealistic" },
                    { k: "render", i: "🖼", l: "AI Render", d: "Studio-quality visualization" },
                    { k: "estimate", i: "💰", l: "Cost Estimate", d: "Material & labor breakdown" },
                    { k: "3d", i: "🧊", l: "3D Model Gen", d: "Production-ready mesh" },
                    { k: "marketing", i: "📷", l: "Marketing Image", d: "Campaign-ready content" },
                    { k: "ai", i: "✦", l: "AI Assistant", d: "Ask anything about this project" },
                  ].map((t) => {
                    const [h, setH] = useState(false);
                    return (
                      <div key={t.k} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={() => t.k === "ai" ? setAiOpen(true) : setActiveTool(t.k)} style={{
                        padding: "18px 16px", background: h ? C.white : "transparent", borderRadius: RS,
                        border: `1px solid ${h ? C.borderHover : C.border}`, cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <span style={{ fontSize: 18 }}>{t.i}</span>
                        <div>
                          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: h ? C.black : C.mid }}>{t.l}</div>
                          <div style={{ fontFamily: SANS, fontSize: 10.5, color: C.light, marginTop: 1 }}>{t.d}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section label="Reference Images" count={2} rightAction={<SmallBtn label="+ Upload" onClick={() => {}} />}>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <ImageSlot label="Reference 1" hasImage={false} />
                  <ImageSlot label="Reference 2" hasImage={false} />
                  <ImageSlot label="Add Image" hasImage={false} />
                </div>
              </Section>

              <Section label="Recent Activity" rightAction={<span onClick={() => setActiveTab("timeline")} style={{ fontFamily: SANS, fontSize: 10.5, color: C.light, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>View All →</span>}>
                <TimelineItem icon="📐" title="CAD file uploaded" detail="crown-thorns-v3.step — Revision 3 from designer" time="2h ago" accent={C.blue} />
                <TimelineItem icon="💬" title="Message from CAD designer" detail="'Band width adjusted to 6mm per your note'" time="5h ago" accent={C.purple} />
                <TimelineItem icon="✏️" title="Specs updated" detail="Metal karat changed from 18k to 14k" time="1d ago" accent={C.amber} />
                <TimelineItem icon="🖼" title="AI render generated" detail="Photorealistic render — front view, studio lighting" time="2d ago" accent={C.green} />
              </Section>
            </>
          )}

          {/* ════════════════════════════════════════ */}
          {/* DESIGN & ASSETS TAB */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "design" && (
            <>
              <Section label="AI-Generated Concepts" count={4} rightAction={<SmallBtn label="+ Generate New" primary onClick={() => setActiveTool("render")} />}>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4].map((n) => <ImageSlot key={n} label={`Concept ${n}`} />)}
                  <ImageSlot label="Generate" />
                </div>
                <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 12, color: C.light }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.mid }}>PROMPT:</span> Crown of thorns design, literal depiction, stylized thorn motif, detailed thorns, sharp thorns, 14k yellow gold
                </div>
              </Section>

              <Section label="Sketches & Drawings" count={2} rightAction={<SmallBtn label="+ Upload" onClick={() => {}} />}>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <ImageSlot label="Sketch 1" />
                  <ImageSlot label="Sketch 2" />
                  <ImageSlot label="Add Sketch" />
                </div>
              </Section>

              <Section label="Photorealistic Renders" count={3} rightAction={<SmallBtn label="+ Render" primary onClick={() => setActiveTool("render")} />}>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {["Front View", "Side View", "Detail"].map((v) => <ImageSlot key={v} label={v} />)}
                  <ImageSlot label="Add Render" />
                </div>
              </Section>

              <Section label="Mood Board & References" count={0} rightAction={<SmallBtn label="+ Add" onClick={() => {}} />}>
                <div style={{ padding: "30px 0", textAlign: "center" }}>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: C.light }}>Drag images here or click to add inspiration references</div>
                </div>
              </Section>
            </>
          )}

          {/* ════════════════════════════════════════ */}
          {/* SPECIFICATIONS TAB */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "specs" && (
            <>
              <Section label="General">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                  <Field label="Jewelry Type" value={project.specs.type} />
                  <Field label="Name" value={project.specs.name} />
                  <Field label="Description" value={project.specs.description} wide textarea />
                </div>
              </Section>

              <Section label="Dimensions & Sizing">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                  <Field label="Ring Size" value={project.specs.size} />
                  <Field label="Band Width" value={project.specs.bandWidth} />
                  <Field label="Band Thickness" value={project.specs.bandThickness} />
                  <Field label="Total Height" value={project.specs.totalHeight} />
                  <Field label="Gender" value={project.specs.gender} />
                  <Field label="Weight (est.)" value={project.specs.weight} />
                </div>
              </Section>

              <Section label="Metal">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                  <Field label="Metal" value={project.specs.metal} />
                  <Field label="Metal Karat" value={project.specs.metalKarat} />
                  <Field label="Finish" value={project.specs.finish} />
                  <Field label="Plating" value={project.specs.plating} />
                </div>
              </Section>

              <Section label="Gemstones" collapsed={collapseState.gems} onToggle={() => toggle("gems")} count={0}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                  <Field label="Main Gemstone" value={project.specs.mainGemstone} />
                  <Field label="Gemstone Shape" value={project.specs.gemstoneShape} />
                  <Field label="Gemstone Size" value={project.specs.gemstoneSize} />
                  <Field label="Gemstone Quality" value={project.specs.gemstoneQuality} />
                  <Field label="Setting Type" value={project.specs.settingType} />
                  <Field label="Number of Stones" value={project.specs.numStones} />
                  <Field label="Side Stones" value={project.specs.sideStones} />
                  <Field label="Total Carat Weight" value={project.specs.totalCarat} />
                </div>
              </Section>

              <Section label="Style Details" collapsed={collapseState.style} onToggle={() => toggle("style")}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                  <Field label="Band Style" value={project.specs.bandStyle} />
                  <Field label="Ring Type" value={project.specs.ringType} />
                  <Field label="Design Motif" value={project.specs.designMotif} />
                  <Field label="Texture" value={project.specs.texture} />
                  <Field label="Engraving" value={project.specs.engraving} />
                  <Field label="Special Instructions" value={project.specs.specialInstructions} wide textarea />
                </div>
              </Section>
            </>
          )}

          {/* ════════════════════════════════════════ */}
          {/* MATERIALS & COST TAB */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "materials" && (
            <>
              <Section label="Bill of Materials">
                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: 8,
                  padding: "0 0 8px", borderBottom: `2px solid ${C.border}`,
                  fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label,
                }}>
                  <span>Material</span><span>Specification</span><span style={{ textAlign: "right" }}>Qty</span>
                  <span>Unit</span><span style={{ textAlign: "right" }}>$/Unit</span><span style={{ textAlign: "right" }}>Total</span>
                </div>
                <MaterialRow name="Yellow Gold" spec="14k (585)" qty="8.2" unit="grams" unitCost="52.00" total="426.40" />
                <MaterialRow name="Casting" spec="Lost wax, single" qty="1" unit="piece" unitCost="85.00" total="85.00" />
                <MaterialRow name="Labor – CAD" spec="Custom design, 3 revisions" qty="4" unit="hours" unitCost="65.00" total="260.00" />
                <MaterialRow name="Labor – Setting" spec="N/A — no stones" qty="0" unit="hours" unitCost="0" total="0.00" />
                <MaterialRow name="Labor – Finishing" spec="Polish, QC" qty="2" unit="hours" unitCost="45.00" total="90.00" />

                <div style={{
                  display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: 8,
                  padding: "14px 0 0", fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.black,
                }}>
                  <span style={{ gridColumn: "1 / 6", textAlign: "right", letterSpacing: 2, textTransform: "uppercase", fontSize: 10.5 }}>Subtotal</span>
                  <span style={{ fontFamily: MONO, textAlign: "right" }}>$861.40</span>
                </div>
              </Section>

              <Section label="Pricing">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                  <Field label="Material Cost" value={project.pricing.materialCost} readOnly />
                  <Field label="Labor Cost" value={project.pricing.laborCost} readOnly />
                  <Field label="Markup %" value={project.pricing.markup} />
                  <Field label="Retail Price" value={project.pricing.retail} readOnly />
                  <Field label="Client Budget" value={project.pricing.budget} />
                  <Field label="Deposit Received" value={project.pricing.deposit} />
                </div>
              </Section>

              <Section label="Metal Market" collapsed={collapseState.market} onToggle={() => toggle("market")}>
                <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                  <InfoField label="Gold Spot (oz)" value="$2,870.00" />
                  <InfoField label="14k Per Gram" value="$52.00" />
                  <InfoField label="Last Updated" value="Mar 3, 2026" />
                </div>
                <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 11.5, color: C.light }}>
                  Metal prices are estimates. Final cost calculated at time of casting.
                </div>
              </Section>
            </>
          )}

          {/* ════════════════════════════════════════ */}
          {/* MANUFACTURING TAB */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "manufacturing" && (
            <>
              <Section label="CAD Files" count={3} rightAction={<SmallBtn label="+ Upload CAD" onClick={() => {}} />}>
                <FileCard name="crown-thorns-v3.step" type="cad" size="4.2 MB" date="Mar 3, 2026" status="Current" />
                <FileCard name="crown-thorns-v2.step" type="cad" size="3.8 MB" date="Feb 28, 2026" />
                <FileCard name="crown-thorns-v1.step" type="cad" size="3.1 MB" date="Feb 25, 2026" />
              </Section>

              <Section label="3D Models" count={2} rightAction={<SmallBtn label="+ Upload Model" onClick={() => {}} />}>
                <FileCard name="crown-thorns-render.stl" type="model" size="12.6 MB" date="Mar 2, 2026" status="Current" />
                <FileCard name="crown-thorns-print.stl" type="model" size="8.4 MB" date="Mar 1, 2026" />
              </Section>

              <Section label="Production Notes">
                <Field label="Casting Method" value={project.specs.castingMethod} />
                <div style={{ height: 12 }} />
                <Field label="Production Notes" value={project.specs.productionNotes} wide textarea />
              </Section>

              <Section label="Quality Checklist" collapsed={collapseState.qa} onToggle={() => toggle("qa")}>
                {["CAD approved by client", "Wall thickness verified (min 1.5mm)", "Casting tree positioned", "Cast piece inspected", "Thorn details intact post-cast", "Polish grade confirmed", "Final QC passed", "Photographed for records"].map((item, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderBottom: i < 7 ? `1px solid ${C.border}` : "none" }}>
                    <input type="checkbox" defaultChecked={i < 3} style={{ accentColor: C.green, width: 14, height: 14 }} />
                    <span style={{ fontFamily: SANS, fontSize: 13, color: i < 3 ? C.mid : C.dark }}>{item}</span>
                  </label>
                ))}
              </Section>
            </>
          )}

          {/* ════════════════════════════════════════ */}
          {/* COMMUNICATION TAB */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "communication" && (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                <Pill label="CAD Designer" color={C.blue} bg={C.blueBg} border={C.blueBorder} />
                <Pill label="Client" color={C.green} bg={C.greenBg} border={C.greenBorder} />
                <Pill label="Manufacturer" color={C.amber} bg={C.amberBg} border={C.amberBorder} />
                <Pill label="Internal Notes" color={C.purple} bg={C.purpleBg} border={C.purpleBorder} />
              </div>

              <Section label="CAD Designer Thread" noPad>
                <div style={{ padding: "20px 24px", maxHeight: 400, overflowY: "auto" }}>
                  <ChatBubble from="Alex (CAD)" message="Here's the v3 file with the adjusted band width. Thorn detail is tighter now — let me know if you want more separation between the points." time="Mar 3, 10:22 AM" />
                  <ChatBubble message="Looks great. Can we make the inner band slightly more rounded for comfort? Also the two thorns on the left side seem thicker than the right." time="Mar 3, 10:45 AM" isMe />
                  <ChatBubble from="Alex (CAD)" message="Good catch on the symmetry — I'll fix that in v4. Comfort fit inner band is easy, will have it to you by EOD." time="Mar 3, 11:02 AM" />
                </div>
                <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                  <input placeholder="Type a message…" style={{
                    flex: 1, fontFamily: SANS, fontSize: 13, padding: "10px 14px", color: C.dark,
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: RS, outline: "none",
                  }} />
                  <SmallBtn label="Send" primary onClick={() => {}} />
                </div>
              </Section>

              <Section label="Client Messages" collapsed={collapseState.clientChat} onToggle={() => toggle("clientChat")} count={3}>
                <ChatBubble from="Lord Augm3nt" message="I want it to look like an actual crown of thorns wrapped around the finger. Not cartoonish — realistic, organic thorns." time="Feb 23, 12:40 PM" />
                <ChatBubble message="Understood — going for a sculptural, organic feel. I'll have some AI concepts for you to review within the hour." time="Feb 23, 12:55 PM" isMe />
                <ChatBubble from="Lord Augm3nt" message="Perfect. Size 10, 14k yellow gold. No stones." time="Feb 23, 1:02 PM" />
              </Section>

              <Section label="Internal Notes" collapsed={collapseState.notes} onToggle={() => toggle("notes")} count={2}>
                <div style={{ fontFamily: SANS, fontSize: 13, color: C.dark, lineHeight: 1.7 }}>
                  <div style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.light }}>Mar 1 — </span>
                    Client is particular about thorn realism. Show at least 4 concept variations before proceeding to CAD. May want to do a wax try-on.
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.light }}>Feb 24 — </span>
                    Gold market is volatile this week. Lock in price at casting order, not before.
                  </div>
                </div>
              </Section>
            </>
          )}

          {/* ════════════════════════════════════════ */}
          {/* DOCUMENTS TAB */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "documents" && (
            <>
              <Section label="Invoices & Quotes" count={2} rightAction={<SmallBtn label="+ New Invoice" onClick={() => {}} />}>
                <FileCard name="Quote-CrownThorns-001.pdf" type="pdf" size="124 KB" date="Feb 24, 2026" status="Current" />
                <FileCard name="Deposit-Invoice-001.pdf" type="pdf" size="98 KB" date="Feb 25, 2026" />
              </Section>

              <Section label="Certificates & Grading" count={0} rightAction={<SmallBtn label="+ Upload" onClick={() => {}} />}>
                <div style={{ padding: "24px 0", textAlign: "center" }}>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginBottom: 4 }}>No certificates uploaded</div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.light }}>Upload stone grading reports, metal assay certs, or appraisals</div>
                </div>
              </Section>

              <Section label="Client Agreements" count={1} rightAction={<SmallBtn label="+ Upload" onClick={() => {}} />}>
                <FileCard name="Custom-Order-Agreement.pdf" type="doc" size="210 KB" date="Feb 23, 2026" />
              </Section>

              <Section label="Shipping & Insurance" count={0} collapsed={collapseState.shipping} onToggle={() => toggle("shipping")}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                  <Field label="Shipping Method" value="" />
                  <Field label="Insurance Value" value="" />
                  <Field label="Tracking Number" value="" mono />
                  <Field label="Delivery Date" value="" />
                </div>
              </Section>

              <Section label="All Project Files" count={8} rightAction={<SmallBtn label="+ Upload" onClick={() => {}} />}>
                <FileCard name="crown-thorns-v3.step" type="cad" size="4.2 MB" date="Mar 3" />
                <FileCard name="crown-thorns-render.stl" type="model" size="12.6 MB" date="Mar 2" />
                <FileCard name="render-front-v2.png" type="image" size="2.1 MB" date="Mar 1" />
                <FileCard name="render-side-v2.png" type="image" size="1.8 MB" date="Mar 1" />
                <FileCard name="concept-ai-001.png" type="image" size="890 KB" date="Feb 23" />
                <FileCard name="Quote-CrownThorns-001.pdf" type="pdf" size="124 KB" date="Feb 24" />
                <FileCard name="Custom-Order-Agreement.pdf" type="doc" size="210 KB" date="Feb 23" />
                <FileCard name="client-reference-photo.jpg" type="image" size="1.4 MB" date="Feb 23" />
              </Section>
            </>
          )}

          {/* ════════════════════════════════════════ */}
          {/* TIMELINE TAB */}
          {/* ════════════════════════════════════════ */}
          {activeTab === "timeline" && (
            <Section label="Full Project Timeline">
              <TimelineItem icon="📐" title="CAD file uploaded — v3" detail="crown-thorns-v3.step uploaded by Alex (CAD designer)" time="Mar 3, 10:22 AM" accent={C.blue} />
              <TimelineItem icon="💬" title="Designer message" detail="Band width adjusted to 6mm, comfort fit inner band" time="Mar 3, 10:22 AM" accent={C.purple} />
              <TimelineItem icon="🖼" title="Render generated" detail="Photorealistic front view render — studio lighting" time="Mar 2, 4:15 PM" accent={C.green} />
              <TimelineItem icon="📐" title="CAD file uploaded — v2" detail="crown-thorns-v2.step — thorn detail refined" time="Feb 28, 2:30 PM" accent={C.blue} />
              <TimelineItem icon="✏️" title="Specifications updated" detail="Metal karat changed: 18k → 14k per client request" time="Feb 27, 11:00 AM" accent={C.amber} />
              <TimelineItem icon="📐" title="CAD file uploaded — v1" detail="crown-thorns-v1.step — initial model from sketches" time="Feb 25, 9:00 AM" accent={C.blue} />
              <TimelineItem icon="💰" title="Deposit invoice sent" detail="Deposit-Invoice-001.pdf sent to client" time="Feb 25, 8:30 AM" accent={C.coral} />
              <TimelineItem icon="📄" title="Quote sent to client" detail="Quote-CrownThorns-001.pdf — $1,249 estimated total" time="Feb 24, 3:00 PM" accent={C.coral} />
              <TimelineItem icon="🤖" title="AI concepts generated" detail="4 variations generated from initial prompt" time="Feb 23, 1:30 PM" accent={C.green} />
              <TimelineItem icon="📝" title="Specifications captured" detail="Ring, size 10, 14k yellow gold, no stones, sculptural thorn motif" time="Feb 23, 12:50 PM" accent={C.amber} />
              <TimelineItem icon="💬" title="Client conversation" detail="Initial requirements discussed via chat" time="Feb 23, 12:40 PM" accent={C.purple} />
              <TimelineItem icon="📸" title="Reference image uploaded" detail="client-reference-photo.jpg — crown of thorns inspiration" time="Feb 23, 12:36 PM" accent={C.green} />
              <TimelineItem icon="🆕" title="Project created" detail="Crown of Thorns Ring — Mythos Line" time="Feb 23, 12:36 PM" accent={C.black} />
            </Section>
          )}

        </div>
      </main>

      {/* ═══ AI PANEL ═══ */}
      <AIPanel project={project} open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* ═══ TOOL MODAL ═══ */}
      <ToolModal tool={activeTool} project={project} onClose={() => setActiveTool(null)} onGenerate={handleToolGenerate} />
    </div>
  );
}
