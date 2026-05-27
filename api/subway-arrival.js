// Vercel 서버리스 함수 — 지하철 실시간 도착정보
// 서울 Open API: swopenapi.seoul.go.kr
// 환경 변수: SEOUL_API_KEY

const SUBWAY_COLORS = {
  1001: '#0052a4', 1002: '#00a84d', 1003: '#ef7c1c', 1004: '#00a5de',
  1005: '#996cac', 1006: '#cd7c2f', 1007: '#747f00', 1008: '#e6186c', 1009: '#bdb092',
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { stationName } = req.query
  const KEY = process.env.SEOUL_API_KEY

  if (!KEY) {
    console.error('[subway-arrival] SEOUL_API_KEY 미설정')
    return res.status(500).json({ error: 'SEOUL_API_KEY 미설정', subways: [] })
  }
  if (!stationName) return res.json({ subways: [] })

  // 역 이름에서 "역" 제거 (API는 "강남" 형식 선호)
  const cleanName = stationName.replace(/역$/, '')

  try {
    const url =
      `http://swopenapi.seoul.go.kr/api/subway/${encodeURIComponent(KEY)}/json/realtimeStationArrival` +
      `/0/20/${encodeURIComponent(cleanName)}`

    console.log('[subway-arrival] 요청:', url.replace(encodeURIComponent(KEY), 'KEY_HIDDEN'))

    const resp = await fetch(url)
    const text = await resp.text()
    console.log('[subway-arrival] 응답 상태:', resp.status, text.slice(0, 300))

    let data
    try { data = JSON.parse(text) } catch {
      console.error('[subway-arrival] JSON 파싱 실패:', text.slice(0, 200))
      return res.json({ error: 'JSON 파싱 실패', subways: [] })
    }

    if (data.errorMessage) {
      console.warn('[subway-arrival] API 오류:', data.errorMessage)
      return res.json({ subways: [], apiError: data.errorMessage })
    }

    const list = Array.isArray(data.realtimeArrivalList) ? data.realtimeArrivalList : []
    console.log('[subway-arrival] 도착 정보:', list.length, '개')

    const seen = new Set()
    const subways = list.reduce((acc, item) => {
      const key = `${item.subwayId}-${item.trainLineNm}`
      if (seen.has(key)) return acc
      seen.add(key)
      const eta = item.barvlDt != null ? Math.max(0, Math.round(Number(item.barvlDt) / 60)) : null
      if (eta === null) return acc
      acc.push({
        id:        `subway-${key}`,
        name:      item.subwayNm ?? String(item.subwayId),
        dest:      item.bstatnNm ?? '',
        direction: item.trainLineNm ?? '',
        startStop: item.statnNm ?? stationName,
        eta,
        lineColor: SUBWAY_COLORS[Number(item.subwayId)] || '#00a84d',
      })
      return acc
    }, [])

    return res.json({ subways })
  } catch (err) {
    console.error('[subway-arrival] 오류:', err)
    return res.status(502).json({ error: String(err), subways: [] })
  }
}
