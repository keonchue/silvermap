import { useEffect, useState } from 'react'
import { NorthIcon } from './icons.jsx'

// 상단 가운데에 떠 있는 빨간 방향 화살표.
// 디바이스 방향(deviceorientation)이 잡히면 회전하고,
// 항상 살짝 펄스 + 위아래 흔들림으로 살아있는 느낌을 준다.
export default function Compass({ topOffset = 12 }) {
  const [heading, setHeading] = useState(0)
  const [hasOrient, setHasOrient] = useState(false)

  useEffect(() => {
    function onOrient(e) {
      // iOS는 webkitCompassHeading, 그 외는 alpha
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

  return (
    <div
      className="compass"
      style={{ top: topOffset }}
      role="img"
      aria-label={
        hasOrient ? '내가 바라보는 방향' : '방향 표시 (회전은 모바일에서 동작)'
      }
    >
      <div className="compass-ring" aria-hidden="true" />
      <div
        className="compass-arrow"
        style={{ transform: `rotate(${-heading}deg)` }}
        aria-hidden="true"
      >
        <NorthIcon size={48} />
      </div>
    </div>
  )
}
