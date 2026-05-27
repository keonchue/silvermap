// ODsay 버스 API 전체 흐름 디버그
const REFERER = 'https://keonchue.github.io/silvermap/'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const KEY = process.env.ODSAY_KEY
  const { routeNo = '273' } = req.query
  if (!KEY) return res.json({ error: 'ODSAY_KEY 미설정' })

  const hdrs = { headers: { Referer: REFERER } }
  const result = { routeNo, steps: {} }
  let busID = null, stationID = null

  // Step 1
  try {
    const url = `https://api.odsay.com/v1/api/searchBusLane?apiKey=${encodeURIComponent(KEY)}&lang=0&CID=1000&busNo=${encodeURIComponent(routeNo)}`
    const data = await fetch(url, hdrs).then(r => r.json())
    const lane = data.result?.lane?.find(l => l.busNo === routeNo) || data.result?.lane?.[0]
    busID = lane?.busID
    result.steps.step1 = { busID, busNo: lane?.busNo, start: lane?.busStartPoint, end: lane?.busEndPoint }
  } catch (e) { result.steps.step1 = { error: String(e) } }

  // Step 2
  if (busID) {
    try {
      const url = `https://api.odsay.com/v1/api/busLaneDetail?apiKey=${encodeURIComponent(KEY)}&lang=0&CID=1000&busID=${busID}`
      const data = await fetch(url, hdrs).then(r => r.json())
      const stations = data.result?.station ?? []
      stationID = stations[0]?.stationID
      result.steps.step2 = { stationCount: stations.length, firstStation: stations[0], lastStation: stations[stations.length - 1] }
    } catch (e) { result.steps.step2 = { error: String(e) } }
  }

  // Step 3: 중간 정류장으로 여러 엔드포인트 시도
  const stations = result.steps.step2?.stationCount > 0 ? null : null
  const midStationID = 112355  // 첫 번째 정류장 (테스트용)
  const midArsID = '07418'

  for (const [label, url] of [
    ['realtimeInfo_stationID', `https://api.odsay.com/v1/api/realtimeInfo?apiKey=${encodeURIComponent(KEY)}&lang=0&stationID=${midStationID}&stationMode=2`],
    ['realtimeLane_busID', `https://api.odsay.com/v1/api/realtimeLane?apiKey=${encodeURIComponent(KEY)}&lang=0&CID=1000&busID=${busID}`],
    ['realtimeLane_busLaneID', `https://api.odsay.com/v1/api/realtimeLane?apiKey=${encodeURIComponent(KEY)}&lang=0&CID=1000&busLaneID=${busID}`],
    ['realtimeInfoNoMode', `https://api.odsay.com/v1/api/realtimeInfo?apiKey=${encodeURIComponent(KEY)}&lang=0&stationID=${midStationID}`],
  ]) {
    try {
      const data = await fetch(url, hdrs).then(r => r.json())
      result.steps[label] = JSON.stringify(data).slice(0, 400)
    } catch (e) { result.steps[label] = String(e) }
  }

  return res.json(result)
}
