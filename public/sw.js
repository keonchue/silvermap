// 큰지도 서비스워커 — PWA 홈 화면 추가 지원용
const CACHE = 'silvermap-v5'

self.addEventListener('install', (e) => {
  // index.html을 설치 시점에 미리 캐시
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.add('/'))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // 오프라인이어도 설치는 완료
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
  // HTML 페이지(navigate) 요청만 처리
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // 200 OK 응답만 캐시 (404 등 오류 응답은 캐시하지 않음)
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {})
          }
          return res
        })
        .catch(() =>
          // 오프라인 시 캐시된 '/' 반환
          caches.match('/').then((r) => r || Response.error())
        )
    )
  }
  // 그 외(API, 지도SDK 등)는 브라우저가 직접 처리
})
