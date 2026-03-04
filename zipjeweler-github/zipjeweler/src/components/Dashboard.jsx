import { useState, useEffect } from "react";

// ─── Palette: Matching God Mode Admin ───
const SIDEBAR_BG = "#2E2E2A";
const SIDEBAR_TEXT = "#A8A89C";
const SIDEBAR_ACTIVE_TEXT = "#C8D8A0";
const SIDEBAR_ACTIVE_BG = "rgba(200,216,160,0.1)";

const BG = "#F2F1EF";
const BG_SECTION = "#F7F6F4";
const WHITE = "#FFFFFF";
const TEXT_BLACK = "#1A1A18";
const TEXT_DARK = "#333330";
const TEXT_MID = "#6E6E68";
const TEXT_LIGHT = "#9E9E96";
const TEXT_LABEL = "#8A8A82";
const BORDER = "#E6E5E2";
const BORDER_INPUT = "#D4D3CF";
const BORDER_HOVER = "#B8B7B2";

const CORAL = "#E66B6B";
const CORAL_HOVER = "#D45A5A";
const GREEN = "#5A8A4A";
const BLUE = "#4A78A8";
const AMBER = "#C89E3A";

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'DM Sans', 'Helvetica Neue', sans-serif";
const MONO = "'DM Mono', monospace";

const RADIUS = 8;
const RADIUS_SM = 6;

// ─── Sidebar Nav ───
function SideNav({ label, active, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: "11px 28px", border: "none", cursor: "pointer",
        fontFamily: SANS, fontSize: 12.5, fontWeight: active ? 600 : 400,
        letterSpacing: 2, textTransform: "uppercase",
        color: active ? SIDEBAR_ACTIVE_TEXT : SIDEBAR_TEXT,
        background: active ? SIDEBAR_ACTIVE_BG : h ? "rgba(255,255,255,0.03)" : "transparent",
        borderLeft: active ? `3px solid ${SIDEBAR_ACTIVE_TEXT}` : "3px solid transparent",
        transition: "all 0.2s", borderRadius: 0,
      }}
    >{label}</button>
  );
}

// ─── Section Container (rounded light bg) ───
function Section({ label, children, style = {}, rightAction }) {
  return (
    <div style={{
      background: BG_SECTION, borderRadius: RADIUS,
      border: `1px solid ${BORDER}`, padding: "24px 28px",
      marginBottom: 16, ...style,
    }}>
      {(label || rightAction) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          {label && (
            <div style={{
              fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
              letterSpacing: 3, textTransform: "uppercase", color: TEXT_LABEL,
            }}>{label}</div>
          )}
          {rightAction}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Bottom-border Input Field ───
function Field({ label, value = "", wide, textarea }) {
  return (
    <div style={{ flex: wide ? "1 1 100%" : "1 1 calc(50% - 16px)", minWidth: wide ? "100%" : 200 }}>
      <div style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 600,
        letterSpacing: 2.5, textTransform: "uppercase",
        color: TEXT_LABEL, marginBottom: 4,
      }}>{label}</div>
      {textarea ? (
        <textarea defaultValue={value} rows={3} style={{
          width: "100%", padding: "8px 2px", fontFamily: SANS, fontSize: 13.5,
          color: TEXT_DARK, background: "transparent",
          border: "none", borderBottom: `1px solid ${BORDER_INPUT}`,
          outline: "none", resize: "vertical", lineHeight: 1.6,
          transition: "border-color 0.2s", borderRadius: 0,
        }}
          onFocus={(e) => e.target.style.borderBottomColor = TEXT_MID}
          onBlur={(e) => e.target.style.borderBottomColor = BORDER_INPUT}
        />
      ) : (
        <input defaultValue={value} style={{
          width: "100%", padding: "8px 2px", fontFamily: SANS, fontSize: 13.5,
          color: TEXT_DARK, background: "transparent",
          border: "none", borderBottom: `1px solid ${BORDER_INPUT}`,
          outline: "none", transition: "border-color 0.2s", borderRadius: 0,
        }}
          onFocus={(e) => e.target.style.borderBottomColor = TEXT_MID}
          onBlur={(e) => e.target.style.borderBottomColor = BORDER_INPUT}
        />
      )}
    </div>
  );
}

// ─── Client Info Field (read-only style) ───
function InfoField({ label, value }) {
  return (
    <div style={{ minWidth: 120 }}>
      <div style={{
        fontFamily: SANS, fontSize: 9.5, fontWeight: 600,
        letterSpacing: 2, textTransform: "uppercase",
        color: TEXT_LABEL, marginBottom: 3,
      }}>{label}</div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: TEXT_DARK, fontWeight: 500 }}>
        {value || "—"}
      </div>
    </div>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }) {
  const map = {
    draft: { label: "Draft", color: TEXT_LIGHT },
    "in-progress": { label: "In Progress", color: BLUE },
    review: { label: "In Review", color: AMBER },
    complete: { label: "Complete", color: GREEN },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600,
      letterSpacing: 2, textTransform: "uppercase",
      padding: "5px 14px", borderRadius: RADIUS_SM,
      color: s.color, background: `${s.color}0C`,
      border: `1px solid ${s.color}20`,
    }}>{s.label}</span>
  );
}

