// 카카오 모빌리티 REST API — 자동차·대중교통 경로
// OSRM 오픈소스 API — 도보 경로

const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY
const hasKey   = () => !!REST_KEY && REST_KEY !== 'YOUR_KAKAO_REST_KEY'

console.log('[routeService] REST_KEY 설정 여부:', hasKey(), '| 앞 6자:', REST_KEY?.slice(0, 6))

function nowDatetime() {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'),
          String(d.getDate()).padStart(2,'0'), String(d.getHours()).padStart(2,'0'),
          String(d.getMinutes()).padStart(2,'0')].join('')
}

// 자동차 경로 — 도로 좌표 배열 반환 (폴백: 직선)
export async function getRoadRoute(from, to) {
  if (hasKey()) {
    try {
      const resp = await fetch(
        `https://apis-navi.kakaomobility.com/v1/directions` +
        `?origin=${from.lng},${from.lat}&destination=${to.lng},${to.lat}&priority=RECOMMEND`,
        { headers: { Authorization: `KakaoAK ${REST_KEY}` } }
      )
      if (resp.ok) {
        const data = await resp.json()
        const roads = data.routes?.[0]?.sections?.[0]?.roads
        if (roads?.length) {
          const pts = []
          for (const road of roads)
            for (let i = 0; i < road.vertexes.length - 1; i += 2)
              pts.push({ lng: road.vertexes[i], lat: road.vertexes[i + 1] })
          return { path: pts, duration: data.routes[0].summary?.duration }
        }
      }
    } catch {}
  }
  return { path: [from, to], duration: null }
}

// 도보 경로 — OSRM 실제 보행 경로 (폴백: 직선)
export async function getWalkRoute(from, to) {
  try {
    const resp = await fetch(
      `https://router.project-osrm.org/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    )
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const route = data.routes?.[0]
    const coords = route?.geometry?.coordinates
    if (!coords?.length) throw new Error('no route')
    return {
      path: coords.map(([lng, lat]) => ({ lng, lat })),
      duration: Math.round(route.duration / 60),
      distance: Math.round(route.distance),
    }
  } catch {}
  return { path: [from, to], duration: null, distance: null }
}

// 대중교통 경로 — legs 배열 반환
export async function getTransitRoute(from, to) {
  if (!hasKey()) return null
  try {
    const resp = await fetch(
      'https://apis-navi.kakaomobility.com/v1/transit/routes',
      {
        method: 'POST',
        headers: { Authorization: `KakaoAK ${REST_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin:      { x: String(from.lng), y: String(from.lat) },
          destination: { x: String(to.lng),   y: String(to.lat) },
          datetime: nowDatetime(),
        }),
      }
    )
    if (!resp.ok) return null
    const data = await resp.json()
    const best = data.routes?.find((r) => r.result_code === 0) ?? data.routes?.[0]
    if (!best) return null
    return {
      duration: Math.round((best.summary?.duration ?? 0) / 60), // 분
      fare:     best.summary?.fare?.payment ?? 0,
      legs: (best.legs ?? []).map((leg) => ({
        mode:      leg.mode,           // 'WALK' | 'BUS' | 'SUBWAY'
        route:     leg.route ?? '',    // 버스 번호 or 호선
        color:     leg.routeColor ? `#${leg.routeColor}` : null,
        distance:  leg.distance ?? 0,
        duration:  Math.round((leg.duration ?? 0) / 60),
        startName: leg.start?.name ?? '',
        endName:   leg.end?.name ?? '',
      })).filter((l) => l.mode !== 'WALK' || l.duration > 0),
    }
  } catch {
    return null
  }
}
