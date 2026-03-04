# ZipJeweler — Production Architecture Blueprint

## What You've Built (Current State)

Six React component prototypes totaling ~4,835 lines of UI code:

- **Dashboard** — Project grid, tool cards, tool modals (Imagine, Convert, Estimate, Gallery)
- **Project Folder** — 8-tab project workspace (Overview, Design, Specs, Materials, Manufacturing, Communication, Documents, Timeline)
- **Full Project** — Enhanced Project Folder with functional AI assistant panel, 5 tool modals, clickable pipeline, live-editable specs
- **Products** — Library view with grid/list toggle, filtering, search, product drawer
- **Orders** — 7-stage order pipeline, order detail drawer with 7 tabs (Overview, Manufacturing, Invoicing, Auth Card, Files, Messages, Timeline)
- **Imagine** — Conversational AI agent that builds project folders through natural dialogue with live field extraction

Everything currently runs as static React with mock data and direct Anthropic API calls from the browser. Here is everything needed to make it real.

---

## 1. Framework & Stack Recommendation

### Frontend: Next.js 14+ (App Router)

**Why Next.js over plain React, Remix, or others:**

- **Server Components** — Your project folders, products, and orders pages are data-heavy. Server Components let you fetch and render data on the server without shipping that logic to the browser. The Specs tab with 30+ fields doesn't need client-side hydration until someone clicks "edit."
- **API Routes** — You need server-side endpoints for Claude API calls, GPT image generation, file uploads, and webhook handlers. Next.js API routes live in the same codebase, no separate Express server needed.
- **File-based routing** — Your pages map cleanly: `/projects`, `/projects/[id]`, `/products`, `/orders`, `/orders/[id]`, `/imagine`. Done.
- **Middleware** — Auth checks, role-based access, and API key protection happen at the edge before any page loads.
- **Vercel deployment** — One-click deploy with automatic preview URLs for every PR, which matters when you're iterating on investor demos.

### Recommended Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14+ (App Router) | Server components, API routes, middleware |
| Language | TypeScript | Your data models are complex — specs have 25+ fields, orders have nested client/payment/shipping objects. Types prevent bugs. |
| Styling | Tailwind CSS | You already have a precise design system. Convert your inline styles to Tailwind config with your exact colors, fonts, and spacing. |
| State Management | Zustand | Lightweight, perfect for project editor state. No Redux boilerplate. |
| Forms | React Hook Form + Zod | The Specifications tab alone has 30+ fields. You need validation. |
| Data Fetching | TanStack Query (React Query) | Caching, optimistic updates, background refetching for real-time order status. |

### Project Structure

```
zipjeweler/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Sidebar + nav (shared)
│   │   ├── page.tsx                ← Dashboard home
│   │   ├── projects/
│   │   │   ├── page.tsx            ← Projects list
│   │   │   └── [id]/
│   │   │       ├── page.tsx        ← Project folder (all 8 tabs)
│   │   │       └── imagine/page.tsx
│   │   ├── products/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx            ← Orders list
│   │   │   └── [id]/page.tsx       ← Order detail
│   │   └── imagine/page.tsx        ← Standalone Imagine
│   └── api/
│       ├── ai/chat/route.ts        ← Claude conversation proxy
│       ├── ai/imagine/route.ts     ← Claude Imagine agent proxy
│       ├── ai/generate-image/route.ts ← GPT image generation proxy
│       ├── projects/route.ts
│       ├── orders/route.ts
│       ├── files/upload/route.ts
│       ├── files/[id]/route.ts
│       ├── auth/[...nextauth]/route.ts
│       └── webhooks/stripe/route.ts
├── components/
│   ├── ui/                         ← Design system (Section, Field, Pill, SmallBtn, etc.)
│   ├── project/                    ← Project-specific (PipelineBar, FileCard, ImageSlot, etc.)
│   ├── orders/                     ← Order-specific (OrderRow, AuthCard, PaymentBar, etc.)
│   └── ai/                         ← AI components (AIPanel, ChatBubble, ToolModal, etc.)
├── lib/
│   ├── db.ts                       ← Database client
│   ├── anthropic.ts                ← Claude API wrapper
│   ├── openai.ts                   ← GPT image wrapper
│   ├── storage.ts                  ← File storage client
│   └── auth.ts                     ← Auth configuration
├── types/
│   ├── project.ts                  ← Project, Specs, Material interfaces
│   ├── order.ts                    ← Order, Client, Payment interfaces
│   └── product.ts                  ← Product interfaces
└── prisma/
    └── schema.prisma               ← Database schema
```