// ─── Tool Card (large, centered text) ───
function ToolCard({ title, sub, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex: 1, minWidth: 220, padding: "48px 28px",
        background: h ? WHITE : BG_SECTION, textAlign: "center", cursor: "pointer",
        border: `1px solid ${h ? BORDER_HOVER : BORDER}`,
        borderRadius: RADIUS, transition: "all 0.25s ease",
        boxShadow: h ? "0 2px 16px rgba(0,0,0,0.04)" : "none",
      }}
    >
      <div style={{
        fontFamily: SERIF, fontSize: 22, fontWeight: 600,
        letterSpacing: 5, textTransform: "uppercase",
        color: TEXT_BLACK, marginBottom: 8, lineHeight: 1.3,
      }}>{title}</div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: TEXT_LIGHT, letterSpacing: 0.5 }}>{sub}</div>
    </button>
  );
}

// ─── Mini Tool Card ───
function MiniTool({ title, sub, onClick }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flex: 1, minWidth: 150, padding: "18px 16px", textAlign: "left",
        background: h ? WHITE : BG_SECTION, cursor: "pointer",
        border: `1px solid ${h ? BORDER_HOVER : BORDER}`,
        borderRadius: RADIUS_SM, transition: "all 0.2s",
      }}
    >
      <div style={{
        fontFamily: SANS, fontSize: 11, fontWeight: 600,
        letterSpacing: 1.8, textTransform: "uppercase",
        color: h ? TEXT_BLACK : TEXT_MID, marginBottom: 3, transition: "color 0.2s",
      }}>{title}</div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: TEXT_LIGHT }}>{sub}</div>
    </button>
  );
}

// ─── Project Row ───
function ProjectRow({ project }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "flex", alignItems: "center",
        padding: "15px 20px", gap: 18,
        background: h ? WHITE : BG_SECTION,
        border: `1px solid ${h ? BORDER_HOVER : BORDER}`,
        borderRadius: RADIUS_SM, cursor: "pointer",
        transition: "all 0.2s", marginBottom: 6,
      }}
    >
      {/* Thumbnail placeholder */}
      <div style={{
        width: 44, height: 44, borderRadius: RADIUS_SM,
        background: BORDER, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEXT_LIGHT} strokeWidth="1.2">
          <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: SERIF, fontSize: 16, fontWeight: 600,
          color: TEXT_BLACK, letterSpacing: 2, textTransform: "uppercase",
        }}>{project.name}</div>
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: TEXT_LIGHT, marginTop: 2 }}>
          {project.collection} · {project.stage}
        </div>
      </div>
      <StatusBadge status={project.status} />
      <span style={{ fontFamily: MONO, fontSize: 10, color: TEXT_LIGHT, flexShrink: 0 }}>{project.time}</span>
    </div>
  );
}

