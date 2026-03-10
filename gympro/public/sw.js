// v1.0.2 - Force update 2026-03-10
// Minimal Service Worker required for PWA installability
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass-through fetch (can be extended for offline support later)
    event.respondWith(fetch(event.request));
});
