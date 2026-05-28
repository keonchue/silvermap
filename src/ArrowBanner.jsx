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

  async function requestPermission() {
    try {
      if (typeof DeviceOrientationEvent?.requestPermission === 'function')
        await DeviceOrientationEvent.requestPermission()
    } catch {}
  }

  return (
    <div style={{
      background: '#fff',
      paddingTop: 'env(safe-area-inset-top, 0px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'calc(44px + env(safe-area-inset-top, 0px))',
      flexShrink: 0,
      zIndex: 16,
      boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
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
          filter: 'drop-shadow(0 2px 6px rgba(220,38,38,0.5))',
          animation: 'arrow-bob 2s ease-in-out infinite',
        }}
      >
        <svg viewBox="0 0 28 40" width="28" height="40" aria-hidden="true">
          <path d="M14 2 L24 36 L14 28 L4 36 Z" fill="#dc2626" />
        </svg>
      </button>
    </div>
  )
}
