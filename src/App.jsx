import { useCallback, useEffect, useRef, useState } from 'react'
import MapCanvas from './MapCanvas.jsx'
import MapHomeOverlay from './MapHomeOverlay.jsx'
import BottomNav from './BottomNav.jsx'
import SearchPanel from './SearchPanel.jsx'
import DirectionsPanel from './DirectionsPanel.jsx'
import PlaceSheet from './PlaceSheet.jsx'
import ReservationModal from './ReservationModal.jsx'
import { useGeolocation, DEFAULT_CENTER } from './useGeolocation.js'
import { CloseIcon } from './icons.jsx'

export default function App() {
  const [tab, setTab] = useState('map')
  const [markers, setMarkers] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [reservePlace, setReservePlace] = useState(null)
  const [route, setRoute] = useState(null)
  const [directionsSeed, setDirectionsSeed] = useState(null)
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [homeSearch, setHomeSearch] = useState(null) // { places, heading }

  const { location, status, locate } = useGeolocation()

  useEffect(() => { locate() }, [locate])
  useEffect(() => { if (location) setCenter(location) }, [location])

  const origin = location || DEFAULT_CENTER
  const routePath = route?.path || null

  const onMarkerClick = useCallback((place) => setSelectedPlace(place), [])

  function openDirectionsFor(place) {
    setSelectedPlace(null)
    setDirectionsSeed(place)
    setRoute(null)
    setMarkers([place])
    setTab('directions')
  }

  function handleRoute(r) {
    setRoute(r)
    setMarkers(r ? [r.dest] : [])
  }

  function closePanel() {
    setTab('map')
    setRoute(null)
    setMarkers([])
  }

  function onTabChange(next) {
    setSelectedPlace(null)
    if (next === 'directions' || next === 'transit') setDirectionsSeed(null)
    if (next === 'search') setHomeSearch(null)
    setTab(next)
  }

  // 홈 탭에서 오버레이 높이(방향바+검색바) ≈ 170px + safe area
  const overlayOffset = tab === 'map' ? 170 : 20

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <main style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <MapCanvas
          center={center}
          userLocation={location}
          markers={markers}
          routePath={routePath}
          onMarkerClick={onMarkerClick}
          onLocateRequest={() => { locate(); if (location) setCenter(location) }}
          overlayOffset={overlayOffset}
        />

        {/* 홈 탭 오버레이 */}
        {tab === 'map' && (
          <MapHomeOverlay
            from={origin}
            onResults={(places, heading) => {
              setMarkers(places)
              setHomeSearch({ places, heading })
              setTab('search')
            }}
            onSelectPlace={setSelectedPlace}
            onOpenDirections={() => setTab('directions')}
          />
        )}

        {/* 검색 패널 */}
        {tab === 'search' && (
          <Panel title="장소 찾기" onClose={closePanel}>
            <SearchPanel
              from={origin}
              onResults={setMarkers}
              onSelectPlace={setSelectedPlace}
              initialResults={homeSearch?.places}
              initialHeading={homeSearch?.heading}
            />
          </Panel>
        )}

        {/* 길찾기 패널 */}
        {(tab === 'directions' || tab === 'transit') && (
          <Panel title="길찾기" onClose={closePanel}>
            <DirectionsPanel
              key={directionsSeed?.id || tab}
              from={origin}
              hasMyLocation={!!location}
              initialDest={directionsSeed}
              initialMode={tab === 'transit' ? 'transit' : 'walk'}
              onRoute={handleRoute}
              onSelectPlace={setSelectedPlace}
            />
          </Panel>
        )}

        {/* 더보기 패널 */}
        {tab === 'more' && (
          <Panel title="더보기" onClose={closePanel}>
            <MorePanel />
          </Panel>
        )}

        {/* 장소 상세 */}
        {selectedPlace && (
          <Overlay onClose={() => setSelectedPlace(null)}>
            <Panel title={selectedPlace.name} onClose={() => setSelectedPlace(null)} compactTitle>
              <PlaceSheet
                place={selectedPlace}
                onDirections={openDirectionsFor}
                onReserve={(p) => { setSelectedPlace(null); setReservePlace(p) }}
              />
            </Panel>
          </Overlay>
        )}

        {/* 예약 */}
        {reservePlace && (
          <Overlay onClose={() => setReservePlace(null)}>
            <Panel title="예약하기" onClose={() => setReservePlace(null)}>
              <ReservationModal place={reservePlace} onClose={() => setReservePlace(null)} />
            </Panel>
          </Overlay>
        )}
      </main>

      <BottomNav active={tab} onChange={onTabChange} />
    </div>
  )
}

function Panel({ title, onClose, compactTitle, children }) {
  const panelRef = useRef(null)
  const touchState = useRef({ startY: null, active: false })

  function onDragStart(e) {
    touchState.current = { startY: e.touches[0].clientY, active: true }
    if (panelRef.current) panelRef.current.style.transition = 'none'
  }

  function onDragMove(e) {
    const { startY, active } = touchState.current
    if (!active) return
    const dy = e.touches[0].clientY - startY
    if (dy > 0 && panelRef.current) {
      panelRef.current.style.transform = `translateY(${dy}px)`
    }
  }

  function onDragEnd(e) {
    const { startY, active } = touchState.current
    if (!active) return
    const dy = e.changedTouches[0].clientY - startY
    touchState.current.active = false
    if (dy > 90) {
      onClose()
    } else if (panelRef.current) {
      panelRef.current.style.transition = 'transform 220ms cubic-bezier(0.34,1.1,0.64,1)'
      panelRef.current.style.transform = ''
    }
  }

  return (
    <section ref={panelRef} className="panel" role="dialog" aria-label={title}>
      <div
        className="panel-handle"
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
      >
        <div className="panel-handle-bar" />
      </div>
      <div
        className="panel-header"
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
      >
        <h2 className="panel-title" style={compactTitle ? { fontSize: 'var(--fs-lg)', flex: 1 } : { flex: 1 }}>
          {title}
        </h2>
        <button className="icon-btn" onClick={onClose} aria-label="닫기">
          <CloseIcon size={32} />
        </button>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  )
}

function Overlay({ onClose, children }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      {children}
    </>
  )
}

function MorePanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[
        { label: '사용 도움말', desc: '앱 사용 방법을 알려드립니다' },
        { label: '글자 크기 설정', desc: '화면 글자 크기를 조절합니다' },
        { label: '자주 묻는 질문', desc: '궁금한 점을 확인하세요' },
        { label: '앱 정보', desc: '큰지도 버전 정보' },
      ].map(({ label, desc }) => (
        <button
          key={label}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            padding: '16px 18px', background: 'var(--surface)',
            border: '2px solid var(--border)', borderRadius: 'var(--radius)',
            textAlign: 'left', gap: 4,
          }}
        >
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{label}</span>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>{desc}</span>
        </button>
      ))}

      <div style={{
        marginTop: 8, padding: '14px 18px',
        background: '#fff8e1', border: '2px solid #b25e00',
        borderRadius: 'var(--radius)', fontSize: 'var(--fs-sm)', color: '#7a3f00',
        lineHeight: 1.7,
      }}>
        어려우신가요? 가족이나 주변 분에게 도움을 요청하시거나,
        전화로 문의해 주세요.
      </div>
    </div>
  )
}
