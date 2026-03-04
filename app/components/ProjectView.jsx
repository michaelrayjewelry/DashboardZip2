import { useState, useEffect, useRef } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";
import {
  getProject, updateProject, getProjectFiles, getProjectFilesByCategory,
  uploadFileToProject, getFileBlobURL, FILE_CATEGORIES,
} from "../lib/storage";

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

// ─── PIPELINE STAGES ───
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

function PipelineBar({ current }) {
  const idx = PIPELINE.findIndex((p) => p.key === current);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "stretch" }}>
      {PIPELINE.map((stage, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={stage.key} style={{
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

// ─── MATERIAL ROW ───
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
  const [fileUrls, setFileUrls] = useState({}); // blobKey → objectURL
  const uploadRef = useRef(null);
  const [uploadContext, setUploadContext] = useState("reference"); // context for current upload
  const toggle = (k) => setCollapse((s) => ({ ...s, [k]: !s[k] }));

  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  // Load project data from storage
  const storedProject = projectId ? getProject(projectId) : null;

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
          </div>
        </div>
        <PipelineBar current={project.stage} />
      </header>

      {/* ─── Tab Bar ─── */}
      <div style={{ padding: "0 44px", background: C.white }}>
        <TabBar tabs={TABS} active={activeTab} onSelect={setActiveTab} />
      </div>

      {/* ─── Tab Content ─── */}
      <div style={{ padding: "28px 44px 60px", maxWidth: 1080, animation: "slideUp 0.25s ease" }} key={activeTab}>

        {/* ════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Client Info */}
            <Section label="Client" rightAction={<SmallBtn label="Edit Client" onClick={() => void 0} />}>
              <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
                <InfoField label="Email" value={project.client.email} />
                <InfoField label="Name" value={project.client.name} />
                <InfoField label="Phone" value={project.client.phone} />
                <InfoField label="Created" value={project.client.created} />
              </div>
            </Section>

            {/* Quick Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
              {[
                { label: "Type", value: "Ring" },
                { label: "Metal", value: "14k Yellow Gold" },
                { label: "Est. Weight", value: "8.2g" },
                { label: "Est. Cost", value: "$1,240" },
              ].map((s, i) => (
                <div key={i} style={{ background: C.section, borderRadius: R, border: `1px solid ${C.border}`, padding: "18px 20px", textAlign: "center" }}>
                  <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.black }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Reference Images */}
            <Section label="Reference Images" count={(filesByCategory.reference || []).length} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("reference")} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {(filesByCategory.reference || []).map((f) => {
                  const url = getFileUrl(f);
                  return <ImageSlot key={f.id} label={f.name} hasImage={!!url} src={url} />;
                })}
                {(filesByCategory.render || []).map((f) => {
                  const url = getFileUrl(f);
                  return <ImageSlot key={f.id} label={f.name} hasImage={!!url} src={url} />;
                })}
                <ImageSlot label="Add Image" hasImage={false} />
              </div>
            </Section>

            {/* Recent Activity */}
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
            <Section label="AI-Generated Concepts" count={4} rightAction={<SmallBtn label="+ Generate New" primary onClick={() => void 0} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[1, 2, 3, 4].map((n) => <ImageSlot key={n} label={`Concept ${n}`} />)}
                <ImageSlot label="Generate" />
              </div>
              <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 12, color: C.light }}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.mid }}>PROMPT:</span> Crown of thorns design, literal depiction, stylized thorn motif, detailed thorns, sharp thorns, 14k yellow gold
              </div>
            </Section>

            <Section label="Sketches & Drawings" count={(filesByCategory.sketch || []).length} rightAction={<SmallBtn label="+ Upload" onClick={() => triggerUpload("sketch")} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <ImageSlot label="Sketch 1" />
                <ImageSlot label="Sketch 2" />
                <ImageSlot label="Add Sketch" />
              </div>
            </Section>

            <Section label="Photorealistic Renders" count={3} rightAction={<SmallBtn label="+ Render" primary onClick={() => void 0} />}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {["Front View", "Side View", "Detail"].map((v) => <ImageSlot key={v} label={v} />)}
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
                <Field label="Jewelry Type" value={project.fields.type || "Ring"} />
                <Field label="Name" value={project.fields.name || project.name} />
                <Field label="Description" value={project.fields.description || "Crown of thorns design, literal depiction, stylized thorn motif, detailed thorns, sharp thorns, crown of thorns, 14k yellow gold"} wide textarea />
              </div>
            </Section>

            <Section label="Dimensions & Sizing">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field label="Ring Size" value="10" />
                <Field label="Band Width" value="6mm" />
                <Field label="Band Thickness" value="2.2mm" />
                <Field label="Total Height" value="8mm" />
                <Field label="Gender" value="" />
                <Field label="Weight (est.)" value="8.2g" />
              </div>
            </Section>

            <Section label="Metal">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field label="Metal" value={project.fields.metal || "Yellow Gold"} />
                <Field label="Metal Karat" value={project.fields.metalKarat || "14k"} />
                <Field label="Finish" value={project.fields.finish || "High Polish"} />
                <Field label="Plating" value="None" />
              </div>
            </Section>

            <Section label="Gemstones" collapsed={collapseState.gems} onToggle={() => toggle("gems")} count={0}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field label="Main Gemstone" value="" />
                <Field label="Gemstone Shape" value="" />
                <Field label="Gemstone Size" value="" />
                <Field label="Gemstone Quality" value="" />
                <Field label="Setting Type" value="" />
                <Field label="Number of Stones" value="" />
                <Field label="Side Stones" value="" />
                <Field label="Total Carat Weight" value="" />
              </div>
            </Section>

            <Section label="Style Details" collapsed={collapseState.style} onToggle={() => toggle("style")}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 32px" }}>
                <Field label="Band Style" value="Sculptural" />
                <Field label="Ring Type" value="Statement" />
                <Field label="Design Motif" value="Crown of Thorns" />
                <Field label="Texture" value="Organic / Thorn Detail" />
                <Field label="Engraving" value="" />
                <Field label="Special Instructions" value="" wide textarea />
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
              {/* Table header */}
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
                <Field label="Material Cost" value="$426.40" readOnly />
                <Field label="Labor Cost" value="$435.00" readOnly />
                <Field label="Markup %" value="45%" />
                <Field label="Retail Price" value="$1,249.03" readOnly />
                <Field label="Client Budget" value="" />
                <Field label="Deposit Received" value="" />
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
            <Section label="CAD Files" count={(filesByCategory.cad || []).length || 3} rightAction={<SmallBtn label="+ Upload CAD" onClick={() => triggerUpload("cad")} />}>
              <FileCard name="crown-thorns-v3.step" type="cad" size="4.2 MB" date="Mar 3, 2026" status="Current" />
              <FileCard name="crown-thorns-v2.step" type="cad" size="3.8 MB" date="Feb 28, 2026" />
              <FileCard name="crown-thorns-v1.step" type="cad" size="3.1 MB" date="Feb 25, 2026" />
            </Section>

            <Section label="3D Models" count={(filesByCategory.model3d || []).length || 2} rightAction={<SmallBtn label="+ Upload Model" onClick={() => triggerUpload("3d")} />}>
              <FileCard name="crown-thorns-render.stl" type="model" size="12.6 MB" date="Mar 2, 2026" status="Current" />
              <FileCard name="crown-thorns-print.stl" type="model" size="8.4 MB" date="Mar 1, 2026" />
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
    </>
  );
}
