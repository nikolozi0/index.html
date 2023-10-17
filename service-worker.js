
// service-worker.js
self.addEventListener("install", e => {
  e.waitUntil(caches.open("static".then(cache => {
      return cache.addAll(["./", "./icon.png", "./style.css", "./script.js", "./index.html"])

      })
      ));
  }
);

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
