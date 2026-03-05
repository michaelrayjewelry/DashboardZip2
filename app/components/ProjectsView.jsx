import { useState, useMemo } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";

// ─── SAMPLE PROJECT DATA ───
const SAMPLE_PROJECTS = [
  { id: "s1", name: "Celestial Halo Ring", collection: "Astral Collection", status: "in-progress", stage: "3D Modeling", type: "Ring", time: "2h ago", readiness: 65 },
  { id: "s2", name: "Serpentine Cuff", collection: "Mythos Line", status: "review", stage: "Client Approval", type: "Bracelet", time: "1d ago", readiness: 85 },
  { id: "s3", name: "Art Deco Pendant", collection: "Heritage Revival", status: "complete", stage: "Production Ready", type: "Pendant", time: "3d ago", readiness: 100 },
  { id: "s4", name: "Organic Vine Earrings", collection: "Astral Collection", status: "draft", stage: "Concept", type: "Earrings", time: "5d ago", readiness: 15 },
  { id: "s5", name: "Crown of Thorns Ring", collection: "Mythos Line", status: "in-progress", stage: "CAD Design", type: "Ring", time: "4h ago", readiness: 45 },
  { id: "s6", name: "Cathedral Engagement Ring", collection: "Heritage Revival", status: "review", stage: "Final Review", type: "Ring", time: "12h ago", readiness: 92 },
  { id: "s7", name: "Lunar Phase Necklace", collection: "Astral Collection", status: "in-progress", stage: "Rendering", type: "Necklace", time: "6h ago", readiness: 55 },
  { id: "s8", name: "Medusa Pendant", collection: "Mythos Line", status: "complete", stage: "Production Ready", type: "Pendant", time: "2d ago", readiness: 100 },
];

const STATUS_OPTIONS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "complete", label: "Complete" },
];

const TYPE_OPTIONS = ["All", "Ring", "Bracelet", "Pendant", "Necklace", "Earrings", "Other"];

const STATUS_META = {
  draft: { label: "Draft", color: C.light },
  "in-progress": { label: "In Progress", color: C.blue },
  review: { label: "In Review", color: C.amber },
  complete: { label: "Complete", color: C.green },
};

// ─── HELPERS ───
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function normalizeProject(p) {
  return {
    id: p.id,
    name: p.name || "Untitled Project",
    collection: p.fields?.collection || p.collection || p.type || "Custom",
    status: p.status || "draft",
    stage: p.stage || "Concept",
    type: p.fields?.type || p.type || "Other",
    time: p.updatedAt ? timeAgo(p.updatedAt) : (p.time || ""),
    coverImageUrl: p.fields?.coverImage?.url || p.coverImageUrl || null,
    readiness: p.readiness ?? 0,
    createdAt: p.createdAt || p.created || "",
    isStored: !!p.updatedAt,
  };
}

// ─── PILL BUTTON ───
function Pill({ label, color, active, onClick, small }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontFamily: SANS, fontSize: small ? 9 : 9.5, fontWeight: 600, letterSpacing: small ? 1.5 : 2, textTransform: "uppercase",
      padding: small ? "3px 8px" : "5px 14px", borderRadius: RS, cursor: onClick ? "pointer" : "default",
      color: active ? C.white : color, background: active ? color : (h && onClick ? `${color}0C` : "transparent"),
      border: `1px solid ${active ? color : (h && onClick ? color : `${color}20`)}`,
      transition: "all 0.2s", outline: "none",
    }}>{label}</button>
  );
}

// ─── STATUS BADGE ───
function StatusBadge({ status, small }) {
  const s = STATUS_META[status] || STATUS_META.draft;
  return (
    <span style={{
      fontFamily: SANS, fontSize: small ? 9 : 10, fontWeight: 600,
      letterSpacing: small ? 1.5 : 2, textTransform: "uppercase",
      padding: small ? "3px 8px" : "5px 14px", borderRadius: RS,
      color: s.color, background: `${s.color}0C`, border: `1px solid ${s.color}20`,
    }}>{s.label}</span>
  );
}

