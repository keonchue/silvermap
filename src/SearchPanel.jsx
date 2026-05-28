import { useRef, useState } from 'react'
import { searchByKeyword, searchByCategory } from './placesService.js'
import { CATEGORIES } from './categories.js'
import { SearchIcon, MicIcon, CloseIcon } from './icons.jsx'
import PlaceCard from './PlaceCard.jsx'

const MAX_RECENT = 5

function getRecent() {
  try { return JSON.parse(localStorage.getItem('recentSearches') || '[]') } catch { return [] }
}
function saveRecent(query) {
  const prev = getRecent().filter((q) => q !== query)
  localStorage.setItem('recentSearches', JSON.stringify([query, ...prev].slice(0, MAX_RECENT)))
}

export default function SearchPanel({ from, onResults, onSelectPlace, initialResults, initialHeading }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(initialResults || [])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(!!(initialResults?.length))
  const [heading, setHeading] = useState(initialHeading || '')
  const [recent, setRecent] = useState(getRecent)
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)

  async function runSearch(promise, label) {
    setLoading(true); setSearched(true); setHeading(label)
    const places = await promise
    setResults(places); onResults(places); setLoading(false)
  }

  function onSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    saveRecent(q); setRecent(getRecent())
    runSearch(searchByKeyword(q, from), `'${q}' 검색 결과`)
  }

  function onCategory(cat) {
    setQuery('')
    runSearch(searchByCategory(cat, from), `내 주변 ${cat.label}`)
  }

  function onRecentClick(q) {
    setQuery(q)
    saveRecent(q); setRecent(getRecent())
    runSearch(searchByKeyword(q, from), `'${q}' 검색 결과`)
  }

  function clearRecent() {
    localStorage.removeItem('recentSearches'); setRecent([])
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
      saveRecent(text); setRecent(getRecent())
      runSearch(searchByKeyword(text, from), `'${text}' 검색 결과`)
    }
    r.onend = () => { setListening(false); recRef.current = null }
    r.onerror = () => { setListening(false); recRef.current = null }
    r.start(); recRef.current = r
  }

  return (
    <>
      {/* 검색창 */}
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          padding: '0 14px', border: '2px solid var(--border)',
        }}>
          <SearchIcon size={22} />
          <input
            type="search" value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장소·주소·버스 검색"
            aria-label="장소 검색어" enterKeyHint="search"
            style={{
              flex: 1, border: 'none', background: 'transparent',
              fontSize: 'var(--fs-lg)', padding: '14px 0', outline: 'none',
            }}
          />
          <button type="button" onClick={startVoice} aria-label="음성 검색"
            style={{ color: listening ? 'var(--danger)' : 'var(--text-soft)', flexShrink: 0 }}>
            <MicIcon size={24} />
          </button>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 20px' }}>
          찾기
        </button>
      </form>

      {/* 최근 검색어 */}
      {!searched && recent.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ flex: 1, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-soft)' }}>
              최근 검색어
            </p>
            <button onClick={clearRecent} style={{ fontSize: 15, color: 'var(--text-soft)' }}>
              전체 삭제
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => onRecentClick(q)}
                style={{
                  padding: '8px 16px', borderRadius: 20,
                  background: 'var(--surface)', border: '2px solid var(--border)',
                  fontSize: 18, fontWeight: 700, color: 'var(--text)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 자주 찾는 카테고리 */}
      {!searched && (
        <>
          <p style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-soft)', marginBottom: 10 }}>
            자주 찾는 곳
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
            {CATEGORIES.map((cat) => {
              const { Icon } = cat
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategory(cat)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '12px 4px', minHeight: 86,
                    background: 'var(--surface)', border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)', color: cat.color, fontWeight: 700,
                  }}
                  aria-label={`내 주변 ${cat.label} 찾기`}
                >
                  <Icon size={32} />
                  <span style={{ fontSize: 16, color: 'var(--text)' }}>{cat.label}</span>
                </button>
              )
            })}
          </div>

          {/* 도움말 카드 */}
          <div style={{
            background: '#fff8e1', border: '2px solid #b25e00',
            borderRadius: 'var(--radius)', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>?</span>
            <div>
              <p style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: '#7a3f00' }}>
                검색이 어렵다면?
              </p>
              <p style={{ fontSize: 'var(--fs-sm)', color: '#7a3f00', marginTop: 2 }}>
                위 카테고리 버튼을 눌러 주변 장소를 바로 찾을 수 있어요.
              </p>
            </div>
          </div>
        </>
      )}

      {/* 검색 결과 */}
      {loading && (
        <p style={{ fontSize: 'var(--fs-lg)', textAlign: 'center', padding: 20 }}>
          찾는 중입니다...
        </p>
      )}
      {!loading && searched && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ flex: 1, fontSize: 'var(--fs-lg)', fontWeight: 900 }}>
              {heading} ({results.length}곳)
            </p>
            <button
              onClick={() => setSearched(false)}
              style={{ fontSize: 15, color: 'var(--text-soft)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <CloseIcon size={18} /> 닫기
            </button>
          </div>
          {results.length === 0 ? (
            <p style={{
              fontSize: 'var(--fs-base)', color: 'var(--text-soft)',
              background: 'var(--surface)', borderRadius: 'var(--radius)',
              padding: 24, textAlign: 'center',
            }}>
              결과가 없습니다. 다른 말로 다시 찾아보세요.
            </p>
          ) : (
            results.map((p) => (
              <PlaceCard key={p.id} place={p} from={from} onSelect={onSelectPlace} />
            ))
          )}
        </>
      )}
    </>
  )
}