---

## 2. Database & Persistent Data

### Recommended: PostgreSQL + Prisma ORM

**Why Postgres:** Your data is deeply relational. A project has specs, materials, files, messages, timeline events, and belongs to a collection and client. An order references a product, has a client, payment history, and pipeline state. Postgres handles this natively with JSON columns for flexible fields and full-text search for your product/order search bars.

**Why Prisma:** Type-safe database queries that match your TypeScript models. Auto-generates migrations. Works perfectly with Next.js.

**Hosting: Supabase or Neon**

Both offer managed Postgres with generous free tiers. Supabase adds built-in auth, real-time subscriptions (useful for your chat threads), and file storage — which covers three of your needs in one service.

### Core Schema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(JEWELER)
  passwordHash  String
  projects      Project[]
  orders        Order[]
  createdAt     DateTime  @default(now())
}

enum Role {
  ADMIN
  JEWELER
  CAD_DESIGNER
  CLIENT
}

model Project {
  id            String    @id @default(cuid())
  name          String
  sku           String?   @unique
  collection    String?
  status        String    @default("draft")     // draft, in-progress, review, complete
  stage         String    @default("concept")   // concept, design, cad, approval, casting, setting, finishing, delivery
  
  // Specs stored as structured JSON — flexible for different jewelry types
  specs         Json      // { type, metal, metalKarat, finish, size, bandWidth, ... }
  
  // Relationships
  clientId      String?
  client        Client?   @relation(fields: [clientId], references: [id])
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id])
  
  materials     Material[]
  files         ProjectFile[]
  messages      Message[]
  timeline      TimelineEvent[]
  concepts      ConceptImage[]
  
  // Pricing
  materialCost  Float?
  laborCost     Float?
  markupPercent Float?    @default(45)
  retailPrice   Float?
  clientBudget  Float?
  depositPaid   Float?
  
  // Checklist stored as JSON array
  checklist     Json?     // [{ item: "CAD approved", done: true }, ...]
  internalNotes String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Client {
  id        String    @id @default(cuid())
  name      String
  email     String
  phone     String?
  address   String?
  projects  Project[]
  orders    Order[]
  createdAt DateTime  @default(now())
}

model Material {
  id        String  @id @default(cuid())
  projectId String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String
  spec      String?
  quantity  Float
  unit      String
  unitCost  Float
  total     Float
}

model ProjectFile {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  name      String
  type      String   // cad, image, pdf, model, doc, cert
  size      String
  url       String   // Storage URL
  status    String?  // "Current" or null
  createdAt DateTime @default(now())
}

