// 모든 아이콘은 SVG (이모지 사용 안 함). 굵은 선으로 노인 가독성 확보.
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ size = 28, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      {children}
    </svg>
  )
}

export const MapIcon = (p) => (
  <Svg {...p}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </Svg>
)

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4.3-4.3" />
  </Svg>
)

export const RouteIcon = (p) => (
  <Svg {...p}>
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="5" r="2.5" />
    <path d="M8.5 19H14a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h5.5" />
  </Svg>
)

export const LocationIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </Svg>
)

export const PinIcon = (p) => (
  <Svg {...p}>
    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
)

export const CloseIcon = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const BackIcon = (p) => (
  <Svg {...p}>
    <path d="M15 5 8 12l7 7" />
  </Svg>
)

export const ChevronIcon = (p) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" />
  </Svg>
)

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="M5 13l4 4L19 7" />
  </Svg>
)

export const PhoneIcon = (p) => (
  <Svg {...p}>
    <path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Svg>
)

export const WalkIcon = (p) => (
  <Svg {...p}>
    <circle cx="13" cy="4" r="2" />
    <path d="M13 22v-6l-3-3 1-6 4 3 3 1M10 13l-3 2-1 5M13 16l3 6" />
  </Svg>
)

export const BusIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="15" rx="3" />
    <path d="M5 12h14M8 21v-3M16 21v-3" />
    <circle cx="9" cy="15" r="1" />
    <circle cx="15" cy="15" r="1" />
  </Svg>
)

export const HospitalIcon = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
)

export const PharmacyIcon = (p) => (
  <Svg {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 9v6M9 12h6" />
  </Svg>
)

export const BankIcon = (p) => (
  <Svg {...p}>
    <path d="M3 9 12 4l9 5M5 9v9M19 9v9M9 9v9M15 9v9M3 19h18" />
  </Svg>
)

export const ToiletIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3v18M7 6a2 2 0 1 1 0 .01M7 8v5M5 13h4M17 6a2 2 0 1 1 0 .01M15 13l2-5 2 5" />
  </Svg>
)

export const FoodIcon = (p) => (
  <Svg {...p}>
    <path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10M16 3c-1.5 1-2 3-2 5s.5 3 2 3v10" />
  </Svg>
)

export const StoreIcon = (p) => (
  <Svg {...p}>
    <path d="M4 9 5 4h14l1 5M5 9v11h14V9M5 9h14" />
  </Svg>
)

export const CafeIcon = (p) => (
  <Svg {...p}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </Svg>
)

export const MicIcon = (p) => (
  <Svg {...p}>
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M19 11v1a7 7 0 0 1-14 0v-1M12 19v3M8 22h8" />
  </Svg>
)

export const CarIcon = (p) => (
  <Svg {...p}>
    <path d="M5 17H3v-5l2-5h14l2 5v5h-2" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="16.5" cy="17.5" r="2.5" />
    <path d="M5 12h14" />
  </Svg>
)

export const BikeIcon = (p) => (
  <Svg {...p}>
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 0 0 0-2h-3l-3 9H5.5" />
    <path d="M10.5 9h7l-3 8.5" />
  </Svg>
)

export const LayersIcon = (p) => (
  <Svg {...p}>
    <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" />
  </Svg>
)

export const HomeIcon = (p) => (
  <Svg {...p}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </Svg>
)

export const NavIcon = (p) => (
  <Svg {...p}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </Svg>
)

export const MoreIcon = (p) => (
  <Svg {...p}>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </Svg>
)

export const PlusIcon = (p) => (
  <Svg {...p}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
)

export const MinusIcon = (p) => (
  <Svg {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
)

export const NorthIcon = (p) => (
  <Svg {...p}>
    <polygon points="12 3 16 19 12 15 8 19" fill="currentColor" stroke="none" />
  </Svg>
)

export const StarIcon = (p) => (
  <Svg {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Svg>
)

export const ShareIcon = (p) => (
  <Svg {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Svg>
)

export const VolumeIcon = (p) => (
  <Svg {...p}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
  </Svg>
)
