# 큰지도 (SilverMap)

노인분들이 쓰기 편하도록 만든 지도 웹앱입니다. 큰 글자, 높은 대비,
큰 버튼, 단순한 화면 구성을 원칙으로 합니다.

## 주요 기능

- **장소 찾기** — 키워드 검색 + 자주 찾는 곳(병원·약국·은행·화장실·버스정류장·식당)
- **길찾기** — 출발지(내 위치) → 목적지, 도보 / 대중교통 예상 안내
- **현재 위치 / 주변** — 내 위치 표시, 주변 카테고리 검색
- **예약 / 결제** — 날짜·시간·인원 선택 후 결제까지의 흐름 (목업, 실제 결제 없음)

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 엽니다.

## 카카오맵 키 설정

키가 없어도 **데모 모드**로 모든 화면이 동작합니다(서울시청 주변 샘플 데이터 사용).
실제 지도와 실제 장소 검색을 쓰려면 카카오 키가 필요합니다.

1. https://developers.kakao.com 에 로그인 → **내 애플리케이션** → 애플리케이션 추가
2. **앱 키 > JavaScript 키** 를 복사
3. **플랫폼 > Web** 에 사이트 도메인 등록 (개발 시 `http://localhost:5173`)
4. 프로젝트 루트의 `.env` 파일을 열어 키를 붙여넣기:

   ```
   VITE_KAKAO_MAP_KEY=여기에_복사한_JavaScript_키
   ```

5. `npm run dev` 를 다시 실행

## 길찾기 안내 (중요)

카카오맵 JavaScript SDK는 지도 표시·장소 검색만 제공하고
실제 경로 안내(턴바이턴)는 포함하지 않습니다. 현재 길찾기는
출발지–목적지 직선 거리 기반의 **예상 시간/경로**를 보여줍니다.
정확한 대중교통·도보 경로가 필요하면 카카오 모빌리티 REST API
(서버 측 호출, 별도 키)를 연동해야 합니다.

## 기술 스택

- React 18 + Vite
- 카카오맵 JavaScript SDK (`services` 라이브러리)

## 폴더 구조

```
src/
  App.jsx            전체 화면 구성 / 상태
  MapCanvas.jsx      지도 (카카오 실제 지도 + 데모 지도)
  BottomNav.jsx      하단 큰 메뉴 (지도/장소찾기/길찾기)
  SearchPanel.jsx    장소 검색 화면
  DirectionsPanel.jsx 길찾기 화면
  PlaceSheet.jsx     장소 상세 정보
  ReservationModal.jsx 예약·결제 목업 흐름
  placesService.js   카카오 / 데모 데이터 검색 추상화
  kakaoLoader.js     카카오 SDK 동적 로더
  categories.js      자주 찾는 장소 분류
  index.css          노인 친화 디자인 토큰
```
