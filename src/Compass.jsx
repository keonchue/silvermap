import { useEffect, useState } from 'react'
import { NorthIcon } from './icons.jsx'

// 상단 가운데에 떠 있는 빨간 방향 화살표.
export default function Compass({ topOffset = 12 }) {
  const [heading, setHeading] = useState(0)
  const [hasOrient, setHasOrient] = useState(false)

  useEffect(() => {
    function onOrient(e) {
      const h =
        typeof e.webkitCompassHeading === 'number'
          ? e.webkitCompassHeading
          : e.alpha != null
          ? 360 - e.alpha
          : null
      if (h != null) {
        setHeading(h)
        setHasOrient(true)
      }
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
    <button
      className="compass"
      style={{ top: topOffset, cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
      onClick={requestPermission}
      aria-label={hasOrient ? '내가 바라보는 방향' : '방향 권한 허용'}
      title="현재 방향"
    >
      <div className="compass-ring" aria-hidden="true" />
      <div
        className="compass-arrow"
        style={{ transform: `rotate(${-heading}deg)` }}
        aria-hidden="true"
      >
        <NorthIcon size={48} />
      </div>
    </button>
  )
}
