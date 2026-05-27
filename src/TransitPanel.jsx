import { useEffect, useState } from 'react'
import { RefreshIcon } from './icons.jsx'
import { loadTransitOptions } from './transitService.js'

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
  const [buses, setBuses]       = useState([])
  const [subways, setSubways]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [tick, setTick]         = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  async function load(query = '') {
    setLoading(true)
    const result = await loadTransitOptions(userLocation, query)
    setBuses(result.buses)
    setSubways(result.subways)
    setLoading(false)
    setLastUpdated(new Date())
  }

  // 첫 로드
  useEffect(() => { load() }, [userLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  // 외부 검색어
  useEffect(() => {
    if (externalQuery) load(externalQuery)
  }, [externalQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  // 30초 자동 갱신
  useEffect(() => {
    const id = setInterval(() => { setTick((t) => t + 1) }, 30_000)
    return () => clearInterval(id)
  }, [])

  function refresh() { load(externalQuery); setTick((t) => t + 1) }

  const list = mode === 'bus' ? buses : subways
  const timeStr = `${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')}`
  const usingPubApi   = !!import.meta.env.VITE_DATA_GO_KR_KEY && import.meta.env.VITE_DATA_GO_KR_KEY !== 'YOUR_DATA_GO_KR_KEY'
  const usingKakaoApi = !!import.meta.env.VITE_KAKAO_REST_KEY
  const usingRealApi  = usingPubApi || usingKakaoApi

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 버스 / 지하철 토글 */}
      <div data-tutorial="transit-toggle" style={{ display: 'flex', gap: 8 }}>
        {[{ id: 'bus', label: '🚌 버스' }, { id: 'subway', label: '🚇 지하철' }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setSelectedId(null) }}
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
          {mode === 'bus' ? '주변 버스 노선 확인 중...' : '지하철 노선 확인 중...'}
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, fontSize: 'var(--fs-base)', color: 'var(--text-soft)' }}>
          {externalQuery ? `'${externalQuery}' 검색 결과가 없습니다.` : '주변 노선 정보를 찾을 수 없습니다.'}
        </div>
      ) : mode === 'bus' ? (
        buses.map((b, i) => (
          <BusCard
            key={b.id} bus={b} tick={tick} first={i === 0}
            selected={selectedId === b.id}
            onSelect={() => {
              setSelectedId(b.id)
              const eta = Math.max(1, b.eta - Math.floor(tick / 2))
              speak(`${b.route}번 버스, 약 ${eta}분 후 도착 예정입니다. 탑승 위치: ${b.startStop || '근처 정류장'}`)
              if (onTutAdvance) onTutAdvance()
            }}
          />
        ))
      ) : (
        subways.map((s, i) => (
          <SubwayCard
            key={s.id} subway={s} tick={tick} first={i === 0}
            selected={selectedId === s.id}
            onSelect={() => {
              setSelectedId(s.id)
              const eta = Math.max(1, s.eta - Math.floor(tick / 2))
              speak(`${s.name}, ${s.dest || '종점'} 방면, 약 ${eta}분 후 출발합니다. 탑승 위치: ${s.startStop || '근처 역'}`)
              if (onTutAdvance) onTutAdvance()
            }}
          />
        ))
      )}

      <div style={{
        marginTop: 4, padding: '12px 16px',
        background: usingRealApi ? '#f0fdf4' : '#fff8e1',
        border: `1px solid ${usingRealApi ? '#22c55e' : '#b25e00'}`,
        borderRadius: 12, fontSize: 15,
        color: usingRealApi ? '#166534' : '#7a3f00',
        lineHeight: 1.7,
      }}>
        {usingPubApi
          ? '공공데이터포털 실시간 정보 · 정류장 검색 시 도착 정보 표시'
          : usingKakaoApi
          ? '카카오 모빌리티 기반 · 도착 시간은 추정값'
          : '실시간 정보 없음 · VITE_DATA_GO_KR_KEY 설정 시 실시간 도착정보 제공'}
      </div>
    </div>
  )
}

function BusCard({ bus, tick, first, selected, onSelect }) {
  const eta = Math.max(1, bus.eta - Math.floor(tick / 2))
  const urgent = eta <= 3

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
      {/* 노선 배지 */}
      <div style={{
        background: bus.routeColor || '#0052a4', color: '#fff',
        borderRadius: 10, padding: '6px 10px',
        fontWeight: 900, fontSize: 18, flexShrink: 0,
        minWidth: 60, textAlign: 'center',
      }}>
        {bus.route}
      </div>

      {/* 방향 + 정류장 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--fs-base)', fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {bus.dest}
        </div>
        {bus.startStop && (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 3 }}>
            {bus.startStop}{bus.distanceM ? ` · ${fmtDist(bus.distanceM)}` : ''}
          </div>
        )}
      </div>

      {/* ETA */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, color: urgent ? 'var(--danger)' : 'var(--text)' }}>
          {urgent ? '곧 도착' : `${eta}분`}
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>후 도착</div>
      </div>
    </button>
  )
}

function SubwayCard({ subway, tick, first, selected, onSelect }) {
  const eta = Math.max(1, subway.eta - Math.floor(tick / 2))
  const urgent = eta <= 2

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
      {/* 노선 원형 배지 */}
      <div style={{
        background: subway.lineColor || '#00a84d', color: '#fff',
        borderRadius: '50%', width: 50, height: 50, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 18,
      }}>
        {subway.name?.replace('호선', '') || '?'}
      </div>

      {/* 방향 + 역 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--fs-base)', fontWeight: 700,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {subway.name} {subway.dest ? `→ ${subway.dest}` : ''}
        </div>
        {subway.startStop && (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 3 }}>
            {subway.startStop}{subway.distanceM ? ` · ${fmtDist(subway.distanceM)}` : ''}
          </div>
        )}
      </div>

      {/* ETA */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, color: urgent ? 'var(--danger)' : 'var(--text)' }}>
          {urgent ? '곧 출발' : `${eta}분`}
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>후 출발</div>
      </div>
    </button>
  )
}
