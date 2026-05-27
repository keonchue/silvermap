// 버스 API 대안 탐색 — Seoul Open API (지하철에 쓰는 SEOUL_API_KEY로 버스도 되는지 확인)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const SEOUL_KEY = process.env.SEOUL_API_KEY
  const { routeNo = '273' } = req.query
  const result = { routeNo, steps: {} }

  // 서울 공개API — 버스 노선 검색
  try {
    const url = `http://openapi.seoul.go.kr:8088/${encodeURIComponent(SEOUL_KEY)}/json/busRouteList/1/5/${encodeURIComponent(routeNo)}`
    const resp = await fetch(url)
    const text = await resp.text()
    result.steps.seoulApi_busRouteList = { status: resp.status, body: text.slice(0, 500) }
  } catch (e) {
    result.steps.seoulApi_busRouteList = { error: String(e) }
  }

  // 서울 공개API — 버스정류소 도착정보 (정류소 ID 예시: 22690 = 강남역)
  try {
    const url = `http://openapi.seoul.go.kr:8088/${encodeURIComponent(SEOUL_KEY)}/json/busArrivalByRoute/1/5/100100118/22690`
    const resp = await fetch(url)
    const text = await resp.text()
    result.steps.seoulApi_busArrivalByRoute = { status: resp.status, body: text.slice(0, 500) }
  } catch (e) {
    result.steps.seoulApi_busArrivalByRoute = { error: String(e) }
  }

  return res.json(result)
}
