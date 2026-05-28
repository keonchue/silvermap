// 큰지도 서비스워커 — PWA 홈 화면 추가 지원용
const CACHE = 'silvermap-v6'

function getBase() {
  return new URL(self.registration.scope).pathname  // '/' or '/silvermap/'
}

self.addEventListener('install', (e) => {
  const base = getBase()
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.add(base))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    const base = getBase()
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(base, copy)).catch(() => {})
          }
          return res
        })
        .catch(() =>
          caches.match(base).then((r) => r || Response.error())
        )
    )
  }
})
