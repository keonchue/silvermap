// 카카오 모빌리티 REST API — 자동차·도보·대중교통 경로

const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY
const hasKey   = () => !!REST_KEY && REST_KEY !== 'YOUR_KAKAO_REST_KEY'

// 카카오 자동차 경로에서 도로 좌표 배열 추출
async function fetchKakaoRoadPath(from, to) {
  const resp = await fetch(
    `https://apis-navi.kakaomobility.com/v1/directions` +
    `?origin=${from.lng},${from.lat}&destination=${to.lng},${to.lat}&priority=RECOMMEND`,
    { headers: { Authorization: `KakaoAK ${REST_KEY}` } }
  )
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  const route = data.routes?.[0]
  const roads = route?.sections?.[0]?.roads
  if (!roads?.length) throw new Error('no roads')
  const pts = []
  for (const road of roads)
    for (let i = 0; i < road.vertexes.length - 1; i += 2)
      pts.push({ lng: road.vertexes[i], lat: road.vertexes[i + 1] })
  return { path: pts, distance: route.summary?.distance ?? 0, carDuration: route.summary?.duration ?? 0 }
}

// 자동차 경로
export async function getRoadRoute(from, to) {
  if (!hasKey()) return { path: [from, to], duration: null }
  try {
    const { path, carDuration } = await fetchKakaoRoadPath(from, to)
    return { path, duration: carDuration }
  } catch {
    return { path: [from, to], duration: null }
  }
}

// 도보 경로 — 카카오 도로 경로를 도보 속도로 재계산 (폴백: 직선)
export async function getWalkRoute(from, to) {
  if (hasKey()) {
    try {
      const { path, distance } = await fetchKakaoRoadPath(from, to)
      return {
        path,
        duration: Math.max(1, Math.round(distance / 67)), // 도보 67m/분
        distance,
      }
    } catch {}
  }
  return { path: [from, to], duration: null, distance: null }
}

// 대중교통 경로 — 카카오 모빌리티 (기업용 API, 미사용 시 거리 기반 추정 반환)
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
          datetime: (() => {
            const d = new Date()
            return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'),
                    String(d.getDate()).padStart(2,'0'), String(d.getHours()).padStart(2,'0'),
                    String(d.getMinutes()).padStart(2,'0')].join('')
          })(),
        }),
      }
    )
    if (!resp.ok) return null
    const data = await resp.json()
    const best = data.routes?.find((r) => r.result_code === 0) ?? data.routes?.[0]
    if (!best) return null
    return {
      duration: Math.round((best.summary?.duration ?? 0) / 60),
      fare:     best.summary?.fare?.payment ?? 0,
      isEstimate: false,
      legs: (best.legs ?? []).map((leg) => ({
        mode:      leg.mode,
        route:     leg.route ?? '',
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

// 거리(m) 기반 대중교통 소요 시간 추정
export function estimateTransit(distanceMeters) {
  const walkMin = Math.max(2, Math.round((distanceMeters * 0.3) / 67))
  const rideMin = Math.max(3, Math.round((distanceMeters * 0.7) / 320))
  return { duration: walkMin + rideMin + 5, fare: 1650, isEstimate: true, legs: [] }
}
