import { HomeIcon, BusIcon, NavIcon, SearchIcon, MoreIcon } from './icons.jsx'

const TABS = [
  { id: 'map',        label: '홈',      Icon: HomeIcon   },
  { id: 'transit',    label: '대중교통', Icon: BusIcon    },
  { id: 'directions', label: '내비',    Icon: NavIcon    },
  { id: 'search',     label: '발견',    Icon: SearchIcon },
  { id: 'more',       label: '더보기',  Icon: MoreIcon   },
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
        const on = active === id || (id === 'directions' && active === 'transit')
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
              padding: '10px 4px 12px',
              minHeight: 76,
              color: on ? 'var(--primary)' : 'var(--text-soft)',
              background: on ? 'var(--surface)' : 'transparent',
              fontWeight: on ? 900 : 700,
            }}
          >
            <Icon size={30} />
            <span style={{ fontSize: 15 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
