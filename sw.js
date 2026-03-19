'use strict';
const CACHE_NAME = 'byk-cache-v2';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/404.html',
  '/byk-logo.png',
  '/byk-logo.webp',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if(event.request.mode === 'navigate'){
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then(cache => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      if(response) return response;
      return fetch(event.request).then(fetchResponse => {
        if(!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return fetchResponse;
      });
    }).catch(() => {
      return caches.match(OFFLINE_URL);
    })
  );
});
