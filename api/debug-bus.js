// 버스 API 디버그 — 각 단계별 원본 응답 확인용
// GET /api/debug-bus?routeNo=273

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const RAW_KEY = process.env.TOPIS_KEY || process.env.SEOUL_API_KEY || process.env.DATA_GO_KR_KEY
  const KEY = encodeURIComponent(RAW_KEY ?? '')
  const { routeNo = '273' } = req.query

  const result = { keySet: !!RAW_KEY, routeNo, steps: {} }

  // Step 1: getRouteInfo
  try {
    const url = `http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo?ServiceKey=${KEY}&strSrch=${encodeURIComponent(routeNo)}&resultType=json`
    const resp = await fetch(url)
    const text = await resp.text()
    result.steps.getRouteInfo = { status: resp.status, body: text.slice(0, 600) }
  } catch (e) {
    result.steps.getRouteInfo = { error: String(e) }
  }

  return res.json(result)
}
