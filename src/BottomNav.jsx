import { HomeIcon, RouteIcon, CalendarIcon, TrainIcon, GridIcon } from './icons.jsx'

const TABS = [
  { id: 'home',       label: '홈',       Icon: HomeIcon     },
  { id: 'directions', label: '길 찾기',  Icon: RouteIcon    },
  { id: 'reserve',    label: '예약하기', Icon: CalendarIcon },
  { id: 'transit',    label: '대중교통', Icon: TrainIcon    },
  { id: 'more',       label: '더 보기',  Icon: GridIcon     },
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
              gap: 4, padding: '10px 4px 12px', minHeight: 76,
              color: on ? 'var(--primary)' : 'var(--text-soft)',
              background: 'transparent', fontWeight: on ? 900 : 700,
              position: 'relative',
            }}
          >
            {/* 활성 탭 상단 인디케이터 */}
            {on && (
              <span style={{
                position: 'absolute', top: 0, left: '15%', right: '15%',
                height: 3, borderRadius: '0 0 3px 3px',
                background: 'var(--primary)',
              }} />
            )}
            {/* 아이콘 배경 */}
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 48, height: 36, borderRadius: 12,
              background: on ? 'var(--surface)' : 'transparent',
              transition: 'background 150ms',
            }}>
              <Icon size={28} />
            </span>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
