const CACHE_NAME = 'sdg-shram-v1';
const ASSETS = [
    '/dashboard',
    '/manifest.json',
    '/navbar-common.css',
    '/dashboard.css',
    '/logo/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
