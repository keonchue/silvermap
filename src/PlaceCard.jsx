import { distanceMeters } from './placesService.js'
import { CATEGORIES } from './categories.js'
import { PinIcon, ChevronIcon } from './icons.jsx'

function formatDistance(m) {
  if (m < 1000) return `${Math.round(m / 10) * 10}m`
  return `${(m / 1000).toFixed(1)}km`
}

// 검색 결과 / 길찾기 목록에 쓰는 큰 장소 카드
export default function PlaceCard({ place, onSelect, from, actionLabel = '자세히 보기' }) {
  const cat = CATEGORIES.find((c) => c.id === place.category)
  const Icon = cat?.Icon || PinIcon
  const color = cat?.color || 'var(--primary)'
  const dist = from ? distanceMeters(from, place) : null

  return (
    <button
      onClick={() => onSelect(place)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        textAlign: 'left',
        padding: '16px 14px',
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: 12,
        minHeight: 'var(--tap)',
      }}
      aria-label={`${place.name}, ${place.address}, ${actionLabel}`}
    >
      <span
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: 14, flexShrink: 0,
          background: '#fff', border: `2px solid ${color}`, color,
        }}
      >
        <Icon size={32} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block', fontSize: 'var(--fs-lg)', fontWeight: 700,
            color: 'var(--text)', lineHeight: 1.35,
          }}
        >
          {place.name}
        </span>
        <span
          style={{
            display: 'block', fontSize: 'var(--fs-sm)', color: 'var(--text-soft)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {place.address}
        </span>
        {dist != null && (
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--primary)' }}>
            여기서 {formatDistance(dist)}
          </span>
        )}
      </span>
      <ChevronIcon size={28} />
    </button>
  )
}

export { formatDistance }
