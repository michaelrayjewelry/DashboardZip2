import { useState, useEffect, useRef, useCallback } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";
import {
  getProject, updateProject, getProjectFiles, getProjectFilesByCategory,
  uploadFileToProject, getFileBlobURL, FILE_CATEGORIES,
  saveGeneratedImageToProject, save3DModelToProject, saveChatHistory, getChatHistory,
} from "../lib/storage";
import { generateImage, generateMeshy3D, chatWithClaudeJSON } from "../lib/api";

// ─── SYSTEM PROMPTS ───

const IMAGINE_SYSTEM_PROMPT = `You are the ZipJeweler AI Design Consultant — a master jeweler's creative partner embedded inside ZipJeweler, a SaaS platform for custom jewelry production workflow.

Your role is to help jewelers and designers create complete project folders for custom jewelry pieces through natural, warm conversation. You are knowledgeable about jewelry design, manufacturing, gemstones, metals, CAD processes, casting methods, and the full lifecycle of a custom piece.

CONVERSATION STYLE:
- Be warm, creative, and inspiring — like a knowledgeable friend in the jewelry world
- Ask one or two focused questions at a time, never overwhelm
- Build on what the user shares, making connections and suggestions
- Use vivid language when describing design possibilities
- Be opinionated — suggest specific ideas, not just ask questions
- Celebrate good ideas with genuine enthusiasm

CONTEXT: The user has moved from the Imagine chat into their project folder. Continue the conversation naturally — they may want to refine details, make changes, generate images, or continue building out the project. Do NOT re-introduce yourself or start over.

RESPONSE FORMAT:
You must ALWAYS respond with valid JSON only. No markdown, no backticks, no preamble. Just the JSON object:
{
  "message": "Your conversational response here",
  "extracted": {
    "name": null, "type": null, "description": null, "metal": null, "metalKarat": null, "finish": null,
    "mainGemstone": null, "gemstoneShape": null, "settingType": null, "sideStones": null, "size": null,
    "bandWidth": null, "bandStyle": null, "weight": null, "budget": null, "timeline": null,
    "clientName": null, "clientEmail": null, "collection": null, "designMotif": null,
    "castingMethod": null, "specialNotes": null
  },
  "suggestedTool": "sketch|render|estimate|3d|filehub|null",
  "suggestedToolReason": "why this tool would help right now",
  "projectReadiness": 0-100
}

RULES FOR "extracted":
- Only include fields that have been explicitly mentioned or can be clearly inferred
- Leave fields as null if not yet discussed
- Update fields as the conversation evolves — later info overrides earlier`;

const PROJECT_SYSTEM_PROMPT = `You are the ZipJeweler AI Design Consultant — a master jeweler's creative partner embedded inside a project folder in ZipJeweler, a SaaS platform for custom jewelry production workflow.

You are chatting inside an EXISTING project folder. The user already has a project with details filled in. Your job is to:
1. Help refine and update project details based on the conversation
2. Suggest improvements, alternatives, or additions
3. Answer jewelry-related questions
4. Help with any aspect of the piece's design, materials, manufacturing, or pricing

CONVERSATION STYLE:
- Be warm, creative, and knowledgeable — like a trusted colleague in the jewelry world
- Be concise — the user is working inside a project, not starting from scratch
- Make specific, actionable suggestions
- Celebrate good ideas with genuine enthusiasm

RESPONSE FORMAT:
You must ALWAYS respond with valid JSON only. No markdown, no backticks, no preamble. Just the JSON object:
{
  "message": "Your conversational response here",
  "extracted": {
    "name": null, "type": null, "description": null, "metal": null, "metalKarat": null, "finish": null,
    "mainGemstone": null, "gemstoneShape": null, "settingType": null, "sideStones": null, "size": null,
    "bandWidth": null, "bandStyle": null, "weight": null, "budget": null, "timeline": null,
    "clientName": null, "clientEmail": null, "collection": null, "designMotif": null,
    "castingMethod": null, "specialNotes": null
  },
  "suggestedTool": "sketch|render|estimate|3d|filehub|null",
  "suggestedToolReason": "why this tool would help right now"
}

RULES FOR "extracted":
- Only include fields that the user explicitly wants to change or that you are suggesting changes for
- Leave fields as null if not being updated`;

// Hidden system messages that should not appear in the chat display
const HIDDEN_MSG_PREFIXES = ["Start the conversation", "The user is working on a project called"];
function isHiddenMessage(content) {
  return HIDDEN_MSG_PREFIXES.some((p) => content.startsWith(p));
}
function rebuildDisplayMessages(history) {
  const msgs = [];
  for (const h of history) {
    if (h.role === "user" && !isHiddenMessage(h.content)) {
      msgs.push({ role: "user", content: h.content });
    } else if (h.role === "assistant") {
      try {
        const parsed = JSON.parse(h.content);
        const fieldUpdates = [];
        if (parsed.extracted) Object.entries(parsed.extracted).forEach(([k, v]) => { if (v) fieldUpdates.push({ field: k, value: v }); });
        msgs.push({ role: "assistant", content: parsed.message, fieldUpdates: fieldUpdates.length > 0 ? fieldUpdates : undefined, suggestedTool: parsed.suggestedTool || undefined });
      } catch { msgs.push({ role: "assistant", content: h.content }); }
    }
  }
  return msgs;
}

const FIELD_LABELS = {
  name: "Project Name", type: "Jewelry Type", description: "Description", metal: "Metal", metalKarat: "Karat",
  finish: "Finish", mainGemstone: "Main Gemstone", gemstoneShape: "Gemstone Shape", settingType: "Setting Type",
  sideStones: "Side Stones", size: "Size", bandWidth: "Band Width", bandStyle: "Band Style", weight: "Est. Weight",
  budget: "Budget", timeline: "Timeline", clientName: "Client Name", clientEmail: "Client Email",
  collection: "Collection", designMotif: "Design Motif", castingMethod: "Casting Method", specialNotes: "Special Notes",
};

const TOOL_INFO = {
  sketch: { icon: "\u270F\uFE0F", label: "Sketch to Jewelry" },
  render: { icon: "\uD83D\uDDBC", label: "AI Render" },
  estimate: { icon: "\uD83D\uDCB0", label: "Cost Estimate" },
  "3d": { icon: "\uD83E\uDDCA", label: "3D Model Gen" },
  filehub: { icon: "\uD83D\uDCC1", label: "File Hub" },
};

// ─── CHAT SUB-COMPONENTS ───

function AIChatMessage({ message, isUser }) {
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", padding: "4px 0", gap: 8, alignItems: "flex-start" }}>
      {!isUser && (
        <div style={{ width: 22, height: 22, borderRadius: 11, background: C.sidebarBg, flexShrink: 0, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 9, color: C.sidebarActive, fontWeight: 700 }}>Z</div>
      )}
      <div style={{ maxWidth: isUser ? "85%" : "90%", padding: "8px 12px", borderRadius: isUser ? `${RS}px ${RS}px 3px ${RS}px` : `${RS}px ${RS}px ${RS}px 3px`, background: isUser ? C.sidebarBg : C.white, border: isUser ? "none" : `1px solid ${C.border}` }}>
        <div style={{ fontFamily: SANS, fontSize: 12, lineHeight: 1.6, color: isUser ? "#E0E0D8" : C.dark, whiteSpace: "pre-wrap" }}>{message}</div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: C.sidebarBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 9, color: C.sidebarActive, fontWeight: 700 }}>Z</div>
        <div style={{ display: "flex", gap: 3, padding: "8px 10px", background: C.section, borderRadius: RS, border: `1px solid ${C.border}` }}>
          {[0, 1, 2].map((i) => (<div key={i} style={{ width: 4, height: 4, borderRadius: 2, background: C.light, animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />))}
        </div>
      </div>
    </div>
  );
}

