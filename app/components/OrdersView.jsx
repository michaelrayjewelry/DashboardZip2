import { useState, useEffect, useMemo } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./shared";

// ─── ORDER PIPELINE ───
const PIPELINE = [
  { key: "confirmed", label: "Confirmed", icon: "\u2713" },
  { key: "manufacturing", label: "Manufacturing", icon: "\uD83D\uDD25" },
  { key: "quality", label: "QC", icon: "\uD83D\uDD0D" },
  { key: "authentication", label: "Auth Card", icon: "\uD83C\uDFF7" },
  { key: "packaging", label: "Packaging", icon: "\uD83D\uDCE6" },
  { key: "shipped", label: "Shipped", icon: "\uD83D\uDE9A" },
  { key: "delivered", label: "Delivered", icon: "\u2728" },
];

const pipelineIdx = (stage) => PIPELINE.findIndex((p) => p.key === stage);

// ─── ORDER DATA ───
const ORDERS = [
  {
    id: "ORD-2026-0041", product: "Crown of Thorns Ring", sku: "MTH-RNG-001", collection: "Mythos Line",
    client: { name: "Marcus Chen", email: "m.chen@email.com", phone: "+1 (415) 555-0187", address: "482 Hayes St, San Francisco, CA 94102" },
    type: "Ring", metal: "14k Yellow Gold", size: "10", stones: "None", weight: "8.2g",
    price: 1249, cost: 861, deposit: 625, balance: 624, paid: true,
    stage: "manufacturing", priority: "standard", source: "Website",
    ordered: "Feb 28, 2026", dueDate: "Mar 21, 2026", estShip: "Mar 19, 2026",
    notes: "Client wants slightly matte finish on thorns, high polish on inner band.",
    mfgSub: "casting",
    messages: 4, files: 8, authGenerated: false,
  },
  {
    id: "ORD-2026-0040", product: "Celestial Halo Ring", sku: "AST-RNG-001", collection: "Astral Collection",
    client: { name: "Sarah Kim", email: "sarah.k@email.com", phone: "+1 (212) 555-0294", address: "159 E 64th St, New York, NY 10065" },
    type: "Ring", metal: "18k White Gold", size: "6.5", stones: "1.2ct Round Brilliant Diamond", weight: "4.6g",
    price: 3880, cost: 2420, deposit: 1940, balance: 1940, paid: false,
    stage: "quality", priority: "rush", source: "Referral",
    ordered: "Feb 20, 2026", dueDate: "Mar 10, 2026", estShip: "Mar 8, 2026",
    notes: "Rush order. Client providing own center stone \u2014 received Feb 22. Verify fit before setting.",
    mfgSub: null,
    messages: 7, files: 12, authGenerated: false,
  },
  {
    id: "ORD-2026-0039", product: "Serpentine Cuff", sku: "MTH-BRC-001", collection: "Mythos Line",
    client: { name: "Gallery Moderne", email: "orders@gallerymoderne.com", phone: "+1 (323) 555-0412", address: "8221 Beverly Blvd, Los Angeles, CA 90048" },
    type: "Bracelet", metal: "Sterling Silver", size: "7in", stones: "2\u00D7 3mm Ruby", weight: "42g",
    price: 890, cost: 520, deposit: 890, balance: 0, paid: true,
    stage: "authentication", priority: "standard", source: "Gallery",
    ordered: "Feb 15, 2026", dueDate: "Mar 14, 2026", estShip: "Mar 12, 2026",
    notes: "Gallery consignment order. Needs gallery-branded auth card. Include display stand.",
    mfgSub: null,
    messages: 3, files: 10, authGenerated: true,
  },
  {
    id: "ORD-2026-0038", product: "Art Deco Pendant", sku: "HRT-PND-001", collection: "Heritage Revival",
    client: { name: "Robert Harlow", email: "r.harlow@harlow.co", phone: "+1 (617) 555-0831", address: "77 Charles St, Boston, MA 02114" },
    type: "Pendant", metal: "Platinum", size: "18in chain", stones: "0.8ct Emerald Cut Emerald", weight: "6.1g",
    price: 4200, cost: 2800, deposit: 2100, balance: 2100, paid: false,
    stage: "packaging", priority: "standard", source: "Website",
    ordered: "Feb 5, 2026", dueDate: "Mar 7, 2026", estShip: "Mar 5, 2026",
    notes: "Gift order. Include handwritten note card: 'Happy Anniversary, Elizabeth.' Premium gift box.",
    mfgSub: null,
    messages: 5, files: 14, authGenerated: true,
  },
  {
    id: "ORD-2026-0037", product: "Signet Crest Ring", sku: "HRT-RNG-001", collection: "Heritage Revival",
    client: { name: "William Ashford III", email: "w.ashford@ashfordlaw.com", phone: "+1 (202) 555-0663", address: "1401 K St NW, Washington, DC 20005" },
    type: "Ring", metal: "18k Yellow Gold", size: "11", stones: "None", weight: "14.8g",
    price: 2100, cost: 1380, deposit: 2100, balance: 0, paid: true,
    stage: "shipped", priority: "standard", source: "Referral",
    ordered: "Jan 22, 2026", dueDate: "Feb 28, 2026", estShip: "Feb 26, 2026",
    tracking: "1Z999AA10123456784", carrier: "UPS", shipDate: "Feb 26, 2026",
    notes: "Family crest engraving from provided vector file. Client approved wax model Feb 1.",
    mfgSub: null,
    messages: 8, files: 16, authGenerated: true,
  },
  {
    id: "ORD-2026-0036", product: "Nebula Cocktail Ring", sku: "AST-RNG-002", collection: "Astral Collection",
    client: { name: "Diana Voss", email: "dvoss@outlook.com", phone: "+1 (312) 555-0129", address: "55 E Monroe St, Chicago, IL 60603" },
    type: "Ring", metal: "18k White Gold", size: "7", stones: "3.6ct Mixed Sapphires + 0.8ct Diamond", weight: "7.4g",
    price: 6400, cost: 4100, deposit: 3200, balance: 3200, paid: false,
    stage: "delivered", priority: "standard", source: "Trunk Show",
    ordered: "Dec 18, 2025", dueDate: "Feb 14, 2026", estShip: "Feb 12, 2026",
    tracking: "1Z999AA10987654321", carrier: "FedEx", shipDate: "Feb 12, 2026", deliveredDate: "Feb 14, 2026",
    notes: "Valentine's Day deadline met. Client confirmed receipt. Balance due on delivery \u2014 follow up.",
    mfgSub: null,
    messages: 12, files: 20, authGenerated: true,
  },
  {
    id: "ORD-2026-0042", product: "Medusa Pendant", sku: "MTH-PND-001", collection: "Mythos Line",
    client: { name: "Ava Laurent", email: "ava@laurentcollective.com", phone: "+1 (504) 555-0744", address: "627 Royal St, New Orleans, LA 70130" },
    type: "Pendant", metal: "18k Yellow Gold", size: "30mm medallion", stones: "2\u00D7 2.5mm Garnet", weight: "9.2g",
    price: 2600, cost: 1680, deposit: 1300, balance: 1300, paid: false,
    stage: "confirmed", priority: "rush", source: "Instagram",
    ordered: "Mar 2, 2026", dueDate: "Mar 16, 2026", estShip: "Mar 14, 2026",
    notes: "Rush \u2014 gallery opening Mar 18. Needs to arrive by Mar 16 at latest. Snake detail must match original exactly.",
    mfgSub: null,
    messages: 2, files: 6, authGenerated: false,
  },
  {
    id: "ORD-2026-0035", product: "Cathedral Engagement Ring", sku: "HRT-RNG-002", collection: "Heritage Revival",
    client: { name: "James Whitfield", email: "jwhitfield@gmail.com", phone: "+1 (404) 555-0558", address: "200 Peachtree St NW, Atlanta, GA 30303" },
    type: "Ring", metal: "Platinum", size: "5.5", stones: "2.1ct Oval Diamond, 0.4ct Pav\u00E9", weight: "5.8g",
    price: 8900, cost: 6200, deposit: 4450, balance: 4450, paid: true,
    stage: "delivered", priority: "rush", source: "Website",
    ordered: "Dec 1, 2025", dueDate: "Dec 24, 2025", estShip: "Dec 22, 2025",
    tracking: "1Z999AA10111222333", carrier: "FedEx", shipDate: "Dec 22, 2025", deliveredDate: "Dec 24, 2025",
    notes: "Christmas proposal. Delivered on time. Client sent thank-you note \u2014 proposal successful!",
    mfgSub: null,
    messages: 15, files: 22, authGenerated: true,
  },
];

