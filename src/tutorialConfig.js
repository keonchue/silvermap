// 탭별 튜토리얼 시나리오.
// target: data-tutorial="..." 로 표시된 요소의 CSS 셀렉터.
// position: 말풍선 위치 (스포트라이트 기준 'above' | 'below').
// 사용자가 강조된 요소를 실제로 클릭하면 자동으로 다음 단계로 진행.

export const TUTORIALS = {
  directions: [
    {
      id: 'dest-input',
      target: '[data-tutorial="dest-input"]',
      message: '목적지를 검색해주세요. 검색 후 결과를 눌러주세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'dest-result',
      target: '[data-tutorial="dest-result"]',
      message: '여기를 눌러 목적지를 선택하세요.',
      position: 'below',
      clickAdvances: false, // FindFlow의 selectDest에서 programmatic하게 진행
    },
    {
      id: 'go',
      target: '[data-tutorial="go"]',
      message: "경로를 확인했어요! '안내 시작'을 눌러요.",
      position: 'above',
      clickAdvances: false, // FindFlow의 startNav에서 programmatic하게 진행
    },
  ],
  reserve: [
    {
      id: 'reserve-search',
      target: '[data-tutorial="reserve-search"]',
      message: '예약할 장소를 검색하거나 아래 목록에서 선택하세요.',
      position: 'below',
      clickAdvances: false,
    },
    {
      id: 'reserve-result',
      target: '[data-tutorial="reserve-result"]',
      message: '장소를 눌러 선택하세요.',
      position: 'below',
    },
  ],
  transit: [
    {
      id: 'transit-toggle',
      target: '[data-tutorial="transit-toggle"]',
      message: '버스 또는 지하철을 선택하세요.',
      position: 'below',
    },
    {
      id: 'transit-card',
      target: '[data-tutorial="transit-card"]',
      message: '도착 시간을 확인하세요. 30초마다 자동으로 새로고침 됩니다.',
      position: 'above',
      clickAdvances: false,
    },
  ],
}

export const TUTORIAL_VERSION = 'v3'
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
