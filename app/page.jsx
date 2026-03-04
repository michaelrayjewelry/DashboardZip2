"use client";

import React, { useState } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./components/shared";
import ProductsView from "./components/ProductsView";
import OrdersView from "./components/OrdersView";
import ImagineView from "./components/ImagineView";
import ProjectView from "./components/ProjectView";
import NewProjectModal from "./components/NewProjectModal";

// ─── Mock Data ───
const PRIMARY_ACTIONS = [
  { id: "new-project", title: "New Project", sub: "Create a new custom jewelry project", actionLabel: "Create Project" },
  { id: "imagine", title: "Imagine", sub: "AI-powered concept generation", action: "navigate" },
  { id: "start-collection", title: "Start a Collection", sub: "Group products into a collection", actionLabel: "Create Collection" },
  { id: "create-order", title: "Create an Order", sub: "Start a new customer order", action: "navigate" },
];

const AI_TOOLS = [
  { id: "sketch-to-jewelry", title: "Sketch to Jewelry", sub: "Convert hand sketches to jewelry designs", actionLabel: "Generate Design" },
  { id: "technical-to-image", title: "Technical to Image", sub: "Convert technical drawings to realistic images", actionLabel: "Generate Image" },
  { id: "image-to-marketing", title: "Image to Marketing", sub: "Transform product photos into marketing materials", actionLabel: "Generate Marketing" },
  { id: "manufacture-estimate", title: "Manufacture Estimate", sub: "AI-powered manufacturing cost estimates", actionLabel: "Get Estimate" },
  { id: "3d-model", title: "3D Model Generation", sub: "Generate 3D models from designs", actionLabel: "Generate 3D Model" },
  { id: "file-hub", title: "File & Document Hub", sub: "Central file and document management", actionLabel: "Upload Files" },
];

const PROJECTS = [
  { id: 1, name: "Celestial Halo Ring", collection: "Astral Collection", status: "in-progress", stage: "3D Modeling", time: "2h ago" },
  { id: 2, name: "Serpentine Cuff", collection: "Mythos Line", status: "review", stage: "Client Approval", time: "1d ago" },
  { id: 3, name: "Art Deco Pendant", collection: "Heritage Revival", status: "complete", stage: "Production Ready", time: "3d ago" },
  { id: 4, name: "Organic Vine Earrings", collection: "Astral Collection", status: "draft", stage: "Concept", time: "5d ago" },
];

const COLLECTIONS = [
  { name: "Astral Collection", count: 8 },
  { name: "Mythos Line", count: 5 },
  { name: "Heritage Revival", count: 12 },
  { name: "Summer '26 Bridal", count: 3 },
];

const STATS = [
  { label: "Active Projects", value: "4" },
  { label: "Pieces Created", value: "27" },
  { label: "AI Generations", value: "143" },
  { label: "Avg. Turnaround", value: "4.2d" },
];

// ─── Sidebar Nav Item ───
function SideNav({ label, active, onClick, icon }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        textAlign: "left",
        padding: "11px 28px",
        border: "none",
        cursor: "pointer",
        fontFamily: SANS,
        fontSize: 12.5,
        fontWeight: active ? 600 : 400,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: active ? C.sidebarActive : C.sidebarText,
        background: active ? C.sidebarActiveBg : h ? "rgba(255,255,255,0.03)" : "transparent",
        borderLeft: active ? `3px solid ${C.sidebarActive}` : "3px solid transparent",
        transition: "all 0.2s",
        borderRadius: 0,
      }}
    >
      {icon && <span style={{ display: "flex", alignItems: "center", opacity: active ? 1 : 0.6 }}>{icon}</span>}
      {label}
    </button>
  );
}

