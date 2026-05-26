import { useEffect, useRef, useState } from 'react'
import { loadKakaoSdk, isKakaoKeyConfigured } from './kakaoLoader.js'
import { CATEGORIES } from './categories.js'
import { PinIcon, PlusIcon, MinusIcon, LocationIcon, NorthIcon, LayersIcon } from './icons.jsx'

const catColor = (id) =>
  CATEGORIES.find((c) => c.id === id)?.color || '#1957c8'

/* ===== 실제 카카오 지도 ===== */
function RealMap({ center, userLocation, markers, routePath, onMarkerClick, onLocateRequest, overlayOffset }) {
  const boxRef = useRef(null)
  const mapRef = useRef(null)
  const objsRef = useRef([])
  const [failed, setFailed] = useState(false)

  function zoomIn() { mapRef.current?.setLevel(mapRef.current.getLevel() - 1) }
  function zoomOut() { mapRef.current?.setLevel(mapRef.current.getLevel() + 1) }
  function goToUser() {
    if (!userLocation) { onLocateRequest?.(); return }
    const kakao = window.kakao
    if (mapRef.current && kakao) {
      mapRef.current.panTo(new kakao.maps.LatLng(userLocation.lat, userLocation.lng))
    }
    onLocateRequest?.()
  }

  // 지도 생성
  useEffect(() => {
    let alive = true
    loadKakaoSdk()
      .then((kakao) => {
        if (!alive || !boxRef.current) return
        mapRef.current = new kakao.maps.Map(boxRef.current, {
          center: new kakao.maps.LatLng(center.lat, center.lng),
          level: 4,
        })
      })
      .catch(() => setFailed(true))
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 중심 이동
  useEffect(() => {
    const kakao = window.kakao
    if (!kakao || !mapRef.current) return
    mapRef.current.panTo(new kakao.maps.LatLng(center.lat, center.lng))
  }, [center])

  // 마커 / 경로 다시 그리기
  useEffect(() => {
    const kakao = window.kakao
    if (!kakao || !mapRef.current) return
    const map = mapRef.current

    objsRef.current.forEach((o) => o.setMap(null))
    objsRef.current = []

    markers.forEach((m) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(m.lat, m.lng),
        map,
      })
      kakao.maps.event.addListener(marker, 'click', () => onMarkerClick(m))
      const label = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(m.lat, m.lng),
        yAnchor: 2.1,
        content: `<div style="background:#fff;border:2px solid ${catColor(
          m.category,
        )};border-radius:10px;padding:4px 10px;font-size:15px;font-weight:700;color:#15233b;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2)">${m.name}</div>`,
      })
      label.setMap(map)
      objsRef.current.push(marker, label)
    })

    if (userLocation) {
      const dot = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(userLocation.lat, userLocation.lng),
        content:
          '<div style="width:24px;height:24px;background:#1957c8;border:4px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(25,87,200,.35)"></div>',
      })
      dot.setMap(map)
      objsRef.current.push(dot)
    }

    if (routePath && routePath.length > 1) {
      const line = new kakao.maps.Polyline({
        path: routePath.map((p) => new kakao.maps.LatLng(p.lat, p.lng)),
        strokeWeight: 8,
        strokeColor: '#1957c8',
        strokeOpacity: 0.9,
      })
      line.setMap(map)
      objsRef.current.push(line)

      const bounds = new kakao.maps.LatLngBounds()
      routePath.forEach((p) => bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)))
      map.setBounds(bounds, 80, 80, 80, 80)
    }
  }, [markers, userLocation, routePath, onMarkerClick])

  if (failed) return <DemoMap {...{ center, userLocation, markers, routePath, onMarkerClick }} note="지도를 불러오지 못했어요" />

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={boxRef} style={{ position: 'absolute', inset: 0 }} />
      <MapControls
        top={overlayOffset ?? 20}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onLocation={goToUser}
      />
    </div>
  )
}