// ─── SHARED COMPONENTS ───

function SectionLabel({ children }) {
  return <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: C.label }}>{children}</div>;
}

function Section({ label, children, style = {}, rightAction, collapsed, onToggle }) {
  const isCollapsible = typeof collapsed === "boolean";
  return (
    <div style={{ background: C.section, borderRadius: R, border: `1px solid ${C.border}`, marginBottom: 14, ...style }}>
      {(label || rightAction) && (
        <div onClick={isCollapsible ? onToggle : undefined} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", cursor: isCollapsible ? "pointer" : "default",
          borderBottom: (!isCollapsible || !collapsed) ? `1px solid ${C.border}` : "none",
          userSelect: "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isCollapsible && (
              <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="M2 3L5 6L8 3" fill="none" stroke={C.light} strokeWidth="1.5" />
              </svg>
            )}
            <SectionLabel>{label}</SectionLabel>
          </div>
          {rightAction}
        </div>
      )}
      {(!isCollapsible || !collapsed) && <div style={{ padding: "20px 24px" }}>{children}</div>}
    </div>
  );
}

function Pill({ label, color, bg, border, small, pulse }) {
  return (
    <span style={{
      fontFamily: SANS, fontSize: small ? 9 : 9.5, fontWeight: 600, letterSpacing: small ? 1.5 : 2, textTransform: "uppercase",
      padding: small ? "3px 8px" : "5px 14px", borderRadius: RS,
      color, background: bg || "transparent", border: `1px solid ${border || `${color}20`}`,
      display: "inline-flex", alignItems: "center", gap: 5,
      animation: pulse ? "pulse 2s infinite" : "none",
    }}>
      {pulse && <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: "pulse 2s infinite" }} />}
      {label}
    </span>
  );
}

