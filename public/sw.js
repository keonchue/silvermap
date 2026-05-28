// 큰지도 서비스워커 — PWA 홈 화면 추가 지원용
const CACHE = 'silvermap-v3'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  // HTML 페이지 요청(앱 열기)만 처리: 오프라인 시 캐시된 index.html 반환
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          // 성공하면 캐시에 저장해두기
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/index.html'))
    )
  }
  // 그 외(API, 지도SDK 등)는 브라우저가 직접 처리
})
