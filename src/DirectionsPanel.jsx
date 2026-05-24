import { useState } from 'react'
import { searchByKeyword, distanceMeters } from './placesService.js'
import { SearchIcon, WalkIcon, BusIcon, PinIcon, LocationIcon } from './icons.jsx'
import PlaceCard, { formatDistance } from './PlaceCard.jsx'

// 직선거리 기반 예상치. 실제 경로 안내는 카카오 모빌리티 REST API가 필요하다(README 참고).
function estimate(meters, mode) {
  if (mode === 'walk') {
    const min = Math.max(1, Math.round(meters / 67)) // 약 4km/h
    return {
      min,
      steps: [
        '현재 위치에서 출발합니다.',
        '큰길을 따라 목적지 방향으로 걷습니다.',
        `약 ${min}분 뒤 목적지에 도착합니다.`,
      ],
    }
  }
  const walkMin = Math.max(2, Math.round((meters * 0.25) / 67))
  const rideMin = Math.max(3, Math.round((meters * 0.75) / 320)) // 약 19km/h
  const min = walkMin + rideMin + 6 // 대기 시간 포함
  return {
    min,
    steps: [
      `가까운 정류장까지 걸어갑니다. (약 ${walkMin}분)`,
      `버스 또는 지하철을 타고 이동합니다. (약 ${rideMin}분)`,
      '내려서 목적지까지 걸어갑니다.',
    ],
  }
}

export default function DirectionsPanel({
  from, hasMyLocation, initialDest, onRoute, onSelectPlace,
}) {
  const [dest, setDest] = useState(initialDest || null)
  const [mode, setMode] = useState('walk')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [route, setRoute] = useState(null)

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
    const r = { meters, mode: nextMode, ...est }
    setRoute(r)
    onRoute({ path: [from, dest], dest })
  }

  function reset() {
    setDest(null)
    setRoute(null)
    setResults([])
    setQuery('')
    onRoute(null)
  }

  // 1단계: 목적지 선택
  if (!dest) {
    return (
      <>
        <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 12 }}>
          어디로 가시나요? 목적지를 찾아주세요.
        </p>
        <form onSubmit={onSearch} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="가려는 곳을 적어주세요"
            aria-label="목적지 검색어"
            enterKeyHint="search"
            style={{
              flex: 1, minHeight: 'var(--tap)', padding: '0 18px',
              border: '2px solid var(--border)', borderRadius: 'var(--radius)',
              background: 'var(--surface)',
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px' }}>
            <SearchIcon size={28} />
            찾기
          </button>
        </form>
        {loading && <p style={{ textAlign: 'center', fontSize: 'var(--fs-lg)' }}>찾는 중입니다...</p>}
        {!loading &&
          results.map((p) => (
            <PlaceCard key={p.id} place={p} from={from} onSelect={chooseDest} actionLabel="목적지로 정하기" />
          ))}
      </>
    )
  }

  // 2단계: 출발/도착 + 경로
  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <Row Icon={LocationIcon} color="var(--primary)" label="출발"
          text={hasMyLocation ? '현재 내 위치' : '서울시청 (위치 권한을 켜면 내 위치로 바뀝니다)'} />
        <div style={{ height: 14, borderLeft: '4px dotted var(--border)', marginLeft: 27 }} />
        <Row Icon={PinIcon} color="var(--danger)" label="도착" text={dest.name} sub={dest.address} />
      </div>

      <button className="btn btn-secondary" onClick={reset} style={{ marginBottom: 18 }}>
        목적지 다시 정하기
      </button>

      <p style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-soft)', marginBottom: 10 }}>
        어떻게 가시나요?
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <ModeBtn active={mode === 'walk'} Icon={WalkIcon} label="걸어서"
          onClick={() => { setMode('walk'); findRoute('walk') }} />
        <ModeBtn active={mode === 'transit'} Icon={BusIcon} label="버스·지하철"
          onClick={() => { setMode('transit'); findRoute('transit') }} />
      </div>

      {!route ? (
        <button className="btn btn-primary" onClick={() => findRoute()}>
          길찾기 시작하기
        </button>
      ) : (
        <div
          style={{
            background: 'var(--surface)', border: '2px solid var(--border)',
            borderRadius: 'var(--radius)', padding: 18,
          }}
        >
          <p style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, marginBottom: 4 }}>
            예상 {route.min}분
          </p>
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginBottom: 16 }}>
            거리 약 {formatDistance(route.meters)} · {route.mode === 'walk' ? '걸어서' : '버스·지하철'}
          </p>
          <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {route.steps.map((s, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span
                  style={{
                    flexShrink: 0, width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--primary)', color: '#fff', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 'var(--fs-base)', paddingTop: 2 }}>{s}</span>
              </li>
            ))}
          </ol>
          <button
            className="btn btn-secondary"
            onClick={() => onSelectPlace(dest)}
            style={{ marginTop: 18 }}
          >
            도착지 정보 보기
          </button>
          <p style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 12, textAlign: 'center' }}>
            * 예상 시간입니다. 실제 경로는 다를 수 있어요.
          </p>
        </div>
      )}
    </>
  )
}

function Row({ Icon, color, label, text, sub }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <span style={{ color, flexShrink: 0 }}>
        <Icon size={36} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-soft)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{text}</span>
        {sub && (
          <span style={{ display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>
            {sub}
          </span>
        )}
      </span>
    </div>
  )
}

function ModeBtn({ active, Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 6, padding: '16px 8px', minHeight: 100, borderRadius: 'var(--radius)',
        border: active ? '3px solid var(--primary)' : '2px solid var(--border)',
        background: active ? 'var(--surface)' : 'var(--bg)',
        color: active ? 'var(--primary)' : 'var(--text-soft)',
        fontWeight: 900, fontSize: 'var(--fs-base)',
      }}
    >
      <Icon size={40} />
      {label}
    </button>
  )
}
