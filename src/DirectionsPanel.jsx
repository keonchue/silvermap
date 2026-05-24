import { useState } from 'react'
import { searchByKeyword, distanceMeters } from './placesService.js'
import { SearchIcon, WalkIcon, BusIcon, CarIcon, BikeIcon, PinIcon, LocationIcon, VolumeIcon } from './icons.jsx'
import PlaceCard, { formatDistance } from './PlaceCard.jsx'

const MODES = [
  { id: 'transit', label: '버스',   Icon: BusIcon  },
  { id: 'walk',    label: '도보',   Icon: WalkIcon },
  { id: 'bike',    label: '자전거', Icon: BikeIcon },
  { id: 'car',     label: '자동차', Icon: CarIcon  },
]

function estimate(meters, mode) {
  const speed = { walk: 67, bike: 200, car: 600, transit: 120 }[mode] ?? 67
  const base = Math.max(1, Math.round(meters / speed))
  if (mode === 'walk') {
    return { min: base, steps: ['현재 위치에서 출발합니다.', '큰길을 따라 목적지 방향으로 걷습니다.', `약 ${base}분 뒤 도착합니다.`] }
  }
  if (mode === 'bike') {
    return { min: base, steps: ['자전거로 출발합니다.', '자전거 도로를 이용합니다.', `약 ${base}분 뒤 도착합니다.`] }
  }
  if (mode === 'car') {
    return { min: base, steps: ['차량으로 출발합니다.', '내비게이션을 따라 이동합니다.', `약 ${base}분 뒤 도착합니다.`] }
  }
  const walkMin = Math.max(2, Math.round((meters * 0.25) / 67))
  const rideMin = Math.max(3, Math.round((meters * 0.75) / 320))
  const min = walkMin + rideMin + 6
  return {
    min,
    fare: 1650,
    steps: [
      `버스 정류장까지 걸어갑니다. (도보 ${walkMin}분)`,
      `버스 또는 지하철을 타고 이동합니다. (${rideMin}분)`,
      '내려서 목적지까지 걸어갑니다.',
    ],
  }
}

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

