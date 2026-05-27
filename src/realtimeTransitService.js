// 공공데이터포털 실시간 대중교통 — Vercel API 라우트를 통해 호출
// GitHub Pages 배포 시 VITE_API_BASE=https://silvermap.vercel.app 로 설정

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

async function apiFetch(path) {
  const resp = await fetch(`${API_BASE}${path}`)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

// query: 정류장명 or 역명으로 버스·지하철 도착정보 조회
// 반환: { buses, subways } — 둘 다 빈 배열이면 null 반환해 Kakao 폴백 트리거
export async function loadRealtimeTransit(_userLocation, query = '') {
  if (!query) return null

  const [busResult, subwayResult] = await Promise.allSettled([
    apiFetch(`/api/bus-arrival?stationName=${encodeURIComponent(query)}`),
    apiFetch(`/api/subway-arrival?stationName=${encodeURIComponent(query)}`),
  ])

  const buses   = busResult.status   === 'fulfilled' ? (busResult.value.buses     ?? []) : []
  const subways = subwayResult.status === 'fulfilled' ? (subwayResult.value.subways ?? []) : []

  // 양쪽 다 빈 경우 (키 미설정 or 검색 결과 없음) → null로 Kakao 폴백
  if (buses.length === 0 && subways.length === 0) return null

  return { buses, subways }
}

// 버스 노선번호로 노선 정보 검색
export async function searchBusRoutes(routeNo) {
  try {
    const data = await apiFetch(`/api/bus-routes?routeNo=${encodeURIComponent(routeNo)}`)
    return data.routes ?? []
  } catch {
    return []
  }
}
