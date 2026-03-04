import { useState, useEffect, useMemo } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";

// ─── PRODUCT DATA ───
const PRODUCTS = [
  {
    id: "p001", name: "Crown of Thorns Ring", collection: "Mythos Line", type: "Ring",
    metal: "14k Yellow Gold", weight: "8.2g", price: "$1,249", cost: "$861",
    status: "production-ready", stage: "complete", sku: "MTH-RNG-001",
    files: { cad: 3, renders: 4, docs: 3 }, created: "Feb 23, 2026", completed: "Mar 10, 2026",
    description: "Sculptural crown of thorns band, organic thorn detail, comfort fit",
    stones: "None", size: "10", client: "Lord Augm3nt",
  },
  {
    id: "p002", name: "Celestial Halo Ring", collection: "Astral Collection", type: "Ring",
    metal: "18k White Gold", weight: "4.6g", price: "$3,880", cost: "$2,420",
    status: "production-ready", stage: "complete", sku: "AST-RNG-001",
    files: { cad: 2, renders: 6, docs: 4 }, created: "Jan 12, 2026", completed: "Feb 18, 2026",
    description: "Double halo setting with star-cut prongs, pavé band, cathedral shank",
    stones: "1.2ct Round Brilliant Diamond", size: "6.5", client: "Private Client",
  },
  {
    id: "p003", name: "Serpentine Cuff", collection: "Mythos Line", type: "Bracelet",
    metal: "Sterling Silver", weight: "42g", price: "$890", cost: "$520",
    status: "production-ready", stage: "complete", sku: "MTH-BRC-001",
    files: { cad: 4, renders: 5, docs: 3 }, created: "Dec 5, 2025", completed: "Jan 28, 2026",
    description: "Coiled serpent cuff with scaled texture, ruby eyes, hinged clasp",
    stones: "2× 3mm Ruby (eyes)", size: "7in", client: "Gallery Order",
  },
  {
    id: "p004", name: "Art Deco Pendant", collection: "Heritage Revival", type: "Pendant",
    metal: "Platinum", weight: "6.1g", price: "$4,200", cost: "$2,800",
    status: "production-ready", stage: "complete", sku: "HRT-PND-001",
    files: { cad: 2, renders: 3, docs: 5 }, created: "Nov 15, 2025", completed: "Jan 5, 2026",
    description: "Geometric fan motif, milgrain edges, emerald center stone, box chain",
    stones: "0.8ct Emerald Cut Emerald", size: "18in chain", client: "Estate Commission",
  },
  {
    id: "p005", name: "Organic Vine Earrings", collection: "Astral Collection", type: "Earrings",
    metal: "14k Rose Gold", weight: "3.2g", price: "$680", cost: "$410",
    status: "saved", stage: "approved", sku: "AST-EAR-001",
    files: { cad: 1, renders: 2, docs: 1 }, created: "Feb 1, 2026", completed: null,
    description: "Climbing vine drop earrings, leaf detail, lever back closure",
    stones: "6× 2mm Peridot", size: "42mm drop", client: "—",
  },
  {
    id: "p006", name: "Signet Crest Ring", collection: "Heritage Revival", type: "Ring",
    metal: "18k Yellow Gold", weight: "14.8g", price: "$2,100", cost: "$1,380",
    status: "production-ready", stage: "complete", sku: "HRT-RNG-001",
    files: { cad: 3, renders: 4, docs: 4 }, created: "Oct 20, 2025", completed: "Dec 12, 2025",
    description: "Classic oval signet with custom family crest engraving, tapered shank",
    stones: "None", size: "11", client: "Private Client",
  },
  {
    id: "p007", name: "Nebula Cocktail Ring", collection: "Astral Collection", type: "Ring",
    metal: "18k White Gold", weight: "7.4g", price: "$6,400", cost: "$4,100",
    status: "production-ready", stage: "complete", sku: "AST-RNG-002",
    files: { cad: 5, renders: 8, docs: 6 }, created: "Sep 8, 2025", completed: "Nov 20, 2025",
    description: "Swirling galaxy-inspired cluster setting, mixed-cut sapphires, diamond halo",
    stones: "3.6ct Mixed Sapphires + 0.8ct Diamond", size: "7", client: "Trunk Show",
  },
  {
    id: "p008", name: "Thorn Bangle", collection: "Mythos Line", type: "Bracelet",
    metal: "14k Yellow Gold", weight: "28g", price: "$2,800", cost: "$1,750",
    status: "saved", stage: "approved", sku: "MTH-BRC-002",
    files: { cad: 2, renders: 3, docs: 2 }, created: "Jan 30, 2026", completed: null,
    description: "Continuous thorn motif bangle, hinged, matching Crown of Thorns Ring",
    stones: "None", size: "6.5in", client: "—",
  },
  {
    id: "p009", name: "Phoenix Brooch", collection: "Mythos Line", type: "Brooch",
    metal: "18k Rose Gold", weight: "18g", price: "$5,200", cost: "$3,400",
    status: "production-ready", stage: "complete", sku: "MTH-BRO-001",
    files: { cad: 4, renders: 6, docs: 5 }, created: "Aug 2, 2025", completed: "Oct 15, 2025",
    description: "Rising phoenix with articulated tail feathers, orange sapphire accents",
    stones: "12× Orange Sapphire", size: "68mm", client: "Gallery Order",
  },
  {
    id: "p010", name: "Cathedral Engagement Ring", collection: "Heritage Revival", type: "Ring",
    metal: "Platinum", weight: "5.8g", price: "$8,900", cost: "$6,200",
    status: "production-ready", stage: "complete", sku: "HRT-RNG-002",
    files: { cad: 6, renders: 10, docs: 7 }, created: "Jul 10, 2025", completed: "Sep 28, 2025",
    description: "Gothic cathedral arch prongs, vintage milgrain, split shank, pavé bridge",
    stones: "2.1ct Oval Diamond, 0.4ct Pavé", size: "5.5", client: "Private Client",
  },
  {
    id: "p011", name: "Lunar Phase Necklace", collection: "Astral Collection", type: "Necklace",
    metal: "Sterling Silver + 14k Gold", weight: "12g", price: "$1,100", cost: "$640",
    status: "saved", stage: "approved", sku: "AST-NCK-001",
    files: { cad: 2, renders: 3, docs: 2 }, created: "Feb 10, 2026", completed: null,
    description: "Five moon phase stations on delicate chain, mixed metal, mother of pearl inlay",
    stones: "5× Mother of Pearl", size: "16in + 2in ext", client: "—",
  },
  {
    id: "p012", name: "Medusa Pendant", collection: "Mythos Line", type: "Pendant",
    metal: "18k Yellow Gold", weight: "9.2g", price: "$2,600", cost: "$1,680",
    status: "production-ready", stage: "complete", sku: "MTH-PND-001",
    files: { cad: 3, renders: 5, docs: 4 }, created: "Nov 1, 2025", completed: "Jan 18, 2026",
    description: "Sculpted medusa head medallion, snake hair detail, bezel-set garnet eyes",
    stones: "2× 2.5mm Garnet", size: "30mm medallion", client: "Gallery Order",
  },
];

