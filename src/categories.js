import {
  HospitalIcon, PharmacyIcon, BankIcon, ToiletIcon, BusIcon, FoodIcon,
} from './icons.jsx'

// 노인분들이 자주 찾는 장소. code 가 있으면 카카오 카테고리 검색,
// 없으면 keyword 로 키워드 검색을 한다.
export const CATEGORIES = [
  { id: 'hospital', label: '병원',     code: 'HP8', keyword: '병원',     Icon: HospitalIcon, color: '#c62828' },
  { id: 'pharmacy', label: '약국',     code: 'PM9', keyword: '약국',     Icon: PharmacyIcon, color: '#1f7a3d' },
  { id: 'bank',     label: '은행',     code: 'BK9', keyword: '은행',     Icon: BankIcon,     color: '#103f96' },
  { id: 'toilet',   label: '화장실',   code: null,  keyword: '공중화장실', Icon: ToiletIcon,   color: '#6a3fb5' },
  { id: 'bus',      label: '버스정류장', code: null,  keyword: '버스정류장', Icon: BusIcon,      color: '#b25e00' },
  { id: 'food',     label: '식당',     code: 'FD6', keyword: '식당',     Icon: FoodIcon,     color: '#0277a8' },
]