function SmallBtn({ label, onClick, primary, danger }) {
  const [h, setH] = useState(false);
  const bg = danger ? (h ? "#B03E3E" : C.red) : primary ? (h ? C.coralHover : C.coral) : C.white;
  const clr = (primary || danger) ? C.white : C.mid;
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
      padding: "8px 20px", display: "inline-flex", alignItems: "center", gap: 6,
      background: bg, color: clr,
      border: (primary || danger) ? "none" : `1px solid ${h ? C.borderHover : C.border}`,
      borderRadius: RS, cursor: "pointer", transition: "all 0.2s", outline: "none",
    }}>{label}</button>
  );
}

function InfoField({ label, value, mono }) {
  return (
    <div style={{ minWidth: 100 }}>
      <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: mono ? MONO : SANS, fontSize: 13, color: C.dark, fontWeight: 500 }}>{value || "\u2014"}</div>
    </div>
  );
}

// ─── PIPELINE BAR (horizontal) ───
function OrderPipeline({ stage }) {
  const idx = pipelineIdx(stage);
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "stretch" }}>
      {PIPELINE.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.key} style={{
            flex: 1, textAlign: "center", padding: "8px 2px 6px",
            background: done ? C.greenBg : active ? C.blueBg : "transparent",
            border: `1px solid ${done ? C.greenBorder : active ? C.blueBorder : C.border}`,
            borderRadius: i === 0 ? `${RS}px 0 0 ${RS}px` : i === PIPELINE.length - 1 ? `0 ${RS}px ${RS}px 0` : 0,
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 11, marginBottom: 2 }}>{s.icon}</div>
            <div style={{
              fontFamily: SANS, fontSize: 8, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
              color: done ? C.green : active ? C.blue : C.light,
            }}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── COMPACT PIPELINE DOTS (for order rows) ───
function PipelineDots({ stage }) {
  const idx = pipelineIdx(stage);
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {PIPELINE.map((s, i) => (
        <div key={s.key} title={s.label} style={{
          width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
          background: i < idx ? C.green : i === idx ? C.blue : C.border,
          transition: "all 0.25s",
        }} />
      ))}
    </div>
  );
}

// ─── PAYMENT STATUS BAR ───
function PaymentBar({ deposit, balance, paid, total }) {
  const pct = Math.round((deposit / total) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontFamily: SANS, fontSize: 10, color: C.label, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>
          ${deposit.toLocaleString()} paid
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: paid ? C.green : C.amber }}>
          {paid ? "PAID IN FULL" : `$${balance.toLocaleString()} due`}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 2, width: `${pct}%`,
          background: paid ? C.green : C.amber, transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

// ─── ORDER ROW ───
function OrderRow({ order, onClick, isActive }) {
  const [h, setH] = useState(false);
  const isRush = order.priority === "rush";
  const stageLabel = PIPELINE.find((p) => p.key === order.stage)?.label || order.stage;
  return (
    <div onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr 100px 140px 80px",
      alignItems: "center", gap: 16, padding: "16px 20px",
      background: isActive ? C.white : h ? C.white : C.section,
      border: `1px solid ${isActive ? C.blue : h ? C.borderHover : C.border}`,
      borderRadius: RS, cursor: "pointer", transition: "all 0.2s", marginBottom: 4,
    }}>
      {/* Order # + date */}
      <div>
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.dark, letterSpacing: 0.5 }}>{order.id}</div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 2 }}>{order.ordered}</div>
      </div>

      {/* Product + client */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: C.black, letterSpacing: 2, textTransform: "uppercase" }}>{order.product}</span>
          {isRush && <Pill label="Rush" small color={C.coral} bg={C.redBg} border={C.redBorder} />}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 2 }}>{order.client.name} · {order.source}</div>
      </div>

      {/* Pipeline dots */}
      <div>
        <PipelineDots stage={order.stage} />
        <div style={{ fontFamily: SANS, fontSize: 10, color: C.mid, marginTop: 4, letterSpacing: 1, textTransform: "uppercase" }}>{stageLabel}</div>
      </div>

      {/* Price */}
      <div style={{ fontFamily: MONO, fontSize: 13.5, fontWeight: 600, color: C.dark, textAlign: "right" }}>
        ${order.price.toLocaleString()}
      </div>

      {/* Payment */}
      <div>
        <Pill label={order.paid ? "Paid" : `$${order.balance.toLocaleString()} due`} small
          color={order.paid ? C.green : C.amber}
          bg={order.paid ? C.greenBg : C.amberBg}
          border={order.paid ? C.greenBorder : C.amberBorder}
        />
      </div>

      {/* Due date */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.mid }}>{order.dueDate}</div>
      </div>
    </div>
  );
}

