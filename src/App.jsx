import { useCallback, useEffect, useRef, useState } from 'react'
import MapCanvas from './MapCanvas.jsx'
import BottomNav from './BottomNav.jsx'
import SearchPanel from './SearchPanel.jsx'
import FindFlow from './FindFlow.jsx'
import ReserveFlow from './ReserveFlow.jsx'
import PlaceSheet from './PlaceSheet.jsx'
import ReservationModal from './ReservationModal.jsx'
import Tutorial from './Tutorial.jsx'
import DirectionBanner from './DirectionBanner.jsx'
import TransitPanel from './TransitPanel.jsx'
import ReservePanel from './ReservePanel.jsx'
import {
  TUTORIALS, isTutorialSeen, markTutorialSeen, resetAllTutorials,
} from './tutorialConfig.js'
import { useGeolocation, DEFAULT_CENTER } from './useGeolocation.js'
import { CloseIcon } from './icons.jsx'
import { searchByKeyword } from './placesService.js'

export default function App() {
  // tab: 'home' | 'directions' | 'reserve' | 'transit' | 'more'
  const [tab, setTab]                   = useState('home')
  const [markers, setMarkers]           = useState([])
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [reservePlace, setReservePlace]   = useState(null)
  const [route, setRoute]               = useState(null)
  const [directionsSeed, setDirectionsSeed] = useState(null)
  const [center, setCenter]             = useState(DEFAULT_CENTER)
  const [searchResult, setSearchResult] = useState(null) // { places, query }
  const [flowResults, setFlowResults]   = useState([])   // 길찾기 검색 결과
  const [flowLoading, setFlowLoading]   = useState(false)
  const [reserveResults, setReserveResults] = useState([])  // 예약 검색 결과
  const [reserveSelected, setReserveSelected] = useState(null) // 예약 선택된 장소
  const [transitQuery, setTransitQuery] = useState('')

  // 튜토리얼 상태
  const [tutTab, setTutTab]   = useState(null)
  const [tutStep, setTutStep] = useState(0)
  const tutSteps = tutTab ? TUTORIALS[tutTab] : null

  function maybeStartTutorial(nextTab) {
    if (TUTORIALS[nextTab]) {
      setTutTab(nextTab); setTutStep(0)
    }
  }
  function nextTutorialStep() {
    if (!tutSteps) return
    if (tutStep + 1 >= tutSteps.length) {
      markTutorialSeen(tutTab); setTutTab(null); setTutStep(0)
    } else {
      setTutStep(tutStep + 1)
    }
  }
  function closeTutorial() {
    if (tutTab) markTutorialSeen(tutTab)
    setTutTab(null); setTutStep(0)
  }

  const { location, locate } = useGeolocation()
  useEffect(() => { locate() }, [locate])
  useEffect(() => { if (location) setCenter(location) }, [location])

  const origin    = location || DEFAULT_CENTER
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
    setFlowResults([]) // 목적지 선택 후 결과 드롭다운 닫기
  }

  function closePanel() {
    setTab(null)
    setRoute(null)
    setMarkers([])
    setSearchResult(null)
    setFlowResults([])
    setReserveResults([])
    setReserveSelected(null)
    setTransitQuery('')
  }

  function onTabChange(next) {
    setSelectedPlace(null)
    if (tab === next && next !== 'home') { closePanel(); return }
    if (next !== 'directions') setDirectionsSeed(null)
    // 탭 전환 시 이전 탭 flow 상태 초기화
    setFlowResults([])
    setReserveResults([])
    setReserveSelected(null)
    setTransitQuery('')
    setTab(next)
    maybeStartTutorial(next)
  }

  // 최상단 검색창 — 활성 탭에 따라 라우팅
  async function onBannerSearch(query) {
    if (!query) return

    if (tab === 'directions') {
      setFlowLoading(true)
      const places = await searchByKeyword(query, origin)
      setFlowResults(places)
      setFlowLoading(false)
      if (tutSteps && tutStep === 0) nextTutorialStep()
      return
    }

    if (tab === 'reserve') {
      setFlowLoading(true)
      const places = await searchByKeyword(query, origin)
      setReserveResults(places)
      setFlowLoading(false)
      if (tutSteps && tutStep === 0) nextTutorialStep()
      return
    }

    if (tab === 'transit') {
      setTransitQuery(query)
      if (tutSteps && tutStep === 0) nextTutorialStep()
      return
    }

    // 기본: 지도 마커 검색
    const places = await searchByKeyword(query, origin)
    setMarkers(places)
    setSearchResult({ places, query })
    if (!tab) setTab('search-result')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* ① 최상단: 방향 배너 + 검색창 (탭에 따라 placeholder 변경) */}
      <DirectionBanner
        onSearch={onBannerSearch}
        placeholder={
          tab === 'directions' ? '목적지를 검색하세요' :
          tab === 'reserve'    ? '예약할 장소를 검색하세요' :
          tab === 'transit'    ? '노선번호 또는 정류장 검색' :
          '검색하기'
        }
      />

      {/* ② 중앙: 지도 영역 */}
      <main style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* 카카오 지도 */}
        <MapCanvas
          center={center}
          userLocation={location}
          markers={markers}
          routePath={routePath}
          onMarkerClick={onMarkerClick}
          onLocateRequest={() => { locate(); if (location) setCenter(location) }}
          overlayOffset={16}
        />


        {/* 홈 탭 — 장소 검색 + 카테고리 + 결과에서 바로 길찾기/예약/전화 */}
        {tab === 'home' && (
          <Panel title="장소 찾기" onClose={() => {}} full hideHeader>
            <SearchPanel
              from={origin}
              onResults={setMarkers}
              onSelectPlace={setSelectedPlace}
            />
          </Panel>
        )}

        {/* 검색 결과 패널 (배너 검색용) */}
        {tab === 'search-result' && searchResult && (
          <Panel title={`'${searchResult.query}' 검색 결과`} onClose={closePanel}>
            <SearchPanel
              from={origin}
              onResults={setMarkers}
              onSelectPlace={setSelectedPlace}
              initialResults={searchResult.places}
              initialHeading={searchResult.query}
            />
          </Panel>
        )}

        {/* 길찾기 — 지도 위 오버레이, 튜토리얼이 단계별 안내 */}
        {tab === 'directions' && (
          <FindFlow
            key={directionsSeed?.id || 'directions'}
            from={origin}
            initialDest={directionsSeed}
            results={flowResults}
            loading={flowLoading}
            onRoute={handleRoute}
            onTutAdvance={nextTutorialStep}
          />
        )}

        {/* 예약하기 — 검색 결과 오버레이 (길찾기와 동일한 UX) */}
        {tab === 'reserve' && !reserveSelected && (
          <ReserveFlow
            results={reserveResults}
            loading={flowLoading}
            onSelectPlace={(p) => { setReserveSelected(p); setReserveResults([]) }}
            onTutAdvance={nextTutorialStep}
          />
        )}
        {/* 장소 선택 후: 예약 마법사 전체 화면 */}
        {tab === 'reserve' && reserveSelected && (
          <Panel title={reserveSelected.name} onClose={() => setReserveSelected(null)} full compactTitle>
            <ReservePanel initialPlace={reserveSelected} onTutAdvance={nextTutorialStep} />
          </Panel>
        )}

        {/* 대중교통 패널 (전체 화면) */}
        {tab === 'transit' && (
          <Panel title="대중교통" onClose={closePanel} full>
            <TransitPanel externalQuery={transitQuery} userLocation={location} onTutAdvance={nextTutorialStep} />
          </Panel>
        )}

        {/* 더보기 패널 */}
        {tab === 'more' && (
          <Panel title="더 보기" onClose={closePanel}>
            <MorePanel onReplayTutorials={() => {
              resetAllTutorials()
              setTab('directions')
              maybeStartTutorial('directions')
            }} />
          </Panel>
        )}

        {/* 장소 상세 시트 */}
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

        {/* 예약 모달 (장소 상세에서 예약하기 버튼) */}
        {reservePlace && (
          <Overlay onClose={() => setReservePlace(null)}>
            <Panel title="예약하기" onClose={() => setReservePlace(null)}>
              <ReservationModal place={reservePlace} onClose={() => setReservePlace(null)} />
            </Panel>
          </Overlay>
        )}
      </main>

      {/* ③ 하단: 4탭 네비게이션 */}
      <BottomNav active={tab} onChange={onTabChange} />

      {/* 게임식 튜토리얼 오버레이 */}
      {tutSteps && (
        <Tutorial
          steps={tutSteps}
          stepIndex={tutStep}
          onNext={nextTutorialStep}
          onClose={closeTutorial}
        />
      )}
    </div>
  )
}

/* ===== Panel: 지도 위로 올라오는 바텀 시트 (full=true이면 전체 화면) ===== */
function Panel({ title, onClose, compactTitle, children, full, hideHeader }) {
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
    if (dy > 0 && panelRef.current) panelRef.current.style.transform = `translateY(${dy}px)`
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
    <section ref={panelRef} className={`panel${full ? ' panel-full' : ''}`} role="dialog" aria-label={title}>
      <div
        className="panel-handle"
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onDragEnd}
      >
        <div className="panel-handle-bar" />
      </div>
      {!hideHeader && (
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
      )}
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

function MorePanel({ onReplayTutorials }) {
  const items = [
    { label: '사용 도움말 다시 보기', desc: '튜토리얼을 처음부터 다시 보여드려요', onClick: onReplayTutorials },
    { label: '글자 크기 설정', desc: '화면 글자 크기를 조절합니다' },
    { label: '자주 묻는 질문', desc: '궁금한 점을 확인하세요' },
    { label: '앱 정보', desc: '큰지도 버전 정보' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map(({ label, desc, onClick }) => (
        <button
          key={label}
          onClick={onClick}
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
