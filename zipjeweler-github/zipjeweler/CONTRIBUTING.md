# Contributing to ZipJeweler

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/zipjeweler.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and add your API keys
5. Start the dev server: `npm run dev`

## Project Structure

```
src/
└── components/
    ├── Dashboard.jsx       ← Main dashboard with tool cards
    ├── ProjectFolder.jsx   ← 8-tab project workspace
    ├── FullProject.jsx     ← Enhanced project view with AI panel
    ├── Products.jsx        ← Product library
    ├── Orders.jsx          ← Order pipeline management
    └── Imagine.jsx         ← AI-powered project creation agent

docs/
├── ARCHITECTURE.md         ← Full production architecture blueprint
└── screenshots/            ← UI screenshots for each screen
```

## Current Status

All components are **UI prototypes** with mock data. The production build roadmap is in `docs/ARCHITECTURE.md`.

## Branch Naming

- `feature/description` — new features
- `fix/description` — bug fixes
- `refactor/description` — code improvements

## Pull Requests

- Keep PRs focused on a single concern
- Include a screenshot if your change affects the UI
- Reference any related issues