// ─── AUTH CARD PREVIEW ───
function AuthCardPreview({ order }) {
  return (
    <div style={{
      background: C.white, borderRadius: R, border: `1px solid ${C.border}`,
      padding: "28px 32px", maxWidth: 380, position: "relative", overflow: "hidden",
    }}>
      {/* Watermark */}
      <div style={{
        position: "absolute", top: -20, right: -20, opacity: 0.03,
        fontFamily: SERIF, fontSize: 120, fontWeight: 700, color: C.black,
        letterSpacing: 10, lineHeight: 1, pointerEvents: "none",
      }}>ZJ</div>

      <div style={{ fontFamily: SERIF, fontSize: 11, fontWeight: 600, letterSpacing: 6, textTransform: "uppercase", color: C.label, marginBottom: 16 }}>Certificate of Authenticity</div>

      <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, color: C.black, letterSpacing: 3, textTransform: "uppercase", lineHeight: 1.25, marginBottom: 16 }}>{order.product}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { l: "SKU", v: order.sku },
          { l: "Order", v: order.id },
          { l: "Metal", v: `${order.metal}` },
          { l: "Weight", v: order.weight },
          { l: "Stones", v: order.stones },
          { l: "Size", v: order.size },
        ].map((f, i) => (
          <div key={i}>
            <div style={{ fontFamily: SANS, fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 2 }}>{f.l}</div>
            <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.dark }}>{f.v}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 8, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 2 }}>Issued</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.mid }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase" }}>Zip Jeweler</div>
          <div style={{ fontFamily: MONO, fontSize: 8, color: C.light, letterSpacing: 1, marginTop: 2 }}>ZIPJEWELER.COM</div>
        </div>
      </div>
    </div>
  );
}

// ─── FILE ITEM ───
function FileItem({ name, type, size }) {
  const colors = { cad: C.blue, render: C.green, doc: C.amber, auth: C.purple, invoice: C.coral };
  const labels = { cad: "CAD", render: "IMG", doc: "DOC", auth: "AUTH", invoice: "INV" };
  const col = colors[type] || C.mid;
  const lbl = labels[type] || "FILE";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
      background: C.white, borderRadius: RS, border: `1px solid ${C.border}`, marginBottom: 4,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
        background: `${col}0C`, border: `1px solid ${col}20`,
      }}>
        <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 600, color: col, letterSpacing: 1 }}>{lbl}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
      </div>
      <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.light }}>{size}</span>
    </div>
  );
}

