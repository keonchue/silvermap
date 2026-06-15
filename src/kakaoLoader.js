// 카카오맵 JavaScript SDK를 동적으로 로드한다.
// index.html의 script 태그가 autoload 방식으로 로드하므로
// Map 생성자가 준비될 때까지 polling으로 대기한다.

const KEY = import.meta.env.VITE_KAKAO_MAP_KEY

let loadPromise = null

export function isKakaoKeyConfigured() {
  return !!KEY && KEY !== 'YOUR_KAKAO_JAVASCRIPT_KEY'
}

export function loadKakaoSdk() {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (!isKakaoKeyConfigured()) {
      reject(new Error('NO_KEY'))
      return
    }

    // autoload 방식: script가 로드되면 kakao.maps.Map이 바로 사용 가능해짐
    // 이미 준비된 경우 즉시 반환
    if (window.kakao?.maps?.Map) {
      resolve(window.kakao)
      return
    }

    // 아직 script 로드 중 → polling
    const interval = setInterval(() => {
      if (window.kakao?.maps?.Map) {
        clearInterval(interval)
        clearTimeout(timer)
        resolve(window.kakao)
      }
    }, 100)

    const timer = setTimeout(() => {
      clearInterval(interval)
      // 타임아웃이어도 kakao 객체가 부분적으로 있으면 진행
      if (window.kakao?.maps) resolve(window.kakao)
      else reject(new Error('SDK_TIMEOUT'))
    }, 10000)

    // fallback: index.html script 없이 직접 주입된 경우
    if (!window.kakao && !document.querySelector('script[src*="dapi.kakao.com"]')) {
      const script = document.createElement('script')
      script.src =
        `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}` +
        `&libraries=services,roadview`
      script.onerror = () => {
        clearInterval(interval)
        clearTimeout(timer)
        reject(new Error('SDK_LOAD_FAILED'))
      }
      document.head.appendChild(script)
    }
  })

  return loadPromise
}
