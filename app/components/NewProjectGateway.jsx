"use client";

import { useState, useRef, useCallback } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";
import { createProject, uploadFileToProject } from "../lib/storage";

// ─── Accepted file types for reference image ───
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif,.pdf";

const JEWELRY_TYPES = [
  { key: "ring", label: "Ring" },
  { key: "pendant", label: "Pendant" },
  { key: "earrings", label: "Earrings" },
  { key: "bracelet", label: "Bracelet" },
  { key: "other", label: "Other" },
];

// ═══════════════════════════════════════
// NEW PROJECT GATEWAY
// ═══════════════════════════════════════
export default function NewProjectGateway({ onClose, onBlankCreated, onQuickCreated, onAIAssisted }) {
  const [selectedPath, setSelectedPath] = useState(null); // null | "quick"
  const [name, setName] = useState("");
  const [jewelryType, setJewelryType] = useState(null);
  const [refFile, setRefFile] = useState(null);
  const [refPreview, setRefPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Handle file selection ───
  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return;
    setRefFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setRefPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setRefPreview(null);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ─── Create blank project ───
  const handleBlank = useCallback(() => {
    if (creating) return;
    setCreating(true);
    const p = createProject({ name: "Untitled Project" });
    onBlankCreated(p.id);
  }, [creating, onBlankCreated]);

  // ─── Create quick-start project ───
  const handleQuickCreate = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    const projectName = name.trim() || "Untitled Project";
    const fields = { name: projectName };
    if (jewelryType) fields.type = jewelryType;
    const p = createProject({ name: projectName, type: jewelryType, fields });
    // Upload reference file if provided
    if (refFile) {
      try {
        await uploadFileToProject(p.id, refFile, "reference");
      } catch (_) { /* non-blocking */ }
    }
    onQuickCreated(p.id);
  }, [creating, name, jewelryType, refFile, onQuickCreated]);

  // ─── Launch AI-assisted ───
  const handleAIAssisted = useCallback(() => {
    onAIAssisted();
  }, [onAIAssisted]);

  const isQuickExpanded = selectedPath === "quick";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(30,30,28,0.22)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isQuickExpanded ? 540 : 480,
          background: C.bg, borderRadius: R, overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 2px 12px rgba(0,0,0,0.06)",
          animation: "slideUp 0.25s ease",
          transition: "width 0.3s ease",
        }}
      >
        {/* ─── Header ─── */}
        <div style={{
          padding: "28px 36px 20px", background: C.white,
          borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{
              fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.black,
              letterSpacing: 4, textTransform: "uppercase", lineHeight: 1.2,
            }}>New Project</div>
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginTop: 4 }}>
              Choose how you'd like to get started
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.light, fontSize: 18, padding: 4, lineHeight: 1,
          }}>&#10005;</button>
        </div>

        {/* ─── Body ─── */}
        <div style={{ padding: "24px 36px 32px" }}>

          {/* ─── Path Cards ─── */}
          <div style={{ display: "flex", gap: 12, marginBottom: isQuickExpanded ? 24 : 0 }}>
            {/* Blank Project */}
            <PathCard
              title="Blank"
              description="Empty workspace, add details later"
              icon={<BlankIcon />}
              onClick={handleBlank}
              disabled={creating}
            />

            {/* Quick Start */}
            <PathCard
              title="Quick Start"
              description="Name, type & reference image"
              icon={<QuickIcon />}
              active={isQuickExpanded}
              onClick={() => setSelectedPath(isQuickExpanded ? null : "quick")}
            />

            {/* AI-Assisted */}
            <PathCard
              title="AI-Assisted"
              description="Describe your vision, Claude helps"
              icon={<AIIcon />}
              onClick={handleAIAssisted}
              accent
            />
          </div>

          {/* ─── Quick Start Expanded Form ─── */}
          {isQuickExpanded && (
            <div style={{ animation: "slideUp 0.2s ease" }}>
              {/* Divider */}
              <div style={{ height: 1, background: C.border, marginBottom: 20 }} />

              {/* Name input */}
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  fontFamily: SANS, fontSize: 9.5, fontWeight: 600,
                  letterSpacing: 2.5, textTransform: "uppercase", color: C.label,
                  display: "block", marginBottom: 6,
                }}>Project Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Celestial Halo Ring"
                  autoFocus
                  style={{
                    width: "100%", padding: "11px 14px",
                    fontFamily: SANS, fontSize: 14, color: C.dark,
                    background: C.white, border: `1px solid ${C.border}`,
                    borderRadius: RS, outline: "none", transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.borderHover)}
                  onBlur={(e) => (e.target.style.borderColor = C.border)}
                  onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleQuickCreate(); }}
                />
              </div>

              {/* Jewelry Type selector */}
              <div style={{ marginBottom: 18 }}>
                <label style={{
                  fontFamily: SANS, fontSize: 9.5, fontWeight: 600,
                  letterSpacing: 2.5, textTransform: "uppercase", color: C.label,
                  display: "block", marginBottom: 8,
                }}>Jewelry Type</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {JEWELRY_TYPES.map((t) => (
                    <TypeButton
                      key={t.key}
                      label={t.label}
                      active={jewelryType === t.key}
                      onClick={() => setJewelryType(jewelryType === t.key ? null : t.key)}
                    />
                  ))}
                </div>
              </div>

              {/* Reference Image Drop Zone */}
              <div style={{ marginBottom: 22 }}>
                <label style={{
                  fontFamily: SANS, fontSize: 9.5, fontWeight: 600,
                  letterSpacing: 2.5, textTransform: "uppercase", color: C.label,
                  display: "block", marginBottom: 8,
                }}>Reference Image <span style={{ fontWeight: 400, color: C.light, letterSpacing: 1 }}>(optional)</span></label>

                {refFile ? (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px", background: C.white, borderRadius: RS,
                    border: `1px solid ${C.border}`,
                  }}>
                    {refPreview ? (
                      <div style={{
                        width: 48, height: 48, borderRadius: 4, flexShrink: 0,
                        background: `url(${refPreview}) center/cover`, border: `1px solid ${C.border}`,
                      }} />
                    ) : (
                      <div style={{
                        width: 48, height: 48, borderRadius: 4, flexShrink: 0,
                        background: C.section, display: "flex", alignItems: "center", justifyContent: "center",
                        border: `1px solid ${C.border}`,
                      }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: C.light }}>PDF</span>
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: SANS, fontSize: 12.5, color: C.dark, fontWeight: 500,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{refFile.name}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.light, marginTop: 2 }}>
                        {(refFile.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <button onClick={() => { setRefFile(null); setRefPreview(null); }} style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: C.light, fontSize: 14, padding: 4,
                    }}>&#10005;</button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: "20px", textAlign: "center", cursor: "pointer",
                      background: dragOver ? C.white : C.section,
                      border: `1.5px dashed ${dragOver ? C.coral : C.border}`,
                      borderRadius: RS, transition: "all 0.2s",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={dragOver ? C.coral : C.light} strokeWidth="1.5" style={{ marginBottom: 6 }}>
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <div style={{ fontFamily: SANS, fontSize: 12, color: dragOver ? C.coral : C.mid }}>
                      Drop image or <span style={{ color: C.coral, fontWeight: 500 }}>browse</span>
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 10, color: C.light, marginTop: 3 }}>
                      JPG, PNG, WebP, or PDF
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS}
                      style={{ display: "none" }}
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </div>
                )}
              </div>

              {/* Create Button */}
              <button
                onClick={handleQuickCreate}
                disabled={creating}
                style={{
                  width: "100%", padding: "13px 24px",
                  fontFamily: SANS, fontSize: 12, fontWeight: 600,
                  letterSpacing: 2.5, textTransform: "uppercase",
                  background: creating ? C.light : C.coral, color: C.white,
                  border: "none", borderRadius: RS, cursor: creating ? "default" : "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => { if (!creating) e.currentTarget.style.background = C.coralHover; }}
                onMouseLeave={(e) => { if (!creating) e.currentTarget.style.background = C.coral; }}
              >
                {creating ? "Creating…" : "Create & Open Project"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PATH CARD ───
function PathCard({ title, description, icon, onClick, active, accent, disabled }) {
  const [h, setH] = useState(false);
  const isHighlighted = active || h;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1, padding: "24px 16px 20px",
        background: active ? C.white : (h ? C.white : C.section),
        textAlign: "center", cursor: disabled ? "default" : "pointer",
        border: `1px solid ${active ? (accent ? C.coral : C.borderHover) : (h ? C.borderHover : C.border)}`,
        borderRadius: R, transition: "all 0.2s ease",
        boxShadow: isHighlighted ? "0 2px 12px rgba(0,0,0,0.04)" : "none",
        outline: "none", opacity: disabled ? 0.6 : 1,
        position: "relative",
      }}
    >
      {accent && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          fontFamily: MONO, fontSize: 7.5, fontWeight: 600,
          letterSpacing: 1.5, textTransform: "uppercase",
          color: C.coral, background: `${C.coral}0C`,
          padding: "2px 6px", borderRadius: 3,
          border: `1px solid ${C.coral}20`,
        }}>AI</div>
      )}
      <div style={{ marginBottom: 10, opacity: isHighlighted ? 1 : 0.55, transition: "opacity 0.2s" }}>
        {icon}
      </div>
      <div style={{
        fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: C.black,
        letterSpacing: 3, textTransform: "uppercase", marginBottom: 5, lineHeight: 1.3,
      }}>{title}</div>
      <div style={{
        fontFamily: SANS, fontSize: 11, color: C.light, lineHeight: 1.5,
      }}>{description}</div>
    </button>
  );
}

// ─── TYPE BUTTON ───
function TypeButton({ label, active, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1, padding: "9px 4px",
        fontFamily: SANS, fontSize: 10.5, fontWeight: active ? 600 : 400,
        letterSpacing: 1.5, textTransform: "uppercase",
        color: active ? C.black : (h ? C.mid : C.light),
        background: active ? C.white : (h ? C.section : "transparent"),
        border: `1px solid ${active ? C.borderHover : (h ? C.border : C.border)}`,
        borderRadius: RS, cursor: "pointer", transition: "all 0.15s", outline: "none",
      }}
    >{label}</button>
  );
}

// ─── ICONS ───
function BlankIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.mid} strokeWidth="1.2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function QuickIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.mid} strokeWidth="1.2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="1.2">
      <path d="M12 2a7 7 0 017 7c0 3-2 5.5-4 7l-1 4H10l-1-4c-2-1.5-4-4-4-7a7 7 0 017-7z" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}
