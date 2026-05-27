// 공공데이터포털 실시간 대중교통 — Vercel API 라우트를 통해 호출
// GitHub Pages 배포 시 VITE_API_BASE=https://silvermap.vercel.app 로 설정

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

async function apiFetch(path) {
  const resp = await fetch(`${API_BASE}${path}`)
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return resp.json()
}

// 버스 노선 번호로 가장 가까운 정류장 도착 정보 조회
export async function loadBusArrivalByRoute(routeNo, userLocation) {
  if (!routeNo) return []
  try {
    const params = new URLSearchParams({ routeNo })
    if (userLocation?.lat != null) params.set('lat', userLocation.lat)
    if (userLocation?.lng != null) params.set('lng', userLocation.lng)
    const data = await apiFetch(`/api/bus-arrival?${params}`)
    return data.buses ?? []
  } catch (err) {
    console.warn('[realtimeTransit] 버스 도착정보 오류:', err)
    return []
  }
}

// 지하철 역명으로 실시간 도착 정보 조회
export async function loadSubwayArrival(stationName) {
  if (!stationName) return []
  try {
    const data = await apiFetch(`/api/subway-arrival?stationName=${encodeURIComponent(stationName)}`)
    return data.subways ?? []
  } catch (err) {
    console.warn('[realtimeTransit] 지하철 도착정보 오류:', err)
    return []
  }
}

// (하위 호환) 정류장명 또는 역명으로 버스·지하철 동시 조회
export async function loadRealtimeTransit(_userLocation, query = '') {
  if (!query) return null

  const [busResult, subwayResult] = await Promise.allSettled([
    apiFetch(`/api/bus-arrival?stationName=${encodeURIComponent(query)}`),
    apiFetch(`/api/subway-arrival?stationName=${encodeURIComponent(query)}`),
  ])

  const buses   = busResult.status   === 'fulfilled' ? (busResult.value.buses     ?? []) : []
  const subways = subwayResult.status === 'fulfilled' ? (subwayResult.value.subways ?? []) : []

  if (buses.length === 0 && subways.length === 0) return null
  return { buses, subways }
}
