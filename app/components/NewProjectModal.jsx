"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";
import { chatWithClaudeJSON } from "../lib/api";

// ═══════════════════════════════════════
// JEWELRY TYPE CONFIGURATION
// ═══════════════════════════════════════
const JEWELRY_TYPES = [
  { id: "ring", label: "Ring" },
  { id: "pendant", label: "Pendant" },
  { id: "earrings", label: "Earrings" },
  { id: "bracelet", label: "Bracelet" },
  { id: "other", label: "Other" },
];

const COMMON_FIELDS = [
  { key: "name", label: "Project Name" },
  { key: "metal", label: "Metal" },
  { key: "metalKarat", label: "Metal Karat" },
  { key: "finish", label: "Finish" },
  { key: "mainGemstone", label: "Main Gemstone" },
  { key: "gemstoneShape", label: "Gemstone Shape" },
  { key: "settingType", label: "Setting Type" },
  { key: "sideStones", label: "Side Stones" },
  { key: "budget", label: "Budget" },
  { key: "designMotif", label: "Design Motif" },
];

const TYPE_SPECIFIC_FIELDS = {
  ring: [
    { key: "ringSize", label: "Ring Size" },
    { key: "bandWidth", label: "Band Width" },
    { key: "bandStyle", label: "Band Style" },
    { key: "ringType", label: "Ring Type", hint: "Engagement, Wedding, Signet, Cocktail…" },
    { key: "profileShape", label: "Profile Shape", hint: "Comfort Fit, Flat, D-Shape…" },
  ],
  pendant: [
    { key: "chainLength", label: "Chain Length" },
    { key: "chainStyle", label: "Chain Style", hint: "Cable, Box, Rope, Snake…" },
    { key: "bailType", label: "Bail Type", hint: "Fixed, Hinged, Hidden, Tube…" },
    { key: "pendantShape", label: "Pendant Shape" },
    { key: "pendantSize", label: "Pendant Size" },
  ],
  earrings: [
    { key: "earringType", label: "Earring Type", hint: "Stud, Hoop, Drop, Dangle, Huggie…" },
    { key: "backType", label: "Back Type", hint: "Push, Screw, Lever, Hook…" },
    { key: "earringLength", label: "Length" },
    { key: "earringWidth", label: "Width" },
    { key: "matchedPair", label: "Matched Pair", hint: "Yes / No / Asymmetric" },
  ],
  bracelet: [
    { key: "wristSize", label: "Wrist Size" },
    { key: "braceletWidth", label: "Width" },
    { key: "claspType", label: "Clasp Type", hint: "Lobster, Toggle, Box, Magnetic…" },
    { key: "braceletStyle", label: "Style", hint: "Bangle, Chain, Cuff, Tennis…" },
    { key: "linkType", label: "Link Type" },
  ],
  other: [
    { key: "pieceType", label: "Piece Type", hint: "Brooch, Cufflinks, Tiara, Anklet…" },
    { key: "dimensions", label: "Dimensions" },
    { key: "wearMethod", label: "How It's Worn" },
    { key: "specialFeatures", label: "Special Features" },
  ],
};

// ═══════════════════════════════════════
// SYSTEM PROMPT FOR PROJECT CHAT
// ═══════════════════════════════════════
const PROJECT_SYSTEM_PROMPT = `You are the ZipJeweler Project Assistant — an expert jeweler's AI helper embedded within a New Project creation workflow.

Your role: Help the jeweler fill out their project details through natural conversation. You can see the current state of all fields and the jewelry type selected.

CONVERSATION STYLE:
- Be concise, warm, and knowledgeable about jewelry design and manufacturing
- Ask focused questions to fill missing fields
- When the user describes something, extract all possible field values
- Suggest specific options (e.g. "14k Yellow Gold" not just "gold")
- Proactively recommend next steps when enough data is captured

TOOLS YOU CAN SUGGEST — when appropriate, recommend activating these:
- "generate_image" — Generate an AI visualization of the piece (suggest when description + materials are filled)
- "estimate_cost" — Get a manufacturing cost estimate (suggest when metal, gemstones, and size are known)
- "generate_cad" — Generate a 3D CAD model (suggest when full specs are defined)
- "recommend_next" — Get recommendations for what to complete next (always available)

RESPONSE FORMAT — Always respond with valid JSON only:
{
  "message": "Your conversational response",
  "fieldUpdates": {
    "fieldKey": "value to set"
  },
  "suggestedTool": "generate_image|estimate_cost|generate_cad|recommend_next|null",
  "suggestedToolReason": "Brief reason why this tool would help now",
  "projectReadiness": 0-100
}

FIELD UPDATE RULES:
- Only include fields that were explicitly mentioned or clearly inferable
- Use the exact field keys provided in the context
- Be specific: "14k Yellow Gold" not "gold", "Round Brilliant" not "round"
- Leave fields out of fieldUpdates if they weren't discussed in this message

Remember: You're building a real production project. Every detail matters for manufacturing.`;

