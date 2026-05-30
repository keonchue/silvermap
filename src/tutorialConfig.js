// 탭별 튜토리얼 시나리오.
// target: data-tutorial="..." 로 표시된 요소의 CSS 셀렉터.
// position: 말풍선 위치 (스포트라이트 기준 'above' | 'below').
// clickAdvances: false 이면 클릭으로 자동 진행하지 않음 (기본값: 클릭 시 자동 진행).

export const TUTORIALS = {
  directions: [
    {
      id: 'home-search-tap',
      target: '[data-tutorial="home-search"]',
      message: '맨 위에 있는 검색창을\n손가락으로 한 번 눌러주세요.',
      position: 'below',
      // clickAdvances 생략 → 누르면 다음 단계로 자동 진행
    },
    {
      id: 'home-search-type',
      target: '[data-tutorial="home-search"]',
      message: '이동하실 곳의 이름을 입력해주세요.\n예: 강남역, 서울역, 홍대입구\n\n다 입력하셨으면 키보드의\n검색(🔍) 버튼을 눌러주세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'dest-result',
      target: '[data-tutorial="dest-result"]',
      message: '아래 목록에서 원하시는 장소를\n손가락으로 한 번 눌러주세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'go',
      target: '[data-tutorial="go"]',
      message: '파란색 "안내 시작" 버튼을\n눌러주세요.',
      position: 'above',
      clickAdvances: false,
    },
  ],
  reserve: [
    {
      id: 'reserve-search-tap',
      target: '[data-tutorial="reserve-search"]',
      message: '아래 검색창을\n손가락으로 한 번 눌러주세요.',
      position: 'below',
    },
    {
      id: 'reserve-search-type',
      target: '[data-tutorial="reserve-search"]',
      message: '예약하실 장소 이름을 입력해주세요.\n예: 강남병원, 국민은행\n\n입력 후 검색 버튼을 눌러주세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'reserve-result',
      target: '[data-tutorial="reserve-result"]',
      message: '아래 목록에서 장소를 눌러\n선택해주세요.',
      position: 'below',
      clickAdvances: false,
    },
  ],
  transit: [
    {
      id: 'transit-toggle',
      target: '[data-tutorial="transit-toggle"]',
      message: '지하철을 이용하시면 "지하철" 버튼을,\n버스를 이용하시면 "버스" 버튼을\n눌러주세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'transit-search-tap',
      target: '[data-tutorial="transit-search"]',
      message: '아래 검색창을 손가락으로\n한 번 눌러주세요.',
      position: 'below',
      // clickAdvances 생략 → 누르면 다음 단계로 자동 진행
    },
    {
      id: 'transit-search-type',
      target: '[data-tutorial="transit-search"]',
      message: '버스 번호 또는 역 이름을 입력하고\n"검색" 버튼을 눌러주세요.\n예: 273 (버스), 강남역 (지하철)',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'transit-card',
      target: '[data-tutorial="transit-card"]',
      message: '카드를 누르면 도착 시간을\n음성으로 알려드려요.\n"걸어가기" 버튼으로 길찾기도\n할 수 있어요.',
      position: 'below',
      clickAdvances: false,
    },
  ],
}

export const TUTORIAL_VERSION = 'v7'
const SEEN_KEY = (tab) => `silvermap.tut.${TUTORIAL_VERSION}.${tab}`

export function isTutorialSeen(tab) {
  try { return localStorage.getItem(SEEN_KEY(tab)) === '1' } catch { return true }
}
export function markTutorialSeen(tab) {
  try { localStorage.setItem(SEEN_KEY(tab), '1') } catch {}
}
export function resetAllTutorials() {
  try {
    Object.keys(TUTORIALS).forEach((tab) => localStorage.removeItem(SEEN_KEY(tab)))
  } catch {}
}
