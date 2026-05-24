import { MapIcon, SearchIcon, RouteIcon } from './icons.jsx'

const TABS = [
  { id: 'map', label: '지도', Icon: MapIcon },
  { id: 'search', label: '장소 찾기', Icon: SearchIcon },
  { id: 'directions', label: '길찾기', Icon: RouteIcon },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav
      aria-label="주요 메뉴"
      style={{
        display: 'flex',
        borderTop: '2px solid var(--surface-2)',
        background: 'var(--bg)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        flexShrink: 0,
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const on = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={on ? 'page' : undefined}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '12px 4px 14px',
              minHeight: 84,
              color: on ? 'var(--primary)' : 'var(--text-soft)',
              background: on ? 'var(--surface)' : 'transparent',
              fontWeight: on ? 900 : 700,
            }}
          >
            <Icon size={36} />
            <span style={{ fontSize: 18 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
