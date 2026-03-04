/**
 * Project Storage Layer
 *
 * Provides persistent storage for ZipJeweler projects:
 * - Project metadata, fields, and chat history → localStorage
 * - File blobs (uploads, generated images) → IndexedDB
 *
 * Architecture is modular — swap localStorage/IndexedDB for a real
 * database later by changing only this file.
 */

// ─── FILE CATEGORIES ───
// Files are auto-sorted into these categories based on extension and context.
export const FILE_CATEGORIES = {
  reference: { label: "Reference Images", icon: "🖼️", tab: "design", extensions: [] },
  sketch:    { label: "Sketches",         icon: "✏️", tab: "design", extensions: [] },
  render:    { label: "AI Renders",       icon: "🎨", tab: "design", extensions: [] },
  cad:       { label: "CAD Files",        icon: "📐", tab: "manufacturing", extensions: [".step", ".stp", ".iges", ".igs", ".dwg", ".dxf"] },
  model3d:   { label: "3D Models",        icon: "🧊", tab: "manufacturing", extensions: [".stl", ".obj", ".fbx", ".3dm", ".blend"] },
  document:  { label: "Documents",        icon: "📄", tab: "documents", extensions: [".pdf", ".doc", ".docx", ".txt", ".rtf", ".xls", ".xlsx", ".csv"] },
  marketing: { label: "Marketing",        icon: "📸", tab: "design", extensions: [] },
  certificate: { label: "Certificates",   icon: "📋", tab: "documents", extensions: [] },
  other:     { label: "Other Files",      icon: "📎", tab: "documents", extensions: [] },
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".tiff"];

/**
 * Determine the category for a file based on its extension and upload context.
 *
 * @param {string} filename - The file name
 * @param {string} [source] - Context hint: "reference", "sketch", "render",
 *   "marketing", "cad", "3d", "certificate", "imagine-sketch", "imagine-render",
 *   "tool-sketch", "tool-technical", "tool-marketing"
 * @returns {string} One of the FILE_CATEGORIES keys
 */
export function categorizeFile(filename, source = "") {
  const ext = (filename.lastIndexOf(".") !== -1
    ? filename.slice(filename.lastIndexOf(".")).toLowerCase()
    : "").toLowerCase();

  // Explicit source hints take priority
  const sourceMap = {
    "reference": "reference",
    "sketch": "sketch",
    "render": "render",
    "marketing": "marketing",
    "cad": "cad",
    "3d": "model3d",
    "certificate": "certificate",
    "imagine-sketch": "sketch",
    "imagine-render": "render",
    "tool-sketch": "render",
    "tool-technical": "render",
    "tool-marketing": "marketing",
  };
  if (sourceMap[source]) return sourceMap[source];

  // Extension-based categorization
  for (const [cat, info] of Object.entries(FILE_CATEGORIES)) {
    if (info.extensions.some((e) => ext === e)) return cat;
  }

  // Image files default to "reference"
  if (IMAGE_EXTENSIONS.includes(ext)) return "reference";

  return "other";
}

/**
 * Generate a clean storage-friendly filename.
 * Format: {projectName}_{category}_{timestamp}.{ext}
 */
export function generateStorageName(originalName, projectName, category) {
  const ext = originalName.lastIndexOf(".") !== -1
    ? originalName.slice(originalName.lastIndexOf("."))
    : "";
  const slug = (projectName || "untitled")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 30);
  const ts = Date.now().toString(36);
  return `${slug}_${category}_${ts}${ext}`;
}

// ─── ID GENERATION ───
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ═══════════════════════════════════════
// PROJECT STORAGE (localStorage)
// ═══════════════════════════════════════

const PROJECTS_KEY = "zipjeweler_projects";

function readProjects() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "{}");
  } catch { return {}; }
}

function writeProjects(projects) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

/**
 * Create a new empty project and return it.
 */
export function createProject({ name, type, fields = {}, chatHistory = [] } = {}) {
  const id = genId();
  const now = new Date().toISOString();
  const project = {
    id,
    name: name || "Untitled Project",
    type: type || null,
    status: "draft",
    stage: "concept",
    fields: { ...fields },
    chatHistory: [...chatHistory],
    files: [],             // Array of file metadata (not blobs)
    generatedImages: [],   // URLs from AI generation
    readiness: 0,
    createdAt: now,
    updatedAt: now,
  };
  const all = readProjects();
  all[id] = project;
  writeProjects(all);
  return project;
}

/**
 * Get all projects as an array, sorted by updatedAt desc.
 */
