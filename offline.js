self.addEventListener('fetch', async function (event) {
	event.respondWith(
		caches.match(event.request).then(function (response) {
			return response || fetch(event.request);
		})
	);
});
self.addEventListener('install', function (e) {
	e.waitUntil(
		caches.open('runtime').then(function (cache) {
			return cache.addAll([
				"/",
                "/index.html"
			]);
		})
	);
});