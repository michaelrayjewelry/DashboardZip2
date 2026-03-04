import { useState, useEffect, useRef, useCallback } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";
import {
  getProject, updateProject, getProjectFiles, getProjectFilesByCategory,
  uploadFileToProject, getFileBlobURL, FILE_CATEGORIES,
  saveGeneratedImageToProject, saveChatHistory, getChatHistory,
} from "../lib/storage";
import { generateImage, chatWithClaudeJSON } from "../lib/api";

// ─── SYSTEM PROMPTS ───

// Used for projects that originated from Imagine (preserves conversation continuity)
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

CORE FLOW — guide the conversation through these areas naturally (not rigidly):
1. VISION — What's the piece? What's the inspiration? Who's it for?
2. TYPE & STYLE — Ring, pendant, bracelet, etc. Style era, motifs, mood.
3. MATERIALS — Metal type, karat, finish. Any gemstones?
4. DIMENSIONS — Size, weight targets, proportions.
5. TECHNICAL — Manufacturing notes, special considerations.
6. BUDGET & TIMELINE — Price range, deadline.
7. CLIENT — Who's the client? Contact info?

TOOLS — When appropriate, suggest ZipJeweler tools:
- "Sketch to Jewelry" — when they describe a visual concept
- "AI Render" — when specs are solid enough to visualize
- "Cost Estimate" — when materials are discussed
- "3D Model" — when CAD is needed
- "File Hub" — when organizing assets

RESPONSE FORMAT:
You must ALWAYS respond with valid JSON only. No markdown, no backticks, no preamble. Just the JSON object:
{
  "message": "Your conversational response here",
  "extracted": {
    "name": "project name if mentioned or you can infer one",
    "type": "ring|pendant|bracelet|necklace|earrings|brooch|cufflinks|other",
    "description": "running description of the piece",
    "metal": "e.g. 14k Yellow Gold",
    "metalKarat": "e.g. 14k",
    "finish": "e.g. High Polish, Matte, Brushed, Satin",
    "mainGemstone": "e.g. 1.5ct Round Diamond",
    "gemstoneShape": "e.g. Round Brilliant",
    "settingType": "e.g. Prong, Bezel, Pavé, Channel",
    "sideStones": "e.g. 0.3ct Pavé Diamonds",
    "size": "ring size, chain length, etc.",
    "bandWidth": "e.g. 4mm",
    "bandStyle": "e.g. Comfort Fit, Knife Edge, Cathedral",
    "weight": "estimated weight",
    "budget": "budget range",
    "timeline": "deadline or timeline",
    "clientName": "client name",
    "clientEmail": "client email",
    "collection": "collection name if mentioned",
    "designMotif": "e.g. Floral, Art Deco, Serpentine",
    "castingMethod": "e.g. Lost Wax",
    "specialNotes": "any special manufacturing or design notes"
  },
  "suggestedTool": "sketch|render|estimate|3d|filehub|null",
  "suggestedToolReason": "why this tool would help right now",
  "projectReadiness": 0-100
}

RULES FOR "extracted":
- Only include fields that have been explicitly mentioned or can be clearly inferred
- Leave fields as null if not yet discussed
- Update fields as the conversation evolves — later info overrides earlier
- The "description" field should be a running summary that gets richer over time
- "projectReadiness" is your estimate of how complete the project folder is (0-100)

Remember: You are building a REAL production project folder. Every detail matters. Guide them to completeness but never force it — some pieces are simple, some are complex.`;

// Used for projects created manually (not from Imagine)
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
    "name": "project name if changed",
    "type": "ring|pendant|bracelet|necklace|earrings|brooch|cufflinks|other",
    "description": "updated description",
    "metal": "e.g. 14k Yellow Gold",
    "metalKarat": "e.g. 14k",
    "finish": "e.g. High Polish, Matte, Brushed",
    "mainGemstone": "e.g. 1.5ct Round Diamond",
    "gemstoneShape": "e.g. Round Brilliant",
    "settingType": "e.g. Prong, Bezel, Pavé",
    "sideStones": "e.g. 0.3ct Pavé Diamonds",
    "size": "ring size, chain length, etc.",
    "bandWidth": "e.g. 4mm",
    "bandStyle": "e.g. Comfort Fit, Knife Edge",
    "weight": "estimated weight",
    "budget": "budget range",
    "timeline": "deadline or timeline",
    "clientName": "client name",
    "clientEmail": "client email",
    "collection": "collection name",
    "designMotif": "e.g. Floral, Art Deco",
    "castingMethod": "e.g. Lost Wax",
    "specialNotes": "special notes"
  },
  "suggestedTool": "sketch|render|estimate|3d|filehub|null",
  "suggestedToolReason": "why this tool would help right now"
}

RULES FOR "extracted":
- Only include fields that the user explicitly wants to change or that you are suggesting changes for
- Leave fields as null if not being updated
- Only suggest field changes when the user asks for them or when it naturally follows from the conversation`;

