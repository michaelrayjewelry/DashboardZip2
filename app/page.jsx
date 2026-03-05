"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { C, SERIF, SANS, MONO, R, RS } from "./components/shared";
import ProductsView from "./components/ProductsView";
import ProjectsView from "./components/ProjectsView";
import OrdersView from "./components/OrdersView";
import ImagineView from "./components/ImagineView";
import ProjectView from "./components/ProjectView";
import NewProjectModal from "./components/NewProjectModal";
import { generateImage, chatWithClaude } from "./lib/api";
import { getProjects, createProject, saveGeneratedImageToProject } from "./lib/storage";

// ─── Helpers ───
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
  const thumbUrl = project.coverImageUrl || null;
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
          background: thumbUrl ? `url(${thumbUrl}) center/cover` : C.border,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {!thumbUrl && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.light} strokeWidth="1.2">
            <path d="M6 3h12l4 6-10 13L2 9z" />
            <path d="M2 9h20" />
          </svg>
        )}
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

function ImageDropZone({ dragOver, setDragOver, large, onFile, previewUrl, onClear }) {
  const fileRef = useRef(null);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onFile?.(reader.result, file);
    reader.readAsDataURL(file);
  };

  if (previewUrl) {
    return (
      <div style={{ position: "relative", width: large ? "100%" : 180, borderRadius: RS, overflow: "hidden" }}>
        <img src={previewUrl} alt="Uploaded reference" style={{ width: "100%", maxHeight: 280, objectFit: "contain", display: "block", background: C.border, borderRadius: RS }} />
        <button onClick={onClear} style={{
          position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%",
          background: "rgba(30,30,28,0.7)", color: C.white, border: "none", cursor: "pointer",
          fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)",
        }}>✕</button>
      </div>
    );
  }

  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      style={{
        width: large ? "100%" : 180, height: large ? 220 : 180, borderRadius: RS,
        background: dragOver ? "rgba(90,138,74,0.06)" : C.border,
        border: `2px dashed ${dragOver ? C.green : "transparent"}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all 0.2s",
      }}
    >
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
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
function ToolModal({ tool, onClose, onProjectCreated }) {
  const [dragOver, setDragOver] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1080p");
  const [cameraAngle, setCameraAngle] = useState("front");
  const [lighting, setLighting] = useState("studio");
  const [background, setBackground] = useState("white");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Jewelry-specific fields for sketch-to-jewelry and technical-to-image
  const [jewelryType, setJewelryType] = useState("");
  const [metal, setMetal] = useState("");
  const [gemstone, setGemstone] = useState("");
  const [finish, setFinish] = useState("");
  const [settingType, setSettingType] = useState("");

  if (!tool) return null;

  const isSketchTool = tool.id === "sketch-to-jewelry";
  const isTechnicalTool = tool.id === "technical-to-image";
  const isJewelryTool = isSketchTool || isTechnicalTool;
  const isMarketingTool = tool.id === "image-to-marketing";
  const isImageTool = isJewelryTool || isMarketingTool;
  const isEstimate = tool.id === "manufacture-estimate";
  const is3d = tool.id === "3d-model";
  const isCollection = tool.id === "start-collection";
  const isFileHub = tool.id === "file-hub";
  const actionLabel = tool.actionLabel || "Generate with AI";

  const CAMERA_ANGLES = [
    { value: "front", label: "Front" },
    { value: "three-quarter", label: "3/4 View" },
    { value: "side", label: "Side Profile" },
    { value: "top-down", label: "Top Down" },
    { value: "close-up", label: "Close-Up Detail" },
    { value: "wrist-shot", label: "Wrist / On-Body" },
  ];

  const LIGHTING_OPTIONS = [
    { value: "studio", label: "soft diffused studio" },
    { value: "natural", label: "natural window" },
    { value: "dramatic", label: "dramatic directional" },
    { value: "golden-hour", label: "warm golden hour" },
    { value: "rim", label: "rim backlit" },
  ];

  const BACKGROUND_OPTIONS = [
    { value: "white", label: "clean white seamless" },
    { value: "gradient", label: "soft neutral gradient" },
    { value: "marble", label: "polished marble surface" },
    { value: "velvet", label: "dark velvet fabric" },
    { value: "natural", label: "natural organic texture" },
    { value: "black", label: "solid black" },
  ];

  const JEWELRY_TYPES = [
    { value: "", label: "Select type..." },
    { value: "ring", label: "Ring" },
    { value: "engagement ring", label: "Engagement Ring" },
    { value: "wedding band", label: "Wedding Band" },
    { value: "necklace", label: "Necklace" },
    { value: "pendant", label: "Pendant" },
    { value: "bracelet", label: "Bracelet" },
    { value: "bangle", label: "Bangle" },
    { value: "earrings", label: "Earrings" },
    { value: "brooch", label: "Brooch" },
    { value: "cuff", label: "Cuff" },
  ];

  const METAL_OPTIONS = [
    { value: "", label: "Select metal..." },
    { value: "18k yellow gold", label: "18K Yellow Gold" },
    { value: "14k yellow gold", label: "14K Yellow Gold" },
    { value: "18k white gold", label: "18K White Gold" },
    { value: "14k white gold", label: "14K White Gold" },
    { value: "18k rose gold", label: "18K Rose Gold" },
    { value: "14k rose gold", label: "14K Rose Gold" },
    { value: "platinum", label: "Platinum" },
    { value: "sterling silver", label: "Sterling Silver" },
    { value: "mixed metals", label: "Mixed Metals" },
  ];

  const FINISH_OPTIONS = [
    { value: "", label: "Select finish..." },
    { value: "high polish", label: "High Polish" },
    { value: "brushed matte", label: "Brushed / Matte" },
    { value: "satin", label: "Satin" },
    { value: "hammered", label: "Hammered" },
    { value: "textured", label: "Textured" },
    { value: "antiqued", label: "Antiqued / Oxidized" },
  ];

  const SETTING_OPTIONS = [
    { value: "", label: "Select setting..." },
    { value: "prong", label: "Prong" },
    { value: "bezel", label: "Bezel" },
    { value: "pave", label: "Pave" },
    { value: "channel", label: "Channel" },
    { value: "tension", label: "Tension" },
    { value: "flush", label: "Flush / Gypsy" },
    { value: "halo", label: "Halo" },
    { value: "cluster", label: "Cluster" },
  ];

  // ── Analyze uploaded image with Claude Vision ──
  const analyzeImage = async (dataUrl) => {
    setIsAnalyzing(true);
    try {
      const base64 = dataUrl.split(",")[1];
      const mimeMatch = dataUrl.match(/^data:(image\/[^;]+);/);
      const mediaType = mimeMatch ? mimeMatch[1] : "image/png";

      const systemPrompt = isSketchTool
        ? "You are a jewelry design expert analyzing a rough sketch. Describe ONLY what you see in the image in precise detail: the type of jewelry piece, its shape and silhouette, decorative elements, stone placements, band/chain style, proportions, and any design motifs. Be specific about curves, angles, symmetry, and structural details. Output a single dense paragraph. Do not suggest improvements or give opinions."
        : "You are a jewelry technical analyst examining a technical drawing. Describe ONLY what you see: the type of jewelry piece, exact structural elements, measurements or proportions visible, stone cuts and placement positions, prong/bezel/setting details, band width, construction joints, and engineering details. Be precise about dimensions, angles, and construction specifications. Output a single dense paragraph. Do not suggest improvements or give opinions.";

      const result = await chatWithClaude({
        system: systemPrompt,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: isSketchTool
              ? "Describe this jewelry sketch in detail. Focus on the shape, design elements, proportions, and any visible features."
              : "Describe this technical jewelry drawing in detail. Focus on construction, dimensions, stone placements, and structural elements."
            },
          ],
        }],
        maxTokens: 500,
      });
      setImageAnalysis(result);
    } catch {
      setImageAnalysis("");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Tool-specific prompt builders ──

  const buildSketchPrompt = () => {
    const parts = [];
    // Quality prefix — proven keywords for photorealistic jewelry generation
    parts.push("Photorealistic studio product photograph of custom jewelry, masterpiece quality, ultra detailed, professional jewelry photography, 8k");

    // Jewelry type
    if (jewelryType) parts.push(jewelryType);

    // Image analysis from Claude Vision (the actual sketch content)
    if (imageAnalysis) parts.push(imageAnalysis);

    // User description
    if (prompt.trim()) parts.push(prompt.trim());

    // Material specs
    if (metal) parts.push(`made of ${metal}`);
    if (gemstone) parts.push(`featuring ${gemstone}`);
    if (settingType) parts.push(`${settingType} setting`);
    if (finish) parts.push(`${finish} finish`);
    if (style) parts.push(`${style} style`);

    // Photography settings
    const angle = CAMERA_ANGLES.find(a => a.value === cameraAngle);
    parts.push(`${angle?.label || "front"} view`);
    const light = LIGHTING_OPTIONS.find(l => l.value === lighting);
    parts.push(`${light?.label || "soft diffused studio"} lighting`);
    const bg = BACKGROUND_OPTIONS.find(b => b.value === background);
    parts.push(`${bg?.label || "clean white seamless"} background`);

    // Quality tail
    parts.push("dazzling light reflections, sharp focus, luxury aesthetic");

    return parts.join(", ");
  };

  const buildTechnicalPrompt = () => {
    const parts = [];
    // Precision-focused prefix
    parts.push("Photorealistic product photograph of precision-crafted jewelry, exact proportions, highly detailed metalwork, technically accurate construction, professional product photography, 8k");

    // Jewelry type
    if (jewelryType) parts.push(jewelryType);

    // Image analysis from Claude Vision (the actual technical drawing content)
    if (imageAnalysis) parts.push(`precise reproduction of: ${imageAnalysis}`);

    // User technical description
    if (prompt.trim()) parts.push(prompt.trim());

    // Material specs with technical phrasing
    if (metal) parts.push(`constructed in ${metal}`);
    if (gemstone) parts.push(`set with ${gemstone}`);
    if (settingType) parts.push(`${settingType} stone setting`);
    if (finish) parts.push(`${finish} surface finish`);
    if (style) parts.push(`${style} design language`);

    // Photography settings
    const angle = CAMERA_ANGLES.find(a => a.value === cameraAngle);
    parts.push(`${angle?.label || "front"} view`);
    const light = LIGHTING_OPTIONS.find(l => l.value === lighting);
    parts.push(`${light?.label || "soft diffused studio"} lighting`);
    const bg = BACKGROUND_OPTIONS.find(b => b.value === background);
    parts.push(`${bg?.label || "clean white seamless"} background`);

    // Technical quality tail
    parts.push("macro detail, true-to-spec proportions, sharp focus, professional jewelry rendering");

    return parts.join(", ");
  };

  const buildMarketingPrompt = () => {
    const base = "Luxury jewelry marketing photograph, editorial style, elegant composition";
    const anglePart = cameraAngle !== "front" ? `${CAMERA_ANGLES.find(a => a.value === cameraAngle)?.label || cameraAngle} angle` : "front view";
    const lightPart = `${LIGHTING_OPTIONS.find(l => l.value === lighting)?.label || lighting} lighting`;
    const bgPart = `${BACKGROUND_OPTIONS.find(b => b.value === background)?.label || background} background`;
    const settingsParts = [anglePart, lightPart, bgPart].join(", ");
    const p = [base, prompt, style, settingsParts].filter(Boolean);
    return p.join(". ");
  };

  const buildPrompt = () => {
    if (isSketchTool) return buildSketchPrompt();
    if (isTechnicalTool) return buildTechnicalPrompt();
    return buildMarketingPrompt();
  };

  // ── Create a project and save generated images ──
  const createProjectFromGeneration = (images, promptUsed) => {
    const projectName = prompt.trim().length > 40 ? prompt.trim().slice(0, 40) + "…" : prompt.trim() || tool.title;
    const project = createProject({
      name: projectName,
      type: tool.id,
      fields: {
        ...(isJewelryTool ? { jewelryType, metal, gemstone, finish, settingType } : {}),
        style, cameraAngle, lighting, background, aspectRatio, resolution,
        ...(imageAnalysis ? { imageAnalysis } : {}),
        promptUsed,
      },
    });
    for (const img of images) {
      saveGeneratedImageToProject(project.id, img.url, tool.id, promptUsed);
    }
    return project;
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage && !jewelryType) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      // If there's an uploaded image but no analysis yet, analyze it and use the result directly
      let analysisText = imageAnalysis;
      if (uploadedImage && !imageAnalysis && isJewelryTool) {
        setIsAnalyzing(true);
        try {
          const base64 = uploadedImage.split(",")[1];
          const mimeMatch = uploadedImage.match(/^data:(image\/[^;]+);/);
          const mediaType = mimeMatch ? mimeMatch[1] : "image/png";
          const systemPrompt = isSketchTool
            ? "You are a jewelry design expert analyzing a rough sketch. Describe ONLY what you see in the image in precise detail: the type of jewelry piece, its shape and silhouette, decorative elements, stone placements, band/chain style, proportions, and any design motifs. Be specific about curves, angles, symmetry, and structural details. Output a single dense paragraph. Do not suggest improvements or give opinions."
            : "You are a jewelry technical analyst examining a technical drawing. Describe ONLY what you see: the type of jewelry piece, exact structural elements, measurements or proportions visible, stone cuts and placement positions, prong/bezel/setting details, band width, construction joints, and engineering details. Be precise about dimensions, angles, and construction specifications. Output a single dense paragraph. Do not suggest improvements or give opinions.";
          analysisText = await chatWithClaude({
            system: systemPrompt,
            messages: [{ role: "user", content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: isSketchTool ? "Describe this jewelry sketch in detail." : "Describe this technical jewelry drawing in detail." },
            ]}],
            maxTokens: 500,
          });
          setImageAnalysis(analysisText);
        } catch { analysisText = ""; } finally { setIsAnalyzing(false); }
      }

      // Build prompt with the analysis text available
      const buildFinalPrompt = () => {
        if (isSketchTool) {
          const parts = ["Photorealistic studio product photograph of custom jewelry, masterpiece quality, ultra detailed, professional jewelry photography, 8k"];
          if (jewelryType) parts.push(jewelryType);
          if (analysisText) parts.push(analysisText);
          if (prompt.trim()) parts.push(prompt.trim());
          if (metal) parts.push(`made of ${metal}`);
          if (gemstone) parts.push(`featuring ${gemstone}`);
          if (settingType) parts.push(`${settingType} setting`);
          if (finish) parts.push(`${finish} finish`);
          if (style) parts.push(`${style} style`);
          const angle = CAMERA_ANGLES.find(a => a.value === cameraAngle);
          parts.push(`${angle?.label || "front"} view`);
          const light = LIGHTING_OPTIONS.find(l => l.value === lighting);
          parts.push(`${light?.label || "soft diffused studio"} lighting`);
          const bg = BACKGROUND_OPTIONS.find(b => b.value === background);
          parts.push(`${bg?.label || "clean white seamless"} background`);
          parts.push("dazzling light reflections, sharp focus, luxury aesthetic");
          return parts.join(", ");
        }
        if (isTechnicalTool) {
          const parts = ["Photorealistic product photograph of precision-crafted jewelry, exact proportions, highly detailed metalwork, technically accurate construction, professional product photography, 8k"];
          if (jewelryType) parts.push(jewelryType);
          if (analysisText) parts.push(`precise reproduction of: ${analysisText}`);
          if (prompt.trim()) parts.push(prompt.trim());
          if (metal) parts.push(`constructed in ${metal}`);
          if (gemstone) parts.push(`set with ${gemstone}`);
          if (settingType) parts.push(`${settingType} stone setting`);
          if (finish) parts.push(`${finish} surface finish`);
          if (style) parts.push(`${style} design language`);
          const angle = CAMERA_ANGLES.find(a => a.value === cameraAngle);
          parts.push(`${angle?.label || "front"} view`);
          const light = LIGHTING_OPTIONS.find(l => l.value === lighting);
          parts.push(`${light?.label || "soft diffused studio"} lighting`);
          const bg = BACKGROUND_OPTIONS.find(b => b.value === background);
          parts.push(`${bg?.label || "clean white seamless"} background`);
          parts.push("macro detail, true-to-spec proportions, sharp focus, professional jewelry rendering");
          return parts.join(", ");
        }
        return buildMarketingPrompt();
      };

      const fullPrompt = buildFinalPrompt();
      const result = await generateImage({
        prompt: fullPrompt,
        aspectRatio,
        resolution,
      });

      if (result.images && result.images.length > 0) {
        setGeneratedImages(result.images);
        const project = createProjectFromGeneration(result.images, fullPrompt);
        onProjectCreated?.(project.id);
      } else {
        setError("No images were returned. Please try again.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = () => {
    if (!prompt.trim() && !uploadedImage && !jewelryType) { onClose(); return; }
    const fullPrompt = buildPrompt();
    const project = createProjectFromGeneration(generatedImages, fullPrompt);
    onProjectCreated?.(project.id);
    onClose();
  };

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

          {/* ── Sketch to Jewelry / Technical to Image ── */}
          {isJewelryTool && (
            <>
              <Section label={isSketchTool ? "Upload Sketch" : "Upload Technical Drawing"}>
                <ImageDropZone
                  dragOver={dragOver} setDragOver={setDragOver} large
                  previewUrl={uploadedImage}
                  onFile={(dataUrl, file) => {
                    setUploadedImage(dataUrl);
                    setUploadedFile(file);
                    setImageAnalysis("");
                    analyzeImage(dataUrl);
                  }}
                  onClear={() => { setUploadedImage(null); setUploadedFile(null); setImageAnalysis(""); }}
                />
                {!uploadedImage && (
                  <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 8 }}>
                    {isSketchTool
                      ? "Upload your hand sketch — AI will analyze the design and convert it to a photorealistic jewelry image"
                      : "Upload your technical drawing — AI will analyze the specifications and render a precise photorealistic image"}
                  </div>
                )}
                {isAnalyzing && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                    <div style={{ width: 14, height: 14, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontFamily: SANS, fontSize: 11, color: C.blue, letterSpacing: 1, textTransform: "uppercase" }}>Analyzing {isSketchTool ? "sketch" : "drawing"}...</span>
                  </div>
                )}
                {imageAnalysis && !isAnalyzing && (
                  <div style={{ marginTop: 10, padding: "10px 14px", background: C.blueBg, border: `1px solid ${C.blueBorder}`, borderRadius: RS }}>
                    <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: C.blue, marginBottom: 4 }}>
                      AI Analysis
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 11.5, color: C.dark, lineHeight: 1.5 }}>{imageAnalysis}</div>
                  </div>
                )}
              </Section>

              <Section label="Jewelry Details">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 32px" }}>
                  <div style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                    <div style={labelStyle}>Jewelry Type</div>
                    <select value={jewelryType} onChange={(e) => setJewelryType(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {JEWELRY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                    <div style={labelStyle}>Metal</div>
                    <select value={metal} onChange={(e) => setMetal(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {METAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                    <div style={labelStyle}>Primary Gemstone</div>
                    <input value={gemstone} onChange={(e) => setGemstone(e.target.value)}
                      placeholder={isSketchTool ? "e.g. Round Diamond, Oval Emerald" : "e.g. 1.5ct Round Brilliant Diamond"}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
                      onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)} />
                  </div>
                  <div style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                    <div style={labelStyle}>Setting Type</div>
                    <select value={settingType} onChange={(e) => setSettingType(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {SETTING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                    <div style={labelStyle}>Finish</div>
                    <select value={finish} onChange={(e) => setFinish(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {FINISH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                    <div style={labelStyle}>Design Style</div>
                    <input value={style} onChange={(e) => setStyle(e.target.value)}
                      placeholder={isSketchTool ? "e.g. Art Deco, Bohemian, Minimalist" : "e.g. Modern, Vintage, Architectural"}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
                      onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)} />
                  </div>
                </div>
              </Section>

              <Section label={isSketchTool ? "Describe Your Vision" : "Technical Description"}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
                  <div style={{ flex: "1 1 100%", minWidth: "100%" }}>
                    <textarea
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={isSketchTool
                        ? "Describe the jewelry piece you envision — the overall feel, unique design elements, who it's for..."
                        : "Describe precise specifications — dimensions, stone placement, band width, construction details..."}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                      onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
                      onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)}
                    />
                  </div>
                </div>
              </Section>

              <Section label="Photography Settings">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px 32px" }}>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 160 }}>
                    <div style={labelStyle}>Camera Angle</div>
                    <select value={cameraAngle} onChange={(e) => setCameraAngle(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {CAMERA_ANGLES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 160 }}>
                    <div style={labelStyle}>Lighting</div>
                    <select value={lighting} onChange={(e) => setLighting(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {LIGHTING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 160 }}>
                    <div style={labelStyle}>Background</div>
                    <select value={background} onChange={(e) => setBackground(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {BACKGROUND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 120 }}>
                    <div style={labelStyle}>Aspect Ratio</div>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="4:3">4:3 (Product)</option>
                      <option value="3:4">3:4 (Portrait)</option>
                      <option value="16:9">16:9 (Wide)</option>
                      <option value="9:16">9:16 (Tall)</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 120 }}>
                    <div style={labelStyle}>Resolution</div>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      <option value="720p">720p (Fast)</option>
                      <option value="1080p">1080p (Default)</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* Generated image results */}
              {(generatedImages.length > 0 || isGenerating || error) && (
                <Section label="Generated Result">
                  {isGenerating && (
                    <div style={{ padding: "40px 0", textAlign: "center" }}>
                      <div style={{
                        width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.coral,
                        borderRadius: "50%", margin: "0 auto 16px",
                        animation: "spin 0.8s linear infinite",
                      }} />
                      <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid, letterSpacing: 1.5, textTransform: "uppercase" }}>
                        Generating with Nano Banana...
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 11, color: C.light, marginTop: 6 }}>
                        This may take up to 30 seconds
                      </div>
                    </div>
                  )}
                  {error && (
                    <div style={{
                      padding: "16px 20px", background: C.redBg, border: `1px solid ${C.redBorder}`,
                      borderRadius: RS, marginBottom: 12,
                    }}>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: C.coral, fontWeight: 600, marginBottom: 4 }}>
                        Generation Failed
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid }}>{error}</div>
                    </div>
                  )}
                  {generatedImages.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      {generatedImages.map((img, i) => (
                        <div key={i} style={{ position: "relative", flex: "1 1 auto", maxWidth: "100%" }}>
                          <img
                            src={img.url}
                            alt={`Generated jewelry ${i + 1}`}
                            style={{
                              width: "100%", borderRadius: RS, border: `1px solid ${C.border}`,
                              display: "block",
                            }}
                          />
                          <a
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              position: "absolute", bottom: 10, right: 10,
                              fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
                              padding: "6px 14px", background: "rgba(30,30,28,0.75)", color: C.white,
                              borderRadius: RS, textDecoration: "none", backdropFilter: "blur(4px)",
                            }}
                          >
                            Open Full Size
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}
            </>
          )}

          {/* ── Image to Marketing (keeps original simple UI) ── */}
          {isMarketingTool && (
            <>
              <Section label="Upload Reference Image">
                <ImageDropZone
                  dragOver={dragOver} setDragOver={setDragOver} large
                  previewUrl={uploadedImage}
                  onFile={(dataUrl, file) => { setUploadedImage(dataUrl); setUploadedFile(file); }}
                  onClear={() => { setUploadedImage(null); setUploadedFile(null); }}
                />
              </Section>
              <Section label="Generation Settings">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "20px 32px" }}>
                  <div style={{ flex: "1 1 100%", minWidth: "100%" }}>
                    <div style={labelStyle}>Prompt / Description</div>
                    <textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the marketing look you want..."
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                      onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
                      onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)} />
                  </div>
                  <div style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                    <div style={labelStyle}>Style</div>
                    <input value={style} onChange={(e) => setStyle(e.target.value)}
                      placeholder="e.g. Editorial, Luxury Brand, Minimalist"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderBottomColor = C.mid)}
                      onBlur={(e) => (e.target.style.borderBottomColor = C.borderInput)} />
                  </div>
                  <div style={{ flex: "1 1 calc(50% - 16px)", minWidth: 200 }}>
                    <div style={labelStyle}>Camera Angle</div>
                    <select value={cameraAngle} onChange={(e) => setCameraAngle(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {CAMERA_ANGLES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 120 }}>
                    <div style={labelStyle}>Lighting</div>
                    <select value={lighting} onChange={(e) => setLighting(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {LIGHTING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 120 }}>
                    <div style={labelStyle}>Background</div>
                    <select value={background} onChange={(e) => setBackground(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      {BACKGROUND_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 120 }}>
                    <div style={labelStyle}>Aspect Ratio</div>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      <option value="1:1">1:1 (Square)</option>
                      <option value="4:3">4:3 (Product)</option>
                      <option value="16:9">16:9 (Wide)</option>
                      <option value="9:16">9:16 (Tall)</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 calc(33% - 22px)", minWidth: 120 }}>
                    <div style={labelStyle}>Resolution</div>
                    <select value={resolution} onChange={(e) => setResolution(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", appearance: "auto", borderBottom: `1px solid ${C.borderInput}` }}>
                      <option value="720p">720p (Fast)</option>
                      <option value="1080p">1080p (Default)</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* Generated image results */}
              {(generatedImages.length > 0 || isGenerating || error) && (
                <Section label="Generated Result">
                  {isGenerating && (
                    <div style={{ padding: "40px 0", textAlign: "center" }}>
                      <div style={{ width: 32, height: 32, border: `3px solid ${C.border}`, borderTopColor: C.coral, borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
                      <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid, letterSpacing: 1.5, textTransform: "uppercase" }}>Generating...</div>
                    </div>
                  )}
                  {error && (
                    <div style={{ padding: "16px 20px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: RS, marginBottom: 12 }}>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: C.coral, fontWeight: 600, marginBottom: 4 }}>Generation Failed</div>
                      <div style={{ fontFamily: SANS, fontSize: 12, color: C.mid }}>{error}</div>
                    </div>
                  )}
                  {generatedImages.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      {generatedImages.map((img, i) => (
                        <div key={i} style={{ position: "relative", flex: "1 1 auto", maxWidth: "100%" }}>
                          <img src={img.url} alt={`Generated ${i + 1}`} style={{ width: "100%", borderRadius: RS, border: `1px solid ${C.border}`, display: "block" }} />
                          <a href={img.url} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", bottom: 10, right: 10, fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 14px", background: "rgba(30,30,28,0.75)", color: C.white, borderRadius: RS, textDecoration: "none", backdropFilter: "blur(4px)" }}>Open Full Size</a>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              )}
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
            {(() => {
              const canGenerate = isImageTool && (prompt.trim() || uploadedImage || jewelryType);
              const isDisabled = isImageTool ? (isGenerating || isAnalyzing || !canGenerate) : false;
              return (
                <button
                  onClick={isImageTool ? handleGenerate : undefined}
                  disabled={isDisabled}
                  style={{
                    flex: 1, fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase",
                    padding: "14px 28px",
                    background: isDisabled ? C.border : C.coral,
                    color: C.white, border: "none", borderRadius: RS,
                    cursor: isDisabled ? "default" : "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.background = C.coralHover; }}
                  onMouseLeave={(e) => { if (!isDisabled) e.currentTarget.style.background = C.coral; }}
                >
                  {isAnalyzing ? "Analyzing image..." : isGenerating ? "Generating..." : actionLabel}
                </button>
              );
            })()}
            <button
              onClick={isImageTool && !isFileHub && generatedImages.length === 0 ? handleSaveDraft : onClose}
              style={{
                fontFamily: SANS, fontSize: 12, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase",
                padding: "14px 24px", background: C.white, color: C.mid, border: `1px solid ${C.border}`,
                borderRadius: RS, cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderHover)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
            >
              {generatedImages.length > 0 ? "Done" : isFileHub ? "Close" : "Save Draft"}
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
function DashboardContent({ onNavigate, onOpenTool, storedProjects = [] }) {
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
          {storedProjects.slice(0, 3).map((p) => (
            <ProjectRow
              key={p.id}
              project={{
                id: p.id,
                name: p.name || "Untitled Project",
                collection: p.fields?.collection || p.type || "Custom",
                status: p.status || "draft",
                stage: p.stage || "Concept",
                time: timeAgo(p.updatedAt),
                coverImageUrl: p.fields?.coverImage?.url || null,
              }}
              onClick={() => onNavigate("project-detail", p.id)}
            />
          ))}
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
  const [storedProjects, setStoredProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // Load projects from storage on mount and when returning to dashboard/projects
  const refreshProjects = useCallback(() => {
    setStoredProjects(getProjects());
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [activeNav, refreshProjects]);

  const handleNavigate = (target, projectId) => {
    if (target === "project-detail" && projectId) {
      setSelectedProjectId(projectId);
    }
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
          <DashboardContent onNavigate={handleNavigate} onOpenTool={setActiveTool} storedProjects={storedProjects} />
        )}
        {activeNav === "projects" && (
          <ProjectsView
            storedProjects={storedProjects}
            onNewProject={() => setShowNewProjectModal(true)}
            onOpenProject={(id) => handleNavigate("project-detail", id)}
          />
        )}
        {activeNav === "products" && <ProductsView />}
        {activeNav === "orders" && <OrdersView />}
        {activeNav === "imagine" && <ImagineView onProjectCreated={(id) => { refreshProjects(); handleNavigate("project-detail", id); }} />}
        {activeNav === "project-detail" && (
          <ProjectView onBack={() => handleNavigate("projects")} projectId={selectedProjectId} />
        )}
      </main>

      {/* ═══ Tool Modal ═══ */}
      {activeTool?.id === "new-project" ? (
        <NewProjectModal onClose={() => { setActiveTool(null); refreshProjects(); }} onProjectCreated={(id) => { refreshProjects(); handleNavigate("project-detail", id); }} />
      ) : (
        <ToolModal tool={activeTool} onClose={() => { setActiveTool(null); refreshProjects(); }} onProjectCreated={(id) => { refreshProjects(); }} />
      )}

      {/* ═══ New Project Modal (from Projects page button) ═══ */}
      {showNewProjectModal && (
        <NewProjectModal onClose={() => { setShowNewProjectModal(false); refreshProjects(); }} onProjectCreated={(id) => { setShowNewProjectModal(false); refreshProjects(); handleNavigate("project-detail", id); }} />
      )}
    </div>
  );
}
