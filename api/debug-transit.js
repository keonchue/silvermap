// 임시 진단 엔드포인트
const SUBWAY_COLORS = {
  1001: '#0052a4', 1002: '#00a84d', 1003: '#ef7c1c', 1004: '#00a5de',
  1005: '#996cac', 1006: '#cd7c2f', 1007: '#747f00', 1008: '#e6186c', 1009: '#bdb092',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const SUBWAY_KEY = process.env.SEOUL_API_KEY
  const result = {
    key: SUBWAY_KEY ? `설정됨 (앞 8자: ${SUBWAY_KEY.slice(0, 8)}...)` : '❌ 미설정',
    raw_api: null,
    parsed_subways: null,
    error: null,
  }

  if (!SUBWAY_KEY) return res.json(result)

  try {
    const url = `http://swopenapi.seoul.go.kr/api/subway/${encodeURIComponent(SUBWAY_KEY)}/json/realtimeStationArrival/0/20/${encodeURIComponent('강남')}`
    const resp = await fetch(url)
    const text = await resp.text()

    let data
    try { data = JSON.parse(text) } catch {
      result.error = 'JSON 파싱 실패: ' + text.slice(0, 200)
      return res.json(result)
    }

    result.raw_api = {
      status: resp.status,
      errorMessage: data.errorMessage,
      listLength: Array.isArray(data.realtimeArrivalList) ? data.realtimeArrivalList.length : 0,
    }

    // subway-arrival.js와 동일한 로직으로 파싱
    if (data.errorMessage && data.errorMessage.code !== 'INFO-000') {
      result.error = '서울 API 오류: ' + JSON.stringify(data.errorMessage)
      return res.json(result)
    }

    const list = Array.isArray(data.realtimeArrivalList) ? data.realtimeArrivalList : []
    const seen = new Set()
    const subways = list.reduce((acc, item) => {
      const key = `${item.subwayId}-${item.trainLineNm}`
      if (seen.has(key)) return acc
      seen.add(key)
      const eta = item.barvlDt != null ? Math.max(0, Math.round(Number(item.barvlDt) / 60)) : null
      if (eta === null) return acc
      acc.push({
        id: `subway-${key}`,
        name: item.subwayNm ?? String(item.subwayId),
        dest: item.bstatnNm ?? '',
        direction: item.trainLineNm ?? '',
        startStop: item.statnNm ?? '강남',
        eta,
        lineColor: SUBWAY_COLORS[Number(item.subwayId)] || '#00a84d',
      })
      return acc
    }, [])

    result.parsed_subways = subways

  } catch (e) {
    result.error = String(e)
  }

  return res.json(result)
}