// ═══════════════════════════════════════
// TOOL INFO
// ═══════════════════════════════════════
const TOOL_ACTIONS = {
  generate_image: { icon: "\uD83D\uDDBC\uFE0F", label: "Generate Image", desc: "Create an AI visualization of the piece" },
  estimate_cost: { icon: "\uD83D\uDCB0", label: "Estimate Cost", desc: "Get manufacturing cost estimate" },
  generate_cad: { icon: "\uD83E\uDDCA", label: "Generate CAD", desc: "Create a 3D model from specs" },
  recommend_next: { icon: "\uD83D\uDCA1", label: "Next Steps", desc: "Get recommendations to complete the project" },
};

// ═══════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════

const inputBaseStyle = {
  width: "100%", padding: "8px 2px", fontFamily: SANS, fontSize: 13, color: C.dark,
  background: "transparent", border: "none", borderBottom: `1px solid ${C.borderInput}`,
  outline: "none", transition: "border-color 0.2s", borderRadius: 0,
};

const fieldLabelStyle = {
  fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2,
  textTransform: "uppercase", color: C.label, marginBottom: 3,
};

function ProjectField({ label, hint, value, onChange, wide, textarea }) {
  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 calc(50% - 16px)", minWidth: wide ? "100%" : 180 }}>
      <div style={fieldLabelStyle}>{label}</div>
      {textarea ? (
        <textarea
          rows={2} value={value || ""} onChange={(e) => onChange(e.target.value)}
          placeholder={hint || ""} style={{ ...inputBaseStyle, resize: "vertical", lineHeight: 1.6 }}
          onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
          onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)}
        />
      ) : (
        <input
          value={value || ""} onChange={(e) => onChange(e.target.value)}
          placeholder={hint || ""} style={inputBaseStyle}
          onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
          onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)}
        />
      )}
    </div>
  );
}

function SectionBox({ label, children, style = {} }) {
  return (
    <div style={{
      background: C.section, borderRadius: R, border: `1px solid ${C.border}`,
      padding: "16px 20px", marginBottom: 12, ...style,
    }}>
      {label && (
        <div style={{
          fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5,
          textTransform: "uppercase", color: C.label, marginBottom: 12,
        }}>{label}</div>
      )}
      {children}
    </div>
  );
}

function TypeSelector({ selected, onSelect }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {JEWELRY_TYPES.map((t) => {
        const active = selected === t.id;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)} style={{
            fontFamily: SANS, fontSize: 11, fontWeight: active ? 700 : 500,
            letterSpacing: 2, textTransform: "uppercase",
            padding: "10px 20px", borderRadius: RS, cursor: "pointer",
            background: active ? C.coral : C.white,
            color: active ? C.white : C.mid,
            border: `1px solid ${active ? C.coral : C.border}`,
            transition: "all 0.2s",
          }}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ReadinessBadge({ value }) {
  const clr = value < 30 ? C.coral : value < 65 ? C.amber : C.green;
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1,
      padding: "4px 10px", borderRadius: 12, color: clr,
      background: value < 30 ? C.redBg : value < 65 ? C.amberBg : C.greenBg,
      border: `1px solid ${value < 30 ? C.redBorder : value < 65 ? C.amberBorder : C.greenBorder}`,
    }}>{value}%</span>
  );
}

