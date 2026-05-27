// Vercel 서버리스 함수 — ODsay 버스 도착 정보
// 실시간 대신 배차 간격 기반 다음 버스 시각 추정
// ?routeNo=273&lat=37.5&lng=127.0

const ODSAY_BASE = 'https://api.odsay.com/v1/api'
const REFERER = 'https://keonchue.github.io/silvermap/'

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 배차 간격 기반 다음 버스 추정 (한국 시간 KST)
function estimateNextBus(lane) {
  const now = new Date(Date.now() + 9 * 3600_000) // UTC → KST
  const day = now.getUTCDay() // 0=일, 6=토
  const intervalStr =
    day === 0 ? lane.bus_Interval_Sun :
    day === 6 ? lane.bus_Interval_Sat :
    lane.bus_Interval_Week || lane.busInterval || '10'
  const interval = parseInt(intervalStr, 10) || 10

  const [fh, fm] = (lane.busFirstTime || '05:00').split(':').map(Number)
  const [lh, lm] = (lane.busLastTime  || '23:00').split(':').map(Number)
  const nowMin   = now.getUTCHours() * 60 + now.getUTCMinutes()
  const firstMin = fh * 60 + fm
  const lastMin  = lh * 60 + lm

  if (nowMin < firstMin || nowMin > lastMin) return { eta: null, interval, outsideHours: true }

  const elapsed     = nowMin - firstMin
  const sinceLastDep = elapsed % interval
  const nextIn       = interval - sinceLastDep

  return { eta: Math.max(1, nextIn), interval }
}

async function odsayGet(KEY, endpoint) {
  const url = `${ODSAY_BASE}/${endpoint}&apiKey=${encodeURIComponent(KEY)}`
  const resp = await fetch(url, { headers: { Referer: REFERER } })
  if (!resp.ok) throw new Error(`ODsay HTTP ${resp.status}`)
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
    // 1단계: 노선 번호 검색
    const searchData = await odsayGet(KEY, `searchBusLane?lang=0&CID=1000&busNo=${encodeURIComponent(routeNo)}`)
    const lanes = searchData.result?.lane
    if (!lanes?.length) return res.json({ buses: [] })

    const lane  = lanes.find((l) => l.busNo === routeNo) || lanes[0]
    const busID = lane.busID
    console.log('[bus-arrival] 노선:', lane.busNo, 'busID:', busID, '배차:', lane.busInterval, '분')

    // 2단계: 노선 정류장 목록 (busID 파라미터)
    const detailData = await odsayGet(KEY, `busLaneDetail?lang=0&CID=1000&busID=${busID}`)
    const stations   = detailData.result?.station ?? []
    if (!stations.length) return res.json({ buses: [] })

    // 3단계: 가장 가까운 정류장
    let nearestStation = stations[Math.floor(stations.length / 4)] // 출발지 근처 회피용 기본값
    let nearestDist    = Infinity
    if (userLat != null && userLng != null) {
      for (const st of stations) {
        const d = haversine(userLat, userLng, parseFloat(st.y), parseFloat(st.x))
        if (d < nearestDist) { nearestDist = d; nearestStation = st }
      }
    }
    console.log('[bus-arrival] 가장 가까운 정류장:', nearestStation.stationName, Math.round(nearestDist), 'm')

    // 4단계: 배차 간격 기반 ETA 추정
    const { eta, interval, outsideHours } = estimateNextBus(lane)
    const distanceM = isFinite(nearestDist) ? Math.round(nearestDist) : null

    const stopLat = parseFloat(nearestStation.y)
    const stopLng = parseFloat(nearestStation.x)

    if (outsideHours || eta === null) {
      return res.json({
        buses: [{
          id:        `bus-${busID}-noop`,
          route:     lane.busNo,
          dest:      lane.busEndPoint ?? '',
          startStop: nearestStation.stationName,
          distanceM, stopLat, stopLng,
          eta:       null,
          noService: true,
          interval,
          routeColor: '#888',
        }],
      })
    }

    // 도착 예정 2회 (지금, 1 배차 후)
    const buses = [
      {
        id: `bus-${busID}-0`, route: lane.busNo, dest: lane.busEndPoint ?? '',
        startStop: nearestStation.stationName, distanceM, stopLat, stopLng,
        eta, interval, routeColor: '#0052a4',
      },
      {
        id: `bus-${busID}-1`, route: lane.busNo, dest: lane.busEndPoint ?? '',
        startStop: nearestStation.stationName, distanceM, stopLat, stopLng,
        eta: eta + interval, interval, routeColor: '#0052a4',
      },
    ]

    return res.json({ buses })
  } catch (err) {
    console.error('[bus-arrival] 오류:', err)
    return res.status(502).json({ error: String(err), buses: [] })
  }
}
