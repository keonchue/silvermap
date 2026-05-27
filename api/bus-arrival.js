// Vercel 서버리스 함수 — 버스 도착정보
// 공공데이터포털: 국토교통부_버스도착정보조회서비스 + 버스정류소정보조회서비스
// 환경 변수: DATA_GO_KR_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { stationName, cityCode = '11' } = req.query   // 11 = 서울
  const RAW_KEY = process.env.DATA_GO_KR_KEY
  const KEY = encodeURIComponent(RAW_KEY ?? '')         // base64 키 URL 인코딩 필수

  if (!RAW_KEY) {
    console.error('[bus-arrival] DATA_GO_KR_KEY 미설정')
    return res.status(500).json({ error: 'DATA_GO_KR_KEY 미설정', buses: [] })
  }
  if (!stationName) return res.json({ buses: [] })

  try {
    // 1단계: 정류장 ID 조회
    const stUrl =
      `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnNoList` +
      `?serviceKey=${KEY}&_type=json&cityCode=${cityCode}` +
      `&nodeNm=${encodeURIComponent(stationName)}&numOfRows=5`

    console.log('[bus-arrival] 정류장 조회:', stUrl.replace(KEY, 'KEY_HIDDEN'))

    const stResp = await fetch(stUrl)
    const stText = await stResp.text()
    console.log('[bus-arrival] 정류장 응답 상태:', stResp.status, stText.slice(0, 300))

    let stData
    try { stData = JSON.parse(stText) } catch {
      console.error('[bus-arrival] JSON 파싱 실패:', stText.slice(0, 200))
      return res.json({ error: 'JSON 파싱 실패', buses: [] })
    }

    const stItems = stData.response?.body?.items?.item
    const stList  = stItems ? (Array.isArray(stItems) ? stItems : [stItems]) : []
    const nodeId  = stList[0]?.nodeid

    console.log('[bus-arrival] 정류장 목록:', stList.length, '개 | nodeId:', nodeId)

    if (!nodeId) return res.json({ buses: [] })

    // 2단계: 도착정보 조회
    const arrUrl =
      `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList` +
      `?serviceKey=${KEY}&_type=json&cityCode=${cityCode}&nodeId=${nodeId}&numOfRows=10`

    const arrResp = await fetch(arrUrl)
    const arrData = await arrResp.json()
    const arrItems = arrData.response?.body?.items?.item
    const arrList  = arrItems ? (Array.isArray(arrItems) ? arrItems : [arrItems]) : []

    console.log('[bus-arrival] 도착정보:', arrList.length, '개')

    const buses = arrList
      .map((item) => ({
        id:        `bus-${item.routeno}-${item.nodeid}`,
        route:     item.routeno ?? '?',
        dest:      item.nodenm ?? '',
        startStop: item.routetp ?? '',
        prevStops: item.arrprevstationcnt ?? null,
        eta:       item.arrtime != null ? Math.max(1, Math.round(Number(item.arrtime) / 60)) : null,
        routeColor: '#0052a4',
      }))
      .filter((b) => b.eta !== null)

    return res.json({ buses })
  } catch (err) {
    console.error('[bus-arrival] 오류:', err)
    return res.status(502).json({ error: String(err), buses: [] })
  }
}