// ─── Tool Modal (matches project detail view) ───
function ToolModal({ tool, onClose }) {
  if (!tool) return null;
  const [dragOver, setDragOver] = useState(false);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(30,30,28,0.18)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 60, overflowY: "auto",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 780, marginBottom: 60,
        background: BG, borderRadius: RADIUS,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        animation: "slideUp 0.25s ease", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "32px 36px 0",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div style={{
            fontFamily: SERIF, fontSize: 32, fontWeight: 600,
            color: TEXT_BLACK, letterSpacing: 4, textTransform: "uppercase",
          }}>{tool.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 500,
              letterSpacing: 2, textTransform: "uppercase",
              padding: "8px 28px 8px 14px", color: TEXT_MID,
              background: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: RADIUS_SM, cursor: "pointer", outline: "none",
              appearance: "auto",
            }}>
              <option>Draft</option>
              <option>In Progress</option>
              <option>Complete</option>
            </select>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              color: TEXT_LIGHT, fontSize: 11, fontFamily: SANS,
              letterSpacing: 2, textTransform: "uppercase",
              padding: "8px 4px", fontWeight: 500,
            }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "24px 36px 36px" }}>
          {/* Client Section */}
          <Section label="Client" rightAction={
            <button style={{
              fontFamily: SANS, fontSize: 10.5, fontWeight: 700,
              letterSpacing: 2, textTransform: "uppercase",
              padding: "9px 22px", background: CORAL, color: WHITE,
              border: "none", borderRadius: RADIUS_SM, cursor: "pointer",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = CORAL_HOVER}
              onMouseLeave={(e) => e.currentTarget.style.background = CORAL}
            >Send Update Email</button>
          }>
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              <InfoField label="Email" value="client@email.com" />
              <InfoField label="Name" value="" />
              <InfoField label="Phone" value="" />
              <InfoField label="Created" value={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
            </div>
          </Section>

          {/* Reference Image */}
          <Section label="Reference Image">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
              style={{
                width: 180, height: 180, borderRadius: RADIUS_SM,
                background: dragOver ? "rgba(90,138,74,0.06)" : BORDER,
                border: `2px dashed ${dragOver ? GREEN : "transparent"}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? GREEN : TEXT_LIGHT} strokeWidth="1.2" style={{ marginBottom: 8 }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span style={{ fontFamily: SANS, fontSize: 10, color: TEXT_LIGHT, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Drop image
              </span>
            </div>
          </Section>

          {/* Specifications */}
          <Section label="Specifications">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
              <Field label="Jewelry Type" value="" />
              <Field label="Name" value="" />
              <Field label="Description" value="" wide textarea />
              <Field label="Budget" value="" />
              <Field label="Size" value="" />
              <Field label="Gender" value="" />
              <Field label="Metal" value="" />
              <Field label="Metal Karat" value="" />
              <Field label="Main Gemstone" value="" />
              <Field label="Gemstone Shape" value="" />
              <Field label="Setting Type" value="" />
              <Field label="Band Style" value="" />
              <Field label="Ring Type" value="" />
            </div>
          </Section>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={{
              flex: 1, fontFamily: SANS, fontSize: 12, fontWeight: 600,
              letterSpacing: 2, textTransform: "uppercase",
              padding: "14px 28px", background: CORAL, color: WHITE,
              border: "none", borderRadius: RADIUS_SM, cursor: "pointer",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = CORAL_HOVER}
              onMouseLeave={(e) => e.currentTarget.style.background = CORAL}
            >Generate with AI</button>
            <button style={{
              fontFamily: SANS, fontSize: 12, fontWeight: 500,
              letterSpacing: 1.5, textTransform: "uppercase",
              padding: "14px 24px", background: WHITE, color: TEXT_MID,
              border: `1px solid ${BORDER}`, borderRadius: RADIUS_SM,
              cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = BORDER_HOVER; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}
            >Save Draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data ───
const TOOLS = [
  { id: "imagine", title: "Imagine Something New", sub: "Begin Custom Jewelry Concept" },
  { id: "convert", title: "Convert to Render", sub: "Generate High-Quality Render" },
  { id: "estimate", title: "Appraise & Estimate", sub: "Approximate Pricing Only" },
  { id: "gallery", title: "Inspiration Gallery", sub: "View Recent Creations" },
];

const MORE_TOOLS = [
  { id: "sketch", title: "Sketch to Jewelry", sub: "Hand-drawn to photorealistic" },
  { id: "marketing", title: "Image to Marketing", sub: "Generate campaign content" },
  { id: "3d", title: "3D Model Gen", sub: "Export-ready meshes" },
  { id: "files", title: "File Hub", sub: "CAD, certs, specs" },
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

// ═══════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════
export default function ZipJewelerDashboard() {
  const [activeNav, setActiveNav] = useState("projects");
  const [activeTool, setActiveTool] = useState(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  return (
    <div style={{ fontFamily: SANS, background: BG, minHeight: "100vh", color: TEXT_DARK, display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${SIDEBAR_ACTIVE_TEXT}; color: ${SIDEBAR_BG}; }
        body { -webkit-font-smoothing: antialiased; background: ${BG}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <aside style={{
        width: 200, minHeight: "100vh", background: SIDEBAR_BG,
        display: "flex", flexDirection: "column", flexShrink: 0,
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 50,
      }}>
        <div style={{ padding: "28px 28px 36px" }}>
          <div style={{
            fontFamily: SERIF, fontSize: 20, fontWeight: 600,
            color: SIDEBAR_ACTIVE_TEXT, letterSpacing: 6, textTransform: "uppercase",
            lineHeight: 1.2,
          }}>
            Zip<br />Jeweler
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {["Projects", "Products", "Orders", "Users"].map((item) => (
            <SideNav key={item} label={item} active={activeNav === item.toLowerCase()} onClick={() => setActiveNav(item.toLowerCase())} />
          ))}
        </nav>

        <div style={{ padding: "36px 28px", flex: 1 }}>
          <div style={{
            fontFamily: SANS, fontSize: 9.5, fontWeight: 600,
            letterSpacing: 2.5, textTransform: "uppercase",
            color: "rgba(168,168,156,0.45)", marginBottom: 14,
          }}>Collections</div>
          {COLLECTIONS.map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", padding: "7px 0", cursor: "pointer" }}>
              <span style={{ fontFamily: SANS, fontSize: 12, color: SIDEBAR_TEXT, flex: 1 }}>{c.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: "rgba(168,168,156,0.35)" }}>{c.count}</span>
            </div>
          ))}
          <button style={{
            fontFamily: SANS, fontSize: 11, color: SIDEBAR_ACTIVE_TEXT,
            background: "none", border: "none", cursor: "pointer",
            padding: "10px 0 0", letterSpacing: 1, opacity: 0.65,
            transition: "opacity 0.2s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.65"}
          >+ New Collection</button>
        </div>

        <div style={{ padding: "16px 28px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontFamily: MONO, fontSize: 9, color: "rgba(168,168,156,0.25)", letterSpacing: 1 }}>ZIPJEWELER.COM</div>
        </div>
      </aside>

      {/* ═══ MAIN ═══ */}
      <main style={{
        flex: 1, marginLeft: 200, minHeight: "100vh",
        opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease",
      }}>
        {/* Header */}
        <header style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "24px 44px",
          background: WHITE, borderBottom: `1px solid ${BORDER}`,
          position: "sticky", top: 0, zIndex: 40,
          borderRadius: 0,
        }}>
          <div style={{
            fontFamily: SERIF, fontSize: 32, fontWeight: 600,
            color: TEXT_BLACK, letterSpacing: 5, textTransform: "uppercase",
          }}>Dashboard</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 500,
              letterSpacing: 2, textTransform: "uppercase",
              padding: "9px 30px 9px 16px", color: TEXT_MID,
              background: WHITE, border: `1px solid ${BORDER}`,
              borderRadius: RADIUS_SM, cursor: "pointer", outline: "none",
              appearance: "auto",
            }}>
              <option>All Status</option>
              <option>Draft</option>
              <option>In Progress</option>
              <option>Complete</option>
            </select>
            <button style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 600,
              letterSpacing: 2, textTransform: "uppercase",
              padding: "10px 24px", background: CORAL, color: WHITE,
              border: "none", borderRadius: RADIUS_SM, cursor: "pointer",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = CORAL_HOVER}
              onMouseLeave={(e) => e.currentTarget.style.background = CORAL}
            >+ New Project</button>
          </div>
        </header>

        <div style={{ padding: "36px 44px", maxWidth: 1080 }}>

          {/* ═══ 2×2 Tool Grid ═══ */}
          <Section label="AI-Assisted Tools" style={{ padding: "28px 28px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {TOOLS.map((t) => (
                <ToolCard key={t.id} title={t.title} sub={t.sub} onClick={() => setActiveTool(t)} />
              ))}
            </div>
          </Section>

          {/* ═══ More Tools ═══ */}
          <Section label="More Tools" style={{ padding: "24px 28px 28px" }}>
            <div style={{ display: "flex", gap: 12 }}>
              {MORE_TOOLS.map((t) => (
                <MiniTool key={t.id} title={t.title} sub={t.sub} onClick={() => setActiveTool(t)} />
              ))}
            </div>
          </Section>

          {/* ═══ Recent Projects ═══ */}
          <Section label="Recent Projects" style={{ padding: "24px 28px 28px" }}
            rightAction={
              <span style={{
                fontFamily: SANS, fontSize: 10.5, color: TEXT_LIGHT,
                letterSpacing: 1.5, textTransform: "uppercase",
                cursor: "pointer", transition: "color 0.2s", fontWeight: 500,
              }}
                onMouseEnter={(e) => e.currentTarget.style.color = TEXT_MID}
                onMouseLeave={(e) => e.currentTarget.style.color = TEXT_LIGHT}
              >View All →</span>
            }
          >
            {PROJECTS.map((p) => <ProjectRow key={p.id} project={p} />)}
          </Section>

          {/* ═══ Overview Stats ═══ */}
          <Section label="Overview" style={{ padding: "24px 28px 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {[
                { label: "Active Projects", value: "4" },
                { label: "Pieces Created", value: "27" },
                { label: "AI Generations", value: "143" },
                { label: "Avg. Turnaround", value: "4.2d" },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: "22px 18px", background: WHITE,
                  border: `1px solid ${BORDER}`, borderRadius: RADIUS_SM,
                  textAlign: "center",
                }}>
                  <div style={{
                    fontFamily: SANS, fontSize: 9.5, fontWeight: 600,
                    letterSpacing: 2.5, textTransform: "uppercase",
                    color: TEXT_LABEL, marginBottom: 10,
                  }}>{stat.label}</div>
                  <div style={{
                    fontFamily: SERIF, fontSize: 30, fontWeight: 600, color: TEXT_BLACK,
                  }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* Footer line */}
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ width: 32, height: 1, background: BORDER, margin: "0 auto 14px", borderRadius: 1 }} />
            <div style={{
              fontFamily: SERIF, fontSize: 13, color: TEXT_LIGHT,
              letterSpacing: 4, textTransform: "uppercase",
            }}>Every piece. Every order. Organized.</div>
          </div>
        </div>
      </main>

      {/* ═══ Tool Modal ═══ */}
      <ToolModal tool={activeTool} onClose={() => setActiveTool(null)} />
    </div>
  );
}