export function getProjects() {
  const all = readProjects();
  return Object.values(all).sort((a, b) =>
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

/**
 * Get a single project by ID.
 */
export function getProject(id) {
  return readProjects()[id] || null;
}

/**
 * Update a project (partial merge). Returns the updated project.
 */
export function updateProject(id, updates) {
  const all = readProjects();
  if (!all[id]) return null;
  all[id] = {
    ...all[id],
    ...updates,
    fields: updates.fields
      ? { ...all[id].fields, ...updates.fields }
      : all[id].fields,
    updatedAt: new Date().toISOString(),
  };
  writeProjects(all);
  return all[id];
}

/**
 * Delete a project and its files from IndexedDB.
 */
export function deleteProject(id) {
  const all = readProjects();
  const project = all[id];
  if (project) {
    // Clean up IndexedDB file blobs
    project.files.forEach((f) => {
      if (f.blobKey) deleteFileBlob(f.blobKey);
    });
  }
  delete all[id];
  writeProjects(all);
}

// ─── File metadata operations (within a project) ───

/**
 * Add a file record to a project. Returns the file metadata object.
 *
 * @param {string} projectId
 * @param {object} fileInfo
 * @param {string} fileInfo.name - Original filename
 * @param {string} [fileInfo.url] - External URL (for generated images)
 * @param {string} [fileInfo.blobKey] - IndexedDB key (for uploaded files)
 * @param {string} [fileInfo.source] - Upload context for auto-categorization
 * @param {number} [fileInfo.size] - File size in bytes
 * @param {string} [fileInfo.mimeType] - MIME type
 * @param {string} [fileInfo.category] - Override auto-categorization
 * @returns {object|null} The file metadata, or null if project not found
 */
export function addFileToProject(projectId, fileInfo) {
  const all = readProjects();
  const project = all[projectId];
  if (!project) return null;

  const category = fileInfo.category || categorizeFile(fileInfo.name, fileInfo.source);
  const storageName = generateStorageName(fileInfo.name, project.name, category);

  const fileMeta = {
    id: genId(),
    name: fileInfo.name,
    storageName,
    url: fileInfo.url || null,
    blobKey: fileInfo.blobKey || null,
    category,
    size: fileInfo.size || 0,
    mimeType: fileInfo.mimeType || "",
    source: fileInfo.source || "manual",
    addedAt: new Date().toISOString(),
  };

  project.files.push(fileMeta);
  project.updatedAt = new Date().toISOString();
  writeProjects(all);
  return fileMeta;
}

/**
 * Remove a file from a project.
 */
export function removeFileFromProject(projectId, fileId) {
  const all = readProjects();
  const project = all[projectId];
  if (!project) return;
  const file = project.files.find((f) => f.id === fileId);
  if (file?.blobKey) deleteFileBlob(file.blobKey);
  project.files = project.files.filter((f) => f.id !== fileId);
  project.updatedAt = new Date().toISOString();
  writeProjects(all);
}

/**
 * Get files for a project, optionally filtered by category.
 */
export function getProjectFiles(projectId, category = null) {
  const project = getProject(projectId);
  if (!project) return [];
  if (category) return project.files.filter((f) => f.category === category);
  return project.files;
}

/**
 * Get files grouped by category.
 */
export function getProjectFilesByCategory(projectId) {
  const files = getProjectFiles(projectId);
  const grouped = {};
  for (const cat of Object.keys(FILE_CATEGORIES)) {
    grouped[cat] = files.filter((f) => f.category === cat);
  }
  return grouped;
}

// ─── Chat history operations ───

export function saveChatHistory(projectId, messages) {
  return updateProject(projectId, { chatHistory: messages });
}

export function getChatHistory(projectId) {
  const project = getProject(projectId);
  return project?.chatHistory || [];
}

// ═══════════════════════════════════════
// FILE BLOB STORAGE (IndexedDB)
// ═══════════════════════════════════════

const DB_NAME = "zipjeweler_files";
const DB_VERSION = 1;
const STORE_NAME = "blobs";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Store a file blob in IndexedDB. Returns the key.
 */
export async function storeFileBlob(file) {
  const key = genId();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, key);
    tx.oncomplete = () => resolve(key);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve a file blob from IndexedDB.
 */
export async function getFileBlob(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a file blob from IndexedDB.
 */
export async function deleteFileBlob(key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* ignore cleanup errors */ }
}

/**
 * Create an object URL for a stored blob (for rendering in <img>).
 * Caller should revoke the URL when done with URL.revokeObjectURL().
 */
export async function getFileBlobURL(key) {
  const blob = await getFileBlob(key);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

// ═══════════════════════════════════════
// CONVENIENCE: Upload file to a project
// ═══════════════════════════════════════

/**
 * Upload a File object to a project: stores the blob in IndexedDB
 * and adds metadata to the project.
 *
 * @param {string} projectId
 * @param {File} file - Browser File object
 * @param {string} [source] - Upload context hint
 * @returns {Promise<object>} The file metadata record
 */
export async function uploadFileToProject(projectId, file, source = "manual") {
  const blobKey = await storeFileBlob(file);
  const meta = addFileToProject(projectId, {
    name: file.name,
    blobKey,
    size: file.size,
    mimeType: file.type,
    source,
  });
  return meta;
}

/**
 * Save a generated image (by URL) to a project.
 *
 * @param {string} projectId
 * @param {string} url - The image URL (e.g. from Higgsfield)
 * @param {string} [source] - Context: "imagine-sketch", "imagine-render", "tool-sketch", etc.
 * @param {string} [promptUsed] - The prompt that generated this image
 * @returns {object|null}
 */
export function saveGeneratedImageToProject(projectId, url, source = "render", promptUsed = "") {
  const ext = ".png";
  const name = `generated_${source}_${Date.now().toString(36)}${ext}`;
  const meta = addFileToProject(projectId, {
    name,
    url,
    source,
    mimeType: "image/png",
  });

  // Also add to generatedImages array for quick access
  const project = getProject(projectId);
  if (project) {
    updateProject(projectId, {
      generatedImages: [...(project.generatedImages || []), { url, source, promptUsed, addedAt: new Date().toISOString() }],
    });
  }

  return meta;
}
