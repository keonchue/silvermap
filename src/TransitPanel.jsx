import { useEffect, useState } from 'react'
import { RefreshIcon } from './icons.jsx'

// 목업 버스 데이터 (공공 API 키 없을 때 폴백)
const BUS_MOCK = [
  { id: '1', route: '273',        dest: '서울역 방향',    stops: 2, min: 3,  type: 'trunk'  },
  { id: '2', route: '3412',       dest: '잠실 방향',      stops: 5, min: 7,  type: 'branch' },
  { id: '3', route: '마을버스 04', dest: '사당역 방향',    stops: 1, min: 2,  type: 'local'  },
  { id: '4', route: '401',        dest: '강남역 방향',    stops: 8, min: 12, type: 'express'},
  { id: '5', route: '472',        dest: '노원역 방향',    stops: 3, min: 5,  type: 'trunk'  },
]

// 목업 지하철 데이터
const SUBWAY_MOCK = [
  { id: '1', line: '2', name: '2호선', dest: '외선순환 (성수행)',        min: 2, color: '#00a84d' },
  { id: '2', line: '2', name: '2호선', dest: '내선순환 (까치산행)',      min: 5, color: '#00a84d' },
  { id: '3', line: '9', name: '9호선', dest: '급행 (김포공항행)',        min: 3, color: '#d4a017' },
  { id: '4', line: '9', name: '9호선', dest: '완행 (중앙보훈병원행)',    min: 8, color: '#d4a017' },
  { id: '5', line: '3', name: '3호선', dest: '대화 방면 (지축행)',       min: 6, color: '#ef7c1c' },
]

// 버스 종류별 색상 (서울시 표준)
const BUS_COLORS = {
  trunk:   '#0052a4', // 간선 파란색
  branch:  '#53b332', // 지선 초록색
  local:   '#5bb025', // 마을버스 연두색
  express: '#f72f08', // 급행 빨간색
}

export default function TransitPanel() {
  const [mode, setMode]           = useState('bus')    // 'bus' | 'subway'
  const [query, setQuery]         = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [tick, setTick]           = useState(0)        // 갱신 카운터 (도착 시간 계산용)

  // 30초마다 자동 갱신
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

  const buses = BUS_MOCK.filter(
    (b) => !query || b.route.includes(query) || b.dest.includes(query)
  )
  const subways = SUBWAY_MOCK.filter(
    (s) => !query || s.name.includes(query) || s.dest.includes(query)
  )

  const timeStr = `${lastUpdated.getHours()}:${String(lastUpdated.getMinutes()).padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 버스 / 지하철 토글 */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { id: 'bus',    label: '🚌 버스'   },
          { id: 'subway', label: '🚇 지하철' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
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

      {/* 검색창 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface)', border: '2px solid var(--border)',
        borderRadius: 30, padding: '0 16px',
      }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === 'bus' ? '노선번호 또는 정류장 검색' : '호선 또는 역명 검색'}
          style={{
            flex: 1, border: 'none', background: 'transparent',
            fontSize: 18, padding: '13px 0', outline: 'none', color: 'var(--text)',
          }}
        />
      </div>

      {/* 갱신 시각 + 새로고침 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15, color: 'var(--text-soft)' }}>
          {timeStr} 기준
        </span>
        <button
          onClick={refresh}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 15, fontWeight: 700 }}
          aria-label="새로고침"
        >
          <RefreshIcon size={18} /> 새로고침
        </button>
      </div>

      {/* 목록 */}
      {mode === 'bus' ? (
        buses.length === 0 ? (
          <EmptyState msg="검색된 버스가 없습니다." />
        ) : (
          buses.map((b) => <BusCard key={b.id} bus={b} tick={tick} />)
        )
      ) : (
        subways.length === 0 ? (
          <EmptyState msg="검색된 지하철이 없습니다." />
        ) : (
          subways.map((s) => <SubwayCard key={s.id} subway={s} tick={tick} />)
        )
      )}

      {/* 실제 API 미연동 안내 */}
      <div style={{
        marginTop: 8, padding: '12px 16px',
        background: '#fff8e1', border: '1px solid #b25e00',
        borderRadius: 12, fontSize: 15, color: '#7a3f00', lineHeight: 1.7,
      }}>
        현재 시범 데이터로 표시 중입니다. 실시간 정보는 공공데이터포털 API 연동 후 제공됩니다.
      </div>
    </div>
  )
}

function BusCard({ bus, tick }) {
  const color = BUS_COLORS[bus.type] ?? '#0052a4'
  // tick 기준으로 남은 시간 감소 시뮬레이션
  const remaining = Math.max(1, bus.min - tick)
  const urgent = remaining <= 3

  return (
    <div style={{
      background: '#fff', border: '2px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '16px 18px',
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      {/* 노선 번호 배지 */}
      <div style={{
        background: color, color: '#fff', borderRadius: 10,
        padding: '8px 12px', fontWeight: 900, fontSize: 20,
        flexShrink: 0, minWidth: 70, textAlign: 'center',
      }}>
        {bus.route}
      </div>

      {/* 방향 + 정류장 */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{bus.dest}</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 3 }}>
          {bus.stops}번째 전 정류장
        </div>
      </div>

      {/* 도착 시간 */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 'var(--fs-xl)', fontWeight: 900,
          color: urgent ? 'var(--danger)' : 'var(--text)',
        }}>
          {urgent ? '곧 도착' : `${remaining}분`}
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>후 도착</div>
      </div>
    </div>
  )
}

function SubwayCard({ subway, tick }) {
  const remaining = Math.max(1, subway.min - tick)
  const urgent = remaining <= 2

  return (
    <div style={{
      background: '#fff', border: '2px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '16px 18px',
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      {/* 호선 원형 배지 */}
      <div style={{
        background: subway.color, color: '#fff',
        borderRadius: '50%', width: 50, height: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 22, flexShrink: 0,
      }}>
        {subway.line}
      </div>

      {/* 호선명 + 방향 */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: subway.color, fontWeight: 700 }}>
          {subway.name}
        </div>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginTop: 2 }}>
          {subway.dest}
        </div>
      </div>

      {/* 도착 시간 */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 'var(--fs-xl)', fontWeight: 900,
          color: urgent ? 'var(--danger)' : 'var(--text)',
        }}>
          {urgent ? '곧 도착' : `${remaining}분`}
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>후 도착</div>
      </div>
    </div>
  )
}

function EmptyState({ msg }) {
  return (
    <p style={{ textAlign: 'center', color: 'var(--text-soft)', fontSize: 'var(--fs-base)', padding: 32 }}>
      {msg}
    </p>
  )
}