const COLLECTIONS = [
  { name: "All Products", key: "all" },
  { name: "Astral Collection", key: "Astral Collection", count: 4, color: C.blue },
  { name: "Mythos Line", key: "Mythos Line", count: 5, color: C.purple },
  { name: "Heritage Revival", key: "Heritage Revival", count: 3, color: C.amber },
  { name: "Summer '26 Bridal", key: "Summer '26 Bridal", count: 0, color: C.coral },
];

const TYPES = ["All", "Ring", "Bracelet", "Pendant", "Necklace", "Earrings", "Brooch"];

// ─── SHARED COMPONENTS ───

function SectionLabel({ children }) {
  return <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.label }}>{children}</div>;
}

function Pill({ label, color, bg, border, active, onClick, small }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontFamily: SANS, fontSize: small ? 9 : 9.5, fontWeight: 600, letterSpacing: small ? 1.5 : 2, textTransform: "uppercase",
      padding: small ? "3px 8px" : "5px 14px", borderRadius: RS, cursor: onClick ? "pointer" : "default",
      color: active ? C.white : color, background: active ? color : (h && onClick ? bg : "transparent"),
      border: `1px solid ${active ? color : (h && onClick ? color : border || `${color}20`)}`,
      transition: "all 0.2s", outline: "none",
    }}>{label}</button>
  );
}