// Hidden system messages that should not appear in the chat display
const HIDDEN_MSG_PREFIXES = [
  "Start the conversation",
  "The user is working on a project called",
];
function isHiddenMessage(content) {
  return HIDDEN_MSG_PREFIXES.some((p) => content.startsWith(p));
}

/**
 * Reconstruct display messages from raw conversation history.
 * Extracts fieldUpdates, suggestedTool, etc. from assistant JSON.
 */
function rebuildDisplayMessages(history) {
  const msgs = [];
  for (const h of history) {
    if (h.role === "user") {
      if (!isHiddenMessage(h.content)) {
        msgs.push({ role: "user", content: h.content });
      }
    } else if (h.role === "assistant") {
      try {
        const parsed = JSON.parse(h.content);
        // Reconstruct field updates by comparing with previous state
        const fieldUpdates = [];
        if (parsed.extracted) {
          Object.entries(parsed.extracted).forEach(([key, val]) => {
            if (val) fieldUpdates.push({ field: key, value: val });
          });
        }
        msgs.push({
          role: "assistant",
          content: parsed.message,
          fieldUpdates: fieldUpdates.length > 0 ? fieldUpdates : undefined,
          suggestedTool: parsed.suggestedTool || undefined,
          suggestedToolReason: parsed.suggestedToolReason || undefined,
        });
      } catch {
        msgs.push({ role: "assistant", content: h.content });
      }
    }
  }
  return msgs;
}

// ─── FIELD CONFIG ───
const FIELD_LABELS = {
  name: "Project Name", type: "Jewelry Type", description: "Description",
  metal: "Metal", metalKarat: "Karat", finish: "Finish",
  mainGemstone: "Main Gemstone", gemstoneShape: "Gemstone Shape", settingType: "Setting Type",
  sideStones: "Side Stones", size: "Size", bandWidth: "Band Width",
  bandStyle: "Band Style", weight: "Est. Weight", budget: "Budget",
  timeline: "Timeline", clientName: "Client Name", clientEmail: "Client Email",
  collection: "Collection", designMotif: "Design Motif", castingMethod: "Casting Method",
  specialNotes: "Special Notes",
};

const FIELD_GROUPS = {
  "Details": ["name", "type", "description", "collection", "designMotif"],
  "Materials": ["metal", "metalKarat", "finish"],
  "Gemstones": ["mainGemstone", "gemstoneShape", "settingType", "sideStones"],
  "Dimensions": ["size", "bandWidth", "bandStyle", "weight"],
  "Production": ["castingMethod", "specialNotes", "budget", "timeline"],
  "Client": ["clientName", "clientEmail"],
};

const TOOL_INFO = {
  sketch: { icon: "\u270F\uFE0F", label: "Sketch to Jewelry", desc: "Convert concept into a photorealistic jewelry image" },
  render: { icon: "\uD83D\uDDBC", label: "AI Render", desc: "Generate a studio-quality render of the piece" },
  estimate: { icon: "\uD83D\uDCB0", label: "Cost Estimate", desc: "Calculate material and labor costs" },
  "3d": { icon: "\uD83E\uDDCA", label: "3D Model Gen", desc: "Generate a production-ready 3D model" },
  filehub: { icon: "\uD83D\uDCC1", label: "File Hub", desc: "Organize all project assets" },
};

// ─── PIPELINE STAGES ───
const PIPELINE = [
  { key: "concept", label: "Concept", icon: "\uD83D\uDCA1" },
  { key: "design", label: "Design", icon: "\u270F\uFE0F" },
  { key: "cad", label: "CAD", icon: "\uD83D\uDCD0" },
  { key: "approval", label: "Approval", icon: "\u2713" },
  { key: "casting", label: "Casting", icon: "\uD83D\uDD25" },
  { key: "setting", label: "Setting", icon: "\uD83D\uDC8E" },
  { key: "finishing", label: "Finishing", icon: "\u2728" },
  { key: "delivery", label: "Delivery", icon: "\uD83D\uDCE6" },
];

// ─── SHARED SUB-COMPONENTS ───

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

function Pill({ label, color, bg, border, small }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: small ? 9 : 9.5, fontWeight: 600, letterSpacing: small ? 1.5 : 2, textTransform: "uppercase",
      padding: small ? "3px 8px" : "4px 12px", borderRadius: RS, color, background: bg, border: `1px solid ${border}`,
      display: "inline-block",
    }}>{label}</span>
  );
}

