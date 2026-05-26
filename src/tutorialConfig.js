// 탭별 튜토리얼 시나리오.
// target: data-tutorial="..." 로 표시된 요소의 CSS 셀렉터.
// position: 말풍선 위치 (스포트라이트 기준 'above' | 'below').
// 사용자가 강조된 요소를 실제로 클릭하면 자동으로 다음 단계로 진행.

export const TUTORIALS = {
  directions: [
    {
      id: 'dest-input',
      target: '[data-tutorial="dest-input"]',
      message: '목적지를 검색해주세요.',
      position: 'below',
      clickAdvances: false, // 검색창 클릭(포커스)만으로는 넘어가지 않음 — 직접 "알겠어요" 눌러야 진행
    },
    {
      id: 'dest-result',
      target: '[data-tutorial="dest-result"]',
      message: '목적지를 눌러서 방향을 살펴보세요.',
      position: 'above',
    },
    {
      id: 'my-location',
      target: '[data-tutorial="my-location"]',
      message: "'내 위치'를 눌러 출발지를 정해요.",
      position: 'below',
    },
    {
      id: 'go',
      target: '[data-tutorial="go"]',
      message: "경로를 확인했어요! '안내 시작'을 눌러요.",
      position: 'above',
    },
  ],
}

export const TUTORIAL_VERSION = 'v2'
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
