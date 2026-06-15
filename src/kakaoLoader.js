// Kakao Maps SDK 동적 로더
// index.html 스크립트 태그 방식은 document.write()로 kakao.js를 주입해
// Chrome이 차단할 수 있음. createElement 방식으로 직접 주입한다.

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
      let settled = false
      const settle = () => { if (!settled) { settled = true; resolve(window.kakao) } }
      window.kakao.maps.load(settle)
      setTimeout(settle, 15000) // 15초 안전망
    }

    // 이미 로드된 경우
    if (window.kakao?.maps) { init(); return }

    // createElement로 동적 주입 — document.write() 미사용
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
