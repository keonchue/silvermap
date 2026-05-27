// Vercel 서버리스 함수 — ODsay 버스 도착정보
// ?routeNo=273&lat=37.5&lng=127.0
// 환경 변수: ODSAY_KEY

const ODSAY = 'https://api.odsay.com/v1/api'
const REFERER = 'https://keonchue.github.io/silvermap/'

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function odsayFetch(KEY, path) {
  const url = `${ODSAY}/${path}&apiKey=${encodeURIComponent(KEY)}`
  const resp = await fetch(url, { headers: { Referer: REFERER } })
  return resp.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const KEY = process.env.ODSAY_KEY
  if (!KEY) return res.status(500).json({ error: 'ODSAY_KEY 미설정', buses: [] })

  const { routeNo, lat, lng } = req.query
  if (!routeNo) return res.json({ buses: [] })

  const userLat = lat ? parseFloat(lat) : null
  const userLng = lng ? parseFloat(lng) : null

  try {
    // 1단계: 노선 번호로 busID 조회
    const searchData = await odsayFetch(KEY, `searchBusLane?lang=0&CID=1000&busNo=${encodeURIComponent(routeNo)}`)
    const lanes = searchData.result?.lane
    if (!lanes?.length) {
      console.log('[bus-arrival] 노선 없음:', routeNo)
      return res.json({ buses: [] })
    }
    const lane = lanes.find((l) => l.busNo === routeNo) || lanes[0]
    const busID = lane.busID
    console.log('[bus-arrival] 노선:', lane.busNo, 'busID:', busID)

    // 2단계: 노선 정류장 목록 (busID 파라미터 사용)
    const detailData = await odsayFetch(KEY, `busLaneDetail?lang=0&CID=1000&busID=${busID}`)
    const stations = detailData.result?.station ?? []
    console.log('[bus-arrival] 정류장 수:', stations.length)
    if (!stations.length) return res.json({ buses: [] })

    // 3단계: 가장 가까운 정류장 찾기
    let nearestStation = stations[0]
    let nearestDist = Infinity
    if (userLat != null && userLng != null) {
      for (const st of stations) {
        const d = haversine(userLat, userLng, parseFloat(st.y), parseFloat(st.x))
        if (d < nearestDist) { nearestDist = d; nearestStation = st }
      }
    }
    console.log('[bus-arrival] 가장 가까운 정류장:', nearestStation.stationName, Math.round(nearestDist), 'm')

    // 4단계: 해당 정류장 실시간 도착정보
    const realtimeData = await odsayFetch(KEY, `realtimeInfo?lang=0&stationID=${nearestStation.stationID}&stationMode=2`)
    const realItems = realtimeData.result?.real ?? []
    console.log('[bus-arrival] 실시간 도착:', realItems.length, '개')

    // 이 노선 버스만 필터
    const filtered = realItems.filter((r) => String(r.busLaneID) === String(busID) || r.busNo === routeNo)
    const distanceM = isFinite(nearestDist) ? Math.round(nearestDist) : null

    const buses = filtered.slice(0, 2).map((item, i) => ({
      id: `bus-${busID}-${i}`,
      route: lane.busNo,
      dest: lane.busEndPoint ?? '',
      startStop: nearestStation.stationName,
      distanceM,
      eta: Math.max(1, Math.round(Number(item.estimateTime ?? item.predictTime1 ?? 0))),
      routeColor: '#0052a4',
    }))

    // 해당 노선 버스가 없으면 이 정류장 전체 버스 중 첫 번째
    if (!buses.length && realItems.length) {
      const item = realItems[0]
      buses.push({
        id: `bus-${busID}-0`,
        route: lane.busNo,
        dest: lane.busEndPoint ?? '',
        startStop: nearestStation.stationName,
        distanceM,
        eta: Math.max(1, Math.round(Number(item.estimateTime ?? item.predictTime1 ?? 5))),
        routeColor: '#0052a4',
      })
    }

    return res.json({ buses })
  } catch (err) {
    console.error('[bus-arrival] 오류:', err)
    return res.status(502).json({ error: String(err), buses: [] })
  }
}
