import { useEffect, useState } from 'react'
import { SearchIcon } from './icons.jsx'
import { searchByKeyword } from './placesService.js'

// 지도 위에 올라오는 길찾기 오버레이 (하단 시트 없음)
// 튜토리얼이 각 단계 요소를 가리키며 안내

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'; u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function FindFlow({ from, onRoute, onTutAdvance, initialDest }) {
  const [query, setQuery]     = useState(initialDest?.name || '')
  const [results, setResults] = useState([])
  const [dest, setDest]       = useState(initialDest || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialDest) onRoute({ path: [from, initialDest], dest: initialDest })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSearch(e) {
    e?.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    const places = await searchByKeyword(query.trim(), from)
    setResults(places)
    setLoading(false)
    onTutAdvance()   // → 튜토리얼 step 2: 결과 가리키기
  }

  function selectDest(place) {
    setDest(place)
    setResults([])
    onRoute({ path: [from, place], dest: place })
    onTutAdvance()   // → 튜토리얼 step 3: 안내 시작 버튼 가리키기
  }

  function startNav() {
    if (!dest) return
    speak(`길 안내를 시작합니다. ${dest.name}까지 이동합니다. 목적지를 향해 출발하세요.`)
    onTutAdvance()   // → 튜토리얼 종료
  }

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 18 }}>

      {/* 검색창 (지도 상단 오버레이) */}
      <form
        onSubmit={handleSearch}
        style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 8, pointerEvents: 'auto' }}
      >
        <div
          data-tutorial="dest-input"
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', borderRadius: 14,
            padding: '0 14px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            border: '2px solid var(--border)',
          }}
        >
          <SearchIcon size={20} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="목적지를 검색하세요"
            enterKeyHint="search"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 18, padding: '14px 0', outline: 'none', color: 'var(--text)' }}
          />
        </div>
        <button
          type="submit"
          style={{
            background: 'var(--primary)', color: '#fff',
            borderRadius: 14, padding: '0 20px',
            fontSize: 18, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(25,87,200,0.35)',
            flexShrink: 0,
          }}
        >
          검색
        </button>
      </form>

      {/* 검색 중 */}
      {loading && (
        <div style={{
          position: 'absolute', top: 76, left: 12, right: 12,
          background: '#fff', borderRadius: 14, padding: '16px 18px',
          textAlign: 'center', fontSize: 18, fontWeight: 700,
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          pointerEvents: 'auto',
        }}>
          찾는 중입니다...
        </div>
      )}

      {/* 검색 결과 드롭다운 */}
      {!loading && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 76, left: 12, right: 12,
          background: '#fff', borderRadius: 14,
          boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
          overflow: 'hidden', pointerEvents: 'auto',
        }}>
          {results.map((p, i) => (
            <div
              key={p.id}
              data-tutorial={i === 0 ? 'dest-result' : undefined}
              onClick={() => selectDest(p)}
              style={{
                padding: '16px 18px', cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid #eef2f7' : 'none',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
              {p.address && (
                <div style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 3 }}>{p.address}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 목적지 선택 완료 → 안내 시작 버튼 */}
      {dest && results.length === 0 && (
        <button
          data-tutorial="go"
          onClick={startNav}
          style={{
            position: 'absolute', bottom: 20, left: 16, right: 16,
            background: 'var(--primary)', color: '#fff',
            padding: '20px', borderRadius: 18,
            fontSize: 22, fontWeight: 900,
            boxShadow: '0 6px 20px rgba(25,87,200,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            pointerEvents: 'auto',
          }}
        >
          ↗ 안내 시작
        </button>
      )}
    </div>
  )
}
