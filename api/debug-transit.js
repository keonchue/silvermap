// 임시 진단 엔드포인트 — API 응답 확인용
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const SUBWAY_KEY = process.env.SEOUL_API_KEY
  const BUS_KEY    = process.env.DATA_GO_KR_KEY

  const result = {
    keys: {
      SEOUL_API_KEY:  SUBWAY_KEY ? `설정됨 (앞 6자: ${SUBWAY_KEY.slice(0, 6)})` : '❌ 미설정',
      DATA_GO_KR_KEY: BUS_KEY    ? `설정됨 (앞 6자: ${BUS_KEY.slice(0, 6)})`    : '❌ 미설정',
    },
    subway: null,
    bus:    null,
  }

  // 지하철 테스트 — "강남"
  if (SUBWAY_KEY) {
    try {
      const url = `http://swopenapi.seoul.go.kr/api/subway/${encodeURIComponent(SUBWAY_KEY)}/json/realtimeStationArrival/0/5/${encodeURIComponent('강남')}`
      const resp = await fetch(url)
      const text = await resp.text()
      result.subway = { status: resp.status, body: text.slice(0, 500) }
    } catch (e) {
      result.subway = { error: String(e) }
    }
  }

  // 버스 테스트 — "강남역" cityCode=11
  if (BUS_KEY) {
    try {
      const KEY = encodeURIComponent(BUS_KEY)
      const url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnNoList?serviceKey=${KEY}&_type=json&cityCode=11&nodeNm=${encodeURIComponent('강남역')}&numOfRows=3`
      const resp = await fetch(url)
      const text = await resp.text()
      result.bus = { status: resp.status, body: text.slice(0, 500) }
    } catch (e) {
      result.bus = { error: String(e) }
    }
  }

  return res.json(result)
}