function FieldUpdateToast({ field, value }) {
  return (
    <div style={{ padding: "2px 0 2px 30px" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 20 }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
        <span style={{ fontFamily: SANS, fontSize: 9, color: C.green, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>{FIELD_LABELS[field] || field}</span>
        <span style={{ fontFamily: SANS, fontSize: 10, color: C.mid }}>{"\u2192"} {value}</span>
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ───

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.label }}>{children}</div>
  );
}

function Section({ label, children, style = {}, rightAction, collapsed, onToggle, count }) {
  const isCollapsible = typeof collapsed === "boolean";
  return (
    <div style={{ background: C.section, borderRadius: R, border: `1px solid ${C.border}`, marginBottom: 14, ...style }}>
      {(label || rightAction) && (
        <div
          onClick={isCollapsible ? onToggle : undefined}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 24px", cursor: isCollapsible ? "pointer" : "default",
            borderBottom: (!isCollapsible || !collapsed) ? `1px solid ${C.border}` : "none",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isCollapsible && (
              <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="M2 3L5 6L8 3" fill="none" stroke={C.light} strokeWidth="1.5" />
              </svg>
            )}
            <SectionLabel>{label}</SectionLabel>
            {count !== undefined && (
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.light, background: C.white, padding: "2px 8px", borderRadius: 4, border: `1px solid ${C.border}` }}>{count}</span>
            )}
          </div>
          {rightAction}
        </div>
      )}
      {(!isCollapsible || !collapsed) && <div style={{ padding: "20px 24px" }}>{children}</div>}
    </div>
  );
}

function Field({ label, value = "", wide, textarea, readOnly, mono, onChange }) {
  const handleBlur = (e) => {
    const newVal = e.target.value.trim();
    if (onChange && newVal !== (value || "")) onChange(newVal);
  };
  const inputStyle = {
    width: "100%", padding: "8px 2px", fontFamily: mono ? MONO : SANS, fontSize: 13, color: C.dark,
    background: "transparent", border: "none", borderBottom: `1px solid ${C.borderInput}`,
    outline: "none", borderRadius: 0,
  };
  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 calc(50% - 16px)", minWidth: wide ? "100%" : 180 }}>
      <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 4 }}>{label}</div>
      {textarea ? (
        <textarea defaultValue={value} readOnly={readOnly} rows={3} onBlur={handleBlur} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
      ) : (
        <input defaultValue={value} readOnly={readOnly} onBlur={handleBlur} style={inputStyle} />
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

function Pill({ label, color, bg, border }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
      padding: "4px 12px", borderRadius: RS, color, background: bg, border: `1px solid ${border}`,
    }}>{label}</span>
  );
}

