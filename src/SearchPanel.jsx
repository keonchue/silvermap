import { useState } from 'react'
import { searchByKeyword, searchByCategory } from './placesService.js'
import { CATEGORIES } from './categories.js'
import { SearchIcon } from './icons.jsx'
import PlaceCard from './PlaceCard.jsx'

export default function SearchPanel({ from, onResults, onSelectPlace }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [heading, setHeading] = useState('')

  async function runSearch(promise, label) {
    setLoading(true)
    setSearched(true)
    setHeading(label)
    const places = await promise
    setResults(places)
    onResults(places)
    setLoading(false)
  }

  function onSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    runSearch(searchByKeyword(query, from), `'${query}' 검색 결과`)
  }

  function onCategory(cat) {
    setQuery('')
    runSearch(searchByCategory(cat, from), `내 주변 ${cat.label}`)
  }

  return (
    <>
      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="장소나 주소를 적어주세요"
          aria-label="장소 검색어"
          enterKeyHint="search"
          style={{
            flex: 1, minHeight: 'var(--tap)', padding: '0 18px',
            border: '2px solid var(--border)', borderRadius: 'var(--radius)',
            background: 'var(--surface)', color: 'var(--text)',
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 24px' }}>
          <SearchIcon size={28} />
          찾기
        </button>
      </form>

      <p style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text-soft)', marginBottom: 10 }}>
        자주 찾는 곳
      </p>
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, marginBottom: 22,
        }}
      >
        {CATEGORIES.map((cat) => {
          const { Icon } = cat
          return (
            <button
              key={cat.id}
              onClick={() => onCategory(cat)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, padding: '14px 6px', minHeight: 96,
                background: 'var(--surface)', border: '2px solid var(--border)',
                borderRadius: 'var(--radius)', color: cat.color, fontWeight: 700,
              }}
              aria-label={`내 주변 ${cat.label} 찾기`}
            >
              <Icon size={38} />
              <span style={{ fontSize: 18, color: 'var(--text)' }}>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {loading && (
        <p style={{ fontSize: 'var(--fs-lg)', textAlign: 'center', padding: 20 }}>
          찾는 중입니다...
        </p>
      )}

      {!loading && searched && (
        <>
          <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, marginBottom: 12 }}>
            {heading} ({results.length}곳)
          </p>
          {results.length === 0 ? (
            <p
              style={{
                fontSize: 'var(--fs-base)', color: 'var(--text-soft)',
                background: 'var(--surface)', borderRadius: 'var(--radius)',
                padding: 24, textAlign: 'center',
              }}
            >
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
