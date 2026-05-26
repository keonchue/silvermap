import { useEffect, useRef, useState } from 'react'
import { MicIcon, SearchIcon } from './icons.jsx'

// 최상단 고정 배너: 빨간 방향 화살표(DeviceOrientation) + 검색창
export default function DirectionBanner({ onSearch, placeholder = '검색하기' }) {
  const [heading, setHeading] = useState(0)
  const [hasOrient, setHasOrient] = useState(false)
  const [query, setQuery] = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  useEffect(() => {
    function onOrient(e) {
      // iOS는 webkitCompassHeading, Android는 alpha
      const h =
        typeof e.webkitCompassHeading === 'number'
          ? e.webkitCompassHeading
          : e.alpha != null
          ? 360 - e.alpha
          : null
      if (h != null) { setHeading(h); setHasOrient(true) }
    }
    window.addEventListener('deviceorientation', onOrient, true)
    return () => window.removeEventListener('deviceorientation', onOrient, true)
  }, [])

  // iOS 13+ 권한 요청
  async function requestOrientPermission() {
    try {
      if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission()
        if (r === 'granted') setHasOrient(true)
      }
    } catch {}
  }

  function handleSearch(e) {
    e.preventDefault()
    const q = query.trim()
    if (q) onSearch(q)
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('이 브라우저는 음성 검색을 지원하지 않습니다.'); return }
    if (recRef.current) { recRef.current.stop(); return }
    const r = new SR()
    r.lang = 'ko-KR'
    r.onstart = () => setListening(true)
    r.onresult = (e) => {
      const text = e.results[0][0].transcript
      setQuery(text)
      onSearch(text)
    }
    r.onend = () => { setListening(false); recRef.current = null }
    r.onerror = () => { setListening(false); recRef.current = null }
    r.start()
    recRef.current = r
  }

  return (
    <div
      className="dir-banner"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
    >
      {/* 빨간 방향 화살표 + 펄스 링 (bobbing 애니메이션은 CSS에서 처리) */}
      <div className="dir-banner-arrow-wrap" role="img" aria-label="내가 바라보는 방향">
        <div className="dir-banner-pulse" aria-hidden="true" />
        <div className="dir-banner-pulse dir-banner-pulse-2" aria-hidden="true" />
        <div
          className="dir-banner-arrow"
          style={{ transform: `rotate(${-heading}deg)` }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 34" width="32" height="44">
            <path d="M12 2 L21 30 L12 23 L3 30 Z" fill="#dc2626" />
            <path d="M12 2 L21 30 L12 23 L3 30 Z" fill="none" stroke="rgba(220,38,38,0.3)" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* iOS 방향 권한 미승인 시 요청 버튼 */}
      {!hasOrient && typeof DeviceOrientationEvent?.requestPermission === 'function' && (
        <button onClick={requestOrientPermission} className="dir-banner-perm-btn">
          방향 사용 허용
        </button>
      )}

      {/* 검색창 */}
      <form className="dir-banner-form" onSubmit={handleSearch}>
        <div className="dir-banner-input-row">
          <SearchIcon size={22} />
          <input
            data-tutorial="home-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            enterKeyHint="search"
            className="dir-banner-input"
            aria-label="장소 검색"
          />
          <button
            type="button"
            onClick={startVoice}
            aria-label="음성 검색"
            style={{ color: listening ? 'var(--danger)' : 'var(--text-soft)', flexShrink: 0 }}
          >
            <MicIcon size={22} />
          </button>
        </div>
      </form>
    </div>
  )
}
