# <img src="https://api.iconify.design/lucide:calendar.svg?color=%238A2BE2" width="32" height="32" align="center" /> BIS Schedule Search

> **Bilingual (Arabic/English) schedule search web app for BIS Level 3 students.**
> Lightning-fast, offline-capable, and precision-engineered for mobile-first academic navigation.

<div align="center">

| Project Status | Core Technology                                                                                                   | Deployment                                                                                             | Reliability                                                             |
| :------------- | :---------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| `ACTIVE`       | ![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black) | ![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white) | ![PWA](https://img.shields.io/badge/PWA-Ready-8A2BE2?style=flat-square) |

</div>

---

## <img src="https://api.iconify.design/lucide:list.svg?color=%238A2BE2" width="20" height="20" align="center" /> Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Performance](#-performance-optimizations)
- [Getting Started](#-getting-started)

---

## Overview

BIS Schedule Search solves a real problem: navigating a large, static semester schedule PDF. The app replaces the PDF entirely with an instant, searchable, filterable web interface that works in both Arabic and English.

Built with **zero build tooling** — no Webpack, no Vite, no Babel. The architecture relies entirely on native browser ES Modules, making development frictionless and bundle size zero. A Web Worker handles all search computation off the main thread, keeping the UI at 60fps even on mobile devices.

---

---

## <img src="https://api.iconify.design/lucide:sparkles.svg?color=%238A2BE2" width="20" height="20" align="center" /> Features

| Feature               | Description                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| **Bilingual Search**  | Query by doctor name in either Arabic or English — both supported simultaneously |
| **Fuzzy Search**      | Powered by Fuse.js for typo-tolerant, intelligent matching                       |
| **Advanced Filters**  | Filter by Subject, Group, Doctor, Day, and Time — independently or combined      |
| **Live Dashboard**    | Real-time view highlighting current and upcoming active schedule slots           |
| **Off-Thread Search** | Fuse.js runs inside a Web Worker — UI never blocks during search                 |
| **Dark Mode Native**  | Sleek dark aesthetic designed for reduced eye strain                             |
| **One-Tap Copy**      | Copy attendance codes and section info instantly to clipboard                    |
| **Admin Reset Panel** | `admin-reset.html` for clearing cached state and refreshing data                 |
| **PWA Support**       | Service Worker registered for offline capability                                 |

---

---

## <img src="https://api.iconify.design/lucide:cpu.svg?color=%238A2BE2" width="20" height="20" align="center" /> Tech Stack

| Layer              | Technology                                       |
| ------------------ | ------------------------------------------------ |
| **Language**       | JavaScript (Vanilla ES6 Modules)                 |
| **Search Library** | [Fuse.js](https://www.fusejs.io/) (fuzzy search) |
| **Threading**      | Web Workers API (off-main-thread search)         |
| **Data**           | Local `schedule-data.json`                       |
| **Deployment**     | Netlify (`netlify.toml` pre-configured)          |
| **PWA**            | Service Worker (`sw.js`)                         |

---

---

## <img src="https://api.iconify.design/lucide:git-pull-request.svg?color=%238A2BE2" width="20" height="20" align="center" /> Architecture

**Philosophy: The "No Build Step" Approach**

```
index.html  →  app.js (Entry Point)
                   ↓
         ┌─────────────────────┐
         │      DataService    │──── spawns ──→ SearchWorker.js (Web Worker)
         │  (fetch + cache)    │                  ↓ Fuse.js search
         └─────────────────────┘                  ↓ returns results
                   ↓
         ┌─────────────────────┐
         │    FilterManager    │  ← maintains active filter state
         └─────────────────────┘
                   ↓
         ┌─────────────────────┐
         │     UIManager       │  ← DOM rendering, event listeners
         └─────────────────────┘
                   ↓
         ┌─────────────────────┐
         │   ScheduleTable.js  │  ← Renders result rows with bilingual cells
         └─────────────────────┘
```

### Module Responsibilities

| Module             | Role                                                  |
| ------------------ | ----------------------------------------------------- |
| `app.js`           | Composition root — initializes and wires all modules  |
| `DataService.js`   | Fetches JSON data, spawns Worker, manages caching     |
| `FilterManager.js` | Pure state machine for active filter combinations     |
| `UIManager.js`     | All DOM manipulation and event binding                |
| `ScheduleTable.js` | Bilingual stacked-cell table rendering                |
| `SearchWorker.js`  | Runs Fuse.js search entirely off the main thread      |
| `LiveDashboard.js` | Computes and displays currently active schedule slots |
| `CustomSelect.js`  | Accessible, styled dropdown component                 |

---

---

## <img src="https://api.iconify.design/lucide:folder-tree.svg?color=%238A2BE2" width="20" height="20" align="center" /> Project Structure

```
bis-schedule/
├── index.html                     # Main application shell
├── admin-reset.html               # Admin panel for cache/state reset
├── app.js                         # Composition root
├── schedule-data.json             # Raw schedule dataset (JSON)
├── sw.js                          # Service Worker (PWA)
├── netlify.toml                   # Netlify deployment configuration
├── preview.png                    # Social sharing preview image
│
├── modules/                       # ES6 module layer
│   ├── App.js
│   ├── DataService.js
│   ├── FilterManager.js
│   ├── UIManager.js
│   ├── LiveDashboard.js
│   ├── CustomSelect.js
│   ├── DOMUtils.js
│   ├── Icons.js
│   ├── Utils.js
│   │
│   ├── components/
│   │   └── ScheduleTable.js       # Bilingual table renderer
│   │
│   ├── utils/
│   │   ├── ScheduleProcessor.js
│   │   └── TimeUtils.js
│   │
│   └── workers/
│       └── SearchWorker.js        # Off-thread Fuse.js search
│
├── css/                           # Modular CSS architecture
│   ├── base/
│   │   ├── reset.css
│   │   └── variables.css
│   └── components/
│       ├── buttons.css
│       ├── inputs.css
│       ├── table.css
│       ├── search.css
│       ├── pagination.css
│       ├── tags.css
│       ├── live-dashboard.css
│       └── utilities.css
│
├── assets/                        # Media and third-party libraries
│   ├── libs/fuse.esm.js           # Fuse.js (local, no CDN dependency)
│   └── meme-friday-[1-5].webp     # Weekly meme assets
│
└── scripts/                       # Dev utilities
    ├── test-schedule.mjs
    └── verify-project.js
```

---

---

## <img src="https://api.iconify.design/lucide:zap.svg?color=%238A2BE2" width="20" height="20" align="center" /> Performance Optimizations

| Optimization                 | Impact                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| **Off-Main-Thread Search**   | Web Worker keeps UI at 60fps during search                  |
| **Debounced Inputs**         | Prevents redundant search on rapid keystrokes               |
| **Local Fuse.js**            | No CDN dependency — zero network request for search library |
| **CSS `content-visibility`** | Off-screen table rows skipped during paint                  |
| **No Build Overhead**        | Zero bundle time — browser loads only what it needs         |

---

---

## <img src="https://api.iconify.design/lucide:rocket.svg?color=%238A2BE2" width="20" height="20" align="center" /> Getting Started

```bash
# Clone the repository
git clone https://github.com/AhmedTyson/bis-schedule.git

cd bis-schedule

# Serve locally (ES Modules require HTTP — cannot open as file://)
python -m http.server 8000
# OR
npx serve .
```

Open `http://localhost:8000` in your browser.

---

---

## <img src="https://api.iconify.design/lucide:globe.svg?color=%238A2BE2" width="20" height="20" align="center" /> Deployment

The project is pre-configured for Netlify:

```toml
# netlify.toml handles:
# - Cache-Control headers (aggressive no-cache for JS/JSON)
# - SPA redirects
# - Security headers
```

To deploy: connect this repository to Netlify — no build command needed.
