// Vercel 서버리스 함수 — 서울 버스 도착정보
// ws.bus.go.kr: SEOUL_API_KEY 우선, DATA_GO_KR_KEY 폴백
// 환경 변수: SEOUL_API_KEY 또는 DATA_GO_KR_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { stationName } = req.query
  // ws.bus.go.kr는 서울 Open API 키(SEOUL_API_KEY)로도 접근 가능
  const RAW_KEY = process.env.TOPIS_KEY || process.env.SEOUL_API_KEY || process.env.DATA_GO_KR_KEY
  const KEY = encodeURIComponent(RAW_KEY ?? '')

  if (!RAW_KEY) return res.status(500).json({ error: 'API 키 미설정', buses: [] })
  if (!stationName) return res.json({ buses: [] })

  try {
    // 1단계: 정류소명 → arsId (서울 정류소 고유번호)
    const stUrl =
      `http://ws.bus.go.kr/api/rest/stationinfo/getStationByName` +
      `?ServiceKey=${KEY}&stSrch=${encodeURIComponent(stationName)}&resultType=json`

    const stResp = await fetch(stUrl)
    const stText = await stResp.text()
    console.log('[bus-arrival] 정류소 응답:', stResp.status, stText.slice(0, 400))

    let stData
    try { stData = JSON.parse(stText) } catch {
      console.error('[bus-arrival] JSON 파싱 실패:', stText.slice(0, 300))
      return res.json({ buses: [] })
    }

    const stItems = stData.msgBody?.itemList
    const stList  = stItems ? (Array.isArray(stItems) ? stItems : [stItems]) : []
    const arsId   = stList[0]?.arsId

    console.log('[bus-arrival] 정류소', stList.length, '개, arsId:', arsId)
    if (!arsId) return res.json({ buses: [] })

    // 2단계: arsId → 실시간 도착정보
    const arrUrl =
      `http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid` +
      `?ServiceKey=${KEY}&arsId=${arsId}&resultType=json`

    const arrResp = await fetch(arrUrl)
    const arrData = await arrResp.json()
    const arrItems = arrData.msgBody?.itemList
    const arrList  = arrItems ? (Array.isArray(arrItems) ? arrItems : [arrItems]) : []

    console.log('[bus-arrival] 도착정보', arrList.length, '개')

    const buses = arrList.flatMap((item) => {
      const rows = []
      if (item.traTime1 > 0) rows.push({
        id: `bus-${item.rtNm}-1`, route: item.rtNm ?? '?',
        dest: item.nxtStn ?? '', startStop: item.stNm ?? stationName,
        eta: Math.max(1, Math.round(Number(item.traTime1) / 60)),
        routeColor: '#0052a4',
      })
      if (item.traTime2 > 0) rows.push({
        id: `bus-${item.rtNm}-2`, route: item.rtNm ?? '?',
        dest: item.nxtStn ?? '', startStop: item.stNm ?? stationName,
        eta: Math.max(1, Math.round(Number(item.traTime2) / 60)),
        routeColor: '#0052a4',
      })
      return rows
    })

    return res.json({ buses })
  } catch (err) {
    console.error('[bus-arrival] 오류:', err)
    return res.status(502).json({ error: String(err), buses: [] })
  }
}
