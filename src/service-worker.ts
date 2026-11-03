/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

// The version changes on every build, so a new deploy gets a new cache and the old one is deleted.
const CACHE = `subnote-${version}`;
const ASSETS = [...build, ...files, ...prerendered];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET' || new URL(request.url).origin !== sw.location.origin) return;

	event.respondWith(
		caches.open(CACHE).then(async (cache) => {
			// Pages go to the network first so the visit after a deploy shows the new build;
			// the cache answers when offline. Hashed assets never change, so they stay cache-first.
			if (request.mode === 'navigate') {
				try {
					return await fetch(request, { cache: 'no-cache' });
				} catch (error) {
					const cached =
						(await cache.match(request, { ignoreSearch: true })) ?? (await cache.match('/'));
					if (cached) return cached;
					throw error;
				}
			}
			return (await cache.match(request)) ?? fetch(request);
		})
	);
});
