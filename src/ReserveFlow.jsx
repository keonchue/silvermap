// 지도 위 예약 장소 검색 결과 오버레이 (FindFlow와 동일한 UX 패턴)
export default function ReserveFlow({ results, loading, onSelectPlace, onTutAdvance }) {
  const showResults = !loading && results.length > 0

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
              data-tutorial={i === 0 ? 'reserve-result' : undefined}
              onClick={() => { onSelectPlace(p); onTutAdvance() }}
              style={{
                padding: '16px 18px', cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid #eef2f7' : 'none',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
              {p.address && (
                <div style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 3 }}>{p.address}</div>
              )}
              {p.rating && (
                <div style={{ fontSize: 14, color: '#f59e0b', marginTop: 3 }}>★ {p.rating}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 검색 전 안내 */}
      {!loading && results.length === 0 && (
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          background: '#fff', borderRadius: 14, padding: '20px 18px',
          textAlign: 'center', fontSize: 18, color: 'var(--text-soft)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          pointerEvents: 'none',
        }}>
          위 검색창에서 예약할 장소를 검색하세요
        </div>
      )}
    </div>
  )
}
