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