function SmallBtn({ label, onClick, primary, icon }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
      padding: icon ? "7px 14px" : "7px 18px", display: "inline-flex", alignItems: "center", gap: 6,
      background: primary ? C.coral : C.white, color: primary ? C.white : C.mid,
      border: primary ? "none" : `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: RS, cursor: "pointer", transition: "all 0.2s",
      ...(primary && h ? { background: C.coralHover } : {}),
    }}>{icon}{label}</button>
  );
}

const dl3dStyle = {
  fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 1.5,
  textTransform: "uppercase", padding: "5px 12px",
  background: C.white, color: C.dark, border: `1px solid ${C.border}`,
  borderRadius: RS, textDecoration: "none", cursor: "pointer",
};

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
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12,
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


// ─── BOM HELPERS ───
const KARAT_PURITY = { "10k": "417", "14k": "585", "18k": "750", "22k": "916", "24k": "999" };
let _bomUid = 0;
const newBomId = () => "row-" + Date.now() + "-" + (++_bomUid);

function buildDefaultBom(f) {
  if (!f) f = {};
  const metalName = f.metal || "Yellow Gold";
  const karat = f.metalKarat || "14k";
  const rows = [
    { id: "metal", category: "material", name: metalName, spec: `${karat} (${KARAT_PURITY[karat] || karat})`, qty: parseFloat(f.weight) || 0, unit: "grams", unitCost: 52 },
    { id: "casting", category: "labor", name: "Casting", spec: "Lost wax, single", qty: 1, unit: "piece", unitCost: 85 },
    { id: "labor-cad", category: "labor", name: "Labor \u2013 CAD", spec: "Custom design", qty: 4, unit: "hours", unitCost: 65 },
    { id: "labor-setting", category: "labor", name: "Labor \u2013 Setting", spec: f.settingType || "", qty: 0, unit: "hours", unitCost: 55 },
    { id: "labor-finishing", category: "labor", name: "Labor \u2013 Finishing", spec: "Polish, QC", qty: 2, unit: "hours", unitCost: 45 },
  ];
  if (f.mainGemstone) {
    rows.splice(1, 0, { id: "gemstone", category: "material", name: f.mainGemstone, spec: [f.gemstoneShape, f.gemstoneSize].filter(Boolean).join(", "), qty: parseFloat(f.numberOfStones) || 1, unit: "stones", unitCost: 0 });
  }
  return rows;
}

// ─── EDITABLE MATERIAL ROW ───
function MaterialRow({ row, onChange, onDelete }) {
  const total = ((parseFloat(row.qty) || 0) * (parseFloat(row.unitCost) || 0));
  const cellStyle = (align, mono) => ({
    width: "100%", padding: "4px 2px", fontFamily: mono ? MONO : SANS, fontSize: 12.5, color: C.dark,
    background: "transparent", border: "none", borderBottom: `1px solid ${C.borderInput}`,
    textAlign: align || "left", outline: "none",
  });
  const cell = (field, align, mono) => (
    <input
      key={row.id + "-" + field + "-" + String(row[field])}
      defaultValue={row[field] ?? ""}
      onBlur={(e) => {
        const v = e.target.value.trim();
        if (v !== String(row[field] ?? "")) {
          const val = (field === "qty" || field === "unitCost") ? (parseFloat(v) || 0) : v;
          onChange({ ...row, [field]: val });
        }
      }}
      style={cellStyle(align, mono)}
    />
  );
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 24px",
      gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center",
    }}>
      {cell("name")}
      {cell("spec")}
      {cell("qty", "right", true)}
      {cell("unit")}
      {cell("unitCost", "right", true)}
      <span style={{ fontFamily: MONO, fontSize: 12.5, textAlign: "right", fontWeight: 600, color: C.dark }}>${total.toFixed(2)}</span>
      <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 15, padding: 0, lineHeight: 1 }}>{"\u00D7"}</button>
    </div>
  );
}

// ─── TABS ───
function TabBar({ tabs, active, onSelect }) {
  return (
    <div style={{
      display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 20,
      overflowX: "auto",
    }}>
      {tabs.map((tab) => (
        <button key={tab.key} onClick={() => onSelect(tab.key)} style={{
          fontFamily: SANS, fontSize: 11, fontWeight: active === tab.key ? 600 : 400,
          letterSpacing: 2, textTransform: "uppercase", padding: "14px 20px",
          color: active === tab.key ? C.black : C.light, background: "none", border: "none",
          borderBottom: active === tab.key ? `2px solid ${C.black}` : "2px solid transparent",
          cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
        }}>{tab.label}</button>
      ))}
    </div>
  );
}

// ─── IMAGE SLOT ───
function ImageSlot({ label, hasImage, src, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick || undefined} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
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

// ═══════════════════════════════════════
// PROJECT VIEW – MAIN COMPONENT
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

export default function ProjectView({ onBack, projectId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loaded, setLoaded] = useState(false);
  const [collapseState, setCollapse] = useState({});
  const [projectFiles, setProjectFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const uploadRef = useRef(null);
  const [uploadContext, setUploadContext] = useState("reference");
  const [genState, setGenState] = useState({ loading: false, error: null, imageUrl: null });
  const toggle = (k) => setCollapse((s) => ({ ...s, [k]: !s[k] }));

  // ─── AI Chat state ───
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [chatSource, setChatSource] = useState(null);
  const [chatStarted, setChatStarted] = useState(false);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const [revision, setRevision] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  // ─── 3D model generation state (Meshy) ───
  const [is3dGenerating, setIs3dGenerating] = useState(false);
  const [meshy3dError, setMeshy3dError] = useState(null);

  // Load project data from storage (hoisted before BOM state initializers)
  const storedProject = projectId ? getProject(projectId) : null;

  // ─── BOM & Pricing state ───
  const [bom, setBom] = useState(() => {
    const stored = storedProject?.fields?.bom;
    return stored && stored.length > 0 ? stored : buildDefaultBom(storedProject?.fields || {});
  });
  const [metalMarket, setMetalMarket] = useState(() => {
    const stored = storedProject?.fields?.metalMarket;
    return stored || { goldSpot: 2870, perGram14k: 52 };
  });
  const [markup, setMarkup] = useState(() => {
    return parseFloat(storedProject?.fields?.markup) || 45;
  });

  const saveBom = useCallback((newBom) => {
    setBom(newBom);
    if (projectId) updateProject(projectId, { fields: { bom: newBom } });
  }, [projectId]);

  const saveMetalMarket = useCallback((newMarket) => {
    setMetalMarket(newMarket);
    if (projectId) updateProject(projectId, { fields: { metalMarket: newMarket } });
  }, [projectId]);

  const saveMarkup = useCallback((val) => {
    setMarkup(val);
    if (projectId) updateProject(projectId, { fields: { markup: val } });
  }, [projectId]);

  const handleBomChange = useCallback((updated) => {
    const next = bom.map((r) => r.id === updated.id ? updated : r);
    saveBom(next);
  }, [bom, saveBom]);

  const handleBomAdd = useCallback(() => {
    saveBom([...bom, { id: newBomId(), category: "material", name: "", spec: "", qty: 0, unit: "piece", unitCost: 0 }]);
  }, [bom, saveBom]);

  const handleBomDelete = useCallback((id) => {
    saveBom(bom.filter((r) => r.id !== id));
  }, [bom, saveBom]);

  // Computed pricing
  const materialTotal = bom.filter((r) => r.category === "material").reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.unitCost) || 0), 0);
  const laborTotal = bom.filter((r) => r.category !== "material").reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.unitCost) || 0), 0);
  const bomSubtotal = materialTotal + laborTotal;
  const retailPrice = bomSubtotal * (1 + markup / 100);

  const saveField = useCallback((fieldKey, value) => {
    if (!projectId) return;
    const updates = { fields: { [fieldKey]: value } };
    if (fieldKey === "name") updates.name = value;
    updateProject(projectId, updates);
    setRevision((r) => r + 1);
  }, [projectId]);

  // ─── One-way sync: project fields → BOM (does NOT flow back) ───
  const prevFieldsRef = useRef({});
  useEffect(() => {
    if (!storedProject?.fields) return;
    const f = storedProject.fields;
    const pf = prevFieldsRef.current;
    let changed = false;
    const next = bom.map((r) => ({ ...r }));
    const metalRow = next.find((r) => r.id === "metal");
    if (metalRow) {
      if (f.metal && f.metal !== pf.metal) { metalRow.name = f.metal; changed = true; }
      if (f.metalKarat && f.metalKarat !== pf.metalKarat) { metalRow.spec = `${f.metalKarat} (${KARAT_PURITY[f.metalKarat] || f.metalKarat})`; changed = true; }
      if (f.weight && f.weight !== pf.weight) { metalRow.qty = parseFloat(f.weight) || metalRow.qty; changed = true; }
    }
    const gemRow = next.find((r) => r.id === "gemstone");
    if (gemRow) {
      if (f.mainGemstone && f.mainGemstone !== pf.mainGemstone) { gemRow.name = f.mainGemstone; changed = true; }
      if (f.gemstoneShape && f.gemstoneShape !== pf.gemstoneShape) { gemRow.spec = [f.gemstoneShape, f.gemstoneSize].filter(Boolean).join(", "); changed = true; }
    }
    const settingRow = next.find((r) => r.id === "labor-setting");
    if (settingRow && f.settingType && f.settingType !== pf.settingType) { settingRow.spec = f.settingType; changed = true; }
    prevFieldsRef.current = { ...f, bom: undefined, metalMarket: undefined, markup: undefined };
    if (changed) saveBom(next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  const handleGenerateDesign = async (style) => {
    if (genState.loading) return;
    setGenState({ loading: true, error: null, imageUrl: null });
    try {
      const f = project.fields;
      // Build a structured prompt for consistent perspective jewelry renders
      const envParts = [
        "Photorealistic studio product photograph",
        "three-quarter perspective view of a single jewelry piece",
        "centered on clean white background",
        "professional jewelry photography lighting with soft shadows",
        "high-end e-commerce product shot",
      ];
      const pieceParts = [];
      const jewelryType = f.type || "jewelry piece";
      pieceParts.push(jewelryType);
      if (f.name || project.name) pieceParts.push(`called "${f.name || project.name}"`);
      if (f.description) pieceParts.push(f.description);
      if (f.metal && f.metalKarat) pieceParts.push(`made of ${f.metalKarat} ${f.metal}`);
      else if (f.metal) pieceParts.push(`made of ${f.metal}`);
      if (f.finish) pieceParts.push(`${f.finish} finish`);
      if (f.mainGemstone) pieceParts.push(`featuring ${f.mainGemstone}`);
      if (f.gemstoneShape) pieceParts.push(`${f.gemstoneShape} cut`);
      if (f.settingType) pieceParts.push(`${f.settingType} setting`);
      if (f.sideStones) pieceParts.push(`with ${f.sideStones}`);
      if (f.designMotif) pieceParts.push(`${f.designMotif} design motif`);
      if (f.bandStyle) pieceParts.push(`${f.bandStyle} band`);
      const prompt = envParts.join(", ") + ". " + pieceParts.join(", ");

      const result = await generateImage({ prompt, aspectRatio: "1:1", resolution: "1080p" });
      if (result.images?.length) {
        const url = result.images[0].url;
        setGenState({ loading: false, error: null, imageUrl: url });
        if (projectId) {
          saveGeneratedImageToProject(projectId, url, style === "render" ? "render" : "imagine-sketch", prompt);
          setProjectFiles(getProjectFiles(projectId));
        }
      } else {
        setGenState({ loading: false, error: "No images were returned. Please try again.", imageUrl: null });
      }
    } catch (err) {
      setGenState({ loading: false, error: err.message, imageUrl: null });
    }
  };

  // ── 3D model generation from project images (Meshy AI) ──
  const handleGenerate3D = async (sourceImageUrl) => {
    if (is3dGenerating || !sourceImageUrl) return;
    setIs3dGenerating(true);
    setMeshy3dError(null);
    try {
      const result = await generateMeshy3D({ imageUrl: sourceImageUrl, enablePbr: true });
      if (projectId) {
        save3DModelToProject(projectId, result, sourceImageUrl);
        setProjectFiles(getProjectFiles(projectId));
      }
    } catch (err) {
      setMeshy3dError(err.message);
    } finally {
      setIs3dGenerating(false);
    }
  };

  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  // Load files from storage
  useEffect(() => {
    if (projectId) {
      setProjectFiles(getProjectFiles(projectId));
    }
  }, [projectId]);

  // Generate blob URLs for uploaded files
  useEffect(() => {
    const loadUrls = async () => {
      const urls = {};
      for (const f of projectFiles) {
        if (f.blobKey && !f.url) {
          try {
            const url = await getFileBlobURL(f.blobKey);
            if (url) urls[f.blobKey] = url;
          } catch { /* skip */ }
        }
      }
      setFileUrls(urls);
    };
    if (projectFiles.length > 0) loadUrls();
    return () => {
      // Revoke URLs on cleanup
      Object.values(fileUrls).forEach(URL.revokeObjectURL);
    };
  }, [projectFiles]);

  const handleFileUpload = async (files, source) => {
    if (!projectId) return;
    for (const file of files) {
      await uploadFileToProject(projectId, file, source);
    }
    setProjectFiles(getProjectFiles(projectId));
  };

  const triggerUpload = (source) => {
    setUploadContext(source);
    uploadRef.current?.click();
  };

  // ─── Load chat history from storage ───
  useEffect(() => {
    if (storedProject) {
      setChatSource(storedProject.chatSource || null);
      const history = getChatHistory(projectId);
      if (history && history.length > 0) {
        setConversationHistory(history);
        setChatMessages(rebuildDisplayMessages(history));
        setChatStarted(true);
        setChatOpen(true); // auto-open if there's existing chat
      }
    }
  }, [projectId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatLoading]);

  const getSystemPrompt = useCallback(() => chatSource === "imagine" ? IMAGINE_SYSTEM_PROMPT : PROJECT_SYSTEM_PROMPT, [chatSource]);

  const buildContextMessage = useCallback(() => {
    const sp = storedProject;
    if (!sp || !sp.fields) return "";
    const filled = Object.entries(sp.fields).filter(([_, v]) => v);
    if (filled.length === 0) return "";
    return "\n\n[CURRENT PROJECT STATE]\n" + filled.map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`).join("\n");
  }, [storedProject]);

  const startChat = useCallback(async () => {
    if (chatStarted) return;
    setChatStarted(true);
    setChatLoading(true);
    try {
      const name = storedProject?.name || "Untitled Project";
      const contextMsg = `The user is working on a project called "${name}". Here are the current project details:${buildContextMessage()}\n\nGreet them briefly and ask how you can help with this project.`;
      const parsed = await chatWithClaudeJSON({
        system: getSystemPrompt(),
        messages: [{ role: "user", content: contextMsg }],
        maxTokens: 800,
        fallback: { extracted: {}, suggestedTool: null },
      });
      setChatMessages([{ role: "assistant", content: parsed.message || "How can I help with this project?" }]);
      const hist = [{ role: "user", content: contextMsg }, { role: "assistant", content: JSON.stringify(parsed) }];
      setConversationHistory(hist);
      if (projectId) saveChatHistory(projectId, hist);
    } catch {
      setChatMessages([{ role: "assistant", content: "How can I help refine this project?" }]);
    }
    setChatLoading(false);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [chatStarted, storedProject, projectId, getSystemPrompt, buildContextMessage]);

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatMessages((prev) => [...prev, { role: "user", content: text }]);
    setChatInput("");
    setChatLoading(true);
    const newHistory = [...conversationHistory, { role: "user", content: text }];
    try {
      const parsed = await chatWithClaudeJSON({
        system: getSystemPrompt(),
        messages: newHistory,
        maxTokens: 1000,
        fallback: { extracted: {}, suggestedTool: null },
      });
      const fieldUpdates = [];
      if (parsed.extracted) {
        Object.entries(parsed.extracted).forEach(([key, val]) => {
          if (val) {
            fieldUpdates.push({ field: key, value: val });
            // Auto-update stored project fields
            if (projectId && storedProject) {
              const updatedFields = { ...(storedProject.fields || {}), [key]: val };
              const updates = { fields: updatedFields };
              if (key === "name") updates.name = val;
              updateProject(projectId, updates);
            }
          }
        });
      }
      setChatMessages((prev) => [...prev, { role: "assistant", content: parsed.message, fieldUpdates: fieldUpdates.length > 0 ? fieldUpdates : undefined, suggestedTool: parsed.suggestedTool || undefined }]);
      const updatedHistory = [...newHistory, { role: "assistant", content: JSON.stringify(parsed) }];
      setConversationHistory(updatedHistory);
      if (projectId) saveChatHistory(projectId, updatedHistory);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "I had a brief connection issue \u2014 could you repeat that?" }]);
    }
    setChatLoading(false);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [chatInput, chatLoading, conversationHistory, projectId, storedProject, getSystemPrompt]);

  const handleChatOpen = () => {
    setChatOpen(true);
    if (!chatStarted) startChat();
  };

  // Merge stored data with fallback mock data
  const project = storedProject ? {
    name: storedProject.name || "Untitled Project",
    collection: storedProject.fields?.collection || "",
    stage: storedProject.stage || "concept",
    status: storedProject.status || "draft",
    created: new Date(storedProject.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    updated: new Date(storedProject.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    client: {
      email: storedProject.fields?.clientEmail || "—",
      name: storedProject.fields?.clientName || "—",
      phone: "—",
      created: new Date(storedProject.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
    },
    fields: storedProject.fields || {},
    readiness: storedProject.readiness || 0,
  } : {
    name: "Crown of Thorns Ring",
    collection: "Mythos Line",
    stage: "cad",
    status: "in-progress",
    created: "Feb 23, 2026",
    updated: "Mar 3, 2026",
    client: { email: "augm3ntllc@gmail.com", name: "Lord Augm3nt", phone: "—", created: "Feb 23, 2026, 12:36 PM" },
    fields: {},
    readiness: 0,
  };

  // Get files grouped by category
  const filesByCategory = projectId ? getProjectFilesByCategory(projectId) : {};
  const storedGeneratedImages = storedProject?.generatedImages || [];
  const getFileUrl = (f) => f.url || (f.blobKey ? fileUrls[f.blobKey] : null);
  const getFileTypeKey = (f) => {
    const catMap = { reference: "image", sketch: "image", render: "image", marketing: "image", cad: "cad", model3d: "model", document: "doc", certificate: "cert", other: "doc" };
    return catMap[f.category] || "doc";
  };
  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <>
      {/* Hidden file input for uploads */}
      <input
        ref={uploadRef}
        type="file"
        multiple
        accept="image/*,.pdf,.step,.stp,.stl,.obj,.doc,.docx,.xlsx,.csv"
        style={{ display: "none" }}
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) await handleFileUpload(files, uploadContext);
          e.target.value = "";
        }}
      />
      {/* ─── Header ─── */}
      <header style={{
        padding: "24px 44px", background: C.white,
        borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ marginBottom: 10 }}>
          <span
            onClick={onBack}
            style={{
              fontFamily: SANS, fontSize: 11, color: C.light, letterSpacing: 1.5,
              textTransform: "uppercase", cursor: "pointer", transition: "color 0.2s",
            }}
          >
            ← Back to Projects
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: C.black, letterSpacing: 5, textTransform: "uppercase", lineHeight: 1.1 }}>{project.name}</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginTop: 6, letterSpacing: 1 }}>
              {project.collection} &nbsp;·&nbsp; Created {project.created} &nbsp;·&nbsp; Last updated {project.updated}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <select style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase",
              padding: "9px 30px 9px 16px", color: C.mid, background: C.white,
              border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
            }}>
              <option>In Progress</option><option>Draft</option><option>In Review</option><option>Complete</option>
            </select>
            <SmallBtn label="Send Update Email" primary onClick={() => void 0} />
            <button onClick={handleChatOpen} style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
              padding: "7px 14px", display: "inline-flex", alignItems: "center", gap: 6,
              background: chatOpen ? C.sidebarBg : C.white, color: chatOpen ? C.sidebarActive : C.mid,
              border: `1px solid ${chatOpen ? C.sidebarBg : C.border}`, borderRadius: RS, cursor: "pointer", transition: "all 0.2s",
            }}>{"\u2726"} AI Chat</button>
          </div>
        </div>
      </header>

      {/* ─── Tab Bar ─── */}
      <div style={{ padding: "0 44px", background: C.white }}>
        <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
      </div>

      {/* ─── Content + Chat Sidebar Row ─── */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 240px)" }}>

      {/* ─── Tab Content ─── */}
      <div style={{ flex: 1, padding: "28px 44px 60px", maxWidth: chatOpen ? undefined : 1080, animation: "slideUp 0.25s ease", minWidth: 0, transition: "max-width 0.3s" }} key={activeTab}>

        {/* ════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "overview" && (() => {
          // Resolve cover image: saved cover → first render → first reference
          const coverField = project.fields.coverImage;
          const coverFile = coverField ? projectFiles.find((pf) => pf.id === coverField.fileId) : null;
          const coverUrl = coverFile ? getFileUrl(coverFile) : (coverField?.url || null);
          const fallbackFile = (filesByCategory.render || [])[0] || (filesByCategory.reference || [])[0];
          const heroUrl = coverUrl || (fallbackFile ? getFileUrl(fallbackFile) : null);
          const f = project.fields;
          const specs = [
            { label: "Type", value: f.type || "—" },
            { label: "Metal", value: f.metal ? `${f.metalKarat || ""} ${f.metal}`.trim() : "—" },
            { label: "Gemstone", value: f.mainGemstone || "—" },
            { label: "Shape", value: f.gemstoneShape || "—" },
            { label: "Setting", value: f.settingType || "—" },
            { label: "Finish", value: f.finish || "—" },
            { label: "Size", value: f.size || "—" },
            { label: "Weight", value: f.weight || "—" },
            { label: "Budget", value: f.budget || "—" },
            { label: "Timeline", value: f.timeline || "—" },
          ];
          // Gather ALL image files + generated images for gallery picker
          const allImages = [];
          const seenUrls = new Set();
          const addImage = (entry) => {
            if (entry.url && !seenUrls.has(entry.url)) { seenUrls.add(entry.url); allImages.push(entry); }
          };
          for (const cat of ["render", "reference", "sketch", "marketing", "other"]) {
            (filesByCategory[cat] || []).forEach((file) => {
              const url = getFileUrl(file);
              if (url) addImage({ fileId: file.id, url, label: file.name });
            });
          }
          (storedGeneratedImages || []).forEach((img, i) => {
            addImage({ fileId: null, url: img.url, label: `AI Concept ${i + 1}` });
          });
          // Include the just-generated image (may not be persisted to storage yet)
          if (genState.imageUrl) {
            addImage({ fileId: null, url: genState.imageUrl, label: "New Concept" });
          }
          return (
            <>
              {/* ── Product Card ── */}
              <div style={{
                display: "flex", gap: 28, padding: 24,
                background: C.section, borderRadius: R, border: `1px solid ${C.border}`, marginBottom: 14,
              }}>
                {/* Hero image — click to open gallery picker */}
                <div
                  onClick={() => setCoverPickerOpen(true)}
                  style={{
                    width: 220, height: 220, flexShrink: 0, borderRadius: RS, overflow: "hidden",
                    background: heroUrl ? `url(${heroUrl}) center/cover` : C.border,
                    border: `1px solid ${C.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", position: "relative",
                  }}
                >
                  {!heroUrl && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 32, color: C.light, fontWeight: 300, lineHeight: 1 }}>+</span>
                      <span style={{ fontFamily: SANS, fontSize: 9, color: C.light, letterSpacing: 1.5, textTransform: "uppercase" }}>Set Cover</span>
                    </div>
                  )}
                  {heroUrl && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "rgba(0,0,0,0)", transition: "background 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.35)"; e.currentTarget.querySelector("span").style.opacity = "1"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0)"; e.currentTarget.querySelector("span").style.opacity = "0"; }}
                    >
                      <span style={{ fontSize: 28, color: "#fff", fontWeight: 300, opacity: 0, transition: "opacity 0.2s" }}>+</span>
                    </div>
                  )}
                </div>

              {/* ── Cover Image Gallery Picker Modal ── */}
              {coverPickerOpen && (
                <div onClick={() => setCoverPickerOpen(false)} style={{
                  position: "fixed", inset: 0, zIndex: 9998,
                  background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div onClick={(e) => e.stopPropagation()} style={{
                    background: C.white, borderRadius: R, padding: 28, width: 520, maxHeight: "80vh",
                    overflow: "hidden", display: "flex", flexDirection: "column",
                    border: `1px solid ${C.border}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                      <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.label }}>Select Cover Image</div>
                      <button onClick={() => setCoverPickerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.mid, fontSize: 20, lineHeight: 1 }}>{"\u2715"}</button>
                    </div>
                    {allImages.length === 0 ? (
                      <div style={{ padding: "40px 0", textAlign: "center", fontFamily: SANS, fontSize: 13, color: C.light }}>
                        No images in project yet. Upload or generate images first.
                      </div>
                    ) : (
                      <div style={{ overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                        {allImages.map((img, i) => (
                          <div
                            key={img.fileId || img.url || i}
                            onClick={() => {
                              const coverData = { fileId: img.fileId, url: img.url };
                              saveField("coverImage", coverData);
                              setCoverPickerOpen(false);
                            }}
                            style={{
                              aspectRatio: "1", borderRadius: RS, overflow: "hidden", cursor: "pointer",
                              background: `url(${img.url}) center/cover`, border: `2px solid ${C.border}`,
                              position: "relative", transition: "border-color 0.2s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.blue; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                          >
                            <div style={{
                              position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 6px 5px",
                              background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                              fontFamily: SANS, fontSize: 9, color: "#fff", letterSpacing: 1,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {img.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* Info right */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.black, letterSpacing: 3, textTransform: "uppercase", lineHeight: 1.15 }}>
                    {project.name}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 4, letterSpacing: 1 }}>
                    {[project.collection, f.type].filter(Boolean).join(" · ") || "Custom Jewelry"}
                  </div>

                  <div style={{ width: "100%", height: 1, background: C.border, margin: "14px 0 12px" }} />

                  {/* 2-col spec grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
                    {specs.map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "3px 0" }}>
                        <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, minWidth: 70 }}>{s.label}</span>
                        <span style={{ fontFamily: SANS, fontSize: 12.5, color: s.value === "—" ? C.light : C.dark, fontWeight: 500 }}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Client row */}
                  <div style={{ width: "100%", height: 1, background: C.border, margin: "12px 0 10px" }} />
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label }}>Client</span>
                    <span style={{ fontFamily: SANS, fontSize: 12.5, color: C.dark, fontWeight: 500 }}>
                      {[project.client.name, project.client.email].filter((v) => v && v !== "—").join(" · ") || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Images ── */}
              <Section label="Images" count={(filesByCategory.reference || []).length + (filesByCategory.render || []).length} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("reference")} />}>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {(filesByCategory.render || []).map((file) => {
                    const url = getFileUrl(file);
                    return <ImageSlot key={file.id} label={file.name} hasImage={!!url} src={url} onClick={() => url && setPreviewImage({ src: url, label: file.name })} />;
                  })}
                  {(filesByCategory.reference || []).map((file) => {
                    const url = getFileUrl(file);
                    return <ImageSlot key={file.id} label={file.name} hasImage={!!url} src={url} onClick={() => url && setPreviewImage({ src: url, label: file.name })} />;
                  })}
                  <ImageSlot label="Add Image" hasImage={false} onClick={() => triggerUpload("reference")} />
                </div>
              </Section>

              {/* ── Recent Activity ── */}
              <Section label="Recent Activity" rightAction={<span onClick={() => setActiveTab("timeline")} style={{ fontFamily: SANS, fontSize: 10.5, color: C.light, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>View All →</span>}>
                <TimelineItem icon="📐" title="CAD file uploaded" detail="crown-thorns-v3.step — Revision 3 from designer" time="2h ago" accent={C.blue} />
                <TimelineItem icon="💬" title="Message from CAD designer" detail="'Band width adjusted to 6mm per your note'" time="5h ago" accent={C.purple} />
                <TimelineItem icon="✏️" title="Specs updated" detail="Metal karat changed from 18k to 14k" time="1d ago" accent={C.amber} />
                <TimelineItem icon="🖼" title="AI render generated" detail="Photorealistic render — front view, studio lighting" time="2d ago" accent={C.green} />
              </Section>
            </>
          );
        })()}

        {/* ════════════════════════════════════════ */}
        {/* DESIGN & ASSETS TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "design" && (
          <>
            <Section label="AI-Generated Concepts" count={storedGeneratedImages.length} rightAction={<SmallBtn label={genState.loading ? "Generating..." : "+ Generate New"} primary onClick={() => handleGenerateDesign("concept")} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {genState.imageUrl && !storedGeneratedImages.find(i => i.url === genState.imageUrl) && (
                  <ImageSlot label="New" hasImage src={genState.imageUrl} onClick={() => setPreviewImage({ src: genState.imageUrl, label: "New Concept" })} />
                )}
                {storedGeneratedImages.map((img, i) => (
                  <ImageSlot key={img.url || i} label={`Concept ${i + 1}`} hasImage src={img.url} onClick={() => setPreviewImage({ src: img.url, label: `Concept ${i + 1}` })} />
                ))}
                <ImageSlot label="Generate" />
              </div>
              {genState.loading && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.coral,
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  <span style={{ fontFamily: SANS, fontSize: 12, color: C.mid }}>Generating with Nano Banana... This may take up to 30 seconds</span>
                </div>
              )}
              {genState.error && (
                <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 12, color: C.coral }}>{genState.error}</div>
              )}
              {storedGeneratedImages.length > 0 && storedGeneratedImages[storedGeneratedImages.length - 1].promptUsed && (
                <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 12, color: C.light }}>
                  <span style={{ fontFamily: MONO, fontSize: 10, color: C.mid }}>PROMPT:</span> {storedGeneratedImages[storedGeneratedImages.length - 1].promptUsed}
                </div>
              )}
            </Section>

            <Section label="Sketches & Drawings" count={(filesByCategory.sketch || []).length} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("sketch")} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {(filesByCategory.sketch || []).map((f) => {
                  const url = getFileUrl(f);
                  return <ImageSlot key={f.id} label={f.name} hasImage={!!url} src={url} onClick={() => url && setPreviewImage({ src: url, label: f.name })} />;
                })}
                <ImageSlot label="Add Sketch" />
              </div>
            </Section>

            <Section label="Photorealistic Renders" count={(filesByCategory.render || []).length} rightAction={<SmallBtn label={genState.loading ? "Generating..." : "+ Render"} primary onClick={() => handleGenerateDesign("render")} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {(filesByCategory.render || []).map((f) => {
                  const url = getFileUrl(f);
                  return <ImageSlot key={f.id} label={f.name} hasImage={!!url} src={url} onClick={() => url && setPreviewImage({ src: url, label: f.name })} />;
                })}
                <ImageSlot label="Add Render" />
              </div>
            </Section>

            <Section label="Mood Board & References" count={0} rightAction={<SmallBtn label="+ Add" onClick={() => void 0} />}>
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
                <Field label="Jewelry Type" value={project.fields.type || ""} onChange={(v) => saveField("type", v)} />
                <Field label="Name" value={project.fields.name || project.name} onChange={(v) => saveField("name", v)} />
                <Field label="Description" value={project.fields.description || ""} wide textarea onChange={(v) => saveField("description", v)} />
              </div>
            </Section>

            <Section label="Dimensions & Sizing">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field label="Ring Size" value={project.fields.size || ""} onChange={(v) => saveField("size", v)} />
                <Field label="Band Width" value={project.fields.bandWidth || ""} onChange={(v) => saveField("bandWidth", v)} />
                <Field label="Band Thickness" value={project.fields.bandThickness || ""} onChange={(v) => saveField("bandThickness", v)} />
                <Field label="Total Height" value={project.fields.totalHeight || ""} onChange={(v) => saveField("totalHeight", v)} />
                <Field label="Gender" value={project.fields.gender || ""} onChange={(v) => saveField("gender", v)} />
                <Field label="Weight (est.)" value={project.fields.weight || ""} onChange={(v) => saveField("weight", v)} />
              </div>
            </Section>

            <Section label="Metal">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field label="Metal" value={project.fields.metal || ""} onChange={(v) => saveField("metal", v)} />
                <Field label="Metal Karat" value={project.fields.metalKarat || ""} onChange={(v) => saveField("metalKarat", v)} />
                <Field label="Finish" value={project.fields.finish || ""} onChange={(v) => saveField("finish", v)} />
                <Field label="Plating" value={project.fields.plating || ""} onChange={(v) => saveField("plating", v)} />
              </div>
            </Section>

            <Section label="Gemstones" collapsed={collapseState.gems} onToggle={() => toggle("gems")} count={0}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field label="Main Gemstone" value={project.fields.mainGemstone || ""} onChange={(v) => saveField("mainGemstone", v)} />
                <Field label="Gemstone Shape" value={project.fields.gemstoneShape || ""} onChange={(v) => saveField("gemstoneShape", v)} />
                <Field label="Gemstone Size" value={project.fields.gemstoneSize || ""} onChange={(v) => saveField("gemstoneSize", v)} />
                <Field label="Gemstone Quality" value={project.fields.gemstoneQuality || ""} onChange={(v) => saveField("gemstoneQuality", v)} />
                <Field label="Setting Type" value={project.fields.settingType || ""} onChange={(v) => saveField("settingType", v)} />
                <Field label="Number of Stones" value={project.fields.numberOfStones || ""} onChange={(v) => saveField("numberOfStones", v)} />
                <Field label="Side Stones" value={project.fields.sideStones || ""} onChange={(v) => saveField("sideStones", v)} />
                <Field label="Total Carat Weight" value={project.fields.totalCaratWeight || ""} onChange={(v) => saveField("totalCaratWeight", v)} />
              </div>
            </Section>

            <Section label="Style Details" collapsed={collapseState.style} onToggle={() => toggle("style")}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field label="Band Style" value={project.fields.bandStyle || ""} onChange={(v) => saveField("bandStyle", v)} />
                <Field label="Ring Type" value={project.fields.ringType || ""} onChange={(v) => saveField("ringType", v)} />
                <Field label="Design Motif" value={project.fields.designMotif || ""} onChange={(v) => saveField("designMotif", v)} />
                <Field label="Texture" value={project.fields.texture || ""} onChange={(v) => saveField("texture", v)} />
                <Field label="Engraving" value={project.fields.engraving || ""} onChange={(v) => saveField("engraving", v)} />
                <Field label="Special Instructions" value={project.fields.specialNotes || ""} wide textarea onChange={(v) => saveField("specialNotes", v)} />
              </div>
            </Section>
          </>
        )}

        {/* ════════════════════════════════════════ */}
        {/* MATERIALS & COST TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "materials" && (
          <>
            <Section label="Bill of Materials" rightAction={<SmallBtn label="+ Add Line Item" onClick={handleBomAdd} />}>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 24px", gap: 8,
                padding: "0 0 8px", borderBottom: `2px solid ${C.border}`,
                fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label,
              }}>
                <span>Material</span><span>Specification</span><span style={{ textAlign: "right" }}>Qty</span>
                <span>Unit</span><span style={{ textAlign: "right" }}>$/Unit</span><span style={{ textAlign: "right" }}>Total</span>
                <span />
              </div>

              {/* Material rows */}
              {bom.filter((r) => r.category === "material").length > 0 && (
                <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.light, padding: "10px 0 2px" }}>Materials</div>
              )}
              {bom.filter((r) => r.category === "material").map((row) => (
                <MaterialRow key={row.id} row={row} onChange={handleBomChange} onDelete={() => handleBomDelete(row.id)} />
              ))}
              {bom.filter((r) => r.category === "material").length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 24px", gap: 8, padding: "6px 0 2px" }}>
                  <span style={{ gridColumn: "1 / 6", textAlign: "right", fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.mid }}>Materials Subtotal</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, textAlign: "right", color: C.mid }}>${materialTotal.toFixed(2)}</span>
                  <span />
                </div>
              )}

              {/* Labor rows */}
              {bom.filter((r) => r.category !== "material").length > 0 && (
                <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.light, padding: "10px 0 2px" }}>Labor & Services</div>
              )}
              {bom.filter((r) => r.category !== "material").map((row) => (
                <MaterialRow key={row.id} row={row} onChange={handleBomChange} onDelete={() => handleBomDelete(row.id)} />
              ))}
              {bom.filter((r) => r.category !== "material").length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 24px", gap: 8, padding: "6px 0 2px" }}>
                  <span style={{ gridColumn: "1 / 6", textAlign: "right", fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.mid }}>Labor Subtotal</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, textAlign: "right", color: C.mid }}>${laborTotal.toFixed(2)}</span>
                  <span />
                </div>
              )}

              {/* Grand total */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr 24px", gap: 8,
                padding: "14px 0 0", borderTop: `2px solid ${C.border}`, marginTop: 8,
                fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.black,
              }}>
                <span style={{ gridColumn: "1 / 6", textAlign: "right", letterSpacing: 2, textTransform: "uppercase", fontSize: 10.5 }}>Subtotal</span>
                <span style={{ fontFamily: MONO, textAlign: "right" }}>${bomSubtotal.toFixed(2)}</span>
                <span />
              </div>
            </Section>

            <Section label="Pricing">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field key={"mc-" + materialTotal} label="Material Cost" value={"$" + materialTotal.toFixed(2)} readOnly />
                <Field key={"lc-" + laborTotal} label="Labor Cost" value={"$" + laborTotal.toFixed(2)} readOnly />
                <Field label="Markup %" value={String(markup)} onChange={(v) => { const n = parseFloat(v.replace("%", "")) || 0; saveMarkup(n); }} />
                <Field key={"rp-" + retailPrice} label="Retail Price" value={"$" + retailPrice.toFixed(2)} readOnly />
                <Field label="Client Budget" value={project.fields.budget || ""} onChange={(v) => saveField("budget", v)} />
                <Field label="Deposit Received" value={project.fields.depositReceived || ""} onChange={(v) => saveField("depositReceived", v)} />
              </div>
            </Section>

            <Section label="Metal Market" collapsed={collapseState.market} onToggle={() => toggle("market")}>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                <Field label="Gold Spot (oz)" value={String(metalMarket.goldSpot.toFixed(2))} mono onChange={(v) => {
                  const n = parseFloat(v.replace(/[$,]/g, "")) || 0;
                  saveMetalMarket({ ...metalMarket, goldSpot: n });
                }} />
                <Field label="14k Per Gram" value={String(metalMarket.perGram14k.toFixed(2))} mono onChange={(v) => {
                  const n = parseFloat(v.replace(/[$,]/g, "")) || 0;
                  saveMetalMarket({ ...metalMarket, perGram14k: n });
                  // Also update metal row unitCost in BOM
                  saveBom(bom.map((r) => r.id === "metal" ? { ...r, unitCost: n } : r));
                }} />
                <InfoField label="Last Updated" value={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
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
            <Section label="CAD Files" count={(filesByCategory.cad || []).length || 3} rightAction={<SmallBtn label="+ Upload CAD" onClick={() => triggerUpload("cad")} />}>
              <FileCard name="crown-thorns-v3.step" type="cad" size="4.2 MB" date="Mar 3, 2026" status="Current" />
              <FileCard name="crown-thorns-v2.step" type="cad" size="3.8 MB" date="Feb 28, 2026" />
              <FileCard name="crown-thorns-v1.step" type="cad" size="3.1 MB" date="Feb 25, 2026" />
            </Section>

            <Section label="3D Models" count={(storedProject?.models3d || []).length + ((filesByCategory.model3d || []).length || 0)} rightAction={
              <div style={{ display: "flex", gap: 6 }}>
                {storedGeneratedImages.length > 0 && (
                  <SmallBtn
                    label={is3dGenerating ? "Generating..." : "🧊 Generate 3D"}
                    primary
                    onClick={() => {
                      const lastImg = storedGeneratedImages[storedGeneratedImages.length - 1];
                      if (lastImg?.url) handleGenerate3D(lastImg.url);
                    }}
                  />
                )}
                <SmallBtn label="+ Upload Model" onClick={() => triggerUpload("3d")} />
              </div>
            }>
              {meshy3dError && (
                <div style={{ padding: "10px 14px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: RS, marginBottom: 10 }}>
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.coral }}>{meshy3dError}</div>
                </div>
              )}
              {is3dGenerating && (
                <div style={{ padding: "30px 0", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.coral, borderRadius: "50%", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.mid, letterSpacing: 1.5, textTransform: "uppercase" }}>Generating 3D with Meshy AI...</div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: C.light, marginTop: 4 }}>This typically takes 2–5 minutes</div>
                </div>
              )}
              {(storedProject?.models3d || []).map((m, i) => (
                <div key={m.taskId || i} style={{ marginBottom: 16 }}>
                  {m.modelUrls?.glb && (
                    <div style={{ borderRadius: RS, overflow: "hidden", border: `1px solid ${C.border}`, marginBottom: 8 }}>
                      <model-viewer
                        src={m.modelUrls.glb}
                        poster={m.thumbnailUrl || undefined}
                        alt="3D jewelry model"
                        auto-rotate
                        camera-controls
                        shadow-intensity="1"
                        style={{ width: "100%", height: 280, background: "#f5f5f3" }}
                      />
                    </div>
                  )}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {m.modelUrls?.glb && <a href={m.modelUrls.glb} target="_blank" rel="noopener noreferrer" style={dl3dStyle}>⬇ GLB</a>}
                    {m.modelUrls?.fbx && <a href={m.modelUrls.fbx} target="_blank" rel="noopener noreferrer" style={dl3dStyle}>⬇ FBX</a>}
                    {m.modelUrls?.usdz && <a href={m.modelUrls.usdz} target="_blank" rel="noopener noreferrer" style={dl3dStyle}>⬇ USDZ</a>}
                    {m.modelUrls?.obj && <a href={m.modelUrls.obj} target="_blank" rel="noopener noreferrer" style={dl3dStyle}>⬇ OBJ</a>}
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.light, alignSelf: "center", marginLeft: 4 }}>
                      {new Date(m.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
              {(storedProject?.models3d || []).length === 0 && !is3dGenerating && (
                <>
                  <FileCard name="crown-thorns-render.stl" type="model" size="12.6 MB" date="Mar 2, 2026" status="Current" />
                  <FileCard name="crown-thorns-print.stl" type="model" size="8.4 MB" date="Mar 1, 2026" />
                </>
              )}
            </Section>

            <Section label="Production Notes">
              <Field label="Casting Method" value="Lost Wax" />
              <div style={{ height: 12 }} />
              <Field label="Production Notes" value="Thorn tips need extra attention during finishing — fragile points. Double-check wall thickness on inner band before casting. Client prefers slightly matte finish on thorn surfaces only." wide textarea />
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
            {/* Chat Channels */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <Pill label="CAD Designer" color={C.blue} bg={C.blueBg} border={C.blueBorder} />
              <Pill label="Client" color={C.green} bg={C.greenBg} border={C.greenBorder} />
              <Pill label="Manufacturer" color={C.amber} bg={C.amberBg} border={C.amberBorder} />
              <Pill label="Internal Notes" color={C.purple} bg={C.purpleBg} border={C.purpleBorder} />
            </div>

            <Section label="CAD Designer Thread" style={{ padding: 0 }}>
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
                <SmallBtn label="Send" primary onClick={() => void 0} />
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
            <Section label="Invoices & Quotes" count={2} rightAction={<SmallBtn label="+ New Invoice" onClick={() => void 0} />}>
              <FileCard name="Quote-CrownThorns-001.pdf" type="pdf" size="124 KB" date="Feb 24, 2026" status="Current" />
              <FileCard name="Deposit-Invoice-001.pdf" type="pdf" size="98 KB" date="Feb 25, 2026" />
            </Section>

            <Section label="Certificates & Grading" count={0} rightAction={<SmallBtn label="+ Upload" onClick={() => void 0} />}>
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginBottom: 4 }}>No certificates uploaded</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: C.light }}>Upload stone grading reports, metal assay certs, or appraisals</div>
              </div>
            </Section>

            <Section label="Client Agreements" count={1} rightAction={<SmallBtn label="+ Upload" onClick={() => void 0} />}>
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

            <Section label="All Project Files" count={projectFiles.length || 8} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("other")} />}>
              {projectFiles.length > 0 ? (
                projectFiles.map((f) => (
                  <FileCard
                    key={f.id}
                    name={f.name}
                    type={getFileTypeKey(f)}
                    size={formatSize(f.size)}
                    date={new Date(f.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                ))
              ) : (
                <>
                  <FileCard name="crown-thorns-v3.step" type="cad" size="4.2 MB" date="Mar 3" />
                  <FileCard name="crown-thorns-render.stl" type="model" size="12.6 MB" date="Mar 2" />
                  <FileCard name="render-front-v2.png" type="image" size="2.1 MB" date="Mar 1" />
                  <FileCard name="render-side-v2.png" type="image" size="1.8 MB" date="Mar 1" />
                  <FileCard name="concept-ai-001.png" type="image" size="890 KB" date="Feb 23" />
                  <FileCard name="Quote-CrownThorns-001.pdf" type="pdf" size="124 KB" date="Feb 24" />
                  <FileCard name="Custom-Order-Agreement.pdf" type="doc" size="210 KB" date="Feb 23" />
                  <FileCard name="client-reference-photo.jpg" type="image" size="1.4 MB" date="Feb 23" />
                </>
              )}
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

      {/* ─── AI Chat Sidebar ─── */}
      {chatOpen && (
        <div style={{
          width: 370, flexShrink: 0, borderLeft: `1px solid ${C.border}`, background: C.section,
          display: "flex", flexDirection: "column", height: "calc(100vh - 240px)", position: "sticky", top: 240,
        }}>
          {/* Chat header */}
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: C.white }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: C.sidebarBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: SERIF, fontSize: 11, color: C.sidebarActive, fontWeight: 700 }}>Z</span>
              </div>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600, color: C.black, letterSpacing: 2, textTransform: "uppercase" }}>Imagine</div>
                <div style={{ fontFamily: SANS, fontSize: 9, color: C.light }}>
                  {chatSource === "imagine" ? "Continuing from Imagine" : "AI Design Consultant"}
                </div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.light, fontSize: 16 }}>{"\u2715"}</button>
          </div>

          {/* Chat messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
            {chatMessages.length === 0 && !chatLoading && (
              <div style={{ textAlign: "center", padding: "30px 16px" }}>
                <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, lineHeight: 1.7 }}>
                  Ask me to update specs, suggest materials, refine the design, generate images, or anything else about this piece.
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i}>
                <AIChatMessage message={msg.content} isUser={msg.role === "user"} />
                {msg.fieldUpdates?.map((u, j) => (
                  <FieldUpdateToast key={j} field={u.field} value={u.value} />
                ))}
                {msg.suggestedTool && TOOL_INFO[msg.suggestedTool] && (
                  <div style={{ padding: "3px 0 3px 30px" }}>
                    <div onClick={() => {
                      if (msg.suggestedTool === "render" || msg.suggestedTool === "sketch") handleGenerateDesign(msg.suggestedTool);
                    }} style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px",
                      background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: RS,
                      cursor: "pointer", transition: "all 0.2s",
                    }}>
                      <span style={{ fontSize: 12 }}>{TOOL_INFO[msg.suggestedTool].icon}</span>
                      <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue }}>
                        {TOOL_INFO[msg.suggestedTool].label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {chatLoading && <TypingDots />}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "flex-end", background: C.white }}>
            <div style={{ flex: 1, background: C.section, borderRadius: RS, border: `1px solid ${C.border}`, transition: "border-color 0.2s" }}>
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                placeholder="Ask about this project..."
                rows={1}
                style={{
                  width: "100%", padding: "10px 12px", fontFamily: SANS, fontSize: 12,
                  color: C.dark, background: "transparent", border: "none", resize: "none",
                  lineHeight: 1.5, minHeight: 38, maxHeight: 100, overflowY: "auto",
                }}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px"; }}
                onFocus={(e) => e.target.parentElement.style.borderColor = C.borderHover}
                onBlur={(e) => e.target.parentElement.style.borderColor = C.border}
                disabled={chatLoading}
              />
            </div>
            <button
              onClick={sendChatMessage}
              disabled={chatLoading || !chatInput.trim()}
              style={{
                width: 36, height: 36, borderRadius: RS, border: "none",
                background: chatInput.trim() ? C.coral : C.border,
                color: C.white, cursor: chatInput.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      </div>{/* end content + sidebar row */}

      {/* ─── Image Preview Modal ─── */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.82)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", cursor: "zoom-out",
        }}>
          <button onClick={() => setPreviewImage(null)} style={{
            position: "absolute", top: 18, right: 24, background: "none", border: "none",
            color: "#fff", fontSize: 28, cursor: "pointer", lineHeight: 1,
          }}>{"\u2715"}</button>
          <img
            src={previewImage.src} alt={previewImage.label || "Preview"}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "82vh", objectFit: "contain", borderRadius: R, cursor: "default" }}
          />
          {previewImage.label && (
            <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 12, color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>
              {previewImage.label}
            </div>
          )}
        </div>
      )}
    </>
  );
}
