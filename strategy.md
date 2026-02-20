This is a great goal. Since you are constrained to **Vanilla JS with No Build Step**, we cannot rely on bundlers like Webpack to tree-shake or minify code automatically. We must use **native browser APIs** to achieve high performance.

To hit 100/100 on Lighthouse, we need to target three specific metrics:

1. **LCP (Largest Contentful Paint):** How fast the main content (Schedule Table) appears.
2. **TBT (Total Blocking Time):** How long the main thread is frozen (often caused by `Fuse.js` searching).
3. **CLS (Cumulative Layout Shift):** Preventing the layout from jumping when data loads.

Here is the **"Vanilla Performance Strategy"** tailored to your `AI_CONTEXT.md`.

---

### Strategy 1: Move `Fuse.js` to a Web Worker (Critical for Mobile)

**Problem:** `Fuse.js` searching a large JSON file on the main thread freezes the UI, killing your **Interaction to Next Paint (INP)** score on mobile.
**Solution:** Move the search logic to a background thread.

**Action:** Create `modules/workers/SearchWorker.js`.

```javascript
// modules/workers/SearchWorker.js
import Fuse from '../../libs/fuse.esm.js'; // Adjust path to your local Fuse module

let fuse;

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    if (type === 'INIT') {
        // Initialize Fuse with data passed from main thread
        const { data, options } = payload;
        fuse = new Fuse(data, options);
        self.postMessage({ type: 'READY' });
    } else if (type === 'SEARCH') {
        if (!fuse) return;
        // Run search off-main-thread
        const results = fuse.search(payload.query);
        // Map results back to original items to save main thread processing
        const items = results.map(r => r.item);
        self.postMessage({ type: 'RESULTS', payload: items });
    }
};

```

**Integration:** Update your `DataService.js` to communicate with this worker instead of running Fuse directly.

---

### Strategy 2: Optimize the Critical Rendering Path (LCP)

**Problem:** The browser waits to download the JSON, *then* parses it, *then* renders.
**Solution:** Use **Resource Hints** to tell the browser to fetch the JSON immediately, even before the JS runs.

**Action:** Update your `index.html` `<head>`.

```html
<head>
    <link rel="preload" href="/data/schedule-data.json" as="fetch" crossorigin>

    <link rel="modulepreload" href="/modules/workers/SearchWorker.js">

    <link rel="stylesheet" href="/css/critical.css"> <link rel="stylesheet" href="/css/styles.css" media="print" onload="this.media='all'">
</head>

```

---

### Strategy 3: CSS "Content Visibility" (Rendering Performance)

**Problem:** The browser tries to render the entire schedule table (which might be huge) at once, even rows that are off-screen.
**Solution:** Use the modern CSS property `content-visibility: auto`. This is "lazy loading" for HTML elements, managed entirely by the browser.

**Action:** Update your `css/components/schedule-table.css`.

```css
.schedule-row {
    /* Tells the browser: "Don't calculate layout for this until it's near the viewport" */
    content-visibility: auto;
    
    /* CRITICAL: You must estimate the height, or the scrollbar will jump (CLS penalty) */
    contain-intrinsic-size: 0 60px; /* Assuming a row is roughly 60px tall */
}

```

---

### Strategy 4: Zero-Shift Skeleton Loading (CLS)

**Problem:** The table container is empty (height: 0) while data loads, then snaps open to height: 1000px. This ruins your CLS score.
**Solution:** Hard-code the minimum height of the container in CSS so the layout is reserved before data arrives.

**Action:** Update `css/layout.css`.

```css
#schedule-container {
    min-height: 80vh; /* Reserve space immediately */
    background: var(--bg-color);
    transition: opacity 0.3s ease;
}

/* Add a loading state class */
#schedule-container.loading {
    opacity: 0.6;
    pointer-events: none; /* Prevent clicks while loading */
}

```

---

### Strategy 5: Service Worker for Instant Load (The "App-Like" Feel)

**Problem:** Mobile networks in Egypt (or anywhere) can be flaky. Repeated visits should be instant.
**Solution:** Cache the App Shell and JSON data.

**Action:** Create `sw.js` in your root.

```javascript
// sw.js
const CACHE_NAME = 'schedule-app-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/base.css',
    '/modules/App.js',
    '/data/schedule-data.json',
    '/libs/fuse.esm.js' // Ensure this matches your path
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cached) => {
            // Return cached response OR fetch from network
            return cached || fetch(e.request);
        })
    );
});

```

**Register it in `index.html`:**

```html
<script>
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js');
    }
</script>

```

---

### Execution Plan

Which of these would you like to implement first?

1. **The Worker (Refactoring `DataService.js`)** - Best for fixing "laggy" search.
2. **The Service Worker** - Best for "offline" and instant repeat loads.
3. **Visual Stability (CSS)** - Quickest fix for Layout Shift scores.