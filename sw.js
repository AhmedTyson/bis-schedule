// BIS Schedule — Service Worker v6
// Strategy: Stale-While-Revalidate for app shell, Network-First for data
const CACHE_NAME = "bis-schedule-v6";

// App shell: modules, CSS, and local assets that form the core application.
// These are cached on install and served from cache immediately.
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./modules/Config.js",
  "./modules/Utils.js",
  "./modules/CustomSelect.js",
  "./modules/DataService.js",
  "./modules/UIManager.js",
  "./modules/FilterManager.js",
  "./modules/DOMUtils.js",
  "./modules/Icons.js",
  "./modules/LiveDashboard.js",
  "./modules/components/ScheduleTable.js",
  "./modules/utils/TimeUtils.js",
  "./modules/utils/ScheduleProcessor.js",
  "./modules/workers/SearchWorker.js",
  "./assets/libs/fuse.esm.js",
  "./css/base/variables.css",
  "./css/base/reset.css",
  "./css/layout/layout.css",
  "./css/components/utilities.css",
  "./css/components/search.css",
  "./css/components/table.css",
  "./css/components/inputs.css",
  "./css/components/tags.css",
  "./css/components/pagination.css",
  "./css/components/buttons.css",
  "./css/components/live-dashboard.css",
];

// ─── INSTALL ─────────────────────────────────────────────
// Pre-cache the app shell so the site works offline immediately.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// ─── ACTIVATE ────────────────────────────────────────────
// Purge old caches from previous versions and take control immediately.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── FETCH ───────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from our origin
  if (request.method !== "GET") return;

  // Skip cross-origin requests (Google Fonts, Font Awesome, etc.)
  // Let the browser handle those with its normal HTTP cache.
  if (url.origin !== self.location.origin) return;

  // JSON data files: Network-First, fall back to cache.
  // Data changes per deploy, so we always try network first.
  if (url.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // App shell (JS, CSS, HTML): Stale-While-Revalidate.
  // Serve cached version instantly, update cache in background.
  event.respondWith(staleWhileRevalidate(request));
});

// ─── STRATEGIES ──────────────────────────────────────────

/**
 * Stale-While-Revalidate:
 * 1. Instantly return cached response (if available)
 * 2. Fetch fresh copy in background and update cache
 * 3. Fall back to network if nothing cached
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Start network fetch in background (non-blocking)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null); // Swallow network errors for offline support

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Network-First:
 * 1. Try network (data must be fresh)
 * 2. If network fails, fall back to cache (offline support)
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    // Network failed (offline) — serve cached data
    const cachedResponse = await cache.match(request);
    return (
      cachedResponse ||
      new Response('{"error":"offline"}', {
        status: 503,
        headers: { "Content-Type": "application/json" },
      })
    );
  }
}
