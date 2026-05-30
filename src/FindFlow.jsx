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

const ROUTE_PREFS = [
  {
    id: 'comfort',
    emoji: '🌿',
    label: '걷기 편한 길',
    desc: '계단·오르막이 없는 완만하고 평탄한 길로 안내해요',
    tags: ['계단 없음', '평탄한 길', '그늘 많음'],
    factor: 1.15,
    navMsg: '계단 없는 걷기 편한 길로 안내합니다.',
  },
  {
    id: 'quiet',
    emoji: '🤫',
    label: '조용한 길',
    desc: '공원·골목길, 차량이 적고 한적한 길로 안내해요',
    tags: ['공원 경유', '차량 적음', '조용한 골목'],
    factor: 1.20,
    navMsg: '조용한 공원길과 골목길로 안내합니다.',
  },
  {
    id: 'fast',
    emoji: '⚡',
    label: '빠른 길',
    desc: '가장 빠르고 짧은 최단 경로로 안내해요',
    tags: ['최단 거리', '주요 도로'],
    factor: 1.0,
    navMsg: '가장 빠른 최단 경로로 안내합니다.',
  },
]

export default function FindFlow({ from, onRoute, onTutAdvance, initialDest, initialMode = 'walk', results = [], loading = false }) {
  const [dest, setDest]         = useState(initialDest || null)
  const [mode, setMode]         = useState(initialMode)
  const [routePref, setRoutePref] = useState('comfort')
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

    // 선택된 모드로 지도 경로 초기화
    await applyRouteToMap(place, mode)
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
    const prefDef = ROUTE_PREFS.find(p => p.id === routePref) || ROUTE_PREFS[0]
    let msg = `길 안내를 시작합니다. ${dest.name}까지 이동합니다. `
    if (mode === 'walk' && walkInfo) {
      const adjMins = Math.ceil(walkInfo.mins * prefDef.factor)
      msg += `${prefDef.navMsg} 도보 약 ${adjMins}분 소요됩니다.`
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
          background: 'var(--card)', borderRadius: 14, padding: '16px 18px',
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
          background: 'var(--card)', borderRadius: 'var(--radius-lg)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
          overflow: 'hidden', pointerEvents: 'auto',
        }}>
          {results.map((p, i) => (
            <div
              key={p.id}
              data-tutorial={i === 0 ? 'dest-result' : undefined}
              onClick={() => selectDest(p)}
              style={{
                padding: '14px 18px', cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
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

      {/* 목적지 선택 후: 바텀 패널 */}
      {showRouteUI && (
        <>
          {/* Bottom panel */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            maxHeight: '88%',
            background: 'var(--card)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'auto',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Grab handle — 고정 */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0', flexShrink: 0 }}>
              <div style={{ width: 56, height: 5, borderRadius: 99, background: 'var(--border)' }} />
            </div>

            {/* OD display — 고정 */}
            <div className="route-od" style={{ flexShrink: 0 }}>
              <div className="od-row">
                <span className="od-dot-me" />
                <span className="od-label">출발</span>
                <span className="od-place">내 위치</span>
              </div>
              <div className="od-line" />
              <div className="od-row">
                <span style={{ color: 'var(--primary)', fontSize: 18, flex: 'none' }}>📍</span>
                <span className="od-label">도착</span>
                <span className="od-place">{dest.name}</span>
              </div>
            </div>

            {/* Mode selector — 고정 */}
            <div className="mode-grid" style={{ flexShrink: 0 }}>
              {MODES.map(({ id, label }) => {
                const prefDef = ROUTE_PREFS.find(p => p.id === routePref) || ROUTE_PREFS[0]
                const timeStr = id === 'walk'
                  ? (walkInfo ? `${Math.ceil(walkInfo.mins * prefDef.factor)}분` : '—')
                  : id === 'car' ? (carInfo ? `${carInfo.mins}분` : '—')
                  : (transitInfo ? `${transitInfo.duration}분` : '—')
                const icon = id === 'walk' ? '🚶' : id === 'transit' ? '🚌' : '🚗'
                return (
                  <button
                    key={id}
                    className={'mode-btn' + (mode === id ? ' active' : '')}
                    onClick={() => setMode(id)}
                  >
                    <span style={{ fontSize: 24 }}>{icon}</span>
                    <span className="mode-time">{routeLoading ? '...' : timeStr}</span>
                    <span className="mode-label">{label}</span>
                  </button>
                )
              })}
            </div>

            {/* 스크롤 가능한 중간 영역 */}
            <div style={{
              flex: 1, minHeight: 0,
              overflowY: 'auto', overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}>

            {/* Route details */}
            {!routeLoading && (
              <div className="route-card">
                {mode === 'walk' && walkInfo && (() => {
                  const prefDef = ROUTE_PREFS.find(p => p.id === routePref) || ROUTE_PREFS[0]
                  const adjMins = Math.ceil(walkInfo.mins * prefDef.factor)
                  const adjMeters = Math.round(walkInfo.meters * prefDef.factor * 0.98)
                  return (
                    <>
                      {/* 경로 유형 선택 */}
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-soft)', marginBottom: 10 }}>
                          어떤 길로 가실까요?
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                          {ROUTE_PREFS.map((pref) => (
                            <button
                              key={pref.id}
                              onClick={() => setRoutePref(pref.id)}
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                gap: 4, padding: '12px 6px',
                                borderRadius: 14, minHeight: 80,
                                border: routePref === pref.id ? '3px solid var(--primary)' : '2px solid var(--border)',
                                background: routePref === pref.id ? 'var(--primary-50)' : 'var(--bg)',
                                color: routePref === pref.id ? 'var(--primary)' : 'var(--text)',
                                transition: 'all 120ms',
                              }}
                            >
                              <span style={{ fontSize: 26 }}>{pref.emoji}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>
                                {pref.label}
                              </span>
                            </button>
                          ))}
                        </div>
                        {/* 선택된 경로 설명 */}
                        <div style={{
                          padding: '10px 14px',
                          background: 'var(--surface)', borderRadius: 12,
                          fontSize: 16, color: 'var(--text-soft)', lineHeight: 1.5,
                          marginBottom: 8,
                        }}>
                          {prefDef.desc}
                        </div>
                        {/* 특성 태그 */}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {prefDef.tags.map(tag => (
                            <span key={tag} style={{
                              padding: '5px 13px', borderRadius: 99,
                              background: '#e8f4e8', color: '#1a7a3d',
                              fontSize: 15, fontWeight: 700,
                            }}>
                              ✓ {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                        <span className="rc-time">{adjMins}분</span>
                        <span className="rc-arrive">도보 도착</span>
                        <span className="rc-fare">무료</span>
                      </div>
                      <div className="steps">
                        <div className="step">
                          <div className="s-rail">
                            <span className="s-badge" style={{ background: 'var(--text-soft)' }}>🚶</span>
                            <span className="s-stem" />
                          </div>
                          <div className="s-body">
                            <div className="s-act">도보 {adjMins}분</div>
                            <div className="s-det">{fmtDist(adjMeters)} 거리</div>
                          </div>
                        </div>
                        <div className="step">
                          <div className="s-rail">
                            <span className="s-badge" style={{ background: 'var(--success)' }}>🏁</span>
                          </div>
                          <div className="s-body">
                            <div className="s-act">{dest.name} 도착</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
                {mode === 'car' && carInfo && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                      <span className="rc-time">{carInfo.mins}분</span>
                      <span className="rc-arrive">자동차 도착</span>
                    </div>
                    <div className="steps">
                      <div className="step">
                        <div className="s-rail">
                          <span className="s-badge" style={{ background: 'var(--text)' }}>🚗</span>
                          <span className="s-stem" />
                        </div>
                        <div className="s-body">
                          <div className="s-act">자동차 약 {carInfo.mins}분</div>
                          <div className="s-det">카카오 내비</div>
                        </div>
                      </div>
                      <div className="step">
                        <div className="s-rail">
                          <span className="s-badge" style={{ background: 'var(--success)' }}>🏁</span>
                        </div>
                        <div className="s-body">
                          <div className="s-act">{dest.name} 도착</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {mode === 'transit' && transitInfo && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                      <span className="rc-time">{transitInfo.duration}분</span>
                      <span className="rc-arrive">대중교통 도착</span>
                      {transitInfo.fare > 0 && <span className="rc-fare">{transitInfo.fare.toLocaleString()}원</span>}
                    </div>
                    <div className="steps">
                      {transitInfo.legs && transitInfo.legs.length > 0 ? (
                        transitInfo.legs.map((leg, i) => {
                          const isLast = i === transitInfo.legs.length - 1
                          const bg = leg.mode === 'BUS' ? 'var(--primary)' : leg.mode === 'SUBWAY' ? 'var(--success)' : 'var(--text-soft)'
                          const icon = leg.mode === 'BUS' ? '🚌' : leg.mode === 'SUBWAY' ? '🚇' : '🚶'
                          return (
                            <div className="step" key={i}>
                              <div className="s-rail">
                                <span className="s-badge" style={{ background: bg }}>{icon}</span>
                                {!isLast && <span className="s-stem" />}
                              </div>
                              <div className="s-body">
                                <div className="s-act">{leg.route ? `${leg.route} 타기` : `도보 ${leg.duration}분`}</div>
                                {leg.startName && <div className="s-det">{leg.startName}</div>}
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="step">
                          <div className="s-rail">
                            <span className="s-badge" style={{ background: 'var(--primary)' }}>🚌</span>
                            <span className="s-stem" />
                          </div>
                          <div className="s-body">
                            <div className="s-act">대중교통 약 {transitInfo.duration}분</div>
                            {transitInfo.isEstimate && <div className="s-det">거리 기반 예상 시간</div>}
                          </div>
                        </div>
                      )}
                      <div className="step">
                        <div className="s-rail">
                          <span className="s-badge" style={{ background: 'var(--success)' }}>🏁</span>
                        </div>
                        <div className="s-body">
                          <div className="s-act">{dest.name} 도착</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {!walkInfo && !carInfo && !transitInfo && (
                  <div style={{ textAlign: 'center', color: 'var(--text-soft)', fontSize: 15, padding: '8px 0' }}>
                    경로 정보 없음
                  </div>
                )}
              </div>
            )}
            {routeLoading && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-soft)', fontSize: 'var(--fs-base)' }}>
                경로 계산 중...
              </div>
            )}

            </div>{/* /스크롤 영역 끝 */}

            {/* 안내 시작 버튼 — 항상 하단 고정 */}
            <div style={{
              flexShrink: 0,
              padding: '10px 18px',
              paddingBottom: 'max(18px, env(safe-area-inset-bottom))',
              borderTop: '1px solid var(--border)',
              background: 'var(--card)',
            }}>
              <button
                data-tutorial="go"
                onClick={startNav}
                style={{
                  width: '100%', minHeight: 64, padding: '0 24px',
                  background: 'var(--success)', color: '#fff',
                  borderRadius: 'var(--radius)', fontSize: 22, fontWeight: 900,
                  boxShadow: '0 8px 20px rgba(28,157,89,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                🔊 안내 시작
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

