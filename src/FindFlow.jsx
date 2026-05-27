import { useEffect, useState } from 'react'
import { distanceMeters } from './placesService.js'
import { getRoadRoute, getTransitRoute, getWalkRoute, estimateTransit } from './routeService.js'

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'; u.rate = 0.85
  window.speechSynthesis.speak(u)
}

function fmtDist(m) {
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

const MODES = [
  { id: 'walk',    label: '🚶 도보' },
  { id: 'transit', label: '🚌 대중교통' },
  { id: 'car',     label: '🚗 자동차' },
]

export default function FindFlow({ from, onRoute, onTutAdvance, initialDest, results = [], loading = false }) {
  const [dest, setDest]         = useState(initialDest || null)
  const [mode, setMode]         = useState('walk')
  const [walkInfo, setWalkInfo] = useState(null)  // { meters, mins }
  const [carInfo, setCarInfo]   = useState(null)  // { mins }
  const [transitInfo, setTransitInfo] = useState(null)  // { duration, fare, legs }
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    if (initialDest) fetchAllRoutes(initialDest)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 모드 변경 시 지도 경로선 업데이트
  useEffect(() => {
    if (!dest) return
    applyRouteToMap(dest, mode)
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAllRoutes(place) {
    setRouteLoading(true)
    const [walkResult, carResult, transitResult] = await Promise.all([
      getWalkRoute(from, place),
      getRoadRoute(from, place),
      getTransitRoute(from, place),
    ])
    setRouteLoading(false)

    const straightMeters = Math.round(distanceMeters(from, place))
    setWalkInfo({
      meters: walkResult.distance ?? straightMeters,
      mins:   walkResult.duration ?? Math.ceil(straightMeters / 60),
    })
    if (carResult.duration) {
      setCarInfo({ mins: Math.round(carResult.duration / 60) })
    }
    const straightMeters2 = Math.round(distanceMeters(from, place))
    setTransitInfo(transitResult ?? estimateTransit(straightMeters2))

    // 기본: 도보 실제 경로로 지도 초기화
    onRoute({ path: walkResult.path, dest: place })
  }

  async function applyRouteToMap(place, selectedMode) {
    if (selectedMode === 'walk') {
      const result = await getWalkRoute(from, place)
      onRoute({ path: result.path, dest: place })
    } else if (selectedMode === 'car') {
      const result = await getRoadRoute(from, place)
      onRoute({ path: result.path, dest: place })
    } else {
      onRoute({ path: [from, place], dest: place })
    }
  }

  function selectDest(place) {
    setDest(place)
    setMode('walk')
    setWalkInfo(null); setCarInfo(null); setTransitInfo(null)
    fetchAllRoutes(place)
    onTutAdvance()
  }

  function startNav() {
    if (!dest) return
    let msg = `길 안내를 시작합니다. ${dest.name}까지 이동합니다. `
    if (mode === 'walk' && walkInfo) {
      msg += `도보 약 ${walkInfo.mins}분, ${fmtDist(walkInfo.meters)} 거리입니다.`
    } else if (mode === 'car' && carInfo) {
      msg += `자동차로 약 ${carInfo.mins}분 소요됩니다.`
    } else if (mode === 'transit' && transitInfo) {
      msg += `대중교통으로 약 ${transitInfo.duration}분 소요됩니다.`
    }
    speak(msg)
    onTutAdvance()
  }

  const showResults = !loading && results.length > 0
  const showRouteUI = dest && !showResults

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 18 }}>

      {/* 검색 중 */}
      {loading && (
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          background: '#fff', borderRadius: 14, padding: '16px 18px',
          textAlign: 'center', fontSize: 18, fontWeight: 700,
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)', pointerEvents: 'auto',
        }}>
          찾는 중입니다...
        </div>
      )}

      {/* 검색 결과 */}
      {showResults && (
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          background: '#fff', borderRadius: 14,
          boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
          overflow: 'hidden', pointerEvents: 'auto',
        }}>
          {results.map((p, i) => (
            <div
              key={p.id}
              data-tutorial={i === 0 ? 'dest-result' : undefined}
              onClick={() => selectDest(p)}
              style={{
                padding: '16px 18px', cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid #eef2f7' : 'none',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
              {p.address && (
                <div style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 3 }}>{p.address}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 목적지 선택 후: 모드 선택 + 경로 정보 + 안내 시작 */}
      {showRouteUI && (
        <>
          {/* 교통 수단 선택 */}
          <div style={{
            position: 'absolute', top: 12, left: 12, right: 12,
            background: '#fff', borderRadius: 14,
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            overflow: 'hidden', pointerEvents: 'auto',
          }}>
            {/* 목적지 표시 */}
            <div style={{
              padding: '14px 18px 10px',
              borderBottom: '1px solid #eef2f7',
              fontSize: 16, fontWeight: 700, color: 'var(--text)',
            }}>
              📍 {dest.name}
            </div>

            {/* 모드 탭 */}
            <div style={{ display: 'flex' }}>
              {MODES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  style={{
                    flex: 1, padding: '12px 6px',
                    fontSize: 15, fontWeight: mode === id ? 900 : 600,
                    color: mode === id ? 'var(--primary)' : 'var(--text-soft)',
                    borderBottom: mode === id ? '3px solid var(--primary)' : '3px solid transparent',
                    background: 'none', transition: 'all 120ms',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 경로 정보 */}
            <div style={{ padding: '14px 18px' }}>
              {routeLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-soft)', fontSize: 15 }}>
                  경로 계산 중...
                </div>
              ) : mode === 'walk' && walkInfo ? (
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                  <Stat label="거리" value={fmtDist(walkInfo.meters)} />
                  <Stat label="예상 시간" value={`약 ${walkInfo.mins}분`} />
                </div>
              ) : mode === 'car' && carInfo ? (
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                  <Stat label="예상 시간" value={`약 ${carInfo.mins}분`} />
                  <Stat label="경로" value="카카오 내비" />
                </div>
              ) : mode === 'transit' && transitInfo ? (
                <TransitLegs info={transitInfo} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-soft)', fontSize: 15 }}>
                  {mode === 'transit' ? '대중교통 경로를 찾을 수 없습니다' : '경로 정보 없음'}
                </div>
              )}
            </div>
          </div>

          {/* 안내 시작 버튼 */}
          <button
            data-tutorial="go"
            onClick={startNav}
            style={{
              position: 'absolute', bottom: 20, left: 16, right: 16,
              background: 'var(--primary)', color: '#fff',
              padding: '20px', borderRadius: 18,
              fontSize: 22, fontWeight: 900,
              boxShadow: '0 6px 20px rgba(25,87,200,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              pointerEvents: 'auto',
            }}
          >
            ↗ 안내 시작
          </button>
        </>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function TransitLegs({ info }) {
  const modeIcon = { BUS: '🚌', SUBWAY: '🚇', WALK: '🚶' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 4 }}>
        <Stat label="총 소요" value={`약 ${info.duration}분`} />
        {info.fare > 0 && <Stat label="요금" value={`${info.fare.toLocaleString()}원`} />}
      </div>
      {info.legs.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          {info.legs.map((leg, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {i > 0 && <span style={{ color: 'var(--text-soft)', fontSize: 13 }}>→</span>}
              <span style={{
                background: leg.color || (leg.mode === 'BUS' ? '#0052a4' : leg.mode === 'SUBWAY' ? '#00a84d' : '#888'),
                color: '#fff', borderRadius: 8, padding: '3px 8px',
                fontSize: 13, fontWeight: 700,
              }}>
                {modeIcon[leg.mode] || '•'} {leg.route || `${leg.duration}분`}
              </span>
            </span>
          ))}
        </div>
      )}
      {info.legs[0]?.startName && (
        <div style={{ fontSize: 13, color: 'var(--text-soft)' }}>
          출발: {info.legs[0].startName}
        </div>
      )}
      {info.isEstimate && (
        <div style={{ fontSize: 13, color: 'var(--text-soft)', textAlign: 'center', marginTop: 2 }}>
          ※ 거리 기반 예상 시간 · 실제와 다를 수 있어요
        </div>
      )}
    </div>
  )
}