model Order {
  id          String   @id @default(cuid())
  orderNumber String   @unique  // ORD-2026-0041
  productId   String?
  product     Product? @relation(fields: [productId], references: [id])
  projectId   String?  // Link back to source project
  
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  
  // Specs snapshot (frozen at time of order)
  specs       Json
  
  stage       String   @default("confirmed")
  priority    String   @default("standard")
  source      String?
  
  price       Float
  cost        Float?
  deposit     Float
  balance     Float
  paid        Boolean  @default(false)
  
  dueDate     DateTime?
  estShipDate DateTime?
  shipDate    DateTime?
  deliveredAt DateTime?
  tracking    String?
  carrier     String?
  
  notes       String?
  authGenerated Boolean @default(false)
  
  files       OrderFile[]
  messages    OrderMessage[]
  timeline    OrderTimeline[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  name        String
  sku         String   @unique
  collection  String?
  type        String
  metal       String
  weight      String?
  price       Float
  cost        Float?
  status      String   @default("saved")  // saved, production-ready
  specs       Json
  description String?
  
  orders      Order[]
  files       ProductFile[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Messages support channels (cad, client, manufacturer, internal)
model Message {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  channel   String   // cad, client, manufacturer, internal
  from      String?  // null = "me" (current user)
  content   String
  isMe      Boolean  @default(false)
  createdAt DateTime @default(now())
}

model TimelineEvent {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  icon      String
  title     String
  detail    String?
  accent    String?
  createdAt DateTime @default(now())
}
```

### What Gets Saved Where

| Data | Storage | Why |
|------|---------|-----|
| Project specs, status, pipeline stage | Postgres JSON + columns | Queryable + flexible |
| Materials BOM | Postgres rows | Need to calculate totals, sort |
| Messages/chat threads | Postgres rows | Queryable by channel, chronological |
| Timeline events | Postgres rows | Chronological, filterable |
| File metadata | Postgres rows | Need to filter by type, list |
| Actual files (CAD, renders, PDFs) | Object storage (S3/R2) | Binary files don't belong in DB |
| AI conversation history | Postgres JSON | Rebuild context window per session |
| User sessions | JWT + Redis | Fast auth checks |
| Metal market prices | Redis cache (TTL: 1 hour) | External API, changes frequently |

---

## 3. Authentication & User Management

### Recommended: NextAuth.js (Auth.js v5)

Handles login, signup, sessions, and role-based access. Supports email/password, Google OAuth, and magic links.

### User Roles

| Role | Access |
|------|--------|
| Admin | Everything. Manage users, settings, billing. |
| Jeweler | Full project/order/product CRUD. All AI tools. |
| CAD Designer | Assigned projects only. Upload CAD files, respond in CAD chat channel. |
| Client | View their projects/orders. Approve designs. Message in client channel. |

### Implementation

```typescript
// middleware.ts — runs on every request
import { auth } from "@/lib/auth"

export default auth((req) => {
  if (!req.auth && !req.nextUrl.pathname.startsWith("/login")) {
    return Response.redirect(new URL("/login", req.url))
  }
  
  // Role-based route protection
  if (req.nextUrl.pathname.startsWith("/admin") && req.auth?.user.role !== "ADMIN") {
    return Response.redirect(new URL("/", req.url))
  }
})
```

For the investor demo / MVP phase, email + password with NextAuth is sufficient. Add OAuth later.

---

## 4. File Storage

### Recommended: Cloudflare R2 or AWS S3

**Why R2:** Zero egress fees (S3 charges you every time someone downloads a file). For a jewelry workflow with large CAD files (4–12 MB each), renders, and PDFs being downloaded constantly, this saves real money.

### File Types & Sizes

| File Type | Typical Size | Format | Storage Needs |
|-----------|-------------|--------|---------------|
| CAD files | 3–12 MB | .step, .iges, .3dm | Versioned (v1, v2, v3) |
| 3D print files | 5–15 MB | .stl, .obj | Versioned |
| AI renders | 1–3 MB | .png, .jpg | Multiple per project |
| AI concepts | 500 KB – 2 MB | .png | 4+ per project |
| Sketches | 1–5 MB | .png, .jpg | User uploaded |
| Documents | 100–500 KB | .pdf | Invoices, quotes, agreements, auth cards |
| Reference photos | 1–5 MB | .jpg, .png | Client uploaded |

### Upload Flow

```
Browser → Next.js API route → Presigned URL from R2 → Direct upload to R2
                            → Save metadata to Postgres
                            → Add timeline event
```

```typescript
// app/api/files/upload/route.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export async function POST(req: Request) {
  const { filename, contentType, projectId } = await req.json()
  
  const key = `projects/${projectId}/${Date.now()}-${filename}`
  
  const command = new PutObjectCommand({
    Bucket: "zipjeweler-files",
    Key: key,
    ContentType: contentType,
  })
  
  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  
  // Save file record to DB
  const file = await prisma.projectFile.create({
    data: {
      projectId,
      name: filename,
      type: inferFileType(filename),
      size: "Pending",
      url: `https://files.zipjeweler.com/${key}`,
    }
  })
  
  return Response.json({ presignedUrl, fileId: file.id })
}
```

### Version Management

CAD files need version tracking. When uploading a new version of `crown-thorns.step`, the system should mark the new upload as "Current" and remove the status from the old one, keeping all versions accessible.

```typescript
// When uploading a new CAD file
await prisma.$transaction([
  // Remove "Current" from old versions
  prisma.projectFile.updateMany({
    where: { projectId, type: "cad", status: "Current" },
    data: { status: null }
  }),
  // Mark new file as Current
  prisma.projectFile.update({
    where: { id: newFileId },
    data: { status: "Current" }
  })
])
```

---

## 5. Claude API — AI Assistant & Imagine Agent

You need TWO distinct Claude integrations. Both must be server-side (never expose your API key in the browser).

### A. Project AI Assistant (the slide-out panel)

This is the contextual assistant inside each project folder. It knows the project's current state and can suggest updates.

```typescript
// app/api/ai/chat/route.ts
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { messages, projectId } = await req.json()
  
  // Fetch current project data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { materials: true, client: true, files: true }
  })
  
  const systemPrompt = `You are the ZipJeweler AI assistant for the project "${project.name}".
Current specs: ${JSON.stringify(project.specs)}
Materials: ${JSON.stringify(project.materials)}
Stage: ${project.stage}
Client: ${project.client?.name || "No client"}

When the user asks to update fields, respond with JSON:
{ "message": "...", "updates": { "specs.metal": "White Gold" } }
Only include updates when explicitly requested.`

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  
  // Parse updates and apply to DB
  let parsed
  try {
    parsed = JSON.parse(text)
    if (parsed.updates && Object.keys(parsed.updates).length > 0) {
      await applyProjectUpdates(projectId, parsed.updates)
    }
  } catch {
    parsed = { message: text, updates: {} }
  }

  return Response.json(parsed)
}
```

**Model choice:** `claude-sonnet-4-5-20250514` for the project assistant. It's fast enough for conversational responses and cheaper than Opus. The structured JSON extraction works reliably on Sonnet.

**Cost estimate:** ~$0.003–$0.01 per message exchange. At 50 messages/day, roughly $0.15–$0.50/day.

### B. Imagine Agent (the project builder)

This is the standalone conversational agent that builds project folders from scratch. It needs a more detailed system prompt and must create DB records as the conversation progresses.

```typescript
// app/api/ai/imagine/route.ts
export async function POST(req: Request) {
  const { messages, projectId } = await req.json()
  
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250514",
    max_tokens: 1024,
    system: IMAGINE_SYSTEM_PROMPT, // Your existing detailed prompt
    messages: messages,
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = { message: text, extracted: {}, projectReadiness: 0 }
  }

  // If we have a projectId, update it. If not and we have enough data, create one.
  if (projectId && parsed.extracted) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: parsed.extracted.name || undefined,
        specs: mergeSpecs(existingSpecs, parsed.extracted),
      }
    })
  } else if (!projectId && parsed.extracted?.name && parsed.extracted?.type) {
    // Auto-create project when we have minimum viable data
    const project = await prisma.project.create({
      data: {
        name: parsed.extracted.name,
        specs: parsed.extracted,
        status: "draft",
        stage: "concept",
        ownerId: userId,
      }
    })
    parsed.projectId = project.id
  }

  return Response.json(parsed)
}
```

### Anthropic API Costs

| Usage | Model | Input Tokens | Output Tokens | Est. Cost/Call |
|-------|-------|-------------|---------------|----------------|
| Project Assistant | Sonnet 4.5 | ~2,000 | ~500 | ~$0.01 |
| Imagine Agent | Sonnet 4.5 | ~3,000 | ~800 | ~$0.015 |
| Batch spec extraction | Haiku 4.5 | ~1,000 | ~300 | ~$0.001 |

---

## 6. GPT Image API — Image Generation

### Which API: OpenAI gpt-image-1 (via DALL-E)

For the **Sketch to Jewelry**, **AI Render**, and **AI Concept Generation** tools.

You can also use the Images API for the **Marketing Image** tool.

```typescript
// app/api/ai/generate-image/route.ts
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { prompt, projectId, tool, referenceImageBase64 } = await req.json()
  
  // Build prompt based on tool type
  let fullPrompt: string
  
  switch (tool) {
    case "render":
      fullPrompt = `Photorealistic studio photograph of a piece of fine jewelry: ${prompt}. 
        Shot on white background, professional jewelry photography lighting, 
        high detail, no hands, no mannequin, clean background.`
      break
    case "sketch":
      fullPrompt = `Convert this hand-drawn jewelry sketch into a photorealistic 
        jewelry photograph: ${prompt}. Professional studio lighting, white background.`
      break
    case "concept":
      fullPrompt = `Jewelry design concept: ${prompt}. Multiple angles, 
        professional product photography, white background, high detail rendering.`
      break
    case "marketing":
      fullPrompt = `Lifestyle jewelry photography: ${prompt}. 
        Elegant setting, natural lighting, luxury brand aesthetic.`
      break
  }
  
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: fullPrompt,
    n: 1,
    size: "1024x1024",
    quality: "high",
  })
  
  const imageUrl = response.data[0].url
  
  // Download image and upload to R2
  const imageResponse = await fetch(imageUrl)
  const buffer = await imageResponse.arrayBuffer()
  
  const key = `projects/${projectId}/generated/${tool}-${Date.now()}.png`
  await uploadToR2(key, Buffer.from(buffer), "image/png")
  
  // Save to project files
  const file = await prisma.projectFile.create({
    data: {
      projectId,
      name: `${tool}-${Date.now()}.png`,
      type: "image",
      size: `${(buffer.byteLength / 1024).toFixed(0)} KB`,
      url: `https://files.zipjeweler.com/${key}`,
    }
  })
  
  // Add timeline event
  await prisma.timelineEvent.create({
    data: {
      projectId,
      icon: tool === "render" ? "🖼" : tool === "sketch" ? "✏️" : "🤖",
      title: `${tool === "render" ? "Render" : tool === "sketch" ? "Sketch conversion" : "Concept"} generated`,
      detail: `AI-generated from project specifications`,
      accent: "#5A8A4A",
    }
  })
  
  return Response.json({ fileId: file.id, url: file.url })
}
```

### Image Generation Costs

| Tool | Model | Size | Quality | Est. Cost/Image |
|------|-------|------|---------|-----------------|
| AI Render | gpt-image-1 | 1024×1024 | High | ~$0.08 |
| Sketch to Jewelry | gpt-image-1 | 1024×1024 | High | ~$0.08 |
| Concept Generation (4x) | gpt-image-1 | 1024×1024 | Standard | ~$0.16 total |
| Marketing Image | gpt-image-1 | 1024×1536 | High | ~$0.08 |

**Note on Sketch to Jewelry:** If using a reference image (the uploaded sketch), you'd use the edit/inpainting endpoint or include the image as input. The GPT image model supports image inputs for style transfer and editing.

### Alternative: Stability AI or Midjourney API

If you need more photorealistic jewelry renders, Stability AI's SDXL with ControlNet gives better results for "sketch → render" conversion because you can condition on the sketch's edge map. More complex to implement but significantly better output for technical jewelry visualization.

---

## 7. Tool-by-Tool Implementation Requirements

### Tool 1: Imagine (AI Project Builder)

| Component | Implementation |
|-----------|---------------|
| Frontend | Already built. Move API call to server-side. |
| Backend | `POST /api/ai/imagine` — Claude Sonnet with structured JSON output |
| Database | Create project on first meaningful extraction, update on subsequent messages |
| Storage | Save conversation history per session in DB |
| **Status: 85% done** | Just needs server proxy and DB writes |

### Tool 2: Sketch to Jewelry

| Component | Implementation |
|-----------|---------------|
| Frontend | Upload zone + prompt field (already in ToolModal) |
| Backend | `POST /api/ai/generate-image` with `tool: "sketch"` |
| Image Processing | Accept sketch upload → send to GPT image as reference → save result to R2 |
| Database | Save generated image as ProjectFile, add TimelineEvent |
| **Status: 40% done** | UI exists, needs image upload + GPT integration |

### Tool 3: AI Render

| Component | Implementation |
|-----------|---------------|
| Frontend | Prompt field pre-filled with project description (already built) |
| Backend | `POST /api/ai/generate-image` with `tool: "render"` |
| Prompt Engineering | Build detailed prompt from specs: type, metal, stones, finish, design motif |
| Database | Save as ProjectFile, update concept/render counts, add TimelineEvent |
| **Status: 40% done** | UI exists, needs GPT integration + smart prompt building |

### Tool 4: Cost Estimate

| Component | Implementation |
|-----------|---------------|
| Frontend | Show current specs, generate estimate (already in ToolModal) |
| Backend | `POST /api/ai/estimate` — Claude with metal pricing data |
| External API | Gold/silver/platinum spot prices from a metals API (Kitco, GoldAPI.io, or MetalPriceAPI) |
| Logic | Pull current metal prices → send to Claude with project specs → Claude returns structured BOM → update Materials table |
| Database | Update Project.materials, Project.materialCost, Project.laborCost |
| **Status: 30% done** | Needs metal price API + Claude cost calculation + DB write |

```typescript
// Cost estimate specific prompt for Claude
const estimatePrompt = `You are a jewelry cost estimation expert. 
Given these specifications and current metal prices, 
generate a detailed bill of materials.

Specs: ${JSON.stringify(project.specs)}
Current gold spot: $${goldSpot}/oz
Current silver spot: $${silverSpot}/oz
Current platinum spot: $${platinumSpot}/oz

Return JSON:
{
  "materials": [
    { "name": "...", "spec": "...", "qty": 0, "unit": "...", "unitCost": 0, "total": 0 }
  ],
  "subtotal": 0,
  "suggestedRetail": 0,
  "notes": "..."
}`
```

### Tool 5: 3D Model Generation

| Component | Implementation |
|-----------|---------------|
| Frontend | Prompt field (already in ToolModal) |
| Backend | This is the most complex tool |
| Option A | Use an AI 3D generation API (Meshy.ai, Tripo3D, or OpenAI's upcoming 3D) to generate a mesh from the render image |
| Option B | Generate a detailed spec sheet PDF that a CAD designer can work from (more realistic for production jewelry) |
| Option C | Use the AI render as input to a parametric CAD system |
| Database | Save .stl/.obj file to R2, create ProjectFile record |
| **Status: 10% done** | UI shell exists. 3D gen from text/image is still emerging tech. |

**Realistic recommendation:** For MVP, make this tool generate a detailed CAD brief (PDF) with all specifications, reference images, and manufacturing notes that gets sent to a CAD designer. True AI-to-production-CAD for jewelry is not reliable enough yet.

### Tool 6: Marketing Image

| Component | Implementation |
|-----------|---------------|
| Frontend | Upload zone + prompt (already in ToolModal) |
| Backend | `POST /api/ai/generate-image` with `tool: "marketing"` |
| Logic | Take existing product render → GPT image to place in lifestyle/marketing context |
| Database | Save as ProjectFile |
| **Status: 30% done** | Same pattern as AI Render |

### Tool 7: AI Assistant (Project Panel)

| Component | Implementation |
|-----------|---------------|
| Frontend | Already built and functional |
| Backend | `POST /api/ai/chat` — Claude with full project context |
| Database | Apply spec updates from Claude's JSON response, log conversation |
| **Status: 70% done** | Needs server proxy, DB writes for updates, conversation persistence |

### Tool 8: Auth Card Generator

| Component | Implementation |
|-----------|---------------|
| Frontend | Preview card already built in Orders page |
| Backend | Generate PDF from template with project data |
| Library | Use `@react-pdf/renderer` or `puppeteer` to render the auth card component to PDF |
| Database | Save PDF to R2, mark `order.authGenerated = true` |
| **Status: 50% done** | Visual template exists, needs PDF generation |

### Tool 9: Invoice Generator

| Component | Implementation |
|-----------|---------------|
| Frontend | Invoice preview already built in Orders page |
| Backend | Same PDF generation approach as Auth Card |
| Optional | Integrate with Stripe for payment links, QuickBooks for accounting |
| **Status: 50% done** | Visual template exists, needs PDF generation + payment integration |

---

## 8. External APIs & Services

| Service | Purpose | Estimated Cost |
|---------|---------|---------------|
| **Anthropic API** | AI Assistant + Imagine Agent | ~$30–100/month at moderate use |
| **OpenAI API** | Image generation (renders, concepts, marketing) | ~$50–200/month |
| **Gold/Metal Price API** | Real-time metal spot prices for cost estimates | $0–29/month (GoldAPI.io) |
| **Cloudflare R2** | File storage (CAD, images, PDFs) | ~$5–15/month for 10–50 GB |
| **Supabase** | Postgres DB + Auth + Realtime | Free tier → $25/month |
| **Vercel** | Hosting + Edge functions | Free tier → $20/month |
| **Resend or SendGrid** | Transactional email (order updates, invoices) | Free tier → $20/month |
| **Stripe** | Payment processing for deposits/balances | 2.9% + $0.30 per transaction |

**Total estimated monthly cost for MVP: $100–400/month** (scales with usage)

---

## 9. Real-Time Features

Your Communication tab and order pipeline need real-time updates.

### Option A: Supabase Realtime (Recommended for MVP)

```typescript
// Subscribe to project messages
const channel = supabase
  .channel(`project:${projectId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `projectId=eq.${projectId}`
  }, (payload) => {
    addMessage(payload.new)
  })
  .subscribe()
```

### Option B: Pusher or Ably (for scale)

If you outgrow Supabase Realtime, dedicated WebSocket services handle thousands of concurrent connections.

### What Needs Real-Time

| Feature | Why |
|---------|-----|
| Chat messages (all channels) | CAD designers and clients see messages instantly |
| Pipeline stage changes | Order dashboard updates when stage advances |
| File uploads | New CAD file appears in project without refresh |
| AI generation completion | Tool modals update when image/estimate is done |

---

## 10. Deployment & DevOps

### MVP Launch Stack

```
Vercel (Frontend + API routes)
  ↕
Supabase (Postgres + Auth + Realtime + Storage)
  ↕
Cloudflare R2 (Large file storage overflow)
  ↕
Anthropic API + OpenAI API (AI features)
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://app.zipjeweler.com"

# AI
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."

# Storage
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY="..."
R2_SECRET_KEY="..."
R2_BUCKET="zipjeweler-files"

# Email
RESEND_API_KEY="re_..."

# Payments
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Metal Prices
GOLD_API_KEY="..."
```

---

## 11. Migration Path — What to Build First

### Phase 1: Foundation (Week 1–2)

- [ ] Initialize Next.js project with TypeScript + Tailwind
- [ ] Convert design system (your C object + SERIF/SANS/MONO) to Tailwind config
- [ ] Set up Prisma schema + Supabase database
- [ ] Implement NextAuth with email/password
- [ ] Build shared layout (sidebar + nav) as a layout component
- [ ] Port Dashboard page

### Phase 2: Core Data (Week 3–4)

- [ ] Port Project Folder with DB-backed CRUD for all 8 tabs
- [ ] File upload to R2 with presigned URLs
- [ ] Port Products page with real filtering/search against Postgres
- [ ] Port Orders page with real pipeline state management

### Phase 3: AI Integration (Week 5–6)

- [ ] Server-side Claude proxy for AI Assistant
- [ ] Server-side Claude proxy for Imagine agent
- [ ] OpenAI image generation for Render + Concept tools
- [ ] Cost Estimate tool with metal price API + Claude

### Phase 4: Production Features (Week 7–8)

- [ ] PDF generation for invoices + auth cards
- [ ] Email notifications (order updates, messages)
- [ ] Real-time chat via Supabase Realtime
- [ ] Stripe integration for deposits/payments

### Phase 5: Polish (Week 9–10)

- [ ] Client portal (limited access view)
- [ ] CAD designer portal
- [ ] Mobile responsive refinements
- [ ] Performance optimization (image lazy loading, virtualized lists)
- [ ] Error handling + loading states everywhere

---

## 12. What You Can Skip for MVP

- **3D Model Generation** — use the CAD brief PDF approach instead
- **Metal market real-time feed** — hardcode reasonable defaults, add live API later
- **Manufacturer channel** — start with CAD + Client + Internal only
- **Advanced file versioning** — simple "Current" flag is enough
- **Multi-tenant/workspace** — single-user or single-team first
- **Mobile app** — responsive web handles it

---

## Summary

You have 4,835 lines of production-quality UI that maps directly to real features. The design system, component library, and interaction patterns are solid. What you're missing is the data layer, auth, file storage, and server-side AI proxies — all of which are well-understood patterns with clear implementation paths.

The biggest technical risk is the image generation quality for jewelry specifically. Start with GPT image generation, evaluate the results, and consider fine-tuning or switching to Stability AI with jewelry-specific LoRA models if the outputs aren't realistic enough for client presentations.

**Total estimated build time to functional MVP: 8–10 weeks for a solo developer, 4–6 weeks with two.**
