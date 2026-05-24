// 카카오맵 JavaScript SDK를 동적으로 로드한다.
// .env 의 VITE_KAKAO_MAP_KEY 가 실제 키로 채워져 있어야 진짜 지도가 뜬다.

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
    const init = () => {
      window.kakao.maps.load(() => resolve(window.kakao))
    }
    if (window.kakao?.maps) {
      init()
      return
    }
    // fallback: dynamic injection (index.html script 실패 시)
    const script = document.createElement('script')
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}` +
      `&libraries=services&autoload=false`
    script.async = true
    script.onload = init
    script.onerror = () => reject(new Error('SDK_LOAD_FAILED'))
    document.head.appendChild(script)
  })

  return loadPromise
}