// ─── Section Container ───
function Section({ label, children, style = {}, rightAction }) {
  return (
    <div
      style={{
        background: C.section,
        borderRadius: R,
        border: `1px solid ${C.border}`,
        padding: "24px 28px",
        marginBottom: 16,
        ...style,
      }}
    >
      {(label || rightAction) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          {label && (
            <div
              style={{
                fontFamily: SANS,
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: C.label,
              }}
            >
              {label}
            </div>
          )}
          {rightAction}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const map = {
    draft: { label: "Draft", color: C.light },
    "in-progress": { label: "In Progress", color: C.blue },
    review: { label: "In Review", color: C.amber },
    complete: { label: "Complete", color: C.green },
  };
  const s = map[status] || map.draft;
  return (
    <span
      style={{
        fontFamily: SANS,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 2,
        textTransform: "uppercase",
        padding: "5px 14px",
        borderRadius: RS,
        color: s.color,
        background: `${s.color}0C`,
        border: `1px solid ${s.color}20`,
      }}
    >
      {s.label}
    </span>
  );
}

// ─── Tool Card (2x2 grid) ───
function ToolCard({ title, sub, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1,
        minWidth: 220,
        padding: "48px 28px",
        background: h ? C.white : C.section,
        textAlign: "center",
        cursor: "pointer",
        border: `1px solid ${h ? C.borderHover : C.border}`,
        borderRadius: R,
        transition: "all 0.25s ease",
        boxShadow: h ? "0 2px 16px rgba(0,0,0,0.04)" : "none",
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: C.black,
          marginBottom: 8,
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, letterSpacing: 0.5 }}>{sub}</div>
    </button>
  );
}

// ─── Primary Action Card (large, prominent) ───
function PrimaryActionCard({ title, sub, onClick, isNavigate }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        padding: "52px 28px",
        background: h ? C.white : C.section,
        textAlign: "center",
        cursor: "pointer",
        border: `1px solid ${h ? C.borderHover : C.border}`,
        borderLeft: h ? `3px solid ${C.coral}` : `3px solid transparent`,
        borderRadius: R,
        transition: "all 0.25s ease",
        boxShadow: h ? "0 4px 24px rgba(0,0,0,0.06)" : "none",
        position: "relative",
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: C.black,
          marginBottom: 10,
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.light, letterSpacing: 0.3 }}>{sub}</div>
      {isNavigate && (
        <div style={{
          position: "absolute", top: 14, right: 16,
          fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2,
          textTransform: "uppercase", color: h ? C.coral : C.light,
          transition: "color 0.2s",
        }}>
          →
        </div>
      )}
    </button>
  );
}

// ─── Project Row ───
function ProjectRow({ project, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "15px 20px",
        gap: 18,
        background: h ? C.white : C.section,
        border: `1px solid ${h ? C.borderHover : C.border}`,
        borderRadius: RS,
        cursor: "pointer",
        transition: "all 0.2s",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: RS,
          background: C.border,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.2">
          <path d="M6 3h12l4 6-10 13L2 9z" />
          <path d="M2 9h20" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 16,
            fontWeight: 600,
            color: C.black,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {project.name}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.light, marginTop: 2 }}>
          {project.collection} &middot; {project.stage}
        </div>
      </div>
      <StatusBadge status={project.status} />
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.light, flexShrink: 0 }}>{project.time}</span>
    </div>
  );
}

// ─── Shared Modal Helpers ───
const inputStyle = {
  width: "100%", padding: "8px 2px", fontFamily: SANS, fontSize: 13.5, color: C.dark,
  background: "transparent", border: "none", borderBottom: `1px solid ${C.borderInput}`,
  outline: "none", transition: "border-color 0.2s", borderRadius: 0,
};
const labelStyle = {
  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2.5,
  textTransform: "uppercase", color: C.label, marginBottom: 4,
};

function ModalField({ label, wide, textarea }) {
  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 calc(50% - 16px)", minWidth: wide ? "100%" : 200 }}>
      <div style={labelStyle}>{label}</div>
      {textarea ? (
        <textarea rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
          onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
          onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)} />
      ) : (
        <input style={inputStyle}
          onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
          onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)} />
      )}
    </div>
  );
}