export default function DirectionsPanel({ from, hasMyLocation, initialDest, initialMode = 'walk', onRoute, onSelectPlace }) {
  const [dest, setDest] = useState(initialDest || null)
  const [mode, setMode] = useState(initialMode)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [route, setRoute] = useState(null)
  const [selectedCard, setSelectedCard] = useState(0)

  async function onSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    const places = await searchByKeyword(query, from)
    setResults(places)
    setLoading(false)
  }

  function chooseDest(place) {
    setDest(place)
    setResults([])
    setRoute(null)
    onRoute(null)
  }

  function findRoute(nextMode = mode) {
    if (!dest) return
    const meters = distanceMeters(from, dest)
    const est = estimate(meters, nextMode)
    setRoute({ meters, mode: nextMode, ...est })
    onRoute({ path: [from, dest], dest })
  }

  function switchMode(m) {
    setMode(m)
    if (dest) findRoute(m)
  }

  function reset() {
    setDest(null); setRoute(null); setResults([]); setQuery(''); onRoute(null)
  }

  // 출발지 선택
  if (!dest) {
    return (
      <>
        <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 12 }}>
          어디로 가시나요?
        </p>
        <form onSubmit={onSearch} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <input
            type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="가려는 곳을 적어주세요" aria-label="목적지 검색어"
            enterKeyHint="search"
            style={{
              flex: 1, minHeight: 'var(--tap)', padding: '0 18px',
              border: '2px solid var(--border)', borderRadius: 'var(--radius)',
              background: 'var(--surface)',
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px' }}>
            <SearchIcon size={28} /> 찾기
          </button>
        </form>
        {loading && <p style={{ textAlign: 'center', fontSize: 'var(--fs-lg)' }}>찾는 중입니다...</p>}
        {!loading && results.map((p) => (
          <PlaceCard key={p.id} place={p} from={from} onSelect={chooseDest} actionLabel="목적지로 정하기" />
        ))}
      </>
    )
  }

  // 추천 경로 3개 계산
  const meters = distanceMeters(from, dest)
  const routes3 = [
    estimate(meters, mode),
    estimate(meters * 1.18, mode),
    estimate(meters * 1.35, mode),
  ]

  return (
    <>
      {/* 출발/도착 카드 */}
      <div style={{
        background: 'var(--surface)', border: '2px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 14,
      }}>
        <Row Icon={LocationIcon} color="var(--primary)"
          text={hasMyLocation ? '현재 내 위치' : '서울시청 (위치 권한 필요)'} />
        <div style={{ height: 12, borderLeft: '4px dotted var(--border)', marginLeft: 18, marginTop: 4, marginBottom: 4 }} />
        <Row Icon={PinIcon} color="var(--danger)" text={dest.name} sub={dest.address} />
      </div>

      <button className="btn btn-secondary" onClick={reset} style={{ marginBottom: 14 }}>
        목적지 다시 정하기
      </button>

      {/* 이동 수단 탭 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {MODES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => switchMode(id)}
            aria-pressed={mode === id}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 4, padding: '12px 4px', borderRadius: 'var(--radius)',
              border: mode === id ? '3px solid var(--primary)' : '2px solid var(--border)',
              background: mode === id ? 'var(--surface)' : 'var(--bg)',
              color: mode === id ? 'var(--primary)' : 'var(--text-soft)',
              fontWeight: 900, fontSize: 16,
            }}
          >
            <Icon size={28} /> {label}
          </button>
        ))}
      </div>

      {/* 추천 경로 카드 3개 */}
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-soft)', marginBottom: 10 }}>
        추천 경로를 선택해 보세요!
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {routes3.map((r, i) => (
          <button
            key={i}
            onClick={() => { setSelectedCard(i); setRoute(r); onRoute({ path: [from, dest], dest }) }}
            style={{
              flex: 1, padding: '12px 6px', borderRadius: 'var(--radius)', textAlign: 'center',
              border: selectedCard === i ? '3px solid var(--primary)' : '2px solid var(--border)',
              background: selectedCard === i ? '#eef3ff' : 'var(--surface)',
            }}
          >
            {i === 0 && (
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 2 }}>
                추천
              </div>
            )}
            <div style={{ fontSize: selectedCard === i ? 28 : 24, fontWeight: 900 }}>
              {r.min}분
            </div>
          </button>
        ))}
      </div>

      {/* 상세 경로 */}
      {route && (
        <div style={{
          background: 'var(--surface)', border: '2px solid var(--primary)',
          borderRadius: 'var(--radius)', padding: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <span style={{
                background: 'var(--primary)', color: '#fff',
                fontSize: 14, fontWeight: 700, borderRadius: 8, padding: '2px 10px', marginRight: 8,
              }}>추천</span>
              <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 900 }}>{route.min}분</span>
            </div>
            <button
              onClick={() => speak(`${dest.name}까지 ${route.min}분 소요됩니다. ${route.steps.join(' ')}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 20,
                border: '2px solid var(--border)', background: '#fff',
                fontSize: 16, fontWeight: 700, color: 'var(--text)',
              }}
            >
              <VolumeIcon size={22} /> 음성 안내
            </button>
          </div>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginBottom: 16 }}>
            거리 약 {formatDistance(route.meters)}
            {route.fare ? ` · ${route.fare.toLocaleString()}원` : ''}
          </p>
          <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {route.steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
                  background: 'var(--primary)', color: '#fff', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 'var(--fs-base)', paddingTop: 4 }}>{s}</span>
              </li>
            ))}
          </ol>
          <button
            className="btn btn-primary"
            onClick={() => speak(`길 안내를 시작합니다. ${dest.name}까지 ${route.min}분 소요됩니다.`)}
            style={{ marginTop: 18, fontSize: 22, fontWeight: 900 }}
          >
            길 안내 시작
          </button>
          <button className="btn btn-secondary" onClick={() => onSelectPlace(dest)} style={{ marginTop: 10 }}>
            도착지 정보 보기
          </button>
        </div>
      )}

      {!route && (
        <button className="btn btn-primary" onClick={() => findRoute()}>
          길찾기 시작하기
        </button>
      )}
    </>
  )
}

function Row({ Icon, color, text, sub }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <span style={{ color, flexShrink: 0 }}><Icon size={32} /></span>
      <span>
        <span style={{ display: 'block', fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{text}</span>
        {sub && <span style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>{sub}</span>}
      </span>
    </div>
  )
}