/* ===== 데모 지도 (카카오 키 없을 때) ===== */
function DemoMap({ center, userLocation, markers, routePath, onMarkerClick, note }) {
  const pts = [
    center,
    ...(userLocation ? [userLocation] : []),
    ...markers,
    ...(routePath || []),
  ]
  let minLat = Math.min(...pts.map((p) => p.lat))
  let maxLat = Math.max(...pts.map((p) => p.lat))
  let minLng = Math.min(...pts.map((p) => p.lng))
  let maxLng = Math.max(...pts.map((p) => p.lng))
  // 점이 하나뿐일 때를 대비한 최소 범위
  const padLat = Math.max((maxLat - minLat) * 0.25, 0.004)
  const padLng = Math.max((maxLng - minLng) * 0.25, 0.004)
  minLat -= padLat; maxLat += padLat; minLng -= padLng; maxLng += padLng

  const projX = (lng) => ((lng - minLng) / (maxLng - minLng)) * 100
  const projY = (lat) => ((maxLat - lat) / (maxLat - minLat)) * 100

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        background:
          'repeating-linear-gradient(0deg,#e8eef7 0 39px,#dbe4f1 39px 40px),' +
          'repeating-linear-gradient(90deg,#eef2f9 0 39px,#dbe4f1 39px 40px)',
      }}
    >
      <div
        style={{
          position: 'absolute', top: 14, left: 14, right: 14,
          background: '#fff8e1', border: '2px solid #b25e00',
          borderRadius: 12, padding: '10px 14px',
          fontSize: 16, fontWeight: 700, color: '#7a3f00',
        }}
      >
        {note || '데모 지도입니다. 카카오 키를 넣으면 실제 지도가 나옵니다.'}
      </div>

      {routePath && routePath.length > 1 && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <polyline
            points={routePath.map((p) => `${projX(p.lng)},${projY(p.lat)}`).join(' ')}
            fill="none" stroke="#1957c8" strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {userLocation && (
        <Dot x={projX(userLocation.lng)} y={projY(userLocation.lat)}>
          <div
            style={{
              width: 26, height: 26, background: '#1957c8',
              border: '4px solid #fff', borderRadius: '50%',
              boxShadow: '0 0 0 5px rgba(25,87,200,.3)',
            }}
          />
        </Dot>
      )}

      {markers.map((m) => (
        <Dot key={m.id} x={projX(m.lng)} y={projY(m.lat)}>
          <button
            onClick={() => onMarkerClick(m)}
            aria-label={`${m.name} 선택`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              color: catColor(m.category),
            }}
          >
            <span
              style={{
                background: '#fff', border: `2px solid ${catColor(m.category)}`,
                borderRadius: 10, padding: '3px 9px', fontSize: 14,
                fontWeight: 700, color: '#15233b', whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,.2)', marginBottom: 2,
                maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {m.name}
            </span>
            <PinIcon size={40} />
          </button>
        </Dot>
      ))}
    </div>
  )
}

function Dot({ x, y, children }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${Math.min(Math.max(x, 4), 96)}%`,
        top: `${Math.min(Math.max(y, 8), 92)}%`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {children}
    </div>
  )
}

function MapControls({ top, onZoomIn, onZoomOut, onLocation }) {
  return (
    <div style={{
      position: 'absolute', right: 12, top,
      display: 'flex', flexDirection: 'column', gap: 10, zIndex: 5,
    }}>
      {[
        { label: '확대',   Icon: PlusIcon,     fn: onZoomIn },
        { label: '축소',   Icon: MinusIcon,    fn: onZoomOut },
        { label: '내 위치', Icon: LocationIcon, fn: onLocation, tutAttr: 'my-location' },
      ].map(({ label, Icon, fn, tutAttr }) => (
        <button
          key={label}
          aria-label={label}
          onClick={fn}
          data-tutorial={tutAttr}
          style={{
            width: 54, height: 54, borderRadius: '50%',
            background: '#fff', border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 2,
            color: 'var(--text)',
          }}
        >
          <Icon size={22} />
          <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
        </button>
      ))}
    </div>
  )
}

export default function MapCanvas(props) {
  return isKakaoKeyConfigured() ? <RealMap {...props} /> : <DemoMap {...props} />
}
