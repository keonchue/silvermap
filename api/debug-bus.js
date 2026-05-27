// 버스 API 디버그 — 키 형식 + 각 단계별 원본 응답 확인용
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const RAW_KEY = process.env.TOPIS_KEY || process.env.SEOUL_API_KEY || process.env.DATA_GO_KR_KEY
  const { routeNo = '273' } = req.query

  if (!RAW_KEY) return res.json({ error: '키 미설정' })

  // 키가 이미 인코딩됐는지 감지
  const isAlreadyEncoded = RAW_KEY.includes('%')
  const KEY_ENCODED = isAlreadyEncoded ? RAW_KEY : encodeURIComponent(RAW_KEY)
  const KEY_RAW     = isAlreadyEncoded ? decodeURIComponent(RAW_KEY) : RAW_KEY

  const result = {
    keyFirstChars: RAW_KEY.slice(0, 8) + '...',
    isAlreadyEncoded,
    routeNo,
    steps: {},
  }

  // 인코딩된 키로 시도
  try {
    const url = `http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo?ServiceKey=${KEY_ENCODED}&strSrch=${encodeURIComponent(routeNo)}&resultType=json`
    const resp = await fetch(url)
    const text = await resp.text()
    result.steps.encodedKey = { status: resp.status, body: text.slice(0, 400) }
  } catch (e) {
    result.steps.encodedKey = { error: String(e) }
  }

  // 디코딩된 키로도 시도 (키가 이미 인코딩된 경우)
  if (isAlreadyEncoded) {
    try {
      const url = `http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo?ServiceKey=${KEY_RAW}&strSrch=${encodeURIComponent(routeNo)}&resultType=json`
      const resp = await fetch(url)
      const text = await resp.text()
      result.steps.rawKey = { status: resp.status, body: text.slice(0, 400) }
    } catch (e) {
      result.steps.rawKey = { error: String(e) }
    }
  }

  return res.json(result)
}
