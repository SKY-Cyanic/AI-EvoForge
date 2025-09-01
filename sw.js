// Service Worker for EvoForge
const CACHE_NAME = 'evoforge-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/main.js',
  '/js/simulation.js',
  '/js/renderer.js',
  '/js/environment.js',
  '/js/entity.js',
  '/js/genome.js',
  '/js/agents.js',
  '/js/ui.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});