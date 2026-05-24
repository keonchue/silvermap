import { useMemo, useState } from 'react'
import { CheckIcon } from './icons.jsx'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const TIME_SLOTS = ['오전 10시', '오전 11시', '오후 1시', '오후 2시', '오후 3시', '오후 4시']
const PAY_METHODS = [
  { id: 'onsite', label: '현장에서 결제' },
  { id: 'card', label: '신용·체크카드' },
  { id: 'kakaopay', label: '카카오페이' },
]
const PRICE_PER_PERSON = 10000

function dateOptions() {
  return [0, 1, 2].map((offset) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    const label = offset === 0 ? '오늘' : offset === 1 ? '내일' : '모레'
    return {
      key: String(offset),
      label,
      text: `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`,
    }
  })
}

// 예약 + 결제 목업 흐름 (실제 결제는 일어나지 않음)
export default function ReservationModal({ place, onClose }) {
  const dates = useMemo(dateOptions, [])
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)
  const [people, setPeople] = useState(1)
  const [pay, setPay] = useState(null)

  const total = people * PRICE_PER_PERSON
  const dateText = dates.find((d) => d.key === date)?.text

  return (
    <>
      {step < 3 && <StepBar step={step} />}

      {/* 1단계: 날짜·시간·인원 */}
      {step === 1 && (
        <>
          <Section title="언제 가시나요?">
            <Grid cols={3}>
              {dates.map((d) => (
                <Choice key={d.key} active={date === d.key} onClick={() => setDate(d.key)}>
                  <strong style={{ fontSize: 'var(--fs-base)' }}>{d.label}</strong>
                  <span style={{ fontSize: 15 }}>{d.text}</span>
                </Choice>
              ))}
            </Grid>
          </Section>

          <Section title="몇 시에 가시나요?">
            <Grid cols={2}>
              {TIME_SLOTS.map((t) => (
                <Choice key={t} active={time === t} onClick={() => setTime(t)}>
                  <strong style={{ fontSize: 'var(--fs-base)' }}>{t}</strong>
                </Choice>
              ))}
            </Grid>
          </Section>

          <Section title="몇 분이 가시나요?">
            <div
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface)', border: '2px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '10px 16px',
              }}
            >
              <Stepper label="한 명 줄이기" onClick={() => setPeople((n) => Math.max(1, n - 1))} sign="−" />
              <span style={{ fontSize: 'var(--fs-xxl)', fontWeight: 900 }}>{people}명</span>
              <Stepper label="한 명 늘리기" onClick={() => setPeople((n) => Math.min(9, n + 1))} sign="+" />
            </div>
          </Section>

          <button
            className="btn btn-primary"
            disabled={!date || !time}
            onClick={() => setStep(2)}
            style={{ marginTop: 8, opacity: !date || !time ? 0.45 : 1 }}
          >
            다음으로
          </button>
          {(!date || !time) && (
            <p style={{ fontSize: 15, color: 'var(--text-soft)', textAlign: 'center', marginTop: 10 }}>
              날짜와 시간을 골라주세요.
            </p>
          )}
        </>
      )}

      {/* 2단계: 결제 */}
      {step === 2 && (
        <>
          <Summary place={place} dateText={dateText} time={time} people={people} />

          <Section title="어떻게 결제하시나요?">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PAY_METHODS.map((m) => (
                <Choice key={m.id} active={pay === m.id} onClick={() => setPay(m.id)} row>
                  <strong style={{ fontSize: 'var(--fs-lg)' }}>{m.label}</strong>
                </Choice>
              ))}
            </div>
          </Section>

          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 4px', fontSize: 'var(--fs-lg)', fontWeight: 900,
            }}
          >
            <span>모두 합쳐</span>
            <span style={{ color: 'var(--primary)' }}>{total.toLocaleString()}원</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
              뒤로
            </button>
            <button
              className="btn btn-primary"
              disabled={!pay}
              onClick={() => setStep(3)}
              style={{ flex: 2, opacity: !pay ? 0.45 : 1 }}
            >
              예약 끝내기
            </button>
          </div>
          {!pay && (
            <p style={{ fontSize: 15, color: 'var(--text-soft)', textAlign: 'center', marginTop: 10 }}>
              결제 방법을 골라주세요.
            </p>
          )}
        </>
      )}

      {/* 3단계: 완료 */}
      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 96, height: 96, borderRadius: '50%',
              background: 'var(--success)', color: '#fff', marginBottom: 16,
            }}
          >
            <CheckIcon size={56} />
          </span>
          <h2 style={{ fontSize: 'var(--fs-xxl)', fontWeight: 900, marginBottom: 8 }}>
            예약이 끝났어요
          </h2>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-soft)', marginBottom: 20 }}>
            아래 내용으로 예약되었습니다.
          </p>
          <div style={{ textAlign: 'left', marginBottom: 22 }}>
            <Summary place={place} dateText={dateText} time={time} people={people} />
          </div>
          <button className="btn btn-primary" onClick={onClose}>
            확인
          </button>
        </div>
      )}
    </>
  )
}

function StepBar({ step }) {
  const labels = ['예약 정보', '결제']
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      {labels.map((label, i) => {
        const n = i + 1
        const on = step >= n
        return (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height: 8, borderRadius: 4,
                background: on ? 'var(--primary)' : 'var(--surface-2)',
                marginBottom: 6,
              }}
            />
            <span
              style={{
                fontSize: 15, fontWeight: 700,
                color: on ? 'var(--primary)' : 'var(--text-soft)',
              }}
            >
              {n}. {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, marginBottom: 12 }}>{title}</h3>
      {children}
    </div>
  )
}

function Grid({ cols, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
      {children}
    </div>
  )
}

function Choice({ active, onClick, children, row }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 2,
        minHeight: row ? 'var(--tap)' : 78, padding: '10px 8px',
        borderRadius: 'var(--radius)',
        border: active ? '3px solid var(--primary)' : '2px solid var(--border)',
        background: active ? 'var(--surface)' : 'var(--bg)',
        color: active ? 'var(--primary)' : 'var(--text)',
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  )
}

function Stepper({ label, onClick, sign }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 60, height: 60, borderRadius: '50%',
        background: 'var(--primary)', color: '#fff',
        fontSize: 36, fontWeight: 900, lineHeight: 1,
      }}
    >
      {sign}
    </button>
  )
}

function Summary({ place, dateText, time, people }) {
  const rows = [
    ['장소', place.name],
    ['날짜', dateText],
    ['시간', time],
    ['인원', `${people}명`],
  ]
  return (
    <div
      style={{
        background: 'var(--surface)', border: '2px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '6px 16px', marginBottom: 20,
      }}
    >
      {rows.map(([k, v]) => (
        <div
          key={k}
          style={{
            display: 'flex', justifyContent: 'space-between', gap: 12,
            padding: '12px 0', borderBottom: '2px solid var(--surface-2)',
          }}
        >
          <span style={{ color: 'var(--text-soft)', fontWeight: 700 }}>{k}</span>
          <span style={{ fontWeight: 700, textAlign: 'right' }}>{v}</span>
        </div>
      ))}
    </div>
  )
}
