import { useState, useEffect, useRef, useCallback } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";
import { chatWithClaudeJSON, generateImage } from "../lib/api";
import {
  createProject, updateProject, saveChatHistory,
  saveGeneratedImageToProject, uploadFileToProject,
} from "../lib/storage";

// ─── SYSTEM PROMPT ───
const SYSTEM_PROMPT = `You are the ZipJeweler AI Design Consultant — a master jeweler's creative partner embedded inside ZipJeweler, a SaaS platform for custom jewelry production workflow.

Your role is to help jewelers and designers create complete project folders for custom jewelry pieces through natural, warm conversation. You are knowledgeable about jewelry design, manufacturing, gemstones, metals, CAD processes, casting methods, and the full lifecycle of a custom piece.

CONVERSATION STYLE:
- Be warm, creative, and inspiring — like a knowledgeable friend in the jewelry world
- Ask one or two focused questions at a time, never overwhelm
- Build on what the user shares, making connections and suggestions
- Use vivid language when describing design possibilities
- Be opinionated — suggest specific ideas, not just ask questions
- Celebrate good ideas with genuine enthusiasm

STARTING: Your first message should always be: "What are we imagining today?"

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

// ─── EMPTY PROJECT ───
const EMPTY_PROJECT = {
  name: null, type: null, description: null, metal: null, metalKarat: null,
  finish: null, mainGemstone: null, gemstoneShape: null, settingType: null,
  sideStones: null, size: null, bandWidth: null, bandStyle: null, weight: null,
  budget: null, timeline: null, clientName: null, clientEmail: null,
  collection: null, designMotif: null, castingMethod: null, specialNotes: null,
};

const FIELD_LABELS = {
  name: "Project Name", type: "Jewelry Type", description: "Description",
  metal: "Metal", metalKarat: "Metal Karat", finish: "Finish",
  mainGemstone: "Main Gemstone", gemstoneShape: "Gemstone Shape", settingType: "Setting Type",
  sideStones: "Side Stones", size: "Size", bandWidth: "Band Width",
  bandStyle: "Band Style", weight: "Est. Weight", budget: "Budget",
  timeline: "Timeline", clientName: "Client Name", clientEmail: "Client Email",
  collection: "Collection", designMotif: "Design Motif", castingMethod: "Casting Method",
  specialNotes: "Special Notes",
};

const FIELD_GROUPS = {
  "Piece": ["name", "type", "description", "collection", "designMotif"],
  "Materials": ["metal", "metalKarat", "finish"],
  "Gemstones": ["mainGemstone", "gemstoneShape", "settingType", "sideStones"],
  "Dimensions": ["size", "bandWidth", "bandStyle", "weight"],
  "Production": ["castingMethod", "specialNotes", "budget", "timeline"],
  "Client": ["clientName", "clientEmail"],
};

const TOOL_INFO = {
  sketch: { icon: "\u270F\uFE0F", label: "Sketch to Jewelry", desc: "Convert this concept into a photorealistic jewelry image" },
  render: { icon: "\uD83D\uDDBC", label: "AI Render", desc: "Generate a studio-quality render of the piece" },
  estimate: { icon: "\uD83D\uDCB0", label: "Cost Estimate", desc: "Calculate material and labor costs" },
  "3d": { icon: "\uD83E\uDDCA", label: "3D Model Gen", desc: "Generate a production-ready 3D model" },
  filehub: { icon: "\uD83D\uDCC1", label: "File Hub", desc: "Organize all project assets" },
};

// ─── SHARED UI ───

function SectionLabel({ children }) {
  return <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.label }}>{children}</div>;
}

function Pill({ label, color, bg, border, small }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: small ? 9 : 9.5, fontWeight: 600, letterSpacing: small ? 1.5 : 2, textTransform: "uppercase",
      padding: small ? "3px 8px" : "5px 14px", borderRadius: RS,
      color, background: bg, border: `1px solid ${border}`, display: "inline-block",
    }}>{label}</span>
  );
}

// ─── TYPING INDICATOR ───
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 14, background: C.sidebarBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: SERIF, fontSize: 12, color: C.sidebarActive, fontWeight: 700,
        }}>Z</div>
        <div style={{ display: "flex", gap: 3, padding: "10px 14px", background: C.section, borderRadius: R, border: `1px solid ${C.border}` }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: 3, background: C.light,
              animation: `dotPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CHAT MESSAGE ───