// ─── READINESS BAR ───
function ReadinessBar({ value }) {
  const color = value >= 90 ? C.green : value >= 50 ? C.blue : value >= 25 ? C.amber : C.light;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: `${color}18`, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontFamily: MONO, fontSize: 9, color, letterSpacing: 1, minWidth: 28, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

// ─── PROJECT CARD (Grid View) ───
function ProjectCard({ project, onClick }) {
  const [h, setH] = useState(false);
  const sm = STATUS_META[project.status] || STATUS_META.draft;
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: h ? C.white : C.section, border: `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: R, cursor: "pointer", transition: "all 0.25s ease",
      boxShadow: h ? "0 4px 20px rgba(0,0,0,0.04)" : "none", overflow: "hidden",
    }}>
      {/* Thumbnail */}
      <div style={{
        height: 140, background: project.coverImageUrl ? `url(${project.coverImageUrl}) center/cover` : C.border,
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {!project.coverImageUrl && (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="0.8" style={{ opacity: h ? 0.6 : 0.35, transition: "opacity 0.25s" }}>
            <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" /><path d="M12 22L6 9l6-6 6 6z" />
          </svg>
        )}
        {/* Status badge top-right */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <StatusBadge status={project.status} small />
        </div>
        {/* Type bottom-left */}
        <div style={{
          position: "absolute", bottom: 8, left: 10,
          fontFamily: MONO, fontSize: 9, color: C.light, letterSpacing: 1,
          background: "rgba(242,241,239,0.85)", padding: "2px 8px", borderRadius: 3,
        }}>{project.type}</div>
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px 20px" }}>
        <div style={{
          fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.black,
          letterSpacing: 2, textTransform: "uppercase", lineHeight: 1.25, marginBottom: 6,
        }}>{project.name}</div>

        <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.light, marginBottom: 14, lineHeight: 1.5 }}>
          {project.collection} · {project.stage}
        </div>

        {/* Readiness bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: SANS, fontSize: 8.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 6 }}>Readiness</div>
          <ReadinessBar value={project.readiness} />
        </div>

        {/* Footer strip */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: `1px solid ${C.border}`, paddingTop: 12,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.light }}>{project.time}</span>
          {project.isStored && (
            <span style={{
              fontFamily: MONO, fontSize: 8.5, color: C.green, letterSpacing: 1,
              background: C.greenBg, padding: "2px 8px", borderRadius: 3,
              border: `1px solid ${C.greenBorder}`,
            }}>YOUR PROJECT</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PROJECT ROW (List View) ───
function ProjectRowItem({ project, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display: "grid", gridTemplateColumns: "52px 2.5fr 1fr 1fr 140px 100px",
      alignItems: "center", gap: 16, padding: "14px 20px",
      background: h ? C.white : C.section, border: `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: RS, cursor: "pointer", transition: "all 0.2s", marginBottom: 4,
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 44, height: 44, borderRadius: RS,
        background: project.coverImageUrl ? `url(${project.coverImageUrl}) center/cover` : C.border,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!project.coverImageUrl && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.2">
            <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" />
          </svg>
        )}
      </div>

      {/* Name & Collection */}
      <div>
        <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.black, letterSpacing: 2, textTransform: "uppercase" }}>{project.name}</div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 2 }}>{project.collection} · {project.stage}</div>
      </div>

      {/* Type */}
      <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid }}>{project.type}</div>

      {/* Readiness */}
      <div style={{ minWidth: 0 }}>
        <ReadinessBar value={project.readiness} />
      </div>

      {/* Status */}
      <div><StatusBadge status={project.status} small /></div>

      {/* Time */}
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.light, textAlign: "right" }}>{project.time}</div>
    </div>
  );
}

// ─── GROUP HEADER ───
function GroupHeader({ label, count, color, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "16px 0 10px",
      cursor: "pointer", userSelect: "none",
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>
        <path d="M2 3L5 6L8 3" fill="none" stroke={C.light} strokeWidth="1.5" />
      </svg>
      <div style={{ width: 4, height: 4, borderRadius: 2, background: color || C.mid }} />
      <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.light, background: C.white, padding: "2px 10px", borderRadius: 4, border: `1px solid ${C.border}` }}>{count}</span>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PROJECTS VIEW
