import { useRef, useState } from 'react'
import { MicIcon, SearchIcon } from './icons.jsx'

export default function DirectionBanner({ onSearch, placeholder = '검색하기' }) {
  const [query, setQuery]       = useState('')
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

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
    r.onresult = (e) => { const t = e.results[0][0].transcript; setQuery(t); onSearch(t) }
    r.onend = () => { setListening(false); recRef.current = null }
    r.onerror = () => { setListening(false); recRef.current = null }
    r.start(); recRef.current = r
  }

  return (
    <div
      style={{
        background: '#fff',
        padding: 'max(10px, env(safe-area-inset-top)) 12px 10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.13)',
        zIndex: 15,
        flexShrink: 0,
      }}
    >
      <form onSubmit={handleSearch}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '2px solid var(--border)',
          borderRadius: 30, padding: '0 14px', minHeight: 56,
        }}>
          {/* 검색 아이콘 */}
          <SearchIcon size={22} style={{ flexShrink: 0, color: 'var(--text-soft)' }} />

          {/* 입력창 */}
          <input
            data-tutorial="home-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            enterKeyHint="search"
            aria-label="장소 검색"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 18, padding: '12px 0', outline: 'none',
              color: 'var(--text)', minWidth: 0,
            }}
          />

          {/* 음성 검색 */}
          <button
            type="button"
            onClick={startVoice}
            aria-label="음성 검색"
            style={{
              flexShrink: 0,
              color: listening ? 'var(--danger)' : 'var(--text-soft)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <MicIcon size={22} />
          </button>
        </div>
      </form>
    </div>
  )
}
