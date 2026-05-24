import {
  HospitalIcon, PharmacyIcon, BankIcon, ToiletIcon, BusIcon, FoodIcon, CafeIcon, StoreIcon,
} from './icons.jsx'

export const CATEGORIES = [
  { id: 'hospital', label: '병원',      code: 'HP8', keyword: '병원',      Icon: HospitalIcon, color: '#c62828' },
  { id: 'pharmacy', label: '약국',      code: 'PM9', keyword: '약국',      Icon: PharmacyIcon, color: '#1f7a3d' },
  { id: 'bank',     label: '은행',      code: 'BK9', keyword: '은행',      Icon: BankIcon,     color: '#103f96' },
  { id: 'toilet',   label: '화장실',    code: null,  keyword: '공중화장실', Icon: ToiletIcon,   color: '#6a3fb5' },
  { id: 'bus',      label: '버스정류장', code: null,  keyword: '버스정류장', Icon: BusIcon,      color: '#b25e00' },
  { id: 'food',     label: '식당',      code: 'FD6', keyword: '식당',      Icon: FoodIcon,     color: '#0277a8' },
  { id: 'cafe',     label: '카페',      code: 'CE7', keyword: '카페',      Icon: CafeIcon,     color: '#795548' },
  { id: 'mart',     label: '마트',      code: 'MT1', keyword: '마트',      Icon: StoreIcon,    color: '#e65100' },
]