// ═══════════════════════════════════════
export default function ProjectsView({ storedProjects = [], onNewProject, onOpenProject }) {
  const [viewMode, setViewMode] = useState("grid");
  const [groupBy, setGroupBy] = useState("status"); // status | collection | none
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (k) => setCollapsedGroups((s) => ({ ...s, [k]: !s[k] }));

  // ─── Merge stored + sample projects ───
  const allProjects = useMemo(() => {
    const stored = storedProjects.map(normalizeProject);
    const samples = SAMPLE_PROJECTS.map(normalizeProject);
    return [...stored, ...samples];
  }, [storedProjects]);

  // ─── Filtering & Sorting ───
  const filtered = useMemo(() => {
    let items = [...allProjects];
    if (filterStatus !== "all") items = items.filter((p) => p.status === filterStatus);
    if (filterType !== "All") items = items.filter((p) => p.type === filterType);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) =>
        p.name.toLowerCase().includes(q) || p.collection.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) || p.stage.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      if (sortBy === "newest") return (b.createdAt > a.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "readiness") return b.readiness - a.readiness;
      if (sortBy === "status") {
        const order = { "draft": 0, "in-progress": 1, "review": 2, "complete": 3 };
        return (order[a.status] ?? 0) - (order[b.status] ?? 0);
      }
      return 0;
    });
    return items;
  }, [allProjects, filterStatus, filterType, search, sortBy]);

  // ─── Stats ───
  const stats = useMemo(() => ({
    total: allProjects.length,
    draft: allProjects.filter((p) => p.status === "draft").length,
    inProgress: allProjects.filter((p) => p.status === "in-progress").length,
    review: allProjects.filter((p) => p.status === "review").length,
    complete: allProjects.filter((p) => p.status === "complete").length,
  }), [allProjects]);

  // ─── Grouping ───
  const grouped = useMemo(() => {
    if (groupBy === "none") return null;
    if (groupBy === "status" && filterStatus !== "all") return null;
    const map = {};
    filtered.forEach((p) => {
      const key = groupBy === "status" ? p.status : p.collection;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    // For status grouping, enforce a nice order
    if (groupBy === "status") {
      const ordered = {};
      ["in-progress", "review", "draft", "complete"].forEach((s) => {
        if (map[s]) ordered[s] = map[s];
      });
      return ordered;
    }
    return map;
  }, [filtered, groupBy, filterStatus]);

  const groupMeta = (key) => {
    if (groupBy === "status") {
      const sm = STATUS_META[key] || STATUS_META.draft;
      return { label: sm.label, color: sm.color };
    }
    const colors = { "Astral Collection": C.blue, "Mythos Line": C.purple, "Heritage Revival": C.amber };
    return { label: key, color: colors[key] || C.mid };
  };

  const renderProjects = (items) => {
    if (viewMode === "grid") {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {items.map((p) => <ProjectCard key={p.id} project={p} onClick={() => onOpenProject?.(p.id)} />)}
        </div>
      );
    }
    return items.map((p) => <ProjectRowItem key={p.id} project={p} onClick={() => onOpenProject?.(p.id)} />);
  };

  return (
    <>
      {/* ─── Header ─── */}
      <header style={{
        padding: "24px 44px", background: C.white,
        borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: C.black, letterSpacing: 5, textTransform: "uppercase" }}>Projects</div>
          <button
            onClick={onNewProject}
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

      <div style={{ padding: "28px 44px 60px", maxWidth: 1200 }}>

        {/* ─── Stats Strip ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Projects", value: stats.total, color: C.black },
            { label: "Draft", value: stats.draft, color: C.light },
            { label: "In Progress", value: stats.inProgress, color: C.blue },
            { label: "In Review", value: stats.review, color: C.amber },
            { label: "Complete", value: stats.complete, color: C.green },
          ].map((s, i) => (
            <div key={i}
              onClick={() => i > 0 ? setFilterStatus(filterStatus === STATUS_OPTIONS[i].key ? "all" : STATUS_OPTIONS[i].key) : setFilterStatus("all")}
              style={{
                background: C.section, borderRadius: R, border: `1px solid ${filterStatus === (STATUS_OPTIONS[i]?.key) ? s.color : C.border}`,
                padding: "16px 18px", textAlign: "center", cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ─── Filter Bar ─── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          padding: "16px 20px", background: C.section, borderRadius: R, border: `1px solid ${C.border}`,
          flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 200 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="2"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
            </svg>
            <input
              placeholder="Search projects, types, collections…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 32px", fontFamily: SANS, fontSize: 12.5,
                color: C.dark, background: C.white, border: `1px solid ${C.border}`,
                borderRadius: RS, outline: "none", transition: "border-color 0.2s",
              }}
            />
          </div>

          <div style={{ width: 1, height: 28, background: C.border }} />

          {/* Type filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {TYPE_OPTIONS.map((t) => (
              <button key={t} onClick={() => setFilterType(t)} style={{
                fontFamily: SANS, fontSize: 10, fontWeight: filterType === t ? 600 : 400,
                letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 12px",
                color: filterType === t ? C.black : C.light, background: filterType === t ? C.white : "transparent",
                border: `1px solid ${filterType === t ? C.border : "transparent"}`,
                borderRadius: RS, cursor: "pointer", transition: "all 0.15s", outline: "none",
              }}>{t}</button>
            ))}
          </div>

          <div style={{ width: 1, height: 28, background: C.border }} />

          {/* Status filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {STATUS_OPTIONS.map((s) => (
              <button key={s.key} onClick={() => setFilterStatus(s.key)} style={{
                fontFamily: SANS, fontSize: 10, fontWeight: filterStatus === s.key ? 600 : 400,
                letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 12px",
                color: filterStatus === s.key ? C.black : C.light,
                background: filterStatus === s.key ? C.white : "transparent",
                border: `1px solid ${filterStatus === s.key ? C.border : "transparent"}`,
                borderRadius: RS, cursor: "pointer", transition: "all 0.15s", outline: "none",
              }}>{s.label}</button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Sort */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{
            fontFamily: SANS, fontSize: 10.5, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
            padding: "8px 28px 8px 12px", color: C.mid, background: C.white,
            border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
          }}>
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="readiness">Readiness</option>
            <option value="status">Status</option>
          </select>

          {/* Group toggle */}
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} style={{
            fontFamily: SANS, fontSize: 10.5, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
            padding: "8px 28px 8px 12px", color: C.mid, background: C.white,
            border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
          }}>
            <option value="status">Group: Status</option>
            <option value="collection">Group: Collection</option>
            <option value="none">No Grouping</option>
          </select>

          {/* View toggle */}
          <div style={{ display: "flex", gap: 2, background: C.white, borderRadius: RS, border: `1px solid ${C.border}`, padding: 2 }}>
            <button onClick={() => setViewMode("grid")} style={{
              width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              background: viewMode === "grid" ? C.section : "transparent", borderRadius: 4,
              border: "none", cursor: "pointer", outline: "none",
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={viewMode === "grid" ? C.dark : C.light} strokeWidth="1.2">
                <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
                <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button onClick={() => setViewMode("list")} style={{
              width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              background: viewMode === "list" ? C.section : "transparent", borderRadius: 4,
              border: "none", cursor: "pointer", outline: "none",
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={viewMode === "list" ? C.dark : C.light} strokeWidth="1.2">
                <line x1="1" y1="3" x2="15" y2="3" /><line x1="1" y1="8" x2="15" y2="8" /><line x1="1" y1="13" x2="15" y2="13" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Results count ─── */}
        <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, letterSpacing: 1, marginBottom: 16 }}>
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
          {filterType !== "All" ? ` · ${filterType}` : ""}
          {filterStatus !== "all" ? ` · ${(STATUS_META[filterStatus] || {}).label || filterStatus}` : ""}
        </div>

        {/* ─── List header for list view (ungrouped) ─── */}
        {viewMode === "list" && !grouped && (
          <div style={{
            display: "grid", gridTemplateColumns: "52px 2.5fr 1fr 1fr 140px 100px",
            gap: 16, padding: "0 20px 8px",
            fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label,
          }}>
            <span /><span>Project</span><span>Type</span><span>Readiness</span><span>Status</span><span style={{ textAlign: "right" }}>Updated</span>
          </div>
        )}

        {/* ─── Project Grid/List ─── */}
        {grouped ? (
          Object.entries(grouped).map(([key, items]) => {
            const meta = groupMeta(key);
            const expanded = !collapsedGroups[key];
            return (
              <div key={key} style={{ marginBottom: 8 }}>
                <GroupHeader
                  label={meta.label} count={items.length}
                  color={meta.color} expanded={expanded}
                  onToggle={() => toggleGroup(key)}
                />
                {expanded && (
                  <div style={{ animation: "slideUp 0.2s ease" }}>
                    {viewMode === "list" && (
                      <div style={{
                        display: "grid", gridTemplateColumns: "52px 2.5fr 1fr 1fr 140px 100px",
                        gap: 16, padding: "0 20px 8px",
                        fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label,
                      }}>
                        <span /><span>Project</span><span>Type</span><span>Readiness</span><span>Status</span><span style={{ textAlign: "right" }}>Updated</span>
                      </div>
                    )}
                    {renderProjects(items)}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          renderProjects(filtered)
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="0.8" style={{ marginBottom: 16 }}>
              <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" />
            </svg>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: C.light, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>No Projects Found</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.light }}>Try adjusting your filters or search terms</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 0 8px" }}>
          <div style={{ width: 32, height: 1, background: C.border, margin: "0 auto 14px", borderRadius: 1 }} />
          <div style={{ fontFamily: SERIF, fontSize: 13, color: C.light, letterSpacing: 4, textTransform: "uppercase" }}>
            {stats.inProgress} in progress · {stats.review} in review · {stats.complete} complete
          </div>
        </div>

      </div>
    </>
  );
}
