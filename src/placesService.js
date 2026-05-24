// 장소 검색 서비스.
// 카카오 키가 있으면 실제 카카오 API, 없으면 데모 데이터를 쓴다.
import { loadKakaoSdk, isKakaoKeyConfigured } from './kakaoLoader.js'
import { DEMO_PLACES } from './demoData.js'

export const usingRealApi = isKakaoKeyConfigured()

// 두 좌표 사이의 직선 거리 (미터). 길찾기 예상치 계산에 사용.
export function distanceMeters(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function normalizeKakao(doc) {
  return {
    id: doc.id,
    name: doc.place_name,
    category: doc.category_group_code || '',
    address: doc.road_address_name || doc.address_name || '',
    phone: doc.phone || '',
    lat: parseFloat(doc.y),
    lng: parseFloat(doc.x),
    url: doc.place_url || '',
  }
}

function sortByDistance(places, center) {
  if (!center) return places
  return [...places].sort(
    (a, b) =>
      distanceMeters(center, a) - distanceMeters(center, b),
  )
}

// 키워드 검색
export async function searchByKeyword(query, center) {
  if (!query.trim()) return []

  if (!usingRealApi) {
    const q = query.trim()
    const hits = DEMO_PLACES.filter(
      (p) => p.name.includes(q) || p.address.includes(q),
    )
    return sortByDistance(hits.length ? hits : DEMO_PLACES, center)
  }

  const kakao = await loadKakaoSdk()
  return new Promise((resolve) => {
    const places = new kakao.maps.services.Places()
    const opts = center
      ? { location: new kakao.maps.LatLng(center.lat, center.lng) }
      : {}
    places.keywordSearch(
      query,
      (data, status) => {
        if (status === kakao.maps.services.Status.OK) {
          resolve(data.map(normalizeKakao))
        } else {
          resolve([])
        }
      },
      opts,
    )
  })
}

// 카테고리(병원/약국 등) 주변 검색
export async function searchByCategory(category, center) {
  if (!usingRealApi) {
    const hits = DEMO_PLACES.filter((p) => p.category === category.id)
    return sortByDistance(hits, center)
  }

  const kakao = await loadKakaoSdk()
  const here =
    center && new kakao.maps.LatLng(center.lat, center.lng)

  return new Promise((resolve) => {
    const places = new kakao.maps.services.Places()
    const handle = (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        resolve(data.map(normalizeKakao))
      } else {
        resolve([])
      }
    }
    if (category.code && here) {
      places.categorySearch(category.code, handle, {
        location: here,
        radius: 2000,
        sort: kakao.maps.services.SortBy.DISTANCE,
      })
    } else {
      places.keywordSearch(category.keyword, handle, here ? { location: here } : {})
    }
  })
}
