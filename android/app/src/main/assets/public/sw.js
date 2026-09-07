// Service Worker for HASEBO POS PWA & Offline Support (Auto-updating)
const CACHE_NAME = 'hasebo-pos-v3.0-' + Date.now();

// Core files to cache immediately for offline support
const CORE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Pre-cache core files for offline support
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_FILES).catch((err) => {
        console.warn('Pre-caching failed:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Network first strategy for API calls to get fresh data
  // Cache first strategy for static assets for offline support
  const isAPI = event.request.url.includes('/api/') || 
                event.request.url.includes('http') || 
                event.request.url.includes('https');

  if (isAPI) {
    // Network first for API calls
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache first for static assets (HTML, CSS, JS, images)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          // Update cache in background
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          });
          return cached;
        }
        // If not in cache, fetch from network
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Return offline page or cached index
          return caches.match('/');
        });
      })
    );
  }
});