function SmallBtn({ label, onClick, primary, icon, disabled }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={disabled ? undefined : onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
      padding: icon ? "7px 14px" : "7px 18px", display: "inline-flex", alignItems: "center", gap: 6,
      background: primary ? C.coral : C.white, color: primary ? C.white : C.mid,
      border: primary ? "none" : `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: RS, cursor: disabled ? "default" : "pointer", transition: "all 0.2s",
      opacity: disabled ? 0.5 : 1,
      ...(primary && h && !disabled ? { background: C.coralHover } : {}),
    }}>{icon}{label}</button>
  );
}

function ImageSlot({ label, hasImage, src, large, onClick }) {
  const [h, setH] = useState(false);
  const size = large ? 280 : 160;
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      width: size, height: size, borderRadius: RS, overflow: "hidden",
      background: hasImage ? `url(${src}) center/cover` : (h ? C.white : C.border),
      border: `1px solid ${h ? C.borderHover : C.border}`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "all 0.2s", position: "relative", flexShrink: 0,
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

// ─── EDITABLE FIELD ───
function EditableField({ label, value, fieldKey, onChange, wide, textarea, mono, select, options }) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => { setLocalVal(value || ""); }, [value]);
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (localVal !== (value || "")) {
      onChange(fieldKey, localVal);
    }
  };

  const sharedStyle = {
    width: "100%", padding: "8px 2px", fontFamily: mono ? MONO : SANS, fontSize: 13, color: C.dark,
    background: editing ? "rgba(200,216,160,0.08)" : "transparent",
    border: "none", borderBottom: `1px solid ${editing ? C.sidebarActive : C.borderInput}`,
    outline: "none", borderRadius: 0, transition: "all 0.2s",
  };

  if (select && !editing) {
    return (
      <div style={{ flex: wide ? "1 1 100%" : "1 1 calc(50% - 16px)", minWidth: wide ? "100%" : 180 }}>
        <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 4 }}>{label}</div>
        <select
          value={localVal}
          onChange={(e) => { setLocalVal(e.target.value); onChange(fieldKey, e.target.value); }}
          style={{ ...sharedStyle, cursor: "pointer", appearance: "auto" }}
        >
          <option value="">—</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 calc(50% - 16px)", minWidth: wide ? "100%" : 180 }}>
      <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 4 }}>{label}</div>
      {textarea ? (
        <textarea
          ref={inputRef}
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onFocus={() => setEditing(true)}
          onBlur={commit}
          rows={3}
          style={{ ...sharedStyle, resize: "vertical", lineHeight: 1.6 }}
          placeholder="Click to edit..."
        />
      ) : (
        <input
          ref={inputRef}
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onFocus={() => setEditing(true)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") { e.target.blur(); } }}
          style={sharedStyle}
          placeholder="Click to edit..."
        />
      )}
    </div>
  );
}

// ─── STATUS PILL ───
const STATUS_COLORS = {
  draft: { color: C.light, bg: C.section, border: C.border },
  "in-progress": { color: C.blue, bg: C.blueBg, border: C.blueBorder },
  review: { color: C.amber, bg: C.amberBg, border: C.amberBorder },
  complete: { color: C.green, bg: C.greenBg, border: C.greenBorder },
};

// ─── PIPELINE BAR ───
function PipelineBar({ current, onChange }) {
  const idx = PIPELINE.findIndex((p) => p.key === current);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "stretch" }}>
      {PIPELINE.map((stage, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={stage.key} onClick={() => onChange(stage.key)} style={{
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

// ─── CHAT MESSAGE (in-project bot) ───
function ChatMessage({ message, isUser }) {
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      padding: "4px 0", gap: 8, alignItems: "flex-start",
    }}>
      {!isUser && (
        <div style={{
          width: 24, height: 24, borderRadius: 12, background: C.sidebarBg, flexShrink: 0, marginTop: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: SERIF, fontSize: 10, color: C.sidebarActive, fontWeight: 700,
        }}>Z</div>
      )}
      <div style={{
        maxWidth: isUser ? "80%" : "85%", padding: "10px 14px",
        borderRadius: isUser ? `${R}px ${R}px 4px ${R}px` : `${R}px ${R}px ${R}px 4px`,
        background: isUser ? C.sidebarBg : C.white,
        border: isUser ? "none" : `1px solid ${C.border}`,
      }}>
        <div style={{
          fontFamily: SANS, fontSize: 12.5, lineHeight: 1.65,
          color: isUser ? "#E0E0D8" : C.dark, whiteSpace: "pre-wrap",
        }}>{message}</div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 12, background: C.sidebarBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: SERIF, fontSize: 10, color: C.sidebarActive, fontWeight: 700,
        }}>Z</div>
        <div style={{ display: "flex", gap: 3, padding: "8px 12px", background: C.section, borderRadius: R, border: `1px solid ${C.border}` }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: 3, background: C.light,
              animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FieldUpdateToast({ field, value }) {
  return (
    <div style={{ padding: "2px 0 2px 32px" }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px",
        background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 20,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <span style={{ fontFamily: SANS, fontSize: 9.5, color: C.green, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {FIELD_LABELS[field] || field}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.mid }}>{"\u2192"} {value}</span>
      </div>
    </div>
  );
}

// ─── TABS ───
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "specs", label: "Specifications" },
  { key: "assets", label: "Assets & Files" },
  { key: "ai", label: "AI Assistant" },
];

// ═══════════════════════════════════════
// PROJECT VIEW – MAIN COMPONENT
// ═══════════════════════════════════════
export default function ProjectView({ onBack, projectId }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loaded, setLoaded] = useState(false);
  const [collapseState, setCollapse] = useState({});
  const [projectFiles, setProjectFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState({});
  const uploadRef = useRef(null);
  const [uploadContext, setUploadContext] = useState("reference");
  const [genState, setGenState] = useState({ loading: false, error: null, imageUrl: null });
  const [fields, setFields] = useState({});
  const [projectName, setProjectName] = useState("");
  const [projectStatus, setProjectStatus] = useState("draft");
  const [projectStage, setProjectStage] = useState("concept");
  const [heroImage, setHeroImage] = useState(null);

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [chatSource, setChatSource] = useState(null); // "imagine" or null
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const toggle = (k) => setCollapse((s) => ({ ...s, [k]: !s[k] }));

  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  // Load project data
  const storedProject = projectId ? getProject(projectId) : null;

  useEffect(() => {
    if (storedProject) {
      setFields(storedProject.fields || {});
      setProjectName(storedProject.name || "Untitled Project");
      setProjectStatus(storedProject.status || "draft");
      setProjectStage(storedProject.stage || "concept");
      setChatSource(storedProject.chatSource || null);
      // Load existing chat history and fully reconstruct display messages
      const history = getChatHistory(projectId);
      if (history && history.length > 0) {
        setConversationHistory(history);
        setChatMessages(rebuildDisplayMessages(history));
      }
    }
  }, [projectId]);

  // Load files
  useEffect(() => {
    if (projectId) setProjectFiles(getProjectFiles(projectId));
  }, [projectId]);

  // Determine hero image (first reference, render, or generated image)
  useEffect(() => {
    const findHero = async () => {
      const cats = getProjectFilesByCategory(projectId);
      const candidates = [...(cats.reference || []), ...(cats.render || []), ...(cats.sketch || [])];
      // Also check generated images
      const genImages = storedProject?.generatedImages || [];

      for (const f of candidates) {
        const url = f.url || (f.blobKey ? await getFileBlobURL(f.blobKey) : null);
        if (url) { setHeroImage(url); return; }
      }
      if (genImages.length > 0) {
        setHeroImage(genImages[genImages.length - 1].url);
        return;
      }
      setHeroImage(null);
    };
    if (projectId) findHero();
  }, [projectId, projectFiles]);

  // Generate blob URLs
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
    return () => { Object.values(fileUrls).forEach(URL.revokeObjectURL); };
  }, [projectFiles]);

  // Scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatLoading]);

  // ─── Field change handler (auto-save) ───
  const handleFieldChange = useCallback((key, value) => {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      if (projectId) {
        const updates = { fields: next };
        if (key === "name") updates.name = value;
        updateProject(projectId, updates);
      }
      return next;
    });
    if (key === "name") setProjectName(value);
  }, [projectId]);

  const handleStatusChange = useCallback((status) => {
    setProjectStatus(status);
    if (projectId) updateProject(projectId, { status });
  }, [projectId]);

  const handleStageChange = useCallback((stage) => {
    setProjectStage(stage);
    if (projectId) updateProject(projectId, { stage });
  }, [projectId]);

  const handleNameChange = useCallback((name) => {
    setProjectName(name);
    if (projectId) updateProject(projectId, { name });
  }, [projectId]);

  // ─── File operations ───
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

  // ─── Image generation ───
  const handleGenerateDesign = async (style) => {
    if (genState.loading) return;
    setGenState({ loading: true, error: null, imageUrl: null });
    try {
      const parts = [];
      if (style === "render") {
        parts.push("Photorealistic studio product photograph, white background, professional jewelry lighting");
      } else {
        parts.push("Photorealistic custom jewelry product photo, studio lighting, white background");
      }
      if (fields.type) parts.push(fields.type);
      if (fields.name || projectName) parts.push(fields.name || projectName);
      if (fields.description) parts.push(fields.description);
      if (fields.metal) parts.push(`made of ${fields.metal}`);
      if (fields.metalKarat) parts.push(fields.metalKarat);
      if (fields.mainGemstone) parts.push(`featuring ${fields.mainGemstone}`);
      if (fields.designMotif) parts.push(`${fields.designMotif} design motif`);
      if (fields.finish) parts.push(`${fields.finish} finish`);
      const prompt = parts.join(", ");

      const result = await generateImage({ prompt, aspectRatio: "1:1", resolution: "1080p" });
      if (result.images?.length) {
        const url = result.images[0].url;
        setGenState({ loading: false, error: null, imageUrl: url });
        setHeroImage(url);
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

  // ─── AI Chat (in-project Imagine bot) ───
  // Use Imagine prompt for projects that originated from Imagine, otherwise use the project prompt
  const getSystemPrompt = useCallback(() => {
    return chatSource === "imagine" ? IMAGINE_SYSTEM_PROMPT : PROJECT_SYSTEM_PROMPT;
  }, [chatSource]);

  const buildContextMessage = () => {
    const filledFields = Object.entries(fields).filter(([_, v]) => v);
    if (filledFields.length === 0) return "";
    return "\n\n[CURRENT PROJECT STATE]\n" + filledFields.map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`).join("\n");
  };

  const startChat = useCallback(async () => {
    if (chatMessages.length > 0) return; // Already has messages (loaded from history or started)
    setChatLoading(true);
    try {
      const contextMsg = `The user is working on a project called "${projectName}". Here are the current project details:${buildContextMessage()}\n\nGreet them briefly and ask how you can help with this project.`;
      const parsed = await chatWithClaudeJSON({
        system: getSystemPrompt(),
        messages: [{ role: "user", content: contextMsg }],
        maxTokens: 800,
        fallback: { extracted: {}, suggestedTool: null },
      });
      const aiMsg = { role: "assistant", content: parsed.message || "How can I help with this project?" };
      setChatMessages([aiMsg]);
      const history = [
        { role: "user", content: contextMsg },
        { role: "assistant", content: JSON.stringify(parsed) },
      ];
      setConversationHistory(history);
      if (projectId) saveChatHistory(projectId, history);
    } catch {
      setChatMessages([{ role: "assistant", content: "How can I help refine this project?" }]);
    }
    setChatLoading(false);
  }, [projectName, fields, chatMessages.length, projectId, getSystemPrompt]);

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

      // Apply extracted field updates
      const fieldUpdates = [];
      if (parsed.extracted) {
        Object.entries(parsed.extracted).forEach(([key, val]) => {
          if (val && val !== fields[key]) {
            fieldUpdates.push({ field: key, value: val });
            handleFieldChange(key, val);
          }
        });
      }

      const aiMsg = {
        role: "assistant", content: parsed.message,
        fieldUpdates,
        suggestedTool: parsed.suggestedTool,
        suggestedToolReason: parsed.suggestedToolReason,
      };
      setChatMessages((prev) => [...prev, aiMsg]);

      const updatedHistory = [...newHistory, { role: "assistant", content: JSON.stringify(parsed) }];
      setConversationHistory(updatedHistory);
      if (projectId) saveChatHistory(projectId, updatedHistory);
    } catch {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "I had a brief connection issue \u2014 could you repeat that?" }]);
    }
    setChatLoading(false);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [chatInput, chatLoading, conversationHistory, fields, projectId, handleFieldChange, getSystemPrompt]);

  // ─── Derived data ───
  const filesByCategory = projectId ? getProjectFilesByCategory(projectId) : {};
  const storedGeneratedImages = storedProject?.generatedImages || [];
  const getFileUrl = (f) => f.url || (f.blobKey ? fileUrls[f.blobKey] : null);
  const getFileTypeKey = (f) => {
    const catMap = { reference: "image", sketch: "image", render: "image", marketing: "image", cad: "cad", model3d: "model", document: "doc", certificate: "cert", other: "doc" };
    return catMap[f.category] || "doc";
  };
  const formatSize = (bytes) => {
    if (!bytes) return "\u2014";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const created = storedProject ? new Date(storedProject.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "\u2014";
  const updated = storedProject ? new Date(storedProject.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "\u2014";
  const sc = STATUS_COLORS[projectStatus] || STATUS_COLORS.draft;

  return (
    <div style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s" }}>
      {/* Hidden file input */}
      <input
        ref={uploadRef} type="file" multiple
        accept="image/*,.pdf,.step,.stp,.stl,.obj,.doc,.docx,.xlsx,.csv"
        style={{ display: "none" }}
        onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) await handleFileUpload(files, uploadContext);
          e.target.value = "";
        }}
      />

      {/* ─── PRODUCT CARD HEADER ─── */}
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 40 }}>
        {/* Back nav */}
        <div style={{ padding: "16px 44px 0" }}>
          <span onClick={onBack} style={{
            fontFamily: SANS, fontSize: 11, color: C.light, letterSpacing: 1.5,
            textTransform: "uppercase", cursor: "pointer", transition: "color 0.2s",
          }}>{"\u2190"} Back to Projects</span>
        </div>

        {/* Product Card: Hero image + Info side-by-side */}
        <div style={{ padding: "20px 44px 0", display: "flex", gap: 32, alignItems: "flex-start" }}>
          {/* Hero Image */}
          <div style={{
            width: 220, height: 220, borderRadius: R, overflow: "hidden", flexShrink: 0,
            background: heroImage ? `url(${heroImage}) center/cover` : C.section,
            border: `1px solid ${C.border}`, position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {!heroImage && (
              <div style={{ textAlign: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                </svg>
                <div style={{ fontFamily: SANS, fontSize: 9, color: C.light, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 6 }}>No Image Yet</div>
              </div>
            )}
            {/* Generate button overlay */}
            <div onClick={() => handleGenerateDesign("render")} style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "10px", background: "rgba(46,46,42,0.85)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: genState.loading ? "default" : "pointer", transition: "all 0.2s",
            }}>
              {genState.loading ? (
                <div style={{
                  width: 14, height: 14, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: "#fff",
                  borderRadius: "50%", animation: "spin 0.8s linear infinite",
                }} />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C8D8A0" strokeWidth="2">
                  <path d="M6 3h12l4 6-10 13L2 9z" />
                </svg>
              )}
              <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#C8D8A0" }}>
                {genState.loading ? "Generating..." : "AI Render"}
              </span>
            </div>
          </div>

          {/* Info Panel */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Editable name */}
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => handleNameChange(projectName)}
              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
              style={{
                fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: C.black,
                letterSpacing: 5, textTransform: "uppercase", lineHeight: 1.15,
                background: "transparent", border: "none", outline: "none", width: "100%",
                padding: "0 0 4px", borderBottom: `1px solid transparent`,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderBottom = `1px solid ${C.sidebarActive}`}
              onBlurCapture={(e) => e.target.style.borderBottom = `1px solid transparent`}
            />

            {/* Editable collection line */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <input
                value={fields.collection || ""}
                onChange={(e) => setFields((p) => ({ ...p, collection: e.target.value }))}
                onBlur={() => handleFieldChange("collection", fields.collection || "")}
                placeholder="Collection name"
                style={{
                  fontFamily: SANS, fontSize: 12, color: C.light, background: "transparent",
                  border: "none", outline: "none", letterSpacing: 1, padding: 0, width: 140,
                }}
              />
              <span style={{ color: C.border }}>&middot;</span>
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.light }}>Created {created}</span>
              <span style={{ color: C.border }}>&middot;</span>
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.light }}>Updated {updated}</span>
            </div>

            {/* Quick info grid */}
            <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
              {[
                { label: "Type", key: "type", value: fields.type },
                { label: "Metal", key: "metal", value: fields.metalKarat ? `${fields.metalKarat} ${fields.metal || ""}`.trim() : fields.metal },
                { label: "Weight", key: "weight", value: fields.weight },
                { label: "Budget", key: "budget", value: fields.budget },
              ].map((s) => (
                <div key={s.label} style={{
                  background: C.section, borderRadius: RS, border: `1px solid ${C.border}`,
                  padding: "12px 16px", textAlign: "center", minWidth: 100, flex: "1 1 0",
                }}>
                  <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: s.value ? C.black : C.border }}>{s.value || "\u2014"}</div>
                </div>
              ))}
            </div>

            {/* Status + Actions row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
              <select
                value={projectStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  fontFamily: SANS, fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase",
                  padding: "8px 28px 8px 14px", color: sc.color, background: sc.bg,
                  border: `1px solid ${sc.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
                }}
              >
                <option value="draft">Draft</option>
                <option value="in-progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="complete">Complete</option>
              </select>
              <SmallBtn label="+ Upload" onClick={() => triggerUpload("reference")} />
              <SmallBtn label="AI Render" primary onClick={() => handleGenerateDesign("render")} disabled={genState.loading} />
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div style={{ padding: "16px 44px 0" }}>
          <PipelineBar current={projectStage} onChange={handleStageChange} />
        </div>

        {/* Tab bar */}
        <div style={{ padding: "0 44px" }}>
          <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "ai" && chatMessages.length === 0) startChat();
              }} style={{
                fontFamily: SANS, fontSize: 11, fontWeight: activeTab === tab.key ? 600 : 400,
                letterSpacing: 2, textTransform: "uppercase", padding: "14px 20px",
                color: activeTab === tab.key ? C.black : C.light, background: "none", border: "none",
                borderBottom: activeTab === tab.key ? `2px solid ${C.black}` : "2px solid transparent",
                cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
              }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </header>

      {/* ─── Tab Content ─── */}
      <div style={{ padding: "28px 44px 60px", maxWidth: 1080, animation: "slideUp 0.25s ease" }} key={activeTab}>

        {/* ════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Generated image error display */}
            {genState.error && (
              <div style={{ marginBottom: 14, padding: "12px 18px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: R }}>
                <span style={{ fontFamily: SANS, fontSize: 12, color: C.coral }}>{genState.error}</span>
              </div>
            )}

            {/* Description */}
            <Section label="Description">
              <EditableField
                label="Project Description"
                value={fields.description}
                fieldKey="description"
                onChange={handleFieldChange}
                wide textarea
              />
            </Section>

            {/* Reference Images */}
            <Section label="Images" count={(filesByCategory.reference || []).length + (filesByCategory.render || []).length + storedGeneratedImages.length} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("reference")} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {storedGeneratedImages.map((img, i) => (
                  <ImageSlot key={img.url || i} label={`AI ${i + 1}`} hasImage src={img.url} />
                ))}
                {(filesByCategory.reference || []).map((f) => {
                  const url = getFileUrl(f);
                  return <ImageSlot key={f.id} label={f.name} hasImage={!!url} src={url} />;
                })}
                {(filesByCategory.render || []).map((f) => {
                  const url = getFileUrl(f);
                  return <ImageSlot key={f.id} label={f.name} hasImage={!!url} src={url} />;
                })}
                <ImageSlot label="Add Image" hasImage={false} onClick={() => triggerUpload("reference")} />
              </div>
            </Section>

            {/* Client info */}
            <Section label="Client">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <EditableField label="Client Name" value={fields.clientName} fieldKey="clientName" onChange={handleFieldChange} />
                <EditableField label="Client Email" value={fields.clientEmail} fieldKey="clientEmail" onChange={handleFieldChange} />
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
                <EditableField label="Jewelry Type" value={fields.type} fieldKey="type" onChange={handleFieldChange}
                  select options={["Ring", "Pendant", "Bracelet", "Necklace", "Earrings", "Brooch", "Cufflinks", "Other"]} />
                <EditableField label="Name" value={fields.name || projectName} fieldKey="name" onChange={handleFieldChange} />
                <EditableField label="Design Motif" value={fields.designMotif} fieldKey="designMotif" onChange={handleFieldChange} />
                <EditableField label="Collection" value={fields.collection} fieldKey="collection" onChange={handleFieldChange} />
                <EditableField label="Description" value={fields.description} fieldKey="description" onChange={handleFieldChange} wide textarea />
              </div>
            </Section>

            <Section label="Dimensions & Sizing">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <EditableField label="Size" value={fields.size} fieldKey="size" onChange={handleFieldChange} />
                <EditableField label="Band Width" value={fields.bandWidth} fieldKey="bandWidth" onChange={handleFieldChange} />
                <EditableField label="Band Style" value={fields.bandStyle} fieldKey="bandStyle" onChange={handleFieldChange} />
                <EditableField label="Weight (est.)" value={fields.weight} fieldKey="weight" onChange={handleFieldChange} />
              </div>
            </Section>

            <Section label="Metal">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <EditableField label="Metal" value={fields.metal} fieldKey="metal" onChange={handleFieldChange} />
                <EditableField label="Metal Karat" value={fields.metalKarat} fieldKey="metalKarat" onChange={handleFieldChange} />
                <EditableField label="Finish" value={fields.finish} fieldKey="finish" onChange={handleFieldChange}
                  select options={["High Polish", "Matte", "Brushed", "Satin", "Hammered", "Sandblasted", "Oxidized"]} />
              </div>
            </Section>

            <Section label="Gemstones" collapsed={collapseState.gems} onToggle={() => toggle("gems")}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <EditableField label="Main Gemstone" value={fields.mainGemstone} fieldKey="mainGemstone" onChange={handleFieldChange} />
                <EditableField label="Gemstone Shape" value={fields.gemstoneShape} fieldKey="gemstoneShape" onChange={handleFieldChange} />
                <EditableField label="Setting Type" value={fields.settingType} fieldKey="settingType" onChange={handleFieldChange}
                  select options={["Prong", "Bezel", "Pav\u00e9", "Channel", "Tension", "Flush", "Cluster", "Halo"]} />
                <EditableField label="Side Stones" value={fields.sideStones} fieldKey="sideStones" onChange={handleFieldChange} />
              </div>
            </Section>

            <Section label="Production" collapsed={collapseState.production} onToggle={() => toggle("production")}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <EditableField label="Casting Method" value={fields.castingMethod} fieldKey="castingMethod" onChange={handleFieldChange}
                  select options={["Lost Wax", "Die Casting", "Sand Casting", "3D Printed", "Hand Fabricated"]} />
                <EditableField label="Budget" value={fields.budget} fieldKey="budget" onChange={handleFieldChange} />
                <EditableField label="Timeline" value={fields.timeline} fieldKey="timeline" onChange={handleFieldChange} />
                <EditableField label="Special Notes" value={fields.specialNotes} fieldKey="specialNotes" onChange={handleFieldChange} wide textarea />
              </div>
            </Section>
          </>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ASSETS & FILES TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "assets" && (
          <>
            <Section label="AI-Generated Images" count={storedGeneratedImages.length} rightAction={
              <div style={{ display: "flex", gap: 8 }}>
                <SmallBtn label={genState.loading ? "Generating..." : "Sketch"} onClick={() => handleGenerateDesign("sketch")} disabled={genState.loading} />
                <SmallBtn label={genState.loading ? "Generating..." : "Render"} primary onClick={() => handleGenerateDesign("render")} disabled={genState.loading} />
              </div>
            }>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {genState.imageUrl && !storedGeneratedImages.find(i => i.url === genState.imageUrl) && (
                  <ImageSlot label="New" hasImage src={genState.imageUrl} />
                )}
                {storedGeneratedImages.map((img, i) => (
                  <ImageSlot key={img.url || i} label={`AI ${i + 1}`} hasImage src={img.url} />
                ))}
                <ImageSlot label="Generate" />
              </div>
              {genState.loading && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.coral,
                    borderRadius: "50%", animation: "spin 0.8s linear infinite",
                  }} />
                  <span style={{ fontFamily: SANS, fontSize: 12, color: C.mid }}>Generating... This may take up to 30 seconds</span>
                </div>
              )}
              {genState.error && (
                <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 12, color: C.coral }}>{genState.error}</div>
              )}
            </Section>

            <Section label="Reference Images" count={(filesByCategory.reference || []).length} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("reference")} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {(filesByCategory.reference || []).map((f) => {
                  const url = getFileUrl(f);
                  return <ImageSlot key={f.id} label={f.name} hasImage={!!url} src={url} />;
                })}
                <ImageSlot label="Add Image" onClick={() => triggerUpload("reference")} />
              </div>
            </Section>

            <Section label="Sketches" count={(filesByCategory.sketch || []).length} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("sketch")} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {(filesByCategory.sketch || []).map((f) => {
                  const url = getFileUrl(f);
                  return <ImageSlot key={f.id} label={f.name} hasImage={!!url} src={url} />;
                })}
                <ImageSlot label="Add Sketch" onClick={() => triggerUpload("sketch")} />
              </div>
            </Section>

            <Section label="CAD Files" count={(filesByCategory.cad || []).length} rightAction={<SmallBtn label="+ Upload CAD" onClick={() => triggerUpload("cad")} />}>
              {(filesByCategory.cad || []).length > 0 ? (
                (filesByCategory.cad || []).map((f) => (
                  <FileCard key={f.id} name={f.name} type="cad" size={formatSize(f.size)} date={new Date(f.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                ))
              ) : (
                <div style={{ padding: "20px 0", textAlign: "center", fontFamily: SANS, fontSize: 12, color: C.light }}>No CAD files uploaded yet</div>
              )}
            </Section>

            <Section label="All Project Files" count={projectFiles.length} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("other")} />}>
              {projectFiles.length > 0 ? (
                projectFiles.map((f) => (
                  <FileCard
                    key={f.id} name={f.name} type={getFileTypeKey(f)}
                    size={formatSize(f.size)}
                    date={new Date(f.addedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                ))
              ) : (
                <div style={{ padding: "20px 0", textAlign: "center", fontFamily: SANS, fontSize: 12, color: C.light }}>
                  No files yet. Upload files or generate AI images to get started.
                </div>
              )}
            </Section>
          </>
        )}

        {/* ════════════════════════════════════════ */}
        {/* AI ASSISTANT TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "ai" && (
          <div style={{
            background: C.white, borderRadius: R, border: `1px solid ${C.border}`,
            display: "flex", flexDirection: "column", height: "calc(100vh - 420px)", minHeight: 400,
          }}>
            {/* Chat header */}
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16, background: C.sidebarBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: SERIF, fontSize: 14, color: C.sidebarActive, fontWeight: 700 }}>Z</span>
              </div>
              <div>
                <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.black, letterSpacing: 3, textTransform: "uppercase" }}>Imagine</div>
                <div style={{ fontFamily: SANS, fontSize: 10, color: C.light }}>
                  {chatSource === "imagine" && chatMessages.length > 0 ? "Continuing from Imagine session" : "AI Design Consultant for this project"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {chatMessages.length === 0 && !chatLoading && (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase", marginBottom: 12 }}>Project Assistant</div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: C.light, lineHeight: 1.7, maxWidth: 360, margin: "0 auto" }}>
                    Ask me to update specs, suggest materials, refine the design, generate images, or anything else about this piece.
                  </div>
                  <button onClick={startChat} style={{
                    marginTop: 20, padding: "12px 28px",
                    fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                    color: C.white, background: C.sidebarBg, border: "none", borderRadius: RS, cursor: "pointer",
                  }}>{"\u2726"} Start Chat</button>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i}>
                  <ChatMessage message={msg.content} isUser={msg.role === "user"} />
                  {msg.fieldUpdates?.map((u, j) => (
                    <FieldUpdateToast key={j} field={u.field} value={u.value} />
                  ))}
                  {msg.suggestedTool && TOOL_INFO[msg.suggestedTool] && (
                    <div style={{ padding: "4px 0 4px 32px" }}>
                      <div onClick={() => {
                        if (msg.suggestedTool === "render" || msg.suggestedTool === "sketch") handleGenerateDesign(msg.suggestedTool);
                      }} style={{
                        display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px",
                        background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: R,
                        cursor: "pointer", transition: "all 0.2s",
                      }}>
                        <span style={{ fontSize: 14 }}>{TOOL_INFO[msg.suggestedTool].icon}</span>
                        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue }}>
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

            {/* Input */}
            <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{
                flex: 1, background: C.section, borderRadius: R, border: `1px solid ${C.border}`, transition: "border-color 0.2s",
              }}>
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  placeholder="Ask about this project..."
                  rows={1}
                  style={{
                    width: "100%", padding: "12px 16px", fontFamily: SANS, fontSize: 13,
                    color: C.dark, background: "transparent", border: "none", resize: "none",
                    lineHeight: 1.5, minHeight: 42, maxHeight: 120, overflowY: "auto",
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onFocus={(e) => e.target.parentElement.style.borderColor = C.borderHover}
                  onBlur={(e) => e.target.parentElement.style.borderColor = C.border}
                  disabled={chatLoading}
                />
              </div>
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  width: 42, height: 42, borderRadius: R, border: "none",
                  background: chatInput.trim() ? C.coral : C.border,
                  color: C.white, cursor: chatInput.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
