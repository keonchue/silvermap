import { CATEGORIES } from './categories.js'
import { PinIcon, PhoneIcon, RouteIcon, CheckIcon } from './icons.jsx'

// 장소 상세 정보 시트
export default function PlaceSheet({ place, onDirections, onReserve }) {
  const cat = CATEGORIES.find((c) => c.id === place.category)
  const Icon = cat?.Icon || PinIcon
  const color = cat?.color || 'var(--primary)'

  return (
    <>
      <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
        <span
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: 16, flexShrink: 0,
            background: '#fff', border: `2px solid ${color}`, color,
          }}
        >
          <Icon size={38} />
        </span>
        <div>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 900, lineHeight: 1.3 }}>
            {place.name}
          </h2>
          {cat && (
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color }}>
              {cat.label}
            </span>
          )}
        </div>
      </div>

      <dl style={{ marginBottom: 22 }}>
        <InfoRow Icon={PinIcon} label="주소" value={place.address || '주소 정보 없음'} />
        {place.phone && (
          <InfoRow Icon={PhoneIcon} label="전화" value={place.phone} />
        )}
      </dl>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {place.phone && (
          <a
            href={`tel:${place.phone.replace(/[^0-9+]/g, '')}`}
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            <PhoneIcon size={28} />
            전화 걸기
          </a>
        )}
        <button className="btn btn-secondary" onClick={() => onDirections(place)}>
          <RouteIcon size={28} />
          여기로 길찾기
        </button>
        <button className="btn btn-primary" onClick={() => onReserve(place)}>
          <CheckIcon size={28} />
          예약하기
        </button>
      </div>
    </>
  )
}

function InfoRow({ Icon, label, value }) {
  return (
    <div
      style={{
        display: 'flex', gap: 14, alignItems: 'center',
        padding: '12px 0', borderBottom: '2px solid var(--surface-2)',
      }}
    >
      <span style={{ color: 'var(--text-soft)', flexShrink: 0 }}>
        <Icon size={30} />
      </span>
      <div>
        <dt style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-soft)' }}>{label}</dt>
        <dd style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{value}</dd>
      </div>
    </div>
  )
}
