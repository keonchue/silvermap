import { HomeIcon, RouteIcon, CalendarIcon, TrainIcon, GridIcon } from './icons.jsx'

const TABS = [
  { id: 'home',       label: '홈',    Icon: HomeIcon     },
  { id: 'directions', label: '길찾기', Icon: RouteIcon    },
  { id: 'reserve',    label: '예약',   Icon: CalendarIcon },
  { id: 'transit',    label: '교통',   Icon: TrainIcon    },
  { id: 'more',       label: '더보기', Icon: GridIcon     },
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
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '8px 2px 10px', minHeight: 68,
              color: on ? 'var(--primary)' : 'var(--text-soft)',
              background: 'transparent', fontWeight: on ? 900 : 700,
              position: 'relative',
            }}
          >
            {on && (
              <span style={{
                position: 'absolute', top: 0, left: '10%', right: '10%',
                height: 3, borderRadius: '0 0 3px 3px',
                background: 'var(--primary)',
              }} />
            )}
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 32, borderRadius: 10,
              background: on ? 'var(--surface)' : 'transparent',
              transition: 'background 150ms',
            }}>
              <Icon size={24} />
            </span>
            <span style={{ fontSize: 11, lineHeight: 1, letterSpacing: '-0.3px' }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
