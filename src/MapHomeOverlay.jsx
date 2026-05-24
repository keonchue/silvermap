import { useState, useEffect, useRef } from 'react'
import { SearchIcon, MicIcon, RouteIcon, FoodIcon, CafeIcon, StoreIcon } from './icons.jsx'
import { searchByKeyword, searchByCategory } from './placesService.js'
import { CATEGORIES } from './categories.js'

const QUICK = [
  { id: 'directions', label: '길찾기', Icon: RouteIcon, color: '#1957c8' },
  { id: 'food',       label: '식당',   Icon: FoodIcon,  color: '#c62828' },
  { id: 'cafe',       label: '카페',   Icon: CafeIcon,  color: '#795548' },
  { id: 'mart',       label: '마트',   Icon: StoreIcon, color: '#e65100' },
]

const HINTS = [
  { num: 1, key: '펴면',   desc: '확대' },
  { num: 2, key: '모으면', desc: '축소' },
  { num: 3, key: '돌리면', desc: '방향 변경' },
]

export default function MapHomeOverlay({ from, onResults, onSelectPlace, onOpenDirections }) {
  const [query, setQuery] = useState('')
  const [direction, setDirection] = useState('북쪽')
  const [hintsVisible, setHintsVisible] = useState(
    () => localStorage.getItem('hintsOff') !== '1'
  )
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      const a = e.webkitCompassHeading ?? e.alpha
      if (a == null) return
      const dirs = ['북쪽', '북동쪽', '동쪽', '남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽']
      setDirection(dirs[Math.round(a / 45) % 8])
    }
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientationabsolute', handler, true)
      window.addEventListener('deviceorientation', handler, true)
    }
    return () => {
      window.removeEventListener('deviceorientationabsolute', handler, true)
      window.removeEventListener('deviceorientation', handler, true)
    }
  }, [])

  async function handleSearch(e) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    const places = await searchByKeyword(q, from)
    onResults(places)
  }

  async function handleQuick(id) {
    if (id === 'directions') { onOpenDirections(); return }
    const cat = CATEGORIES.find((c) => c.id === id)
    if (!cat) return
    const places = await searchByCategory(cat, from)
    onResults(places)
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('이 브라우저는 음성 검색을 지원하지 않습니다.'); return }
    if (recRef.current) { recRef.current.stop(); return }
    const r = new SR()
    r.lang = 'ko-KR'
    r.onstart = () => setListening(true)
    r.onresult = async (e) => {
      const text = e.results[0][0].transcript
      setQuery(text)
      const places = await searchByKeyword(text, from)
      onResults(places)
    }
    r.onend = () => { setListening(false); recRef.current = null }
    r.onerror = () => { setListening(false); recRef.current = null }
    r.start()
    recRef.current = r
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
      {/* 상단 오버레이 */}
      <div style={{ pointerEvents: 'auto' }}>
        {/* 방향 바 */}
        <div style={{
          background: 'var(--primary)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          gap: 10,
        }}>
          <span style={{ flex: 1, fontSize: 20, fontWeight: 900 }}>
            지금 방향: {direction}
          </span>
          <span style={{ fontSize: 26, color: '#ff4d4d', fontWeight: 900 }}>▲</span>
          <button
            onClick={() => setDirection('북쪽')}
            style={{
              background: '#fff',
              color: 'var(--primary)',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 16,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
            }}
          >
            방향 바꾸기
          </button>
        </div>

        {/* 검색창 + 카테고리 */}
        <div style={{
          background: '#fff',
          padding: '10px 12px 10px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
        }}>
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--surface)',
              borderRadius: 30,
              padding: '0 14px',
              border: '2px solid var(--border)',
            }}
          >
            <SearchIcon size={22} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="장소 이름 검색"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 20,
                padding: '11px 0',
                outline: 'none',
                color: 'var(--text)',
              }}
            />
            <button
              type="button"
              onClick={startVoice}
              aria-label="음성 검색"
              style={{ color: listening ? 'var(--danger)' : 'var(--text-soft)', flexShrink: 0 }}
            >
              <MicIcon size={24} />
            </button>
          </form>

          {/* 퀵 카테고리 */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
            {QUICK.map(({ id, label, Icon, color }) => (
              <button
                key={id}
                onClick={() => handleQuick(id)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 22,
                  background: '#fff',
                  border: '2px solid var(--border)',
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--text)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                <Icon size={22} style={{ color }} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 제스처 도움말 */}
      {hintsVisible && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          right: 10,
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {HINTS.map((h) => (
              <div
                key={h.num}
                style={{
                  flex: 1,
                  background: '#fff',
                  borderRadius: 14,
                  padding: '10px 6px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: 'var(--primary)', color: '#fff',
                  fontSize: 14, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 6px',
                }}>
                  {h.num}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-soft)' }}>두 손가락으로</div>
                <div style={{ fontSize: 16, fontWeight: 900, marginTop: 2 }}>
                  <span style={{ color: 'var(--primary)' }}>{h.key}</span> {h.desc}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => { setHintsVisible(false); localStorage.setItem('hintsOff', '1') }}
            style={{
              display: 'block', margin: '8px auto 0',
              fontSize: 15, color: 'var(--text-soft)',
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '4px 16px',
            }}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  )
}
