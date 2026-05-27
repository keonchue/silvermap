// 임시 진단 엔드포인트 — 실제 사용 API 확인용
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const SUBWAY_KEY = process.env.SEOUL_API_KEY
  const BUS_KEY    = process.env.DATA_GO_KR_KEY

  const result = {
    keys: {
      SEOUL_API_KEY:  SUBWAY_KEY ? `설정됨 (앞 8자: ${SUBWAY_KEY.slice(0, 8)}...)` : '❌ 미설정',
      DATA_GO_KR_KEY: BUS_KEY    ? `설정됨 (앞 8자: ${BUS_KEY.slice(0, 8)}...)`    : '❌ 미설정',
    },
    subway: null,
    bus_station: null,
  }

  // 지하철 테스트 — "강남" (실제 subway-arrival.js와 동일한 URL)
  if (SUBWAY_KEY) {
    try {
      const url = `http://swopenapi.seoul.go.kr/api/subway/${encodeURIComponent(SUBWAY_KEY)}/json/realtimeStationArrival/0/5/${encodeURIComponent('강남')}`
      const resp = await fetch(url)
      const text = await resp.text()
      result.subway = { status: resp.status, body: text.slice(0, 600) }
    } catch (e) {
      result.subway = { error: String(e) }
    }
  }

  // 버스 정류장 검색 — SEOUL_API_KEY 우선 시도
  const BUS_TRY_KEY = SUBWAY_KEY || BUS_KEY
  if (BUS_TRY_KEY) {
    try {
      const KEY = encodeURIComponent(BUS_TRY_KEY)
      const url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByName?ServiceKey=${KEY}&stSrch=${encodeURIComponent('강남역')}&resultType=json`
      const resp = await fetch(url)
      const text = await resp.text()
      result.bus_station = { key_used: BUS_TRY_KEY === SUBWAY_KEY ? 'SEOUL_API_KEY' : 'DATA_GO_KR_KEY', status: resp.status, body: text.slice(0, 600) }
    } catch (e) {
      result.bus_station = { error: String(e) }
    }
  }

  return res.json(result)
}
