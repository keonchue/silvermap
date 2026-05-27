import { useEffect, useState } from 'react'
import { RefreshIcon } from './icons.jsx'
import { loadBusArrivalByRoute, loadSubwayArrival } from './realtimeTransitService.js'
import { searchByKeyword } from './placesService.js'

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'; u.rate = 0.85
  window.speechSynthesis.speak(u)
}

function fmtDist(m) {
  if (m == null) return ''
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

export default function TransitPanel({ onTutAdvance, externalQuery = '', userLocation, onWalkTo, onTransitTo, onShowOnMap }) {
  const [mode, setMode]         = useState('subway')
  const [buses, setBuses]       = useState([])
  const [subways, setSubways]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [tick, setTick]         = useState(0)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [internalQuery, setInternalQuery] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [searchedPlace, setSearchedPlace] = useState(null)

  async function load(query = '', reqMode = mode) {
    setLoading(true)
    setLoadError(null)
    setSearchedPlace(null)
    try {
      if (reqMode === 'bus') {
        const buses = await loadBusArrivalByRoute(query, userLocation)
        setBuses(buses)
        setSubways([])
      } else {
        const [subways, places] = await Promise.all([
          loadSubwayArrival(query),
          query ? searchByKeyword(query, userLocation) : Promise.resolve([]),
        ])
        setSubways(subways)
        setBuses([])
        if (places.length > 0) {
          setSearchedPlace(places[0])
          onShowOnMap?.([places[0]])
        }
      }
    } catch (err) {
      console.error('[TransitPanel] 오류:', err)
      setLoadError(String(err))
      setBuses([])
      setSubways([])
    }
    setLoading(false)
    setLastUpdated(new Date())
  }

  useEffect(() => {
    if (externalQuery) { setInternalQuery(externalQuery); setActiveQuery(externalQuery); load(externalQuery, mode) }
  }, [externalQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e) {
    e.preventDefault()
    const q = internalQuery.trim()
    if (!q) return
    setActiveQuery(q)
    load(q)
    if (onTutAdvance) onTutAdvance()
  }

  useEffect(() => {
    const id = setInterval(() => { setTick((t) => t + 1) }, 30_000)
    return () => clearInterval(id)
  }, [])

  function refresh() { load(activeQuery); setTick((t) => t + 1) }

  const timeStr = `${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')}`
  const list = mode === 'bus' ? buses : subways

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 버스 / 지하철 토글 */}
      <div data-tutorial="transit-toggle" style={{ display: 'flex', gap: 8 }}>
        {[{ id: 'subway', label: '🚇 지하철' }, { id: 'bus', label: '🚌 버스' }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setInternalQuery(''); setActiveQuery(''); setBuses([]); setSubways([]); setSearchedPlace(null); if (onTutAdvance) onTutAdvance() }}
            style={{
              flex: 1, padding: '14px 0', borderRadius: 'var(--radius)',
              border: mode === id ? '3px solid var(--primary)' : '2px solid var(--border)',
              background: mode === id ? 'var(--surface)' : '#fff',
              color: mode === id ? 'var(--primary)' : 'var(--text-soft)',
              fontSize: 'var(--fs-lg)', fontWeight: 900, transition: 'all 150ms',
            }}
          >{label}</button>
        ))}
      </div>

      {/* 검색창 */}
      <form data-tutorial="transit-search" onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
        <input
          type="search"
          value={internalQuery}
          onChange={(e) => setInternalQuery(e.target.value)}
          placeholder={mode === 'bus' ? '버스 번호 입력 (예: 273, 9호선)' : '역 이름 입력 (예: 강남역, 홍대입구역)'}
          enterKeyHint="search"
          style={{
            flex: 1, padding: '14px 16px', fontSize: 'var(--fs-base)',
            border: '2px solid var(--border)', borderRadius: 'var(--radius)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '14px 18px', background: 'var(--primary)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)',
            fontSize: 'var(--fs-base)', fontWeight: 700, flexShrink: 0,
          }}
        >
          검색
        </button>
      </form>

      {/* 갱신 정보 */}
      {activeQuery && !loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, color: 'var(--text-soft)' }}>{timeStr} 기준</span>
          <button
            onClick={refresh}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 15, fontWeight: 700 }}
            aria-label="새로고침"
          >
            <RefreshIcon size={18} /> 새로고침
          </button>
        </div>
      )}

      {/* 오류 표시 */}
      {loadError && (
        <div style={{ padding: '12px 16px', background: '#fff0f0', border: '1px solid #f00', borderRadius: 12, fontSize: 14, color: '#900' }}>
          오류: {loadError}
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 'var(--fs-base)', color: 'var(--text-soft)' }}>
          {mode === 'bus' ? '버스 도착 정보 확인 중...' : '지하철 도착 정보 확인 중...'}
        </div>
      ) : list.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '28px 20px',
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          fontSize: 'var(--fs-base)', color: 'var(--text-soft)', lineHeight: 2,
        }}>
          {!activeQuery
            ? mode === 'bus'
              ? '버스 번호를 입력하면\n가장 가까운 정류장 도착 정보를 알려드립니다.'
              : '역 이름을 입력하면\n실시간 도착 정보와 길찾기를 도와드립니다.'
            : mode === 'bus'
            ? '버스 도착 정보를 준비 중입니다.\n잠시 후 다시 시도해 주세요.'
            : `'${activeQuery}' 검색 결과가 없습니다.\n다른 역 이름으로 검색해 보세요.`}
        </div>
      ) : mode === 'bus' ? (
        buses.map((b, i) => (
          <BusCard
            key={b.id} bus={b} tick={tick} first={i === 0}
            onWalkToStop={() => {
                const place = (b.stopLat && b.stopLng)
                  ? { id: `stop-${b.id}`, name: b.startStop, lat: b.stopLat, lng: b.stopLng }
                  : searchedPlace
                if (place) onWalkTo?.(place)
              }}
            onSelect={() => {
              const eta = Math.max(1, b.eta - Math.floor(tick / 2))
              speak(`${b.route}번 버스, 약 ${eta}분 후 도착 예정입니다. 탑승 위치: ${b.startStop || '근처 정류장'}`)
              if (onTutAdvance) onTutAdvance()
            }}
          />
        ))
      ) : (
        <>
          {subways.map((s, i) => (
            <SubwayCard
              key={s.id} subway={s} tick={tick} first={i === 0}
              onSelect={() => {
                const eta = Math.max(1, s.eta - Math.floor(tick / 2))
                speak(`${s.name}, ${s.dest || '종점'} 방면, 약 ${eta}분 후 출발합니다.`)
                if (onTutAdvance) onTutAdvance()
              }}
            />
          ))}

          {/* 지하철 길찾기 버튼 */}
          {searchedPlace && (
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                onClick={() => onWalkTo?.(searchedPlace)}
                style={{
                  flex: 1, padding: '16px 0', borderRadius: 'var(--radius)',
                  background: '#f0f7ff', border: '2px solid var(--primary)',
                  color: 'var(--primary)', fontSize: 'var(--fs-base)', fontWeight: 800,
                }}
              >
                🚶 도보 길찾기
              </button>
              <button
                onClick={() => onTransitTo?.(searchedPlace)}
                style={{
                  flex: 1, padding: '16px 0', borderRadius: 'var(--radius)',
                  background: '#fff8e1', border: '2px solid #b25e00',
                  color: '#7a3f00', fontSize: 'var(--fs-base)', fontWeight: 800,
                }}
              >
                🚇 대중교통 길찾기
              </button>
            </div>
          )}
        </>
      )}

      {list.length > 0 && (
        <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: 12, fontSize: 14, color: '#166534' }}>
          서울 실시간 도착 정보 · {timeStr} 기준
        </div>
      )}
    </div>
  )
}

