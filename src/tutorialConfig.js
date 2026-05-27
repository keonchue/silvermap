// 탭별 튜토리얼 시나리오.
// target: data-tutorial="..." 로 표시된 요소의 CSS 셀렉터.
// position: 말풍선 위치 (스포트라이트 기준 'above' | 'below').
// 사용자가 강조된 요소를 실제로 클릭하면 자동으로 다음 단계로 진행.

// 모든 탭의 step 0은 위 검색창([data-tutorial="home-search"])을 가리킴
export const TUTORIALS = {
  directions: [
    {
      id: 'home-search',
      target: '[data-tutorial="home-search"]',
      message: '위 검색창에 목적지를 입력하고 검색하세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'dest-result',
      target: '[data-tutorial="dest-result"]',
      message: '목적지를 눌러서 선택하세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'go',
      target: '[data-tutorial="go"]',
      message: "경로를 확인했어요! '안내 시작'을 눌러요.",
      position: 'above',
      clickAdvances: false,
    },
  ],
  reserve: [
    {
      id: 'home-search',
      target: '[data-tutorial="home-search"]',
      message: '위 검색창에서 예약할 장소를 검색하세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'reserve-result',
      target: '[data-tutorial="reserve-result"]',
      message: '장소를 눌러 선택하세요.',
      position: 'below',
      clickAdvances: false,
    },
  ],
  transit: [
    {
      id: 'transit-toggle',
      target: '[data-tutorial="transit-toggle"]',
      message: '지하철 또는 버스 중 하나를 선택하세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'transit-search',
      target: '[data-tutorial="transit-search"]',
      message: '버스 번호(예: 273) 또는 역 이름(예: 강남역)을 입력하고 검색 버튼을 누르세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'transit-card',
      target: '[data-tutorial="transit-card"]',
      message: '카드를 눌러 도착 시간을 음성으로 들을 수 있어요. 길찾기 버튼으로 바로 이동할 수 있습니다.',
      position: 'below',
      clickAdvances: false,
    },
  ],
}

export const TUTORIAL_VERSION = 'v5'
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