// Chat message bubble
function ChatBubble({ content, isUser }) {
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      padding: "3px 0",
    }}>
      {!isUser && (
        <div style={{
          width: 24, height: 24, borderRadius: 12, background: C.sidebarBg, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, marginTop: 4,
          fontFamily: SERIF, fontSize: 10, color: C.sidebarActive, fontWeight: 700,
        }}>Z</div>
      )}
      <div style={{
        maxWidth: "85%", padding: "10px 14px",
        borderRadius: isUser ? `${R}px ${R}px 4px ${R}px` : `${R}px ${R}px ${R}px 4px`,
        background: isUser ? C.sidebarBg : C.white,
        border: isUser ? "none" : `1px solid ${C.border}`,
      }}>
        <div style={{
          fontFamily: SANS, fontSize: 12.5, lineHeight: 1.65,
          color: isUser ? "#E0E0D8" : C.dark, whiteSpace: "pre-wrap",
        }}>{content}</div>
      </div>
    </div>
  );
}

// Typing dots
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "3px 0" }}>
      <div style={{
        width: 24, height: 24, borderRadius: 12, background: C.sidebarBg, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8,
        fontFamily: SERIF, fontSize: 10, color: C.sidebarActive, fontWeight: 700,
      }}>Z</div>
      <div style={{ display: "flex", gap: 3, padding: "10px 14px", background: C.white, borderRadius: R, border: `1px solid ${C.border}` }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: 3, background: C.light,
            animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// Field update toast in chat
function FieldToast({ field, value }) {
  return (
    <div style={{ padding: "2px 0 2px 32px" }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px",
        background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 16,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <span style={{ fontFamily: SANS, fontSize: 9.5, color: C.green, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
          {field}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.mid }}>{"\u2192"} {value}</span>
      </div>
    </div>
  );
}

// Tool suggestion card in chat
function ToolSuggestionCard({ toolKey, reason, onActivate }) {
  const [h, setH] = useState(false);
  const tool = TOOL_ACTIONS[toolKey];
  if (!tool) return null;
  return (
    <div style={{ padding: "4px 0 4px 32px" }}>
      <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onActivate} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        background: h ? C.white : C.blueBg, border: `1px solid ${h ? C.blue : C.blueBorder}`,
        borderRadius: R, cursor: "pointer", transition: "all 0.2s",
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{tool.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue }}>{tool.label}</div>
          <div style={{ fontFamily: SANS, fontSize: 11, color: C.mid, lineHeight: 1.4 }}>{reason || tool.desc}</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN NEW PROJECT MODAL
// ═══════════════════════════════════════
export default function NewProjectModal({ onClose }) {
  // ─── Form state ───
  const [jewelryType, setJewelryType] = useState(null);
  const [fields, setFields] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [clientInfo] = useState({
    email: "client@email.com", name: "", phone: "",
    created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  });

  // ─── Chat state ───
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [readiness, setReadiness] = useState(0);
  const [chatStarted, setChatStarted] = useState(false);

  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ─── Field helpers ───
  const updateField = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const getFieldsForType = () => {
    if (!jewelryType) return COMMON_FIELDS;
    return [...COMMON_FIELDS, ...(TYPE_SPECIFIC_FIELDS[jewelryType] || [])];
  };

  // Build context string for AI
  const buildContext = () => {
    const allFields = getFieldsForType();
    const filled = allFields.filter((f) => fields[f.key]).map((f) => `${f.label}: ${fields[f.key]}`);
    const empty = allFields.filter((f) => !fields[f.key]).map((f) => f.label);
    return `JEWELRY TYPE: ${jewelryType || "Not selected yet"}
FILLED FIELDS:\n${filled.length ? filled.join("\n") : "None yet"}
EMPTY FIELDS:\n${empty.join(", ")}
AVAILABLE FIELD KEYS: ${allFields.map((f) => f.key).join(", ")}`;
  };

  // ─── Start chat ───
  const startChat = useCallback(async () => {
    setChatStarted(true);
    setIsLoading(true);
    const contextMsg = `${buildContext()}\n\nStart the conversation. Greet the jeweler and ask what piece they're creating today. Be brief.`;
    try {
      const parsed = await chatWithClaudeJSON({
        system: PROJECT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: contextMsg }],
        maxTokens: 800,
        fallback: { fieldUpdates: {}, suggestedTool: null, projectReadiness: 0 },
      });

      setMessages([{ role: "assistant", content: parsed.message, suggestedTool: parsed.suggestedTool, suggestedToolReason: parsed.suggestedToolReason }]);
      setConversationHistory([
        { role: "user", content: contextMsg },
        { role: "assistant", content: JSON.stringify(parsed) },
      ]);
      if (parsed.projectReadiness) setReadiness(parsed.projectReadiness);
    } catch (err) {
      console.error("startChat error:", err);
      setMessages([{ role: "assistant", content: "Hi! What piece are we creating today? Tell me your vision and I'll help fill in all the details." }]);
      setConversationHistory([
        { role: "user", content: "Start." },
        { role: "assistant", content: JSON.stringify({ message: "Hi! What piece are we creating today?", fieldUpdates: {}, suggestedTool: null, projectReadiness: 0 }) },
      ]);
    }
    setIsLoading(false);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [jewelryType, fields]);

  // ─── Send message ───
  const sendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setChatInput("");
    setIsLoading(true);

    const context = buildContext();
    const userContent = `[CURRENT PROJECT STATE]\n${context}\n\n[USER MESSAGE]\n${text}`;
    const newHistory = [...conversationHistory, { role: "user", content: userContent }];

    try {
      const parsed = await chatWithClaudeJSON({
        system: PROJECT_SYSTEM_PROMPT,
        messages: newHistory,
        maxTokens: 800,
        fallback: { fieldUpdates: {}, suggestedTool: null, projectReadiness: readiness },
      });

      // Apply field updates
      const toasts = [];
      if (parsed.fieldUpdates) {
        const allFieldKeys = getFieldsForType().map((f) => f.key);
        Object.entries(parsed.fieldUpdates).forEach(([key, val]) => {
          if (val && allFieldKeys.includes(key)) {
            toasts.push({ field: key, value: val, label: getFieldsForType().find((f) => f.key === key)?.label || key });
            updateField(key, val);
          }
          // Handle jewelry type update
          if (key === "type" || key === "jewelryType") {
            const typeMap = { ring: "ring", pendant: "pendant", earrings: "earrings", bracelet: "bracelet" };
            const mapped = typeMap[val?.toLowerCase()] || "other";
            setJewelryType(mapped);
          }
        });
      }

      if (parsed.projectReadiness !== undefined) setReadiness(parsed.projectReadiness);

      setMessages((prev) => [...prev, {
        role: "assistant", content: parsed.message,
        fieldUpdates: toasts,
        suggestedTool: parsed.suggestedTool,
        suggestedToolReason: parsed.suggestedToolReason,
      }]);
      setConversationHistory([...newHistory, { role: "assistant", content: JSON.stringify(parsed) }]);
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection issue — could you repeat that?" }]);
    }
    setIsLoading(false);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [chatInput, isLoading, conversationHistory, fields, jewelryType, readiness]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ─── Handle tool activation ───
  const handleToolActivation = (toolKey) => {
    const prompts = {
      generate_image: "Generate an AI image of this piece based on the current specifications.",
      estimate_cost: "Estimate the manufacturing cost based on current materials and specs.",
      generate_cad: "Generate a 3D CAD model based on the current specifications.",
      recommend_next: "Based on the current project state, what should I fill in next to make this project more complete?",
    };
    setChatInput(prompts[toolKey] || "");
    setTimeout(() => chatInputRef.current?.focus(), 50);
  };

  // ─── Render ───
  const specFields = getFieldsForType();

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(30,30,28,0.18)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 30, overflowY: "auto", animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: chatOpen ? 1140 : 780, marginBottom: 40,
          background: C.bg, borderRadius: R, border: `1px solid ${C.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)", animation: "slideUp 0.25s ease",
          overflow: "hidden", display: "flex", flexDirection: "column",
          maxHeight: "calc(100vh - 60px)", transition: "max-width 0.3s ease",
        }}
      >
        {/* ─── HEADER ─── */}
        <div style={{
          padding: "24px 28px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase" }}>
              New Project
            </div>
            {readiness > 0 && <ReadinessBadge value={readiness} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setChatOpen(!chatOpen)} style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
              padding: "8px 16px", color: chatOpen ? C.coral : C.mid, background: chatOpen ? C.redBg : C.white,
              border: `1px solid ${chatOpen ? C.coral : C.border}`, borderRadius: RS, cursor: "pointer",
              transition: "all 0.2s",
            }}>
              {chatOpen ? "Hide" : "Show"} AI Assistant
            </button>
            <select style={{
              fontFamily: SANS, fontSize: 10.5, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
              padding: "8px 24px 8px 12px", color: C.mid, background: C.white,
              border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
            }}>
              <option>Draft</option><option>In Progress</option><option>Complete</option>
            </select>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer", color: C.light,
              fontSize: 11, fontFamily: SANS, letterSpacing: 2, textTransform: "uppercase", padding: "8px 4px", fontWeight: 500,
            }}>✕</button>
          </div>
        </div>

        {/* ─── BODY: FORM + CHAT ─── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* ═══ LEFT: FORM PANEL ═══ */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "20px 28px 28px",
            minWidth: 0,
          }}>
            {/* Client Info */}
            <SectionBox label="Client">
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                {[
                  { label: "Email", value: clientInfo.email },
                  { label: "Name", value: clientInfo.name },
                  { label: "Phone", value: clientInfo.phone },
                  { label: "Created", value: clientInfo.created },
                ].map((f, i) => (
                  <div key={i} style={{ minWidth: 100 }}>
                    <div style={fieldLabelStyle}>{f.label}</div>
                    <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.dark, fontWeight: 500 }}>{f.value || "\u2014"}</div>
                  </div>
                ))}
              </div>
            </SectionBox>

            {/* Jewelry Type Selector */}
            <SectionBox label="Jewelry Type">
              <TypeSelector selected={jewelryType} onSelect={setJewelryType} />
            </SectionBox>

            {/* Reference Image */}
            <SectionBox label="Reference Image">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
                style={{
                  width: 160, height: 160, borderRadius: RS,
                  background: dragOver ? "rgba(90,138,74,0.06)" : C.border,
                  border: `2px dashed ${dragOver ? C.green : "transparent"}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.green : C.light} strokeWidth="1.2" style={{ marginBottom: 6 }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span style={{ fontFamily: SANS, fontSize: 9.5, color: C.light, letterSpacing: 1.5, textTransform: "uppercase" }}>Drop image</span>
              </div>
            </SectionBox>

            {/* Dynamic Specifications */}
            <SectionBox label={jewelryType ? `${JEWELRY_TYPES.find((t) => t.id === jewelryType)?.label || ""} Specifications` : "Specifications"}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 28px" }}>
                {specFields.map((f) => (
                  <ProjectField
                    key={f.key} label={f.label} hint={f.hint}
                    value={fields[f.key]} onChange={(v) => updateField(f.key, v)}
                  />
                ))}
                <ProjectField
                  label="Description" wide textarea
                  value={fields.description} onChange={(v) => updateField("description", v)}
                />
              </div>
            </SectionBox>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button style={{
                flex: 1, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                padding: "13px 24px", background: C.coral, color: C.white, border: "none", borderRadius: RS,
                cursor: "pointer", transition: "background 0.2s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.coralHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.coral)}
              >Create Project</button>
              <button style={{
                fontFamily: SANS, fontSize: 11.5, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
                padding: "13px 20px", background: C.white, color: C.mid, border: `1px solid ${C.border}`,
                borderRadius: RS, cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderHover)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
              >Save Draft</button>
            </div>
          </div>

          {/* ═══ RIGHT: AI CHAT PANEL ═══ */}
          {chatOpen && (
            <div style={{
              width: 380, flexShrink: 0, display: "flex", flexDirection: "column",
              borderLeft: `1px solid ${C.border}`, background: C.section,
            }}>
              {/* Chat header */}
              <div style={{
                padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: C.white,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 15, background: C.sidebarBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: SERIF, fontSize: 13, color: C.sidebarActive, fontWeight: 700 }}>Z</span>
                </div>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.black, letterSpacing: 3, textTransform: "uppercase" }}>Project Assistant</div>
                  <div style={{ fontFamily: SANS, fontSize: 10, color: C.light }}>Powered by Claude</div>
                </div>
              </div>

              {/* Chat messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px" }}>
                {!chatStarted ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 24, background: C.sidebarBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 16px",
                    }}>
                      <span style={{ fontFamily: SERIF, fontSize: 20, color: C.sidebarActive, fontWeight: 700 }}>Z</span>
                    </div>
                    <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
                      Project Assistant
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, lineHeight: 1.7, marginBottom: 20 }}>
                      Describe your vision and I'll auto-fill the project details. I can also generate images, estimates, and CAD files.
                    </div>
                    <button onClick={startChat} style={{
                      fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                      padding: "12px 28px", background: C.sidebarBg, color: C.sidebarActive, border: "none",
                      borderRadius: R, cursor: "pointer", transition: "background 0.2s",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#3A3A34")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = C.sidebarBg)}
                    >{"\u2726"} Start Chat</button>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <div key={i}>
                        <ChatBubble content={msg.content} isUser={msg.role === "user"} />
                        {msg.fieldUpdates?.map((u, j) => (
                          <FieldToast key={j} field={u.label || u.field} value={u.value} />
                        ))}
                        {msg.suggestedTool && TOOL_ACTIONS[msg.suggestedTool] && (
                          <ToolSuggestionCard
                            toolKey={msg.suggestedTool}
                            reason={msg.suggestedToolReason}
                            onActivate={() => handleToolActivation(msg.suggestedTool)}
                          />
                        )}
                      </div>
                    ))}
                    {isLoading && <TypingIndicator />}
                  </>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat input */}
              {chatStarted && (
                <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.border}`, background: C.white }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <div style={{
                      flex: 1, background: C.section, borderRadius: RS, border: `1px solid ${C.border}`,
                      transition: "border-color 0.2s",
                    }}>
                      <textarea
                        ref={chatInputRef} value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your piece..."
                        rows={1}
                        style={{
                          width: "100%", padding: "10px 14px", fontFamily: SANS, fontSize: 12.5,
                          color: C.dark, background: "transparent", border: "none", resize: "none",
                          lineHeight: 1.5, minHeight: 40, maxHeight: 100, overflowY: "auto", outline: "none",
                        }}
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
                        }}
                        onFocus={(e) => (e.target.parentElement.style.borderColor = C.borderHover)}
                        onBlur={(e) => (e.target.parentElement.style.borderColor = C.border)}
                        disabled={isLoading}
                      />
                    </div>
                    <button onClick={sendMessage} disabled={isLoading || !chatInput.trim()} style={{
                      width: 40, height: 40, borderRadius: RS, border: "none",
                      background: chatInput.trim() ? C.coral : C.border,
                      color: C.white, cursor: chatInput.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s", flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                      </svg>
                    </button>
                  </div>

                  {/* Quick tool buttons */}
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {Object.entries(TOOL_ACTIONS).map(([key, t]) => (
                      <button key={key} onClick={() => handleToolActivation(key)} style={{
                        fontFamily: SANS, fontSize: 9, fontWeight: 500, letterSpacing: 1, textTransform: "uppercase",
                        padding: "5px 10px", background: C.section, color: C.mid,
                        border: `1px solid ${C.border}`, borderRadius: 12, cursor: "pointer",
                        transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4,
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.blue; e.currentTarget.style.color = C.blue; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.mid; }}
                      >
                        <span style={{ fontSize: 11 }}>{t.icon}</span> {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