function BusCard({ bus, tick, first, onSelect, onWalkToStop }) {
  const eta = bus.eta != null ? Math.max(1, bus.eta - Math.floor(tick / 2)) : null
  const urgent = eta != null && eta <= 3

  if (bus.noService) {
    return (
      <div
        data-tutorial={first ? 'transit-card' : undefined}
        style={{
          background: '#fff', border: '2px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 18px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ background: '#888', color: '#fff', borderRadius: 10, padding: '6px 12px', fontWeight: 900, fontSize: 20, flexShrink: 0, minWidth: 64, textAlign: 'center' }}>
            {bus.route}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{bus.dest}</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 3 }}>
              정류장: {bus.startStop}{bus.distanceM ? ` · ${fmtDist(bus.distanceM)}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, color: 'var(--text-soft)', fontSize: 'var(--fs-sm)' }}>운행 종료</div>
        </div>
        <button onClick={onWalkToStop} style={{ padding: '12px 0', borderRadius: 'var(--radius)', background: '#f0f7ff', border: '2px solid var(--primary)', color: 'var(--primary)', fontSize: 'var(--fs-base)', fontWeight: 700 }}>
          🚶 이 정류장으로 걸어가기
        </button>
      </div>
    )
  }

  return (
    <div
      data-tutorial={first ? 'transit-card' : undefined}
      style={{
        background: '#fff', border: '2px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <button onClick={onSelect} style={{ display: 'flex', gap: 14, alignItems: 'center', textAlign: 'left' }}>
        <div style={{
          background: bus.routeColor || '#0052a4', color: '#fff',
          borderRadius: 10, padding: '6px 12px',
          fontWeight: 900, fontSize: 20, flexShrink: 0, minWidth: 64, textAlign: 'center',
        }}>
          {bus.route}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bus.dest}
          </div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 3 }}>
            정류장: {bus.startStop}{bus.distanceM ? ` · ${fmtDist(bus.distanceM)}` : ''}
            {bus.interval ? ` · ${bus.interval}분 간격` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, color: urgent ? 'var(--danger)' : 'var(--text)' }}>
            {urgent ? '곧 도착' : `약 ${eta}분`}
          </div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>후 예정</div>
        </div>
      </button>
      <button
        onClick={onWalkToStop}
        style={{
          padding: '12px 0', borderRadius: 'var(--radius)',
          background: '#f0f7ff', border: '2px solid var(--primary)',
          color: 'var(--primary)', fontSize: 'var(--fs-base)', fontWeight: 700,
        }}
      >
        🚶 이 정류장으로 걸어가기
      </button>
    </div>
  )
}

function SubwayCard({ subway, tick, first, onSelect }) {
  const eta = Math.max(1, subway.eta - Math.floor(tick / 2))
  const urgent = eta <= 2

  return (
    <button
      data-tutorial={first ? 'transit-card' : undefined}
      onClick={onSelect}
      style={{
        width: '100%', textAlign: 'left',
        background: '#fff', border: '2px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px 18px',
        display: 'flex', gap: 14, alignItems: 'center',
        transition: 'all 150ms',
      }}
    >
      <div style={{
        background: subway.lineColor || '#00a84d', color: '#fff',
        borderRadius: '50%', width: 52, height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 18,
      }}>
        {subway.name?.replace('호선', '') || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subway.name} {subway.dest ? `→ ${subway.dest}` : ''}
        </div>
        {subway.startStop && (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 3 }}>
            {subway.direction || subway.startStop}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, color: urgent ? 'var(--danger)' : 'var(--text)' }}>
          {urgent ? '곧 출발' : `${eta}분`}
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>후 출발</div>
      </div>
    </button>
  )
}