function ImageDropZone({ dragOver, setDragOver, large }) {
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      style={{
        width: large ? "100%" : 180, height: large ? 220 : 180, borderRadius: RS,
        background: dragOver ? "rgba(90,138,74,0.06)" : C.border,
        border: `2px dashed ${dragOver ? C.green : "transparent"}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.green : C.light} strokeWidth="1.2" style={{ marginBottom: 8 }}>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span style={{ fontFamily: SANS, fontSize: 10, color: C.light, letterSpacing: 1.5, textTransform: "uppercase" }}>
        {large ? "Drop image or click to upload" : "Drop image"}
      </span>
    </div>
  );
}

// ─── Tool Modal ───
function ToolModal({ tool, onClose }) {
  const [dragOver, setDragOver] = useState(false);
  if (!tool) return null;

  const isImageTool = ["sketch-to-jewelry", "technical-to-image", "image-to-marketing"].includes(tool.id);
  const isEstimate = tool.id === "manufacture-estimate";
  const is3d = tool.id === "3d-model";
  const isCollection = tool.id === "start-collection";
  const isFileHub = tool.id === "file-hub";
  const actionLabel = tool.actionLabel || "Generate with AI";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(30,30,28,0.18)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: 60, overflowY: "auto", animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 780, marginBottom: 60,
          background: C.bg, borderRadius: R, border: `1px solid ${C.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)", animation: "slideUp 0.25s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "32px 36px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase" }}>
            {tool.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isCollection && (
              <select style={{
                fontFamily: SANS, fontSize: 11, fontWeight: 500, letterSpacing: 2, textTransform: "uppercase",
                padding: "8px 28px 8px 14px", color: C.mid, background: C.white,
                border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
              }}>
                <option>Draft</option><option>In Progress</option><option>Complete</option>
              </select>
            )}
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer", color: C.light,
              fontSize: 11, fontFamily: SANS, letterSpacing: 2, textTransform: "uppercase", padding: "8px 4px", fontWeight: 500,
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "24px 36px 36px" }}>

          {/* ── Start a Collection body ── */}
          {isCollection && (
            <>
              <Section label="Collection Details">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
                  <ModalField label="Collection Name" />
                  <ModalField label="Season / Year" />
                  <ModalField label="Description" wide textarea />
                </div>
              </Section>
              <Section label="Add Products">
                <div style={{ padding: "30px 0", textAlign: "center" }}>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginBottom: 8 }}>Select products to include in this collection</div>
                  {["Crown of Thorns Ring", "Celestial Halo Ring", "Serpentine Cuff", "Lunar Phase Necklace"].map((p) => (
                    <label key={p} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", cursor: "pointer", borderBottom: `1px solid ${C.border}` }}>
                      <input type="checkbox" style={{ accentColor: C.green, width: 14, height: 14 }} />
                      <span style={{ fontFamily: SANS, fontSize: 13, color: C.dark }}>{p}</span>
                    </label>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* ── Image-input AI tools (Sketch, Technical, Marketing) ── */}
          {isImageTool && (
            <>
              <Section label="Upload Image">
                <ImageDropZone dragOver={dragOver} setDragOver={setDragOver} large />
              </Section>
              <Section label="Instructions">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
                  <ModalField label="Prompt / Description" wide textarea />
                  <ModalField label="Style" />
                  <ModalField label="Output Format" />
                </div>
              </Section>
            </>
          )}

          {/* ── Manufacture Estimate ── */}
          {isEstimate && (
            <>
              <Section label="Reference Image">
                <ImageDropZone dragOver={dragOver} setDragOver={setDragOver} />
              </Section>
              <Section label="Specifications">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
                  {["Metal", "Metal Karat", "Estimated Weight", "Main Gemstone", "Number of Stones", "Ring Size"].map((l) => (
                    <ModalField key={l} label={l} />
                  ))}
                  <ModalField label="Additional Notes" wide textarea />
                </div>
              </Section>
            </>
          )}

          {/* ── 3D Model Generation ── */}
          {is3d && (
            <>
              <Section label="Source Image or CAD">
                <ImageDropZone dragOver={dragOver} setDragOver={setDragOver} large />
              </Section>
              <Section label="Model Parameters">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
                  <ModalField label="Output Format" />
                  <ModalField label="Resolution" />
                  <ModalField label="Description" wide textarea />
                </div>
              </Section>
            </>
          )}

          {/* ── File & Document Hub ── */}
          {isFileHub && (
            <>
              <Section label="Upload Files">
                <ImageDropZone dragOver={dragOver} setDragOver={setDragOver} large />
              </Section>
              <Section label="Recent Files">
                {[
                  { name: "crown-thorns-v3.step", type: "CAD", size: "4.2 MB", date: "Mar 3, 2026" },
                  { name: "Quote-CrownThorns-001.pdf", type: "PDF", size: "124 KB", date: "Feb 24, 2026" },
                  { name: "render-front-v2.png", type: "IMG", size: "2.1 MB", date: "Mar 1, 2026" },
                  { name: "Custom-Order-Agreement.pdf", type: "DOC", size: "210 KB", date: "Feb 23, 2026" },
                ].map((f) => (
                  <div key={f.name} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "10px 0",
                    borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: C.blue, letterSpacing: 1,
                      padding: "4px 8px", background: C.blueBg, borderRadius: RS, border: `1px solid ${C.blueBorder}` }}>{f.type}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: C.dark }}>{f.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.light, marginTop: 1 }}>{f.size} · {f.date}</div>
                    </div>
                  </div>
                ))}
              </Section>
            </>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              style={{
                flex: 1, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                padding: "14px 28px", background: C.coral, color: C.white, border: "none", borderRadius: RS,
                cursor: "pointer", transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.coralHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.coral)}
            >
              {actionLabel}
            </button>
            <button
              style={{
                fontFamily: SANS, fontSize: 12, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
                padding: "14px 24px", background: C.white, color: C.mid, border: `1px solid ${C.border}`,
                borderRadius: RS, cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderHover)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
            >
              {isFileHub ? "Close" : "Save Draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SVG Icons ───
function SearchIcon({ color = C.light, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

function BellIcon({ color = C.mid, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function DashboardIcon({ color = C.sidebarText }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ProjectsIcon({ color = C.sidebarText }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  );
}

function ProductsIcon({ color = C.sidebarText }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M2 9h20" />
    </svg>
  );
}

function OrdersIcon({ color = C.sidebarText }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function UsersIcon({ color = C.sidebarText }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function ImagineIcon({ color = C.sidebarText }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

// ─── Dashboard Content ───
function DashboardContent({ onNavigate, onOpenTool }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      {/* ─── Header Bar ─── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 44px",
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ position: "relative", flex: "0 1 420px" }}>
          <div
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <SearchIcon color={C.light} size={15} />
          </div>
          <input
            placeholder="Search projects, tools, orders..."
            style={{
              width: "100%",
              padding: "11px 16px 11px 40px",
              fontFamily: SANS,
              fontSize: 13,
              color: C.dark,
              background: C.section,
              border: `1px solid ${C.border}`,
              borderRadius: R,
              outline: "none",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = C.borderHover;
              e.target.style.background = C.white;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = C.border;
              e.target.style.background = C.section;
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            style={{
              width: 38,
              height: 38,
              borderRadius: R,
              border: `1px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderHover)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
          >
            <BellIcon />
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 9,
                width: 6,
                height: 6,
                borderRadius: 3,
                background: C.coral,
                border: `1.5px solid ${C.white}`,
              }}
            />
          </button>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: C.sidebarBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontFamily: SERIF,
              fontSize: 14,
              fontWeight: 600,
              color: C.sidebarActive,
              letterSpacing: 1,
            }}
          >
            M
          </div>
        </div>
      </header>

      {/* ─── Scrollable Content ─── */}
      <div style={{ padding: "36px 44px", maxWidth: 1080 }}>
        {/* Hero Greeting */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 38,
              fontWeight: 600,
              color: C.black,
              letterSpacing: 1,
              lineHeight: 1.2,
              marginBottom: 10,
            }}
          >
            {getGreeting()}, Michael.
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 14,
              color: C.light,
              letterSpacing: 0.3,
              marginBottom: 22,
            }}
          >
            4 active projects &middot; 2 awaiting review &middot; 1 ready for delivery
          </div>
        </div>

        {/* Quick Actions */}
        <Section label="Quick Actions" style={{ padding: "28px 28px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {PRIMARY_ACTIONS.map((a) => (
              <PrimaryActionCard
                key={a.id}
                title={a.title}
                sub={a.sub}
                isNavigate={a.action === "navigate"}
                onClick={() => {
                  if (a.id === "imagine") onNavigate("imagine");
                  else if (a.id === "create-order") onNavigate("orders");
                  else onOpenTool(a);
                }}
              />
            ))}
          </div>
        </Section>

        {/* AI Tools */}
        <Section label="AI Tools" style={{ padding: "28px 28px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {AI_TOOLS.map((t) => (
              <ToolCard
                key={t.id}
                title={t.title}
                sub={t.sub}
                onClick={() => onOpenTool(t)}
              />
            ))}
          </div>
        </Section>

        {/* Recent Projects */}
        <Section
          label="Recent Projects"
          style={{ padding: "24px 28px 28px" }}
          rightAction={
            <span
              style={{
                fontFamily: SANS,
                fontSize: 10.5,
                color: C.light,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "color 0.2s",
                fontWeight: 500,
              }}
              onClick={() => onNavigate("projects")}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.mid)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.light)}
            >
              View All &rarr;
            </span>
          }
        >
          {PROJECTS.map((p) => (
            <ProjectRow key={p.id} project={p} onClick={() => onNavigate("project-detail")} />
          ))}
        </Section>

        {/* Overview Stats */}
        <Section label="Overview" style={{ padding: "24px 28px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {STATS.map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: "22px 18px",
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: RS,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                    color: C.label,
                    marginBottom: 10,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: 30,
                    fontWeight: 600,
                    color: C.black,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
          <div style={{ width: 32, height: 1, background: C.border, margin: "0 auto 14px", borderRadius: 1 }} />
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 13,
              color: C.light,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            Every piece. Every order. Organized.
          </div>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════
export default function ZipJewelerDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activeTool, setActiveTool] = useState(null);

  const handleNavigate = (target) => {
    setActiveNav(target);
    setActiveTool(null);
  };

  const sidebarNavKey = activeNav === "project-detail" ? "projects" : activeNav;

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { key: "projects", label: "Projects", icon: <ProjectsIcon /> },
    { key: "products", label: "Products", icon: <ProductsIcon /> },
    { key: "orders", label: "Orders", icon: <OrdersIcon /> },
    { key: "imagine", label: "Imagine", icon: <ImagineIcon /> },
  ];

  return (
    <div style={{ fontFamily: SANS, background: C.bg, minHeight: "100vh", color: C.dark, display: "flex" }}>
      {/* ═══ SIDEBAR ═══ */}
      <aside
        style={{
          width: 200,
          minHeight: "100vh",
          background: C.sidebarBg,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "28px 28px 36px" }}>
          <div
            onClick={() => handleNavigate("dashboard")}
            style={{
              fontFamily: SERIF,
              fontSize: 20,
              fontWeight: 600,
              color: C.sidebarActive,
              letterSpacing: 6,
              textTransform: "uppercase",
              lineHeight: 1.2,
              cursor: "pointer",
            }}
          >
            Zip
            <br />
            Jeweler
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {navItems.map((item) => (
            <SideNav
              key={item.key}
              label={item.label}
              icon={sidebarNavKey === item.key ? React.cloneElement(item.icon, { color: C.sidebarActive }) : item.icon}
              active={sidebarNavKey === item.key}
              onClick={() => handleNavigate(item.key)}
            />
          ))}
        </nav>

        {/* Collections */}
        <div style={{ padding: "36px 28px", flex: 1 }}>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 9.5,
              fontWeight: 600,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              color: "rgba(168,168,156,0.45)",
              marginBottom: 14,
            }}
          >
            Collections
          </div>
          {COLLECTIONS.map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", padding: "7px 0", cursor: "pointer" }}>
              <span style={{ fontFamily: SANS, fontSize: 12, color: C.sidebarText, flex: 1 }}>{c.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(168,168,156,0.35)" }}>{c.count}</span>
            </div>
          ))}
          <button
            style={{
              fontFamily: SANS,
              fontSize: 11,
              color: C.sidebarActive,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 0 0",
              letterSpacing: 1,
              opacity: 0.65,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
          >
            + New Collection
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(168,168,156,0.25)", letterSpacing: 1 }}>ZIPJEWELER.COM</div>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main
        style={{
          flex: 1,
          marginLeft: 200,
          minHeight: "100vh",
          animation: "fadeIn 0.4s ease",
        }}
      >
        {activeNav === "dashboard" && (
          <DashboardContent onNavigate={handleNavigate} onOpenTool={setActiveTool} />
        )}
        {activeNav === "projects" && (
          <>
            <header
              style={{
                padding: "24px 44px",
                background: C.white,
                borderBottom: `1px solid ${C.border}`,
                position: "sticky",
                top: 0,
                zIndex: 40,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: C.black, letterSpacing: 5, textTransform: "uppercase" }}>Projects</div>
                <button
                  style={{
                    fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                    padding: "10px 24px", background: C.coral, color: C.white, border: "none", borderRadius: RS,
                    cursor: "pointer", transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = C.coralHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = C.coral)}
                >
                  + New Project
                </button>
              </div>
            </header>
            <div style={{ padding: "28px 44px 60px", maxWidth: 1080 }}>
              <Section label="All Projects" style={{ padding: "24px 28px 28px" }}>
                {PROJECTS.map((p) => (
                  <ProjectRow key={p.id} project={p} onClick={() => handleNavigate("project-detail")} />
                ))}
              </Section>
            </div>
          </>
        )}
        {activeNav === "products" && <ProductsView />}
        {activeNav === "orders" && <OrdersView />}
        {activeNav === "imagine" && <ImagineView />}
        {activeNav === "project-detail" && (
          <ProjectView onBack={() => handleNavigate("projects")} />
        )}
      </main>

      {/* ═══ Tool Modal ═══ */}
      {activeTool?.id === "new-project" ? (
        <NewProjectModal onClose={() => setActiveTool(null)} />
      ) : (
        <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />
      )}
    </div>
  );
}
