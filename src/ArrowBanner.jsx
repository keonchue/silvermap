import { useEffect, useState } from 'react'

export default function ArrowBanner() {
  const [heading, setHeading] = useState(0)

  useEffect(() => {
    function onOrient(e) {
      const h =
        typeof e.webkitCompassHeading === 'number'
          ? e.webkitCompassHeading
          : e.alpha != null ? 360 - e.alpha : null
      if (h != null) setHeading(Math.round(h))
    }
    window.addEventListener('deviceorientation', onOrient, true)
    return () => window.removeEventListener('deviceorientation', onOrient, true)
  }, [])

  // iOS: 마운트 즉시 방향 권한 요청 (탭하지 않아도 자동)
  useEffect(() => {
    async function autoRequest() {
      try {
        if (typeof DeviceOrientationEvent?.requestPermission === 'function')
          await DeviceOrientationEvent.requestPermission()
      } catch {}
    }
    autoRequest()
  }, [])

  async function requestPermission() {
    try {
      if (typeof DeviceOrientationEvent?.requestPermission === 'function')
        await DeviceOrientationEvent.requestPermission()
    } catch {}
  }

  return (
    <div style={{
      background: 'var(--card)',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'calc(56px + env(safe-area-inset-top, 0px))',
      flexShrink: 0,
      zIndex: 16,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <button
        onClick={requestPermission}
        aria-label="내가 바라보는 방향"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${-heading}deg)`,
          transition: 'transform 200ms ease-out',
          filter: 'drop-shadow(0 3px 8px rgba(220,38,38,0.55))',
          animation: 'arrow-bob 2s ease-in-out infinite',
        }}
      >
        <svg viewBox="0 0 36 52" width="36" height="52" aria-hidden="true">
          <path d="M18 3 L31 47 L18 37 L5 47 Z" fill="#dc2626" />
        </svg>
      </button>
    </div>
  )
}
