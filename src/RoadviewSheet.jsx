import { useEffect, useRef, useState } from 'react'
import { loadKakaoSdk, isKakaoKeyConfigured } from './kakaoLoader.js'

export default function RoadviewSheet({ place, onConfirm, onSkip }) {
  const containerRef = useRef(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'unavailable'

  useEffect(() => {
    console.log('[RV] useEffect, key설정?', isKakaoKeyConfigured(), 'KEY:', import.meta.env.VITE_KAKAO_MAP_KEY?.slice(0,6))
    if (!isKakaoKeyConfigured()) { onSkip(); return }
    let alive = true

    async function load() {
      try {
        console.log('[RV] loadKakaoSdk 시작')
        const kakao = await loadKakaoSdk()
        console.log('[RV] SDK 로드 완료, RoadviewClient:', !!kakao.maps.RoadviewClient)
        if (!alive || !containerRef.current) return

        if (!kakao.maps.RoadviewClient) {
          console.log('[RV] RoadviewClient 없음 → skip')
          onSkip(); return
        }

        const latlng = new kakao.maps.LatLng(place.lat, place.lng)
        console.log('[RV] getNearestPanoId 호출:', place.lat, place.lng)
        const client = new kakao.maps.RoadviewClient()

        client.getNearestPanoId(latlng, 100, (panoId, rvStatus) => {
          console.log('[RV] panoId:', panoId, 'status:', rvStatus)
          if (!alive || !containerRef.current) return
          if (rvStatus === kakao.maps.services.Status.OK) {
            const rv = new kakao.maps.Roadview(containerRef.current)
            rv.setPanoId(panoId, latlng)
            if (alive) setStatus('ready')
          } else {
            if (alive) {
              setStatus('unavailable')
              setTimeout(() => { if (alive) onSkip() }, 1800)
            }
          }
        })
      } catch (e) {
        console.log('[RV] 에러:', e)
        if (alive) onSkip()
      }
    }

    load()
    return () => { alive = false }
  }, [place, onSkip])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        background: '#111',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* 헤더 */}
      <div style={{
        padding: '14px 20px',
        paddingTop: 'max(14px, env(safe-area-inset-top))',
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: '#aaa', fontWeight: 700, marginBottom: 3 }}>
            목적지 미리 보기
          </div>
          <div style={{
            fontSize: 'var(--fs-xl)', color: '#fff', fontWeight: 900,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {place.name}
          </div>
          {place.address && (
            <div style={{ fontSize: 'var(--fs-sm)', color: '#999', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {place.address}
            </div>
          )}
        </div>
        <button
          onClick={onSkip}
          style={{
            color: '#ccc', fontSize: 'var(--fs-sm)', fontWeight: 700,
            background: 'rgba(255,255,255,0.13)',
            borderRadius: 10, padding: '8px 14px', flexShrink: 0,
          }}
        >
          건너뛰기
        </button>
      </div>

      {/* 로드뷰 컨테이너 */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
            color: '#ccc',
          }}>
            <span style={{ fontSize: 52 }}>🗺️</span>
            <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>
              목적지 로드뷰 불러오는 중...
            </span>
          </div>
        )}
        {status === 'unavailable' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 14, color: '#aaa',
          }}>
            <span style={{ fontSize: 52 }}>🏙️</span>
            <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#ddd' }}>
              이 위치는 로드뷰가 없어요
            </span>
            <span style={{ fontSize: 'var(--fs-sm)' }}>바로 길찾기로 이동합니다...</span>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      {status === 'ready' && (
        <div style={{
          flexShrink: 0,
          padding: '14px 20px',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
          background: 'rgba(0,0,0,0.9)',
        }}>
          <button
            onClick={onConfirm}
            style={{
              width: '100%', minHeight: 64,
              background: 'var(--success)', color: '#fff',
              borderRadius: 'var(--radius)', fontSize: 22, fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 20px rgba(28,157,89,.4)',
            }}
          >
            🔍 이 곳으로 길찾기
          </button>
        </div>
      )}
    </div>
  )
}
