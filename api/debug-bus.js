// ODsay API 디버그 — 버스 번호로 각 단계 응답 확인
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const KEY = process.env.ODSAY_KEY
  const { routeNo = '273' } = req.query
  if (!KEY) return res.json({ error: 'ODSAY_KEY 미설정' })

  const result = { routeNo, steps: {} }

  // Step 1: 노선 검색
  let busLaneId = null
  try {
    const url = `https://api.odsay.com/v1/api/searchBusLane?apiKey=${encodeURIComponent(KEY)}&lang=0&CID=1000&busNo=${encodeURIComponent(routeNo)}`
    const resp = await fetch(url, { headers: { Referer: 'https://keonchue.github.io/silvermap/' } })
    const data = await resp.json()
    result.steps.searchBusLane = { status: resp.status, data }
    const lanes = data.result?.lane
    if (lanes?.length) {
      const lane = lanes.find(l => l.busNo === routeNo) || lanes[0]
      busLaneId = lane.busLaneId
      result.busLaneId = busLaneId
    }
  } catch (e) {
    result.steps.searchBusLane = { error: String(e) }
  }

  // Step 2: 노선 정류장 목록
  if (busLaneId) {
    try {
      const url = `https://api.odsay.com/v1/api/busLaneDetail?apiKey=${encodeURIComponent(KEY)}&lang=0&CID=1000&busLaneId=${busLaneId}`
      const resp = await fetch(url)
      const data = await resp.json()
      const stations = data.result?.station ?? []
      result.steps.busLaneDetail = {
        status: resp.status,
        stationCount: stations.length,
        firstStation: stations[0],
        lastStation: stations[stations.length - 1],
      }

      // Step 3: 첫 번째 정류장 실시간 도착정보
      if (stations[0]?.stationID) {
        const sid = stations[0].stationID
        const url2 = `https://api.odsay.com/v1/api/realtimeInfo?apiKey=${encodeURIComponent(KEY)}&lang=0&stationID=${sid}&stationMode=2`
        const resp2 = await fetch(url2)
        const data2 = await resp2.json()
        result.steps.realtimeInfo = { status: resp2.status, data: data2 }
      }
    } catch (e) {
      result.steps.busLaneDetail = { error: String(e) }
    }
  }

  return res.json(result)
}
