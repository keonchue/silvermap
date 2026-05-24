import { useCallback, useState } from 'react'

// 서울 시청 — 위치 권한이 없을 때 쓰는 기본 좌표
export const DEFAULT_CENTER = { lat: 37.5663, lng: 126.9779 }

export function useGeolocation() {
  const [location, setLocation] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | done | error

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setStatus('done')
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    )
  }, [])

  return { location, status, locate }
}
