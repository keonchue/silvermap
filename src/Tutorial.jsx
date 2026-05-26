import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

// 게임 튜토리얼 스타일 오버레이.
// - 강조 대상 주변을 4개 dim 패널로 둘러쌈 → 대상 영역은 실제 클릭 가능.
// - 대상 요소 클릭 시 자동으로 다음 단계 진행 (이벤트 버블링 유지).
// - 안내 캐릭터 + 말풍선으로 단계별 안내.

function useTargetRect(selector, stepId) {
  const [rect, setRect] = useState(null)

  useLayoutEffect(() => {
    if (!selector) { setRect(null); return }
    let alive = true
    let tries = 0

    function update() {
      const el = document.querySelector(selector)
      if (!alive) return
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      setRect({ x: r.left, y: r.top, w: r.width, h: r.height })
    }

    update()
    // 패널 슬라이드 애니메이션 동안 폴링
    const poll = setInterval(() => {
      tries += 1
      update()
      if (tries > 20) clearInterval(poll)
    }, 80)

    const onChange = () => update()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      alive = false
      clearInterval(poll)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [selector, stepId])

  return rect
}

// 친근한 안내 캐릭터 (안경 쓴 어르신)
function Guide({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="30" r="18" fill="#ffe0b2" stroke="#15233b" strokeWidth="2" />
      <path d="M16 26c2-10 12-14 18-12 6 2 12 6 14 12-4-2-10-2-16 0-6 2-12 2-16 0Z" fill="#bdbdbd" />
      <circle cx="25" cy="32" r="5" fill="#fff" stroke="#15233b" strokeWidth="2.4" />
      <circle cx="39" cy="32" r="5" fill="#fff" stroke="#15233b" strokeWidth="2.4" />
      <path d="M30 32h4" stroke="#15233b" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="25" cy="32" r="1.6" fill="#15233b" />
      <circle cx="39" cy="32" r="1.6" fill="#15233b" />
      <path d="M26 40c2 3 10 3 12 0" fill="none" stroke="#15233b" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 60c2-8 8-12 18-12s16 4 18 12" fill="#1957c8" />
    </svg>
  )
}

export default function Tutorial({ steps, stepIndex, onNext, onClose }) {
  const step = steps[stepIndex]
  const rect = useTargetRect(step?.target, step?.id)
  const [bubblePos, setBubblePos] = useState(null)

  // 말풍선 위치 계산 (스포트라이트 위/아래)
  useEffect(() => {
    if (!rect) { setBubblePos(null); return }
    const PAD = 14
    const above = step.position === 'above'
    const cx = rect.x + rect.w / 2
    const top = above ? rect.y - PAD : rect.y + rect.h + PAD
    setBubblePos({ left: cx, top, above })
  }, [rect, step])

  // 강조 요소 클릭 시 다음 단계로 자동 진행 (이벤트 버블링 유지)
  // clickAdvances: false 인 단계는 클릭으로 자동 진행하지 않음
  const handleTargetClick = useCallback(() => {
    onNext()
  }, [onNext])

  useEffect(() => {
    if (!step?.target || !rect || step.clickAdvances === false) return
    const el = document.querySelector(step.target)
    if (!el) return
    el.addEventListener('click', handleTargetClick)
    return () => el.removeEventListener('click', handleTargetClick)
  }, [step, rect, handleTargetClick])

  if (!step) return null

  // 타겟이 아직 화면에 없을 때
  if (!rect) {
    return (
      <div className="tut-root">
        <div className="tut-dim tut-dim-full" />
        <div className="tut-bubble tut-bubble-center">
          <Guide />
          <div className="tut-bubble-body">
            <p>다음 단계 화면을 준비하고 있어요...</p>
            <div className="tut-bubble-actions">
              <button onClick={onClose} className="tut-skip">건너뛰기</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const PAD = 8
  const sx = rect.x - PAD
  const sy = rect.y - PAD
  const sw = rect.w + PAD * 2
  const sh = rect.h + PAD * 2

  const isLast = stepIndex === steps.length - 1

  return (
    <div className="tut-root">
      {/* 4면 어둡게 + 블러 — 스포트라이트 영역은 실제 클릭 가능 */}
      <div className="tut-dim" style={{ top: 0, left: 0, width: '100%', height: Math.max(0, sy) }} />
      <div className="tut-dim" style={{ top: sy + sh, left: 0, width: '100%', height: `calc(100% - ${sy + sh}px)` }} />
      <div className="tut-dim" style={{ top: sy, left: 0, width: Math.max(0, sx), height: sh }} />
      <div className="tut-dim" style={{ top: sy, left: sx + sw, width: `calc(100% - ${sx + sw}px)`, height: sh }} />

      {/* 스포트라이트 테두리 */}
      <div className="tut-ring" style={{ top: sy, left: sx, width: sw, height: sh }} aria-hidden="true" />

      {/* 가리키는 화살표 */}
      <div
        className="tut-pointer"
        style={{
          left: rect.x + rect.w / 2,
          top: bubblePos?.above ? sy - 12 : sy + sh + 12,
          transform: `translate(-50%, -50%) rotate(${bubblePos?.above ? 180 : 0}deg)`,
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 32" width="28" height="36">
          <path d="M12 30 L4 14 L9 14 L9 2 L15 2 L15 14 L20 14 Z" fill="#dc2626" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>

      {/* 말풍선 + 캐릭터 */}
      {bubblePos && (
        <div
          className={`tut-bubble ${bubblePos.above ? 'tut-bubble-above' : 'tut-bubble-below'}`}
          style={{ left: bubblePos.left, top: bubblePos.top }}
          role="status"
          aria-live="polite"
        >
          <Guide />
          <div className="tut-bubble-body">
            <p>{step.message}</p>
            <div className="tut-bubble-actions">
              <button onClick={onClose} className="tut-skip">건너뛰기</button>
              <button onClick={onNext} className="tut-next">
                {isLast ? '다 알겠어요' : '알겠어요'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
