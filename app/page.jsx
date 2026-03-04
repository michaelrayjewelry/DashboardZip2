"use client";

import React, { useState, useEffect } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./components/shared";
import ProductsView from "./components/ProductsView";
import OrdersView from "./components/OrdersView";
import ImagineView from "./components/ImagineView";
import ProjectView from "./components/ProjectView";

// ─── Mock Data ───
const TOOLS = [
  { id: "imagine", title: "Imagine Something New", sub: "Begin Custom Jewelry Concept" },
  { id: "convert", title: "Convert to Render", sub: "Generate High-Quality Render" },
  { id: "estimate", title: "Appraise & Estimate", sub: "Approximate Pricing Only" },
  { id: "gallery", title: "Inspiration Gallery", sub: "View Recent Creations" },
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

// ─── Tool Modal ───
function ToolModal({ tool, onClose }) {
  if (!tool) return null;
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(30,30,28,0.18)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: 60,
        overflowY: "auto",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 780,
          marginBottom: 60,
          background: C.bg,
          borderRadius: R,
          border: `1px solid ${C.border}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          animation: "slideUp 0.25s ease",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "32px 36px 0",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 32,
              fontWeight: 600,
              color: C.black,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {tool.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select
              style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "8px 28px 8px 14px",
                color: C.mid,
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: RS,
                cursor: "pointer",
                outline: "none",
                appearance: "auto",
              }}
            >
              <option>Draft</option>
              <option>In Progress</option>
              <option>Complete</option>
            </select>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: C.light,
                fontSize: 11,
                fontFamily: SANS,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "8px 4px",
                fontWeight: 500,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ padding: "24px 36px 36px" }}>
          {/* Client Section */}
          <Section
            label="Client"
            rightAction={
              <button
                style={{
                  fontFamily: SANS,
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  padding: "9px 22px",
                  background: C.coral,
                  color: C.white,
                  border: "none",
                  borderRadius: RS,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.coralHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = C.coral)}
              >
                Send Update Email
              </button>
            }
          >
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              {[
                { label: "Email", value: "client@email.com" },
                { label: "Name", value: "" },
                { label: "Phone", value: "" },
                { label: "Created", value: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
              ].map((f, i) => (
                <div key={i} style={{ minWidth: 120 }}>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 9.5,
                      fontWeight: 600,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: C.label,
                      marginBottom: 3,
                    }}
                  >
                    {f.label}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: C.dark, fontWeight: 500 }}>{f.value || "\u2014"}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Reference Image */}
          <Section label="Reference Image">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              style={{
                width: 180,
                height: 180,
                borderRadius: RS,
                background: dragOver ? "rgba(90,138,74,0.06)" : C.border,
                border: `2px dashed ${dragOver ? C.green : "transparent"}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={dragOver ? C.green : C.light}
                strokeWidth="1.2"
                style={{ marginBottom: 8 }}
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 10,
                  color: C.light,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Drop image
              </span>
            </div>
          </Section>

          {/* Specifications */}
          <Section label="Specifications">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
              {[
                "Jewelry Type",
                "Name",
                "Budget",
                "Size",
                "Gender",
                "Metal",
                "Metal Karat",
                "Main Gemstone",
                "Gemstone Shape",
                "Setting Type",
                "Band Style",
                "Ring Type",
              ].map((label) => (
                <div key={label} style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: 2.5,
                      textTransform: "uppercase",
                      color: C.label,
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </div>
                  <input
                    style={{
                      width: "100%",
                      padding: "8px 2px",
                      fontFamily: SANS,
                      fontSize: 13.5,
                      color: C.dark,
                      background: "transparent",
                      border: "none",
                      borderBottom: `1px solid ${C.borderInput}`,
                      outline: "none",
                      transition: "border-color 0.2s",
                      borderRadius: 0,
                    }}
                    onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
                    onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)}
                  />
                </div>
              ))}
              <div style={{ flex: "1 1 100%", minWidth: "100%" }}>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                    color: C.label,
                    marginBottom: 4,
                  }}
                >
                  Description
                </div>
                <textarea
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 2px",
                    fontFamily: SANS,
                    fontSize: 13.5,
                    color: C.dark,
                    background: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${C.borderInput}`,
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.6,
                    transition: "border-color 0.2s",
                    borderRadius: 0,
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
                  onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)}
                />
              </div>
            </div>
          </Section>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button
              style={{
                flex: 1,
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "14px 28px",
                background: C.coral,
                color: C.white,
                border: "none",
                borderRadius: RS,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.coralHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.coral)}
            >
              Generate with AI
            </button>
            <button
              style={{
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                padding: "14px 24px",
                background: C.white,
                color: C.mid,
                border: `1px solid ${C.border}`,
                borderRadius: RS,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderHover)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
            >
              Save Draft
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
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                fontFamily: SANS,
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "12px 26px",
                background: C.coral,
                color: C.white,
                border: "none",
                borderRadius: RS,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.coralHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.coral)}
            >
              + Start New Project
            </button>
            <button
              onClick={() => onNavigate("imagine")}
              style={{
                fontFamily: SANS,
                fontSize: 11.5,
                fontWeight: 500,
                letterSpacing: 2,
                textTransform: "uppercase",
                padding: "12px 26px",
                background: C.white,
                color: C.mid,
                border: `1px solid ${C.border}`,
                borderRadius: RS,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.borderHover;
                e.currentTarget.style.color = C.dark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.mid;
              }}
            >
              Open Imagine
            </button>
          </div>
        </div>

        {/* AI-Assisted Tools */}
        <Section label="AI-Assisted Tools" style={{ padding: "28px 28px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {TOOLS.map((t) => (
              <ToolCard
                key={t.id}
                title={t.title}
                sub={t.sub}
                onClick={() => {
                  if (t.id === "imagine") {
                    onNavigate("imagine");
                  } else {
                    onOpenTool(t);
                  }
                }}
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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 50);
  }, []);

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
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s ease",
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
      <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />
    </div>
  );
}
