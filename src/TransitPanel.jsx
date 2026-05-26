import { useEffect, useState } from 'react'
import { RefreshIcon } from './icons.jsx'
import { loadNearbyBusStops, loadNearbySubwayStations } from './transitService.js'

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

export default function TransitPanel({ onTutAdvance, externalQuery = '', userLocation }) {
  const [mode, setMode]         = useState('bus')
  const [busStops, setBusStops] = useState([])
  const [subways, setSubways]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [tick, setTick]         = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // 주변 정류장/역 로드
  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      const [buses, subway] = await Promise.all([
        loadNearbyBusStops(userLocation),
        loadNearbySubwayStations(userLocation),
      ])
      if (!alive) return
      setBusStops(buses)
      setSubways(subway)
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [userLocation])

  // 외부 검색어 변경 시 재검색
  useEffect(() => {
    if (!externalQuery) return
    let alive = true
    setLoading(true)
    Promise.all([
      loadNearbyBusStops(userLocation, externalQuery),
      loadNearbySubwayStations(userLocation, externalQuery),
    ]).then(([buses, subway]) => {
      if (!alive) return
      setBusStops(buses); setSubways(subway); setLoading(false)
    })
    return () => { alive = false }
  }, [externalQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // 30초마다 ETA 갱신 (시뮬레이션)
  useEffect(() => {
    const id = setInterval(() => {
      setLastUpdated(new Date())
      setTick((t) => t + 1)
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  function refresh() {
    setLastUpdated(new Date())
    setTick((t) => t + 1)
  }

  const filteredBus    = busStops
  const filteredSubway = subways

  const timeStr = `${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')}`

  const list = mode === 'bus' ? filteredBus : filteredSubway

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 버스 / 지하철 토글 */}
      <div data-tutorial="transit-toggle" style={{ display: 'flex', gap: 8 }}>
        {[
          { id: 'bus',    label: '🚌 버스'   },
          { id: 'subway', label: '🚇 지하철' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setSelectedId(null) }}
            style={{
              flex: 1, padding: '14px 0',
              borderRadius: 'var(--radius)',
              border: mode === id ? '3px solid var(--primary)' : '2px solid var(--border)',
              background: mode === id ? 'var(--surface)' : '#fff',
              color: mode === id ? 'var(--primary)' : 'var(--text-soft)',
              fontSize: 'var(--fs-lg)', fontWeight: 900,
              transition: 'all 150ms',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 갱신 정보 */}
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

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 'var(--fs-base)', color: 'var(--text-soft)' }}>
          주변 {mode === 'bus' ? '정류장' : '역'} 찾는 중...
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 'var(--fs-base)', color: 'var(--text-soft)' }}>
          주변 {mode === 'bus' ? '정류장' : '지하철역'}이 없습니다.
        </div>
      ) : (
        list.map((item, i) => (
          <TransitCard
            key={item.id}
            item={item}
            tick={tick}
            isSubway={mode === 'subway'}
            first={i === 0}
            selected={selectedId === item.id}
            onSelect={() => {
              setSelectedId(item.id)
              const eta = Math.max(1, item.eta - Math.floor(tick / 2))
              const msg = mode === 'subway'
                ? `${item.name}, 도보 약 ${eta}분 거리입니다.`
                : `${item.name}, 약 ${eta}분 후 도착합니다.`
              speak(msg)
              if (onTutAdvance) onTutAdvance()
            }}
          />
        ))
      )}

      <div style={{
        marginTop: 4, padding: '12px 16px',
        background: '#fff8e1', border: '1px solid #b25e00',
        borderRadius: 12, fontSize: 15, color: '#7a3f00', lineHeight: 1.7,
      }}>
        위치 정보는 카카오에서 제공합니다. 도착 시간은 추정값이며 공공데이터 API 연동 후 실시간 제공됩니다.
      </div>
    </div>
  )
}

function TransitCard({ item, tick, isSubway, first, selected, onSelect }) {
  const eta = Math.max(1, item.eta - Math.floor(tick / 2))
  const urgent = !isSubway && eta <= 3

  return (
    <button
      data-tutorial={first ? 'transit-card' : undefined}
      onClick={onSelect}
      style={{
        width: '100%', textAlign: 'left',
        background: selected ? '#eef4ff' : '#fff',
        border: selected ? '2px solid var(--primary)' : '2px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px 18px',
        display: 'flex', gap: 14, alignItems: 'center',
        transition: 'all 150ms',
      }}
    >
      {/* 아이콘 배지 */}
      <div style={{
        background: isSubway ? '#3a5bc7' : '#0052a4',
        color: '#fff', borderRadius: 10,
        width: 50, height: 50, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
      }}>
        {isSubway ? '🚇' : '🚌'}
      </div>

      {/* 이름 + 주소 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--fs-base)', fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
        {item.distanceM != null && (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 3 }}>
            {fmtDist(item.distanceM)} 거리
          </div>
        )}
      </div>

      {/* ETA */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 'var(--fs-xl)', fontWeight: 900,
          color: urgent ? 'var(--danger)' : 'var(--primary)',
        }}>
          {urgent ? '곧 도착' : `${eta}분`}
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>
          {isSubway ? '도보' : '후 도착'}
        </div>
      </div>
    </button>
  )
}
