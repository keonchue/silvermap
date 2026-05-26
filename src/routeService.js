// 카카오 모빌리티 REST API로 실제 도로 경로를 요청한다.
// VITE_KAKAO_REST_KEY 가 없으면 직선(두 점) 경로로 폴백.

const REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY

export async function getRoadRoute(from, to) {
  if (REST_KEY && REST_KEY !== 'YOUR_KAKAO_REST_KEY') {
    try {
      const url =
        `https://apis-navi.kakaomobility.com/v1/directions` +
        `?origin=${from.lng},${from.lat}` +
        `&destination=${to.lng},${to.lat}` +
        `&priority=RECOMMEND`
      const resp = await fetch(url, {
        headers: { Authorization: `KakaoAK ${REST_KEY}` },
      })
      if (resp.ok) {
        const data = await resp.json()
        const roads = data.routes?.[0]?.sections?.[0]?.roads
        if (roads?.length) {
          const pts = []
          for (const road of roads) {
            for (let i = 0; i < road.vertexes.length - 1; i += 2) {
              pts.push({ lng: road.vertexes[i], lat: road.vertexes[i + 1] })
            }
          }
          return pts
        }
      }
    } catch {}
  }
  return [from, to] // 폴백: 직선
}
