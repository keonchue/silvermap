import { searchByKeyword, distanceMeters } from './placesService.js'

function simEta(seed) { return Math.max(1, seed + Math.floor(Math.random() * 4)) }

export async function loadNearbyBusStops(center, query = '') {
  try {
    const keyword = query ? `버스정류장 ${query}` : '버스정류장'
    const stops = await searchByKeyword(keyword, center)
    return stops.slice(0, 8).map((s, i) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      distanceM: center ? Math.round(distanceMeters(center, s)) : null,
      eta: simEta(2 + i * 2),
    }))
  } catch {
    return []
  }
}

export async function loadNearbySubwayStations(center, query = '') {
  try {
    const keyword = query ? `지하철역 ${query}` : '지하철역'
    const stations = await searchByKeyword(keyword, center)
    return stations.slice(0, 6).map((s, i) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      distanceM: center ? Math.round(distanceMeters(center, s)) : null,
      eta: simEta(3 + i * 3),
    }))
  } catch {
    return []
  }
}
