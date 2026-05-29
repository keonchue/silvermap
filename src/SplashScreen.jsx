import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1600)
    const doneTimer = setTimeout(onDone, 2000)
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#d6e8f7',
      opacity: fading ? 0 : 1,
      transition: 'opacity 400ms ease-out',
    }}>
      <img
        src={`${import.meta.env.BASE_URL}splash.png`}
        alt="SilverMap"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}
