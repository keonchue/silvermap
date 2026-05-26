// 카카오 모빌리티 대중교통 경로 API로 실제 버스·지하철 노선을 가져온다.
// REST 키가 없으면 Kakao Places 폴백(정류장 이름만, 시뮬레이션 시간).

import { searchByKeyword, distanceMeters } from './placesService.js'

const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY
const TRANSIT_URL = 'https://apis-navi.kakaomobility.com/v1/transit/routes'

// 사용자 위치에서 이 방향으로 경로를 탐색해 주변 노선을 추출한다
const PROBE_DESTS = [
  { lng: 126.9784, lat: 37.5666 },  // 서울시청
  { lng: 127.0276, lat: 37.4981 },  // 강남역
  { lng: 126.9236, lat: 37.5547 },  // 홍대입구
]

function nowDatetime() {
  const d = new Date()
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
  ].join('')
}

async function fetchTransitRoute(origin, dest) {
  const resp = await fetch(TRANSIT_URL, {
    method: 'POST',
    headers: {
      Authorization: `KakaoAK ${REST_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin:      { x: String(origin.lng), y: String(origin.lat) },
      destination: { x: String(dest.lng),   y: String(dest.lat)   },
      datetime: nowDatetime(),
    }),
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

export async function loadTransitOptions(userLocation, query = '') {
  if (!userLocation) return { buses: [], subways: [] }

  // ── REST 키 있으면 실제 API ──────────────────────────────
  if (REST_KEY && REST_KEY !== 'YOUR_KAKAO_REST_KEY') {
    try {
      const results = await Promise.allSettled(
        PROBE_DESTS.map((dest) => fetchTransitRoute(userLocation, dest))
      )

      const seenBus    = new Set()
      const seenSubway = new Set()
      const buses      = []
      const subways    = []

      results.forEach((r) => {
        if (r.status !== 'fulfilled') return
        r.value.routes?.forEach((route) => {
          route.legs?.forEach((leg) => {
            if (leg.mode === 'BUS') {
              const key = leg.route
              if (key && !seenBus.has(key)) {
                seenBus.add(key)
                buses.push({
                  id: `bus-${key}`,
                  route: key,
                  dest: leg.end?.name ?? '종점',
                  startStop: leg.start?.name ?? '',
                  // 출발까지 대기 시간 추정 (배차 간격 기반 시뮬레이션)
                  eta: Math.max(1, Math.floor(Math.random() * 8) + 1),
                  routeColor: leg.routeColor ? `#${leg.routeColor}` : '#0052a4',
                })
              }
            } else if (leg.mode === 'SUBWAY') {
              const key = `${leg.route}-${leg.end?.name}`
              if (leg.route && !seenSubway.has(key)) {
                seenSubway.add(key)
                subways.push({
                  id: `subway-${key}`,
                  name: leg.route,
                  dest: leg.end?.name ?? '종점',
                  startStop: leg.start?.name ?? '',
                  eta: Math.max(1, Math.floor(Math.random() * 6) + 1),
                  lineColor: leg.routeColor ? `#${leg.routeColor}` : '#00a84d',
                })
              }
            }
          })
        })
      })

      // query 필터
      const filterQ = (item) =>
        !query ||
        item.route?.includes(query) ||
        item.name?.includes(query) ||
        item.dest?.includes(query) ||
        item.startStop?.includes(query)

      return {
        buses:   buses.filter(filterQ).slice(0, 10),
        subways: subways.filter(filterQ).slice(0, 8),
      }
    } catch (err) {
      console.warn('[transit] API 오류, 폴백 사용:', err)
    }
  }

  // ── 폴백: Kakao Places로 정류장 이름만 ──────────────────
  try {
    const busKeyword    = query ? `버스정류장 ${query}` : '버스정류장'
    const subwayKeyword = query ? `지하철역 ${query}`   : '지하철역'
    const [busStops, stations] = await Promise.all([
      searchByKeyword(busKeyword, userLocation),
      searchByKeyword(subwayKeyword, userLocation),
    ])
    return {
      buses: busStops.slice(0, 8).map((s, i) => ({
        id: s.id, route: '?', dest: s.name,
        startStop: s.address, eta: 2 + i * 2,
        routeColor: '#0052a4',
        distanceM: userLocation ? Math.round(distanceMeters(userLocation, s)) : null,
      })),
      subways: stations.slice(0, 6).map((s, i) => ({
        id: s.id, name: s.name, dest: '',
        startStop: s.address, eta: 3 + i * 3,
        lineColor: '#00a84d',
        distanceM: userLocation ? Math.round(distanceMeters(userLocation, s)) : null,
      })),
    }
  } catch {
    return { buses: [], subways: [] }
  }
}