// ─── CHAT BUBBLE ───
function ChatBubble({ from, message, time, isMe }) {
  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{
        maxWidth: "75%", padding: "12px 16px", borderRadius: R,
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

// ─── TIMELINE ITEM ───
function TimelineItem({ title, detail, time, accent }) {
  return (
    <div style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <div style={{
        width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 5,
        background: accent || C.mid,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: C.dark }}>{title}</div>
        {detail && <div style={{ fontFamily: SANS, fontSize: 12, color: C.light, marginTop: 2 }}>{detail}</div>}
      </div>
      <span style={{ fontFamily: MONO, fontSize: 10, color: C.light, flexShrink: 0, marginTop: 3 }}>{time}</span>
    </div>
  );
}

// ═══════════════════════════════════════
// ORDER DETAIL DRAWER
// ═══════════════════════════════════════
function OrderDrawer({ order, onClose }) {
  const [tab, setTab] = useState("overview");
  const [colState, setCol] = useState({});
  if (!order) return null;
  const toggle = (k) => setCol((s) => ({ ...s, [k]: !s[k] }));

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "manufacturing", label: "Manufacturing" },
    { key: "invoicing", label: "Invoice" },
    { key: "auth", label: "Auth Card" },
    { key: "files", label: "Files" },
    { key: "comms", label: "Messages" },
    { key: "timeline", label: "Timeline" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(30,30,28,0.18)", backdropFilter: "blur(3px)",
      display: "flex", justifyContent: "flex-end",
      animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 620, height: "100vh", background: C.bg,
        borderLeft: `1px solid ${C.border}`, overflowY: "auto",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.06)",
        animation: "slideIn 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 32px 0", background: C.white, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.light, letterSpacing: 1.5, marginBottom: 4 }}>{order.id}</div>
              <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase", lineHeight: 1.2 }}>{order.product}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {order.priority === "rush" && <Pill label="Rush" small color={C.coral} bg={C.redBg} border={C.redBorder} pulse />}
              <select defaultValue={order.stage} style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                padding: "7px 26px 7px 12px", color: C.mid, background: C.white,
                border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
              }}>
                {PIPELINE.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.light, fontSize: 18, padding: 4 }}>{"\u2715"}</button>
            </div>
          </div>

          {/* Mini pipeline */}
          <div style={{ marginBottom: 16 }}>
            <OrderPipeline stage={order.stage} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                fontFamily: SANS, fontSize: 10.5, fontWeight: tab === t.key ? 600 : 400,
                letterSpacing: 2, textTransform: "uppercase", padding: "12px 16px",
                color: tab === t.key ? C.black : C.light, background: "none", border: "none",
                borderBottom: tab === t.key ? `2px solid ${C.black}` : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", outline: "none",
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: "24px 32px 48px" }} key={tab}>

          {/* ═══ OVERVIEW ═══ */}
          {tab === "overview" && (
            <>
              <Section label="Client" rightAction={<SmallBtn label="Email Client" primary onClick={() => {}} />}>
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                  <InfoField label="Name" value={order.client.name} />
                  <InfoField label="Email" value={order.client.email} />
                  <InfoField label="Phone" value={order.client.phone} />
                </div>
                <div style={{ marginTop: 14 }}>
                  <InfoField label="Shipping Address" value={order.client.address} />
                </div>
              </Section>

              <Section label="Product Details">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: C.border, borderRadius: RS, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  {[
                    { l: "SKU", v: order.sku }, { l: "Type", v: order.type },
                    { l: "Metal", v: order.metal }, { l: "Weight", v: order.weight },
                    { l: "Stones", v: order.stones }, { l: "Size", v: order.size },
                    { l: "Source", v: order.source }, { l: "Priority", v: order.priority === "rush" ? "RUSH" : "Standard" },
                  ].map((f, i) => (
                    <div key={i} style={{ padding: "12px 16px", background: C.white }}>
                      <div style={{ fontFamily: SANS, fontSize: 8.5, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 3 }}>{f.l}</div>
                      <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: C.dark }}>{f.v}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section label="Payment">
                <PaymentBar deposit={order.deposit} balance={order.balance} paid={order.paid} total={order.price} />
              </Section>

              <Section label="Key Dates">
                <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
                  <InfoField label="Ordered" value={order.ordered} />
                  <InfoField label="Due Date" value={order.dueDate} />
                  <InfoField label="Est. Ship" value={order.estShip} />
                  {order.shipDate && <InfoField label="Shipped" value={order.shipDate} />}
                  {order.deliveredDate && <InfoField label="Delivered" value={order.deliveredDate} />}
                </div>
                {order.tracking && (
                  <div style={{ marginTop: 14, display: "flex", gap: 28 }}>
                    <InfoField label="Carrier" value={order.carrier} />
                    <InfoField label="Tracking" value={order.tracking} mono />
                  </div>
                )}
              </Section>

              {order.notes && (
                <Section label="Notes">
                  <div style={{ fontFamily: SANS, fontSize: 13, color: C.dark, lineHeight: 1.7 }}>{order.notes}</div>
                </Section>
              )}
            </>
          )}

          {/* ═══ MANUFACTURING ═══ */}
          {tab === "manufacturing" && (
            <>
              <Section label="Production Status">
                <div style={{ marginBottom: 16 }}>
                  <OrderPipeline stage={order.stage} />
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: C.dark, lineHeight: 1.7 }}>
                  Current stage: <strong>{PIPELINE.find((p) => p.key === order.stage)?.label}</strong>
                  {order.mfgSub && <span style={{ color: C.mid }}> — {order.mfgSub} phase</span>}
                </div>
              </Section>

              <Section label="Manufacturing Checklist">
                {[
                  { item: "CAD files verified & approved", done: true },
                  { item: "Material sourced & reserved", done: true },
                  { item: "Casting complete", done: order.stage !== "confirmed" && order.stage !== "manufacturing" },
                  { item: "Stones set (if applicable)", done: pipelineIdx(order.stage) > 2 },
                  { item: "Finishing & polish complete", done: pipelineIdx(order.stage) > 2 },
                  { item: "Quality control passed", done: pipelineIdx(order.stage) > 2 },
                  { item: "Final weigh-in recorded", done: pipelineIdx(order.stage) > 3 },
                  { item: "Authentication card generated", done: order.authGenerated },
                  { item: "Photographed for records", done: pipelineIdx(order.stage) > 3 },
                  { item: "Packaged for shipping", done: pipelineIdx(order.stage) > 4 },
                ].map((c, i) => (
                  <label key={i} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
                    borderBottom: i < 9 ? `1px solid ${C.border}` : "none", cursor: "pointer",
                  }}>
                    <input type="checkbox" defaultChecked={c.done} style={{ accentColor: C.green, width: 14, height: 14 }} />
                    <span style={{ fontFamily: SANS, fontSize: 13, color: c.done ? C.light : C.dark, textDecoration: c.done ? "line-through" : "none" }}>{c.item}</span>
                  </label>
                ))}
              </Section>

              <Section label="Production Notes">
                <textarea defaultValue={order.notes} rows={4} style={{
                  width: "100%", padding: "10px 2px", fontFamily: SANS, fontSize: 13,
                  color: C.dark, background: "transparent", border: "none",
                  borderBottom: `1px solid ${C.borderInput}`, outline: "none", resize: "vertical", lineHeight: 1.7,
                }} />
              </Section>
            </>
          )}

          {/* ═══ INVOICING ═══ */}
          {tab === "invoicing" && (
            <>
              <Section label="Invoice Summary">
                <div style={{
                  background: C.white, borderRadius: RS, border: `1px solid ${C.border}`, overflow: "hidden",
                }}>
                  {/* Invoice header */}
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, color: C.black, letterSpacing: 4, textTransform: "uppercase" }}>Invoice</div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: C.light, marginTop: 4 }}>{order.id}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: C.black, letterSpacing: 3, textTransform: "uppercase" }}>Zip Jeweler</div>
                      <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 2 }}>zipjeweler.com</div>
                    </div>
                  </div>

                  {/* Client / Dates */}
                  <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 40 }}>
                    <div>
                      <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 3 }}>Bill To</div>
                      <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.dark }}>{order.client.name}</div>
                      <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.light, marginTop: 2 }}>{order.client.email}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 3 }}>Date</div>
                      <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.dark }}>{order.ordered}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, marginBottom: 3 }}>Due</div>
                      <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.dark }}>{order.dueDate}</div>
                    </div>
                  </div>

                  {/* Line items */}
                  <div style={{ padding: "16px 24px" }}>
                    {/* Header */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "3fr 1fr 1fr", gap: 8, padding: "0 0 8px",
                      fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label,
                      borderBottom: `1px solid ${C.border}`,
                    }}>
                      <span>Item</span><span style={{ textAlign: "right" }}>Qty</span><span style={{ textAlign: "right" }}>Amount</span>
                    </div>

                    {/* Row */}
                    <div style={{
                      display: "grid", gridTemplateColumns: "3fr 1fr 1fr", gap: 8, padding: "12px 0",
                      fontFamily: SANS, fontSize: 13, color: C.dark, borderBottom: `1px solid ${C.border}`,
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{order.product}</div>
                        <div style={{ fontSize: 11, color: C.light, marginTop: 2 }}>{order.metal} · {order.type} · Size {order.size}</div>
                      </div>
                      <span style={{ fontFamily: MONO, textAlign: "right" }}>1</span>
                      <span style={{ fontFamily: MONO, textAlign: "right" }}>${order.price.toLocaleString()}.00</span>
                    </div>

                    {/* Totals */}
                    <div style={{ padding: "12px 0 0" }}>
                      {[
                        { l: "Subtotal", v: `$${order.price.toLocaleString()}.00` },
                        { l: "Deposit Received", v: `-$${order.deposit.toLocaleString()}.00`, color: C.green },
                        { l: "Balance Due", v: `$${order.balance.toLocaleString()}.00`, bold: true },
                      ].map((r, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "flex-end", gap: 32, padding: "6px 0",
                          fontFamily: r.bold ? SANS : MONO, fontSize: r.bold ? 14 : 12,
                          fontWeight: r.bold ? 700 : 400, color: r.color || (r.bold ? C.black : C.mid),
                        }}>
                          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: C.label, minWidth: 120, textAlign: "right" }}>{r.l}</span>
                          <span style={{ minWidth: 100, textAlign: "right" }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: "16px 24px", background: order.paid ? C.greenBg : C.amberBg,
                    borderTop: `1px solid ${order.paid ? C.greenBorder : C.amberBorder}`,
                    fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                    color: order.paid ? C.green : C.amber, textAlign: "center",
                  }}>
                    {order.paid ? "\u2713 Paid in Full" : "\u23F3 Balance Outstanding \u2014 Payment Required"}
                  </div>
                </div>
              </Section>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <SmallBtn label="Download PDF" onClick={() => {}} />
                <SmallBtn label="Send to Client" primary onClick={() => {}} />
                {!order.paid && <SmallBtn label="Record Payment" onClick={() => {}} />}
              </div>
            </>
          )}

          {/* ═══ AUTH CARD ═══ */}
          {tab === "auth" && (
            <>
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.mid, lineHeight: 1.7, marginBottom: 20 }}>
                The Certificate of Authenticity is included with every shipped piece. It verifies materials, craftsmanship, and provenance.
              </div>

              <AuthCardPreview order={order} />

              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <SmallBtn label={order.authGenerated ? "Regenerate Card" : "Generate Card"} primary onClick={() => {}} />
                <SmallBtn label="Download PDF" onClick={() => {}} />
                <SmallBtn label="Print" onClick={() => {}} />
              </div>

              <Section label="Authentication Details" style={{ marginTop: 20 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 28px" }}>
                  <InfoField label="Serial Number" value={`ZJ-${order.id.split("-").pop()}-${order.sku}`} mono />
                  <InfoField label="Hallmark" value={order.metal.split(" ")[0]} />
                  <InfoField label="Assay Verified" value={order.authGenerated ? "Yes" : "Pending"} />
                  <InfoField label="Appraised Value" value={order.price > 3000 ? `$${Math.round(order.price * 1.15).toLocaleString()}` : "N/A"} />
                </div>
              </Section>

              {order.stones !== "None" && (
                <Section label="Stone Certificate" collapsed={colState.stoneCert} onToggle={() => toggle("stoneCert")}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 28px" }}>
                    <InfoField label="Stone(s)" value={order.stones} />
                    <InfoField label="Grading Lab" value="\u2014" />
                    <InfoField label="Certificate #" value="\u2014" />
                    <InfoField label="Report Uploaded" value="No" />
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <SmallBtn label="+ Upload Grading Report" onClick={() => {}} />
                  </div>
                </Section>
              )}
            </>
          )}

          {/* ═══ FILES ═══ */}
          {tab === "files" && (
            <>
              <Section label="Compiled Production Package" rightAction={<SmallBtn label="Download All" primary onClick={() => {}} />}>
                <div style={{
                  fontFamily: SANS, fontSize: 12, color: C.mid, lineHeight: 1.6, marginBottom: 16,
                  padding: "12px 14px", background: C.white, borderRadius: RS, border: `1px solid ${C.border}`,
                }}>
                  Complete manufacturing package for <strong style={{ color: C.dark }}>{order.product}</strong> — includes all CAD files, renders, spec sheets, invoicing, and authentication documents compiled for production handoff.
                </div>

                <FileItem name={`${order.sku}_CAD_v3.step`} type="cad" size="4.2 MB" />
                <FileItem name={`${order.sku}_CAD_v3.iges`} type="cad" size="3.8 MB" />
                <FileItem name={`${order.sku}_print-ready.stl`} type="cad" size="8.4 MB" />
                <FileItem name={`${order.sku}_render_front.png`} type="render" size="2.1 MB" />
                <FileItem name={`${order.sku}_render_side.png`} type="render" size="1.8 MB" />
                <FileItem name={`${order.sku}_render_detail.png`} type="render" size="1.6 MB" />
                <FileItem name={`${order.id}_spec-sheet.pdf`} type="doc" size="320 KB" />
                <FileItem name={`${order.id}_invoice.pdf`} type="invoice" size="124 KB" />
                <FileItem name={`${order.id}_auth-card.pdf`} type="auth" size="210 KB" />
                <FileItem name={`${order.id}_client-agreement.pdf`} type="doc" size="180 KB" />
              </Section>

              <Section label="Upload Additional Files" collapsed={colState.upload} onToggle={() => toggle("upload")}>
                <div style={{
                  padding: "32px", textAlign: "center",
                  border: `2px dashed ${C.border}`, borderRadius: RS, cursor: "pointer",
                  transition: "border-color 0.2s",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.2" style={{ marginBottom: 8, margin: "0 auto 8px" }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div style={{ fontFamily: SANS, fontSize: 12, color: C.light }}>Drop files here or click to upload</div>
                </div>
              </Section>
            </>
          )}

          {/* ═══ MESSAGES ═══ */}
          {tab === "comms" && (
            <>
              <Section label="Client Communication" style={{ padding: 0 }}>
                <div style={{ padding: "20px 24px", maxHeight: 380, overflowY: "auto" }}>
                  <ChatBubble from={order.client.name} message={`Hi, I placed order ${order.id} for the ${order.product}. Just wanted to check on the timeline?`} time="Mar 1, 2:15 PM" />
                  <ChatBubble message={`Hi ${order.client.name.split(" ")[0]}! Your piece is currently in the ${PIPELINE.find((p) => p.key === order.stage)?.label.toLowerCase()} stage. We're on track for your ${order.dueDate} delivery date.`} time="Mar 1, 3:02 PM" isMe />
                  <ChatBubble from={order.client.name} message="Perfect, thank you! Will I receive photos before it ships?" time="Mar 1, 3:18 PM" />
                  <ChatBubble message="Absolutely \u2014 we'll send completion photos and your Certificate of Authenticity before shipping. You'll also receive tracking info once it's on its way." time="Mar 1, 3:25 PM" isMe />
                </div>
                <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                  <input placeholder="Type a message\u2026" style={{
                    flex: 1, fontFamily: SANS, fontSize: 13, padding: "10px 14px", color: C.dark,
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: RS, outline: "none",
                  }} />
                  <SmallBtn label="Send" primary onClick={() => {}} />
                </div>
              </Section>

              <Section label="Quick Templates" collapsed={colState.templates} onToggle={() => toggle("templates")}>
                {[
                  "Order received confirmation",
                  "Manufacturing started notification",
                  "Quality check complete \u2014 photos attached",
                  "Ready to ship \u2014 balance reminder",
                  "Shipped with tracking",
                  "Delivery confirmation + review request",
                ].map((t, i) => (
                  <div key={i} style={{
                    padding: "10px 14px", fontFamily: SANS, fontSize: 12.5, color: C.mid,
                    borderBottom: i < 5 ? `1px solid ${C.border}` : "none", cursor: "pointer",
                    transition: "color 0.15s",
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.color = C.dark}
                    onMouseLeave={(e) => e.currentTarget.style.color = C.mid}
                  >{t}</div>
                ))}
              </Section>

              <Section label="Internal Notes" collapsed={colState.notes} onToggle={() => toggle("notes")}>
                <textarea defaultValue={order.notes} rows={3} style={{
                  width: "100%", padding: "10px 2px", fontFamily: SANS, fontSize: 13,
                  color: C.dark, background: "transparent", border: "none",
                  borderBottom: `1px solid ${C.borderInput}`, outline: "none", resize: "vertical", lineHeight: 1.7,
                }} />
              </Section>
            </>
          )}

          {/* ═══ TIMELINE ═══ */}
          {tab === "timeline" && (
            <Section label="Order Timeline">
              {pipelineIdx(order.stage) >= 6 && <TimelineItem title="Delivered" detail={`Confirmed delivery at ${order.client.address}`} time={order.deliveredDate} accent={C.green} />}
              {order.tracking && <TimelineItem title="Shipped" detail={`${order.carrier} tracking: ${order.tracking}`} time={order.shipDate} accent={C.blue} />}
              {pipelineIdx(order.stage) >= 4 && <TimelineItem title="Packaged" detail="Final inspection passed, packaged for shipment" time="" accent={C.green} />}
              {order.authGenerated && <TimelineItem title="Authentication card generated" detail="Certificate of Authenticity created and attached to order" time="" accent={C.purple} />}
              {pipelineIdx(order.stage) >= 2 && <TimelineItem title="Quality check" detail="QC inspection complete \u2014 all specs verified" time="" accent={C.green} />}
              <TimelineItem title="Manufacturing" detail={`Production ${pipelineIdx(order.stage) > 1 ? "completed" : "in progress"}`} time="" accent={pipelineIdx(order.stage) > 1 ? C.green : C.blue} />
              <TimelineItem title="Order confirmed" detail={`Payment of $${order.deposit.toLocaleString()} deposit received`} time={order.ordered} accent={C.green} />
              <TimelineItem title="Order placed" detail={`${order.product} \u2014 ${order.source}`} time={order.ordered} accent={C.black} />
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ORDERS VIEW
// ═══════════════════════════════════════
export default function OrdersView() {
  const [loaded, setLoaded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStage, setFilterStage] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  const filtered = useMemo(() => {
    let items = [...ORDERS];
    if (filterStage !== "all") items = items.filter((o) => o.stage === filterStage);
    if (filterPayment === "paid") items = items.filter((o) => o.paid);
    if (filterPayment === "unpaid") items = items.filter((o) => !o.paid);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((o) =>
        o.id.toLowerCase().includes(q) || o.product.toLowerCase().includes(q) ||
        o.client.name.toLowerCase().includes(q) || o.sku.toLowerCase().includes(q)
      );
    }
    if (sortBy === "newest") items.sort((a, b) => b.id.localeCompare(a.id));
    if (sortBy === "due") items.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (sortBy === "price") items.sort((a, b) => b.price - a.price);
    return items;
  }, [filterStage, filterPayment, search, sortBy]);

  const stats = useMemo(() => {
    const active = ORDERS.filter((o) => !["delivered", "shipped"].includes(o.stage));
    return {
      active: active.length,
      revenue: ORDERS.reduce((s, o) => s + o.price, 0),
      outstanding: ORDERS.filter((o) => !o.paid).reduce((s, o) => s + o.balance, 0),
      rush: ORDERS.filter((o) => o.priority === "rush" && !["delivered", "shipped"].includes(o.stage)).length,
    };
  }, []);

  return (
    <>
      {/* Header */}
      <header style={{
        padding: "24px 44px", background: C.white,
        borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: C.black, letterSpacing: 5, textTransform: "uppercase" }}>Orders</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SmallBtn label="Export Orders" onClick={() => {}} />
            <SmallBtn label="+ New Order" primary onClick={() => {}} />
          </div>
        </div>
      </header>

      <div style={{ padding: "28px 44px 60px", maxWidth: 1200 }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Active Orders", value: stats.active },
            { label: "Total Revenue", value: `$${stats.revenue.toLocaleString()}` },
            { label: "Outstanding Balance", value: `$${stats.outstanding.toLocaleString()}`, color: stats.outstanding > 0 ? C.amber : C.green },
            { label: "Rush Orders", value: stats.rush, color: stats.rush > 0 ? C.coral : undefined },
          ].map((s, i) => (
            <div key={i} style={{ background: C.section, borderRadius: R, border: `1px solid ${C.border}`, padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: s.color || C.black }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          padding: "14px 20px", background: C.section, borderRadius: R, border: `1px solid ${C.border}`, flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 200px", minWidth: 200 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="2"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
            </svg>
            <input placeholder="Search orders, clients, SKUs\u2026" value={search} onChange={(e) => setSearch(e.target.value)} style={{
              width: "100%", padding: "9px 12px 9px 32px", fontFamily: SANS, fontSize: 12.5,
              color: C.dark, background: C.white, border: `1px solid ${C.border}`,
              borderRadius: RS, outline: "none",
            }} />
          </div>

          <div style={{ width: 1, height: 28, background: C.border }} />

          {/* Payment filter */}
          {["all", "paid", "unpaid"].map((f) => (
            <button key={f} onClick={() => setFilterPayment(f)} style={{
              fontFamily: SANS, fontSize: 10, fontWeight: filterPayment === f ? 600 : 400,
              letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 12px",
              color: filterPayment === f ? C.black : C.light,
              background: filterPayment === f ? C.white : "transparent",
              border: `1px solid ${filterPayment === f ? C.border : "transparent"}`,
              borderRadius: RS, cursor: "pointer", outline: "none", transition: "all 0.15s",
            }}>{f === "all" ? "All" : f === "paid" ? "Paid" : "Unpaid"}</button>
          ))}

          <div style={{ flex: 1 }} />

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{
            fontFamily: SANS, fontSize: 10.5, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
            padding: "8px 28px 8px 12px", color: C.mid, background: C.white,
            border: `1px solid ${C.border}`, borderRadius: RS, cursor: "pointer", outline: "none", appearance: "auto",
          }}>
            <option value="newest">Newest</option>
            <option value="due">Due Soonest</option>
            <option value="price">Highest Value</option>
          </select>
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 2fr 1.2fr 100px 140px 80px",
          gap: 16, padding: "0 20px 8px",
          fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: C.label,
        }}>
          <span>Order</span><span>Product / Client</span><span>Stage</span>
          <span style={{ textAlign: "right" }}>Total</span><span>Payment</span><span style={{ textAlign: "right" }}>Due</span>
        </div>

        {/* Order rows */}
        {filtered.map((o) => (
          <OrderRow key={o.id} order={o} onClick={() => setSelectedOrder(o)} isActive={selectedOrder?.id === o.id} />
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: C.light, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>No Orders Found</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.light }}>Adjust your filters or search terms</div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 0 8px" }}>
          <div style={{ width: 32, height: 1, background: C.border, margin: "0 auto 14px", borderRadius: 1 }} />
          <div style={{ fontFamily: SERIF, fontSize: 13, color: C.light, letterSpacing: 4, textTransform: "uppercase" }}>
            {stats.active} active orders · ${stats.revenue.toLocaleString()} total revenue
          </div>
        </div>

      </div>

      {/* Order drawer */}
      <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </>
  );
}