function ChatMessage({ message, isUser, isFirst }) {
  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      padding: "4px 20px", animation: "messageIn 0.3s ease",
      gap: 8, alignItems: "flex-start",
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: 14, background: C.sidebarBg, flexShrink: 0, marginTop: 4,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: SERIF, fontSize: 12, color: C.sidebarActive, fontWeight: 700,
        }}>Z</div>
      )}
      <div style={{
        maxWidth: isUser ? "75%" : "80%", padding: "12px 18px",
        borderRadius: isUser ? `${R}px ${R}px 4px ${R}px` : `${R}px ${R}px ${R}px 4px`,
        background: isUser ? C.sidebarBg : C.white,
        border: isUser ? "none" : `1px solid ${C.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
      }}>
        <div style={{
          fontFamily: SANS, fontSize: 13.5, lineHeight: 1.7,
          color: isUser ? "#E0E0D8" : C.dark,
          whiteSpace: "pre-wrap",
        }}>{message}</div>
      </div>
    </div>
  );
}

// ─── TOOL SUGGESTION CARD ───
function ToolSuggestion({ toolKey, reason, onUse }) {
  const [h, setH] = useState(false);
  const tool = TOOL_INFO[toolKey];
  if (!tool) return null;
  return (
    <div style={{ padding: "4px 20px 4px 56px", animation: "messageIn 0.3s ease" }}>
      <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={onUse} style={{
        display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
        background: h ? C.white : C.blueBg, border: `1px solid ${h ? C.blue : C.blueBorder}`,
        borderRadius: R, cursor: "pointer", transition: "all 0.2s", maxWidth: 420,
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{tool.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.blue, marginBottom: 2 }}>{tool.label}</div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid, lineHeight: 1.5 }}>{reason || tool.desc}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

// ─── FIELD UPDATE TOAST ───
function FieldUpdateToast({ field, value }) {
  return (
    <div style={{
      padding: "2px 20px 2px 56px", animation: "messageIn 0.3s ease",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
        background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 20,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <span style={{ fontFamily: SANS, fontSize: 10.5, color: C.green, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {FIELD_LABELS[field] || field}
        </span>
        <span style={{ fontFamily: SANS, fontSize: 11, color: C.mid }}>{"\u2192"} {value}</span>
      </div>
    </div>
  );
}

// ─── READINESS METER ───
function ReadinessMeter({ value }) {
  const clr = value < 30 ? C.coral : value < 65 ? C.amber : C.green;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label }}>Project Readiness</span>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: clr }}>{value}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${value}%`, background: clr, transition: "all 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── PROJECT PANEL ───
function ProjectPanel({ project, readiness, suggestedTool, projectId, onCreateFolder }) {
  const filledFields = Object.entries(project).filter(([_, v]) => v);
  const totalFields = Object.keys(EMPTY_PROJECT).length;
  const [genState, setGenState] = useState({ loading: false, error: null, imageUrl: null });

  const buildProjectPrompt = (style) => {
    const parts = [];
    if (style === "sketch") parts.push("Detailed pencil sketch concept drawing of custom jewelry");
    else parts.push("Photorealistic studio product photograph of custom jewelry, white background, professional lighting");

    if (project.type) parts.push(project.type);
    if (project.description) parts.push(project.description);
    if (project.metal) parts.push(`made of ${project.metal}`);
    if (project.mainGemstone) parts.push(`featuring ${project.mainGemstone}`);
    if (project.designMotif) parts.push(`${project.designMotif} design motif`);
    if (project.finish) parts.push(`${project.finish} finish`);
    if (project.settingType) parts.push(`${project.settingType} setting`);
    if (project.sideStones) parts.push(`with ${project.sideStones}`);
    return parts.join(", ");
  };

  const handleGenerateImage = async (style) => {
    setGenState({ loading: true, error: null, imageUrl: null });
    try {
      const result = await generateImage({
        prompt: buildProjectPrompt(style),
        aspectRatio: "1:1",
        resolution: "1080p",
      });
      if (result.images?.length) {
        const url = result.images[0].url;
        setGenState({ loading: false, error: null, imageUrl: url });
        // Save to project storage
        if (projectId) {
          saveGeneratedImageToProject(projectId, url, `imagine-${style}`, buildProjectPrompt(style));
        }
      } else {
        setGenState({ loading: false, error: "No image returned", imageUrl: null });
      }
    } catch (err) {
      setGenState({ loading: false, error: err.message, imageUrl: null });
    }
  };

  return (
    <div style={{
      width: "100%", height: "100%", overflowY: "auto",
      padding: "24px 20px",
    }}>
      {/* Title area */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.label, marginBottom: 6 }}>Live Project Folder</div>
        <div style={{
          fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.black,
          letterSpacing: 3, textTransform: "uppercase", lineHeight: 1.25, minHeight: 30,
        }}>
          {project.name || <span style={{ color: C.border }}>Untitled Project</span>}
        </div>
        {project.collection && (
          <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 4 }}>{project.collection}</div>
        )}
      </div>

      {/* Readiness */}
      <div style={{ marginBottom: 20, padding: "16px", background: C.section, borderRadius: R, border: `1px solid ${C.border}` }}>
        <ReadinessMeter value={readiness} />
        <div style={{ fontFamily: MONO, fontSize: 10, color: C.light, marginTop: 8 }}>
          {filledFields.length} / {totalFields} fields captured
        </div>
      </div>

      {/* Generated Image */}
      {(genState.loading || genState.imageUrl || genState.error) && (
        <div style={{ marginBottom: 16, padding: "12px", background: C.section, borderRadius: R, border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 8 }}>AI Generated</div>
          {genState.loading && (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <div style={{
                width: 24, height: 24, border: `2px solid ${C.border}`, borderTopColor: C.coral,
                borderRadius: "50%", margin: "0 auto 10px",
                animation: "spin 0.8s linear infinite",
              }} />
              <div style={{ fontFamily: SANS, fontSize: 10, color: C.light }}>Generating...</div>
            </div>
          )}
          {genState.error && (
            <div style={{ fontFamily: SANS, fontSize: 11, color: C.coral, padding: "8px 0" }}>{genState.error}</div>
          )}
          {genState.imageUrl && (
            <a href={genState.imageUrl} target="_blank" rel="noopener noreferrer">
              <img src={genState.imageUrl} alt="Generated jewelry" style={{ width: "100%", borderRadius: RS, border: `1px solid ${C.border}`, display: "block" }} />
            </a>
          )}
        </div>
      )}

      {/* Field groups */}
      {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => {
        const groupFields = fields.filter((f) => project[f]);
        if (groupFields.length === 0) {
          return (
            <div key={groupName} style={{ marginBottom: 12 }}>
              <div style={{
                fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5,
                textTransform: "uppercase", color: C.border, padding: "10px 0 6px",
              }}>{groupName}</div>
              <div style={{
                padding: "12px 14px", borderRadius: RS, border: `1px dashed ${C.border}`,
                fontFamily: SANS, fontSize: 11, color: C.border, fontStyle: "italic",
              }}>Waiting for details…</div>
            </div>
          );
        }
        return (
          <div key={groupName} style={{ marginBottom: 12 }}>
            <div style={{
              fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5,
              textTransform: "uppercase", color: C.label, padding: "10px 0 6px",
              borderBottom: `1px solid ${C.border}`, marginBottom: 6,
            }}>{groupName}</div>
            {groupFields.map((field) => (
              <div key={field} style={{
                display: "flex", gap: 8, padding: "7px 0",
                animation: "fieldIn 0.4s ease",
              }}>
                <div style={{
                  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5,
                  textTransform: "uppercase", color: C.label, minWidth: 90, paddingTop: 2,
                }}>{FIELD_LABELS[field]}</div>
                <div style={{
                  fontFamily: field === "description" || field === "specialNotes" ? SANS : SANS,
                  fontSize: 12.5, color: C.dark, fontWeight: 500, lineHeight: 1.5, flex: 1,
                }}>{project[field]}</div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Actions */}
      {readiness >= 40 && (
        <div style={{
          marginTop: 20, padding: "16px", background: C.section,
          borderRadius: R, border: `1px solid ${C.border}`,
        }}>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {readiness >= 40 && (
              <ActionBtn icon={"\u270F\uFE0F"} label="Generate Sketch" desc="AI concept from current specs" onClick={() => handleGenerateImage("sketch")} disabled={genState.loading} />
            )}
            {readiness >= 55 && (
              <ActionBtn icon={"\uD83D\uDDBC"} label="Create Render" desc="Photorealistic visualization" onClick={() => handleGenerateImage("render")} disabled={genState.loading} />
            )}
            {readiness >= 50 && (
              <ActionBtn icon={"\uD83D\uDCB0"} label="Cost Estimate" desc="Material & labor breakdown" />
            )}
            {readiness >= 70 && (
              <ActionBtn icon={"\uD83E\uDDCA"} label="Generate 3D Model" desc="Production-ready CAD file" />
            )}
            {readiness >= 80 && (
              <ActionBtn icon={"\uD83D\uDCC1"} label="Create Project Folder" desc="Compile complete package" color={C.green} onClick={onCreateFolder} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, desc, color, onClick, disabled }) {
  const [h, setH] = useState(false);
  const c = color || C.blue;
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={disabled ? undefined : onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
        background: h && !disabled ? C.white : "transparent", borderRadius: RS,
        border: `1px solid ${h && !disabled ? c : "transparent"}`,
        cursor: disabled ? "default" : "pointer", transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: h && !disabled ? c : C.mid }}>{label}</div>
        <div style={{ fontFamily: SANS, fontSize: 10.5, color: C.light }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── WELCOME SCREEN ───
function WelcomeScreen() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", padding: "40px 60px", textAlign: "center",
    }}>
      <div style={{ marginBottom: 32, opacity: 0.12 }}>
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={C.sidebarBg} strokeWidth="0.5">
          <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" /><path d="M12 22L6 9l6-6 6 6z" />
        </svg>
      </div>
      <div style={{
        fontFamily: SERIF, fontSize: 36, fontWeight: 600, color: C.black,
        letterSpacing: 6, textTransform: "uppercase", lineHeight: 1.2, marginBottom: 16,
      }}>Imagine</div>
      <div style={{
        fontFamily: SANS, fontSize: 14, color: C.light, lineHeight: 1.8, maxWidth: 380,
      }}>
        Describe your vision and I'll build your project folder in real time — capturing every spec, material, and detail as we talk.
      </div>
      <div style={{
        display: "flex", gap: 16, marginTop: 32, flexWrap: "wrap", justifyContent: "center",
      }}>
        {[
          { icon: "\uD83D\uDC8D", text: "Custom engagement ring" },
          { icon: "\uD83D\uDC0D", text: "Serpent cuff bracelet" },
          { icon: "\u2728", text: "Art deco pendant" },
          { icon: "\uD83D\uDC51", text: "Crown-inspired signet" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "10px 18px", background: C.section, borderRadius: R,
            border: `1px solid ${C.border}`, fontFamily: SANS, fontSize: 12, color: C.mid,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>{s.icon}</span>{s.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN IMAGINE VIEW COMPONENT
// ═══════════════════════════════════════
export default function ImagineView({ onProjectCreated }) {
  const [loaded, setLoaded] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content, extracted?, suggestedTool?, suggestedToolReason?, fieldUpdates? }
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [project, setProject] = useState({ ...EMPTY_PROJECT });
  const [readiness, setReadiness] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [started, setStarted] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [projectId, setProjectId] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  // Persist project fields whenever they change
  useEffect(() => {
    if (projectId) {
      updateProject(projectId, { fields: project, readiness });
    }
  }, [project, readiness, projectId]);

  // Persist chat history whenever messages change
  useEffect(() => {
    if (projectId && conversationHistory.length > 0) {
      saveChatHistory(projectId, conversationHistory);
    }
  }, [conversationHistory, projectId]);

  // ─── Start conversation ───
  const startConversation = useCallback(async () => {
    setStarted(true);
    setIsLoading(true);

    // Create a persistent project, tagged as originating from Imagine
    const newProject = createProject({ name: "Untitled Project" });
    setProjectId(newProject.id);
    updateProject(newProject.id, { chatSource: "imagine" });

    try {
      const startMsg = "Start the conversation. Greet me and ask what we're imagining today.";
      const parsed = await chatWithClaudeJSON({
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: startMsg }],
        maxTokens: 1000,
        fallback: { extracted: {}, suggestedTool: null, projectReadiness: 0 },
      });

      const aiMsg = {
        role: "assistant", content: parsed.message,
        suggestedTool: parsed.suggestedTool, suggestedToolReason: parsed.suggestedToolReason,
      };
      setMessages([aiMsg]);
      setConversationHistory([
        { role: "user", content: startMsg },
        { role: "assistant", content: JSON.stringify(parsed) },
      ]);
    } catch (err) {
      console.error("startConversation error:", err);
      setMessages([{ role: "assistant", content: "What are we imagining today?" }]);
      setConversationHistory([
        { role: "user", content: "Start the conversation." },
        { role: "assistant", content: JSON.stringify({ message: "What are we imagining today?", extracted: {}, suggestedTool: null, projectReadiness: 0 }) },
      ]);
    }
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ─── Send message ───
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const newHistory = [...conversationHistory, { role: "user", content: text }];

    try {
      const parsed = await chatWithClaudeJSON({
        system: SYSTEM_PROMPT,
        messages: newHistory,
        maxTokens: 1000,
        fallback: { extracted: {}, suggestedTool: null, projectReadiness: readiness },
      });

      // Determine which fields were newly extracted
      const fieldUpdates = [];
      if (parsed.extracted) {
        Object.entries(parsed.extracted).forEach(([key, val]) => {
          if (val && val !== project[key]) {
            fieldUpdates.push({ field: key, value: val });
          }
        });

        // Merge extracted into project
        setProject((prev) => {
          const next = { ...prev };
          Object.entries(parsed.extracted).forEach(([k, v]) => {
            if (v) next[k] = v;
          });
          return next;
        });

        // Update project name in storage when first captured
        if (parsed.extracted.name && projectId) {
          updateProject(projectId, { name: parsed.extracted.name, type: parsed.extracted.type || null });
        }
      }

      if (parsed.projectReadiness !== undefined) {
        setReadiness(parsed.projectReadiness);
      }

      const aiMsg = {
        role: "assistant", content: parsed.message,
        suggestedTool: parsed.suggestedTool, suggestedToolReason: parsed.suggestedToolReason,
        fieldUpdates,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setConversationHistory([...newHistory, { role: "assistant", content: JSON.stringify(parsed) }]);
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "I had a brief connection issue — could you repeat that? I want to make sure I capture everything for your project.",
      }]);
    }
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [input, isLoading, conversationHistory, project, readiness]);

  const handleCreateFolder = useCallback(() => {
    if (!projectId) return;
    updateProject(projectId, {
      status: "in-progress",
      name: project.name || "Untitled Project",
      type: project.type || null,
      fields: project,
      readiness,
    });
    if (onProjectCreated) onProjectCreated(projectId);
  }, [projectId, project, readiness, onProjectCreated]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ fontFamily: SANS, background: C.bg, minHeight: "100vh", color: C.dark, display: "flex", opacity: loaded ? 1 : 0, transition: "opacity 0.4s" }}>

      {/* ─── CHAT COLUMN ─── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        borderRight: `1px solid ${C.border}`, minWidth: 0,
      }}>
        {/* Chat header */}
        <header style={{
          padding: "20px 24px", background: C.white,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, background: C.sidebarBg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: SERIF, fontSize: 16, color: C.sidebarActive, fontWeight: 700 }}>Z</span>
            </div>
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase" }}>Imagine</div>
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.light }}>AI Design Consultant</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {started && (
              <Pill label={`${readiness}% Ready`} small
                color={readiness < 30 ? C.coral : readiness < 65 ? C.amber : C.green}
                bg={readiness < 30 ? C.redBg : readiness < 65 ? C.amberBg : C.greenBg}
                border={readiness < 30 ? C.redBorder : readiness < 65 ? C.amberBorder : C.greenBorder}
              />
            )}
            <button onClick={() => setPanelCollapsed(!panelCollapsed)} style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
              padding: "7px 14px", color: C.mid, background: C.white,
              border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none",
            }}>{panelCollapsed ? "Show" : "Hide"} Folder</button>
          </div>
        </header>

        {/* Chat messages */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 16, paddingBottom: 16 }}>
          {!started ? (
            <WelcomeScreen />
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i}>
                  <ChatMessage message={msg.content} isUser={msg.role === "user"} isFirst={i === 0} />
                  {/* Field update toasts */}
                  {msg.fieldUpdates?.map((u, j) => (
                    <FieldUpdateToast key={j} field={u.field} value={u.value} />
                  ))}
                  {/* Tool suggestion */}
                  {msg.suggestedTool && TOOL_INFO[msg.suggestedTool] && (
                    <ToolSuggestion toolKey={msg.suggestedTool} reason={msg.suggestedToolReason} onUse={() => {}} />
                  )}
                </div>
              ))}
              {isLoading && <TypingDots />}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: "16px 20px", background: C.white,
          borderTop: `1px solid ${C.border}`,
        }}>
          {!started ? (
            <button onClick={startConversation} style={{
              width: "100%", padding: "16px 24px",
              fontFamily: SERIF, fontSize: 18, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase",
              color: C.white, background: C.sidebarBg, border: "none",
              borderRadius: R, cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#3A3A34"}
              onMouseLeave={(e) => e.currentTarget.style.background = C.sidebarBg}
            >
              {"\u2726"} &nbsp;Begin Imagining
            </button>
          ) : (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{
                flex: 1, position: "relative",
                background: C.section, borderRadius: R, border: `1px solid ${C.border}`,
                transition: "border-color 0.2s",
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your vision\u2026"
                  rows={1}
                  style={{
                    width: "100%", padding: "14px 18px", fontFamily: SANS, fontSize: 13.5,
                    color: C.dark, background: "transparent", border: "none", resize: "none",
                    lineHeight: 1.6, minHeight: 48, maxHeight: 140, overflowY: "auto",
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                  }}
                  onFocus={(e) => e.target.parentElement.style.borderColor = C.borderHover}
                  onBlur={(e) => e.target.parentElement.style.borderColor = C.border}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                style={{
                  width: 48, height: 48, borderRadius: R, border: "none",
                  background: input.trim() ? C.coral : C.border,
                  color: C.white, cursor: input.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s", flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── PROJECT FOLDER PANEL ─── */}
      {!panelCollapsed && (
        <div style={{
          width: 340, background: C.white, flexShrink: 0,
          borderLeft: `1px solid ${C.border}`, overflowY: "auto",
          animation: "slideIn 0.25s ease",
        }}>
          {started ? (
            <ProjectPanel project={project} readiness={readiness} projectId={projectId} onCreateFolder={handleCreateFolder} />
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontSize: 11, color: C.border, letterSpacing: 2, textTransform: "uppercase" }}>Project folder will<br />appear here</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