function SmallBtn({ label, onClick, primary, icon }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
      padding: icon ? "7px 14px" : "8px 20px", display: "inline-flex", alignItems: "center", gap: 6,
      background: primary ? (h ? C.coralHover : C.coral) : C.white, color: primary ? C.white : C.mid,
      border: primary ? "none" : `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: RS, cursor: "pointer", transition: "all 0.2s", outline: "none",
    }}>{icon}{label}</button>
  );
}

// ─── PRODUCT CARD (Grid View) ───
function ProductCard({ product, onClick }) {
  const [h, setH] = useState(false);
  const isReady = product.status === "production-ready";
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: h ? C.white : C.section, border: `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: R, cursor: "pointer", transition: "all 0.25s ease",
      boxShadow: h ? "0 4px 20px rgba(0,0,0,0.04)" : "none", overflow: "hidden",
    }}>
      {/* Thumbnail area */}
      <div style={{
        height: 180, background: C.border, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Placeholder gem icon */}
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="0.8" style={{ opacity: h ? 0.6 : 0.35, transition: "opacity 0.25s" }}>
          <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" /><path d="M12 22L6 9l6-6 6 6z" />
        </svg>
        {/* Status badge top-right */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <Pill label={isReady ? "Production Ready" : "Saved"} small
            color={isReady ? C.green : C.amber}
            bg={isReady ? C.greenBg : C.amberBg}
            border={isReady ? C.greenBorder : C.amberBorder}
          />
        </div>
        {/* SKU bottom-left */}
        <div style={{
          position: "absolute", bottom: 8, left: 10,
          fontFamily: MONO, fontSize: 9, color: C.light, letterSpacing: 1,
          background: "rgba(242,241,239,0.85)", padding: "2px 8px", borderRadius: 3,
        }}>{product.sku}</div>
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
          <div style={{
            fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: C.black,
            letterSpacing: 2, textTransform: "uppercase", lineHeight: 1.25, flex: 1,
          }}>{product.name}</div>
        </div>

        <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.light, marginBottom: 12, lineHeight: 1.5 }}>
          {product.collection}
        </div>

        <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid, lineHeight: 1.6, marginBottom: 14,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{product.description}</div>

        {/* Specs strip */}
        <div style={{
          display: "flex", gap: 0, borderTop: `1px solid ${C.border}`, paddingTop: 12,
        }}>
          {[
            { label: "Type", value: product.type },
            { label: "Metal", value: product.metal.split(" ").slice(-2).join(" ") },
            { label: "Price", value: product.price },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, textAlign: "center",
              borderRight: i < 2 ? `1px solid ${C.border}` : "none",
            }}>
              <div style={{ fontFamily: SANS, fontSize: 8.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: C.dark }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* File count strip */}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {[
            { label: "CAD", count: product.files.cad, color: C.blue },
            { label: "Renders", count: product.files.renders, color: C.green },
            { label: "Docs", count: product.files.docs, color: C.amber },
          ].map((f, i) => (
            <span key={i} style={{
              fontFamily: MONO, fontSize: 9, color: f.color, letterSpacing: 1,
              background: `${f.color}08`, padding: "3px 8px", borderRadius: 3,
              border: `1px solid ${f.color}15`,
            }}>{f.count} {f.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT ROW (List View) ───
function ProductRow({ product, onClick }) {
  const [h, setH] = useState(false);
  const isReady = product.status === "production-ready";
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display: "grid", gridTemplateColumns: "52px 2.5fr 1.2fr 1fr 1fr 1fr 120px",
      alignItems: "center", gap: 16, padding: "14px 20px",
      background: h ? C.white : C.section, border: `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: RS, cursor: "pointer", transition: "all 0.2s", marginBottom: 4,
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 44, height: 44, borderRadius: RS, background: C.border,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.2">
          <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" />
        </svg>
      </div>

      {/* Name & Collection */}
      <div>
        <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.black, letterSpacing: 2, textTransform: "uppercase" }}>{product.name}</div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 2 }}>{product.collection} · {product.sku}</div>
      </div>

      {/* Metal */}
      <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid }}>{product.metal}</div>

      {/* Type */}
      <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid }}>{product.type}</div>

      {/* Price */}
      <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 500, color: C.dark }}>{product.price}</div>

      {/* Files */}
      <div style={{ display: "flex", gap: 6 }}>
        {[
          { n: product.files.cad, c: C.blue },
          { n: product.files.renders, c: C.green },
          { n: product.files.docs, c: C.amber },
        ].map((f, i) => (
          <span key={i} style={{
            fontFamily: MONO, fontSize: 9, color: f.c, width: 22, height: 22,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: `${f.c}08`, borderRadius: 3, border: `1px solid ${f.c}15`,
          }}>{f.n}</span>
        ))}
      </div>

      {/* Status */}
      <div style={{ textAlign: "right" }}>
        <Pill label={isReady ? "Ready" : "Saved"} small
          color={isReady ? C.green : C.amber}
          bg={isReady ? C.greenBg : C.amberBg}
          border={isReady ? C.greenBorder : C.amberBorder}
        />
      </div>
    </div>
  );
}

// ─── COLLECTION HEADER (for grouped view) ───
function CollectionHeader({ name, count, color, expanded, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "16px 0 10px",
      cursor: "pointer", userSelect: "none",
    }}>
      <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>
        <path d="M2 3L5 6L8 3" fill="none" stroke={C.light} strokeWidth="1.5" />
      </svg>
      <div style={{
        width: 4, height: 4, borderRadius: 2, background: color || C.mid,
      }} />
      <span style={{
        fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: C.black,
        letterSpacing: 4, textTransform: "uppercase",
      }}>{name}</span>
      <span style={{
        fontFamily: MONO, fontSize: 10, color: C.light, background: C.white,
        padding: "2px 10px", borderRadius: 4, border: `1px solid ${C.border}`,
      }}>{count}</span>
    </div>
  );
}

// ─── EXPANDED PRODUCT DRAWER ───
function ProductDrawer({ product, onClose }) {
  if (!product) return null;
  const isReady = product.status === "production-ready";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(30,30,28,0.18)", backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "flex-end",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 520, height: "100vh", background: C.bg,
        borderLeft: `1px solid ${C.border}`, overflowY: "auto",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.06)",
        animation: "slideIn 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "28px 32px", background: C.white, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase", lineHeight: 1.2 }}>{product.name}</div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginTop: 6 }}>
                {product.collection} · {product.sku}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 18, padding: 4, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Pill label={isReady ? "Production Ready" : "Saved"} color={isReady ? C.green : C.amber} bg={isReady ? C.greenBg : C.amberBg} border={isReady ? C.greenBorder : C.amberBorder} />
            <Pill label={product.type} color={C.mid} bg="transparent" border={C.border} />
          </div>
        </div>

        {/* Thumbnail area */}
        <div style={{
          margin: "24px 32px 0", height: 200, borderRadius: R, background: C.border,
          border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="0.7">
            <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" /><path d="M12 22L6 9l6-6 6 6z" />
          </svg>
        </div>

        <div style={{ padding: "24px 32px 40px" }}>
          {/* Description */}
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: C.dark, lineHeight: 1.7, marginBottom: 24 }}>
            {product.description}
          </div>

          {/* Key specs grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.border, borderRadius: RS, overflow: "hidden", marginBottom: 20, border: `1px solid ${C.border}` }}>
            {[
              { label: "Metal", value: product.metal },
              { label: "Weight", value: product.weight },
              { label: "Stones", value: product.stones },
              { label: "Size", value: product.size },
              { label: "Material Cost", value: product.cost },
              { label: "Retail Price", value: product.price },
              { label: "Client", value: product.client },
              { label: "Completed", value: product.completed || "In Progress" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "14px 16px", background: C.white }}>
                <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: C.dark }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Package contents */}
          <div style={{ marginBottom: 24 }}>
            <SectionLabel>Package Contents</SectionLabel>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: `${product.files.cad} CAD Files`, sub: "STEP, IGES, native", color: C.blue, icon: "📐" },
                { label: `${product.files.renders} Renders`, sub: "Hi-res PNG, studio lit", color: C.green, icon: "🖼" },
                { label: `${product.files.docs} Documents`, sub: "Invoice, agreement, specs", color: C.amber, icon: "📄" },
                { label: "3D Print File", sub: "STL, production-ready mesh", color: C.purple, icon: "🧊" },
                { label: "Spec Sheet", sub: "Complete manufacturing brief", color: C.mid, icon: "📋" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  background: C.section, borderRadius: RS, border: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize: 14, width: 28, textAlign: "center" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: C.dark }}>{item.label}</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 1 }}>{item.sub}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.5">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              flex: 1, fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
              padding: "13px 20px", background: C.coral, color: C.white,
              border: "none", borderRadius: RS, cursor: "pointer", transition: "background 0.2s",
            }}>Open Project Folder</button>
            <SmallBtn label="Duplicate" onClick={() => {}} />
            <SmallBtn label="Export" onClick={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN PRODUCTS VIEW
// ═══════════════════════════════════════
export default function ProductsView() {
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [groupBy, setGroupBy] = useState("collection"); // collection | none
  const [filterCollection, setFilterCollection] = useState("all");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("all"); // all | production-ready | saved
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (k) => setCollapsedGroups((s) => ({ ...s, [k]: !s[k] }));

  // ─── Filtering & Sorting ───
  const filtered = useMemo(() => {
    let items = [...PRODUCTS];
    if (filterCollection !== "all") items = items.filter((p) => p.collection === filterCollection);
    if (filterType !== "All") items = items.filter((p) => p.type === filterType);
    if (filterStatus !== "all") items = items.filter((p) => p.status === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((p) =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) || p.metal.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      if (sortBy === "newest") return (b.created > a.created ? 1 : -1);
      if (sortBy === "price-high") return parseInt(b.price.replace(/\D/g, "")) - parseInt(a.price.replace(/\D/g, ""));
      if (sortBy === "price-low") return parseInt(a.price.replace(/\D/g, "")) - parseInt(b.price.replace(/\D/g, ""));
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
    return items;
  }, [filterCollection, filterType, filterStatus, search, sortBy]);

  // ─── Group by collection ───
  const grouped = useMemo(() => {
    if (groupBy !== "collection" || filterCollection !== "all") return null;
    const map = {};
    filtered.forEach((p) => {
      if (!map[p.collection]) map[p.collection] = [];
      map[p.collection].push(p);
    });
    return map;
  }, [filtered, groupBy, filterCollection]);

  // ─── Stats ───
  const stats = useMemo(() => ({
    total: PRODUCTS.length,
    ready: PRODUCTS.filter((p) => p.status === "production-ready").length,
    saved: PRODUCTS.filter((p) => p.status === "saved").length,
    totalValue: PRODUCTS.reduce((sum, p) => sum + parseInt(p.price.replace(/\D/g, "")), 0),
  }), []);

  const renderProducts = (items) => {
    if (viewMode === "grid") {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {items.map((p) => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
        </div>
      );
    }
    return items.map((p) => <ProductRow key={p.id} product={p} onClick={() => setSelectedProduct(p)} />);
  };

  return (
    <>
      {/* ─── Header ─── */}
      <header style={{
        padding: "24px 44px", background: C.white,
        borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: C.black, letterSpacing: 5, textTransform: "uppercase" }}>Products</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SmallBtn label="Export Library" onClick={() => {}} />
            <SmallBtn label="+ New Product" primary onClick={() => {}} />
          </div>
        </div>
      </header>

      <div style={{ padding: "28px 44px 60px", maxWidth: 1200 }}>

        {/* ─── Stats Strip ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Products", value: stats.total },
            { label: "Production Ready", value: stats.ready },
            { label: "Saved / Draft", value: stats.saved },
            { label: "Library Value", value: `$${stats.totalValue.toLocaleString()}` },
          ].map((s, i) => (
            <div key={i} style={{ background: C.section, borderRadius: R, border: `1px solid ${C.border}`, padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.black }}>{s.value}</div>
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
              placeholder="Search products, SKUs, metals…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 32px", fontFamily: SANS, fontSize: 12.5,
                color: C.dark, background: C.white, border: `1px solid ${C.border}`,
                borderRadius: RS, outline: "none", transition: "border-color 0.2s",
              }}
            />
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: C.border }} />

          {/* Type filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {TYPES.map((t) => (
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
            {[
              { key: "all", label: "All" },
              { key: "production-ready", label: "Ready" },
              { key: "saved", label: "Saved" },
            ].map((s) => (
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
            <option value="price-high">Price ↓</option>
            <option value="price-low">Price ↑</option>
          </select>

          {/* Group toggle */}
          <button onClick={() => setGroupBy(groupBy === "collection" ? "none" : "collection")} style={{
            fontFamily: SANS, fontSize: 10, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
            padding: "8px 14px", color: groupBy === "collection" ? C.black : C.light,
            background: groupBy === "collection" ? C.white : "transparent",
            border: `1px solid ${groupBy === "collection" ? C.border : "transparent"}`,
            borderRadius: RS, cursor: "pointer", outline: "none", transition: "all 0.15s",
          }}>Group</button>

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
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}{filterCollection !== "all" ? ` in ${filterCollection}` : ""}
          {filterType !== "All" ? ` · ${filterType}` : ""}
          {filterStatus !== "all" ? ` · ${filterStatus === "production-ready" ? "Production Ready" : "Saved"}` : ""}
        </div>

        {/* ─── List header for list view ─── */}
        {viewMode === "list" && !grouped && (
          <div style={{
            display: "grid", gridTemplateColumns: "52px 2.5fr 1.2fr 1fr 1fr 1fr 120px",
            gap: 16, padding: "0 20px 8px",
            fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label,
          }}>
            <span /><span>Product</span><span>Metal</span><span>Type</span><span>Price</span><span>Files</span><span style={{ textAlign: "right" }}>Status</span>
          </div>
        )}

        {/* ─── Product Grid/List ─── */}
        {grouped ? (
          Object.entries(grouped).map(([collectionName, items]) => {
            const col = COLLECTIONS.find((c) => c.key === collectionName);
            const expanded = !collapsedGroups[collectionName];
            return (
              <div key={collectionName} style={{ marginBottom: 8 }}>
                <CollectionHeader
                  name={collectionName} count={items.length}
                  color={col?.color} expanded={expanded}
                  onToggle={() => toggleGroup(collectionName)}
                />
                {expanded && (
                  <div style={{ animation: "slideUp 0.2s ease" }}>
                    {viewMode === "list" && (
                      <div style={{
                        display: "grid", gridTemplateColumns: "52px 2.5fr 1.2fr 1fr 1fr 1fr 120px",
                        gap: 16, padding: "0 20px 8px",
                        fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label,
                      }}>
                        <span /><span>Product</span><span>Metal</span><span>Type</span><span>Price</span><span>Files</span><span style={{ textAlign: "right" }}>Status</span>
                      </div>
                    )}
                    {renderProducts(items)}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          renderProducts(filtered)
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.border} strokeWidth="0.8" style={{ marginBottom: 16 }}>
              <path d="M6 3h12l4 6-10 13L2 9z" /><path d="M2 9h20" />
            </svg>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: C.light, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>No Products Found</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.light }}>Try adjusting your filters or search terms</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 0 8px" }}>
          <div style={{ width: 32, height: 1, background: C.border, margin: "0 auto 14px", borderRadius: 1 }} />
          <div style={{ fontFamily: SERIF, fontSize: 13, color: C.light, letterSpacing: 4, textTransform: "uppercase" }}>
            {stats.ready} production-ready packages · ${stats.totalValue.toLocaleString()} library value
          </div>
        </div>

      </div>

      {/* ═══ Product Drawer ═══ */}
      <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </>
  );
}
