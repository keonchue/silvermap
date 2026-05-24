import { useCallback, useEffect, useMemo, useState } from 'react'
import MapCanvas from './MapCanvas.jsx'
import BottomNav from './BottomNav.jsx'
import SearchPanel from './SearchPanel.jsx'
import DirectionsPanel from './DirectionsPanel.jsx'
import PlaceSheet from './PlaceSheet.jsx'
import ReservationModal from './ReservationModal.jsx'
import { useGeolocation, DEFAULT_CENTER } from './useGeolocation.js'
import { usingRealApi } from './placesService.js'
import { CloseIcon, LocationIcon } from './icons.jsx'

export default function App() {
  const [tab, setTab] = useState('map')
  const [markers, setMarkers] = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [reservePlace, setReservePlace] = useState(null)
  const [route, setRoute] = useState(null)
  const [directionsSeed, setDirectionsSeed] = useState(null)
  const [center, setCenter] = useState(DEFAULT_CENTER)

  const { location, status, locate } = useGeolocation()

  // 첫 화면에서 위치 권한 요청
  useEffect(() => { locate() }, [locate])
  useEffect(() => {
    if (location) setCenter(location)
  }, [location])

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
  }

  const headerNote = usingRealApi
    ? null
    : '데모 모드 — 카카오 키를 넣으면 실제 지도가 나옵니다'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <header
        style={{
          flexShrink: 0,
          background: 'var(--primary)',
          color: '#fff',
          padding: '14px 18px',
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>큰지도</h1>
        <p style={{ fontSize: 15, opacity: 0.9 }}>
          {headerNote || '어디든 쉽게 찾아갑니다'}
        </p>
      </header>

      <main style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <MapCanvas
          center={center}
          userLocation={location}
          markers={markers}
          routePath={routePath}
          onMarkerClick={onMarkerClick}
        />

        {/* 지도 화면: 내 위치 버튼 */}
        {tab === 'map' && (
          <button
            onClick={() => { locate(); if (location) setCenter(location) }}
            aria-label="내 위치로 이동"
            style={{
              position: 'absolute', right: 16, bottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
              minHeight: 60, padding: '0 20px', borderRadius: 30,
              background: '#fff', color: 'var(--primary)',
              fontSize: 18, fontWeight: 900,
              boxShadow: 'var(--shadow)', border: '2px solid var(--border)',
            }}
          >
            <LocationIcon size={28} />
            {status === 'loading' ? '찾는 중...' : '내 위치'}
          </button>
        )}

        {/* 검색 / 길찾기 패널 */}
        {tab === 'search' && (
          <Panel title="장소 찾기" onClose={closePanel}>
            <SearchPanel
              from={origin}
              onResults={setMarkers}
              onSelectPlace={setSelectedPlace}
            />
          </Panel>
        )}
        {tab === 'directions' && (
          <Panel title="길찾기" onClose={closePanel}>
            <DirectionsPanel
              key={directionsSeed?.id || 'fresh'}
              from={origin}
              hasMyLocation={!!location}
              initialDest={directionsSeed}
              onRoute={handleRoute}
              onSelectPlace={setSelectedPlace}
            />
          </Panel>
        )}

        {/* 장소 상세 (위로 겹침) */}
        {selectedPlace && (
          <Overlay onClose={() => setSelectedPlace(null)}>
            <Panel
              title={selectedPlace.name}
              onClose={() => setSelectedPlace(null)}
              compactTitle
            >
              <PlaceSheet
                place={selectedPlace}
                onDirections={openDirectionsFor}
                onReserve={(p) => { setSelectedPlace(null); setReservePlace(p) }}
              />
            </Panel>
          </Overlay>
        )}

        {/* 예약/결제 (최상단) */}
        {reservePlace && (
          <Overlay onClose={() => setReservePlace(null)}>
            <Panel title="예약하기" onClose={() => setReservePlace(null)}>
              <ReservationModal
                place={reservePlace}
                onClose={() => setReservePlace(null)}
              />
            </Panel>
          </Overlay>
        )}
      </main>

      <BottomNav
        active={tab}
        onChange={(next) => {
          setSelectedPlace(null)
          if (next === 'directions') setDirectionsSeed(null)
          setTab(next)
        }}
      />
    </div>
  )
}

function Panel({ title, onClose, compactTitle, children }) {
  return (
    <section className="panel" role="dialog" aria-label={title}>
      <div className="panel-header">
        <h2
          className="panel-title"
          style={compactTitle ? { fontSize: 'var(--fs-lg)', flex: 1 } : { flex: 1 }}
        >
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
