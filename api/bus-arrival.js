// Vercel 서버리스 함수 — 서울 버스 도착정보
// ?routeNo=273&lat=37.5&lng=127.0  → 버스 노선 번호로 검색 (사용자 위치에서 가장 가까운 정류장)
// 환경 변수: TOPIS_KEY (data.go.kr 서울버스도착정보조회서비스 키)

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const RAW_KEY = process.env.TOPIS_KEY || process.env.SEOUL_API_KEY || process.env.DATA_GO_KR_KEY
  const KEY = encodeURIComponent(RAW_KEY ?? '')

  if (!RAW_KEY) return res.status(500).json({ error: 'API 키 미설정', buses: [] })

  const { routeNo, lat, lng } = req.query
  if (!routeNo) return res.json({ buses: [] })

  const userLat = lat ? parseFloat(lat) : null
  const userLng = lng ? parseFloat(lng) : null

  try {
    // 1단계: 노선 번호로 routeId 검색
    const routeUrl =
      `http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo` +
      `?ServiceKey=${KEY}&strSrch=${encodeURIComponent(routeNo)}&resultType=json`

    const routeResp = await fetch(routeUrl)
    const routeText = await routeResp.text()
    console.log('[bus-arrival] 노선 검색 응답:', routeResp.status, routeText.slice(0, 300))

    let routeData
    try { routeData = JSON.parse(routeText) } catch {
      return res.json({ error: 'JSON 파싱 실패', buses: [] })
    }

    const routeItems = routeData.msgBody?.itemList
    const routeList  = routeItems ? (Array.isArray(routeItems) ? routeItems : [routeItems]) : []
    console.log('[bus-arrival] 노선 검색 결과:', routeList.length, '개')

    if (!routeList.length) return res.json({ buses: [] })

    // 정확히 일치하는 노선 우선, 없으면 첫 번째
    const route = routeList.find((r) => r.busRouteNm === routeNo) || routeList[0]
    const busRouteId = route.busRouteId
    console.log('[bus-arrival] 선택된 노선:', route.busRouteNm, busRouteId)

    // 2단계: 해당 노선의 모든 정류장 목록
    const stopsUrl =
      `http://ws.bus.go.kr/api/rest/busRouteInfo/getStaionByRoute` +
      `?ServiceKey=${KEY}&busRouteId=${encodeURIComponent(busRouteId)}&resultType=json`

    const stopsResp = await fetch(stopsUrl)
    const stopsData = await stopsResp.json()
    const stopsItems = stopsData.msgBody?.itemList
    const stops      = stopsItems ? (Array.isArray(stopsItems) ? stopsItems : [stopsItems]) : []
    console.log('[bus-arrival] 정류장 수:', stops.length)

    if (!stops.length) return res.json({ buses: [] })

    // 3단계: 사용자 위치에서 가장 가까운 정류장 찾기
    let nearestStop = stops[0]
    let nearestDist = Infinity
    if (userLat != null && userLng != null) {
      for (const stop of stops) {
        const sLat = parseFloat(stop.gpsY), sLng = parseFloat(stop.gpsX)
        if (isNaN(sLat) || isNaN(sLng)) continue
        const d = haversine(userLat, userLng, sLat, sLng)
        if (d < nearestDist) { nearestDist = d; nearestStop = stop }
      }
    }
    console.log('[bus-arrival] 가장 가까운 정류장:', nearestStop.stationNm, '거리:', Math.round(nearestDist), 'm')

    // 4단계: 해당 정류장에서 해당 노선 도착 예정 정보
    const arrUrl =
      `http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute` +
      `?ServiceKey=${KEY}&busRouteId=${encodeURIComponent(busRouteId)}&arsId=${encodeURIComponent(nearestStop.arsId)}&resultType=json`

    const arrResp = await fetch(arrUrl)
    const arrText = await arrResp.text()
    console.log('[bus-arrival] 도착정보 응답:', arrResp.status, arrText.slice(0, 300))

    let arrData
    try { arrData = JSON.parse(arrText) } catch {
      return res.json({ buses: [] })
    }

    const arrItems = arrData.msgBody?.itemList
    const arrList  = arrItems ? (Array.isArray(arrItems) ? arrItems : [arrItems]) : []
    console.log('[bus-arrival] 도착정보:', arrList.length, '개')

    const distanceM = isFinite(nearestDist) ? Math.round(nearestDist) : null
    const buses = []

    if (arrList.length > 0) {
      const item = arrList[0]
      if (Number(item.traTime1) > 0) buses.push({
        id: `bus-${busRouteId}-1`,
        route: route.busRouteNm,
        dest: route.edStationNm ?? '',
        startStop: nearestStop.stationNm,
        distanceM,
        eta: Math.max(1, Math.round(Number(item.traTime1) / 60)),
        routeColor: '#0052a4',
      })
      if (Number(item.traTime2) > 0) buses.push({
        id: `bus-${busRouteId}-2`,
        route: route.busRouteNm,
        dest: route.edStationNm ?? '',
        startStop: nearestStop.stationNm,
        distanceM,
        eta: Math.max(1, Math.round(Number(item.traTime2) / 60)),
        routeColor: '#0052a4',
      })
    }

    return res.json({ buses })
  } catch (err) {
    console.error('[bus-arrival] 오류:', err)
    return res.status(502).json({ error: String(err), buses: [] })
  }
}
