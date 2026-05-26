import { useEffect, useState } from 'react'

function speak(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'; u.rate = 0.85
  window.speechSynthesis.speak(u)
}

export default function FindFlow({ from, onRoute, onTutAdvance, initialDest, results = [], loading = false }) {
  const [dest, setDest] = useState(initialDest || null)

  useEffect(() => {
    if (initialDest) onRoute({ path: [from, initialDest], dest: initialDest })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function selectDest(place) {
    setDest(place)
    onRoute({ path: [from, place], dest: place })
    onTutAdvance()
  }

  function startNav() {
    if (!dest) return
    speak(`길 안내를 시작합니다. ${dest.name}까지 이동합니다. 목적지를 향해 출발하세요.`)
    onTutAdvance()
  }

  const showResults = !loading && results.length > 0
  const showGo     = dest && !showResults

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 18 }}>

      {/* 검색 중 */}
      {loading && (
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          background: '#fff', borderRadius: 14, padding: '16px 18px',
          textAlign: 'center', fontSize: 18, fontWeight: 700,
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          pointerEvents: 'auto',
        }}>
          찾는 중입니다...
        </div>
      )}

      {/* 검색 결과 */}
      {showResults && (
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
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

      {/* 안내 시작 버튼 */}
      {showGo && (
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
