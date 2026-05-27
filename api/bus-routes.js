// Vercel 서버리스 함수 — 버스 노선 정보
// 공공데이터포털: 국토교통부_버스노선정보조회서비스
// 환경 변수 (Vercel 대시보드에서 설정): DATA_GO_KR_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { routeNo, cityCode = '25' } = req.query
  const KEY = process.env.DATA_GO_KR_KEY

  if (!KEY) return res.status(500).json({ error: 'DATA_GO_KR_KEY 미설정', routes: [] })
  if (!routeNo) return res.json({ routes: [] })

  try {
    const url =
      `https://apis.data.go.kr/1613000/BusRouteInfoInqireService/getRouteNoList` +
      `?serviceKey=${KEY}&_type=json&cityCode=${cityCode}` +
      `&routeNo=${encodeURIComponent(routeNo)}&numOfRows=5`

    const data = await fetch(url).then((r) => r.json())
    const items = data.response?.body?.items?.item
    const list = items ? (Array.isArray(items) ? items : [items]) : []

    const routes = list.map((item) => ({
      id:        item.routeid,
      routeNo:   item.routeno,
      startStop: item.startnodenm,
      endStop:   item.endnodenm,
      routeType: item.routetp,
    }))

    return res.json({ routes })
  } catch (err) {
    console.error('[bus-routes]', err)
    return res.status(502).json({ error: String(err), routes: [] })
  }
}
