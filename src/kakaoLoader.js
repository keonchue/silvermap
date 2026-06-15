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
      // roadview 등 라이브러리 로드 실패 시 콜백이 안 올 수 있음 → 5초 후 강제 진행
      let settled = false
      const settle = () => { if (!settled) { settled = true; resolve(window.kakao) } }
      setTimeout(settle, 5000)
      window.kakao.maps.load(settle)
    }
    if (window.kakao?.maps) {
      init()
      return
    }
    // fallback: dynamic injection (index.html script 실패 시)
    const script = document.createElement('script')
    script.src =
      `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}` +
      `&libraries=services,roadview&autoload=false`
    script.async = true
    script.onload = init
    script.onerror = () => reject(new Error('SDK_LOAD_FAILED'))
    document.head.appendChild(script)
  })

  return loadPromise
}
