import { useState } from 'react'
import { SearchIcon } from './icons.jsx'

// 목업 장소 데이터 (카카오 로컬 API 없을 때 폴백)
const PLACES_MOCK = [
  {
    id: '1', name: '강남 복지관', address: '서울 강남구 삼성로 100길 10', rating: 4.5,
    programs: [
      { id: 'p1', name: '노래교실',   time: '오전 10:00 ~ 12:00', price: 5000,  days: ['월', '수', '금'] },
      { id: 'p2', name: '요가교실',   time: '오후 2:00 ~ 3:30',   price: 8000,  days: ['화', '목'] },
      { id: 'p3', name: '건강검진 상담', time: '오전 9:00 ~ 11:00', price: 0,  days: ['월', '화', '수', '목', '금'] },
    ],
  },
  {
    id: '2', name: '서울 한방병원', address: '서울 중구 을지로 123', rating: 4.2,
    programs: [
      { id: 'p4', name: '침 치료',  time: '오전 9:00 ~ 12:00', price: 15000, days: ['월', '화', '수', '목', '금'] },
      { id: 'p5', name: '뜸 치료',  time: '오후 1:00 ~ 5:00',  price: 12000, days: ['월', '수', '금'] },
    ],
  },
  {
    id: '3', name: '종로 문화센터', address: '서울 종로구 종로 99', rating: 4.7,
    programs: [
      { id: 'p6', name: '스마트폰 교실', time: '오전 10:00 ~ 12:00', price: 3000,  days: ['화', '목'] },
      { id: 'p7', name: '수채화 수업',   time: '오후 2:00 ~ 4:00',   price: 10000, days: ['월', '금'] },
    ],
  },
  {
    id: '4', name: '마포 주간보호센터', address: '서울 마포구 마포대로 45', rating: 4.6,
    programs: [
      { id: 'p8', name: '인지훈련 교실', time: '오전 9:30 ~ 11:30', price: 0, days: ['월', '화', '수', '목', '금'] },
      { id: 'p9', name: '원예치료',      time: '오후 2:00 ~ 3:30',  price: 5000, days: ['화', '목'] },
    ],
  },
]

const AVAILABLE_DATES = [
  '5월 27일 (화)', '5월 28일 (수)', '5월 29일 (목)',
  '5월 30일 (금)', '6월 2일 (월)',  '6월 3일 (화)',
]

export default function ReservePanel({ onTutAdvance }) {
  const [step, setStep]           = useState(0) // 0:검색 1:장소 2:예약상세 3:결제 4:완료
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState(PLACES_MOCK)
  const [place, setPlace]         = useState(null)
  const [program, setProgram]     = useState(null)
  const [date, setDate]           = useState(null)
  const [people, setPeople]       = useState(1)
  const [bookingNum, setBookingNum] = useState('')

  function search(e) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) { setResults(PLACES_MOCK); return }
    // 카카오 로컬 API 키 없을 때 목업 필터
    setResults(
      PLACES_MOCK.filter(
        (p) => p.name.includes(q) || p.address.includes(q)
      )
    )
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ReservePanel] 카카오 로컬 API 미연동 — 목업 데이터 사용 중')
    }
  }

  function selectPlace(p)   { setPlace(p);   setStep(1) }
  function selectProgram(pr){ setProgram(pr); setStep(2) }

  function goPayment() {
    if (!date) { alert('날짜를 선택해주세요.'); return }
    setStep(3)
  }

  function pay() {
    // 실제 PG(토스페이먼츠/아임포트) 연동 위치.
    // 카드 정보는 PG 위젯이 처리 — 앱이 직접 저장하지 않음.
    console.warn('[ReservePanel] PG 결제 미연동 — 목업 완료 처리')
    const num = 'SLV' + Date.now().toString().slice(-8)
    setBookingNum(num)
    setStep(4)
  }

  function reset() {
    setStep(0); setQuery(''); setResults(PLACES_MOCK)
    setPlace(null); setProgram(null)
    setDate(null); setPeople(1); setBookingNum('')
  }

  function goBack() {
    if (step === 1) setStep(0)
    else if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  if (step === 4) {
    return (
      <CompleteScreen
        bookingNum={bookingNum}
        place={place} program={program}
        date={date} people={people}
        onDone={reset}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 항상 노출되는 뒤로 가기 버튼 */}
      {step > 0 && (
        <button
          onClick={goBack}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--primary)', fontSize: 'var(--fs-base)', fontWeight: 700,
            padding: '8px 0',
          }}
        >
          ← 뒤로
        </button>
      )}

      {step === 0 && (
        <SearchStep
          query={query} setQuery={setQuery}
          results={results} onSearch={search}
          onSelect={selectPlace}
        />
      )}
      {step === 1 && (
        <PlaceDetailStep place={place} onSelect={selectProgram} />
      )}
      {step === 2 && (
        <BookingDetailStep
          program={program}
          date={date} setDate={setDate}
          people={people} setPeople={setPeople}
          onNext={goPayment}
        />
      )}
      {step === 3 && (
        <PaymentStep
          place={place} program={program}
          date={date} people={people}
          onPay={pay}
        />
      )}
    </div>
  )
}

/* ===== 단계별 서브 컴포넌트 ===== */

function SearchStep({ query, setQuery, results, onSearch, onSelect }) {
  return (
    <>
      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>어디를 예약할까요?</p>

      <form data-tutorial="reserve-search" onSubmit={onSearch} style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '2px solid var(--border)',
          borderRadius: 30, padding: '0 14px',
        }}>
          <SearchIcon size={20} />
          <input
            type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="병원, 복지관, 식당 등"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 18, padding: '13px 0', outline: 'none' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 22px' }}>
          검색
        </button>
      </form>

      {results.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 24, fontSize: 'var(--fs-base)' }}>
          검색 결과가 없습니다.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((p, i) => (
          <button
            key={p.id}
            data-tutorial={i === 0 ? 'reserve-result' : undefined}
            onClick={() => onSelect(p)}
            style={{
              textAlign: 'left', background: '#fff',
              border: '2px solid var(--border)', borderRadius: 'var(--radius)',
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>{p.name}</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 4 }}>
              {p.address}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: '#f59e0b', marginTop: 4 }}>
              ★ {p.rating}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

function PlaceDetailStep({ place, onSelect }) {
  return (
    <>
      {/* 장소 요약 카드 */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        padding: '16px 18px', marginBottom: 4,
      }}>
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 900 }}>{place.name}</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 4 }}>
          {place.address}
        </div>
        <div style={{ fontSize: 'var(--fs-base)', color: '#f59e0b', marginTop: 6 }}>
          ★ {place.rating}
        </div>
      </div>

      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>어떤 프로그램을 예약할까요?</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {place.programs.map((pr) => (
          <button
            key={pr.id}
            onClick={() => onSelect(pr)}
            style={{
              textAlign: 'left', background: '#fff',
              border: '2px solid var(--border)', borderRadius: 'var(--radius)',
              padding: '16px 18px',
            }}
          >
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>{pr.name}</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 4 }}>
              {pr.days.join(' · ')} &nbsp;|&nbsp; {pr.time}
            </div>
            <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--primary)', marginTop: 6 }}>
              {pr.price === 0 ? '무료' : `${pr.price.toLocaleString()}원`}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

function BookingDetailStep({ program, date, setDate, people, setPeople, onNext }) {
  return (
    <>
      {/* 선택한 프로그램 요약 */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '14px 18px',
      }}>
        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>{program.name}</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>{program.time}</div>
      </div>

      {/* 날짜 선택 */}
      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>날짜를 선택해주세요</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {AVAILABLE_DATES.map((d) => (
          <button
            key={d}
            onClick={() => setDate(d)}
            style={{
              padding: '14px 8px', borderRadius: 'var(--radius)',
              textAlign: 'center', fontWeight: 700, fontSize: 'var(--fs-sm)',
              border: date === d ? '3px solid var(--primary)' : '2px solid var(--border)',
              background: date === d ? 'var(--surface)' : '#fff',
              color: date === d ? 'var(--primary)' : 'var(--text)',
              transition: 'all 120ms',
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* 인원 선택 */}
      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, marginTop: 8 }}>인원을 선택해주세요</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center', marginBottom: 4 }}>
        <button
          onClick={() => setPeople(Math.max(1, people - 1))}
          aria-label="인원 줄이기"
          style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--surface)', border: '2px solid var(--border)',
            fontSize: 30, fontWeight: 700,
          }}
        >
          −
        </button>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 'var(--fs-xxl)', fontWeight: 900 }}>{people}</span>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>명</div>
        </div>
        <button
          onClick={() => setPeople(Math.min(10, people + 1))}
          aria-label="인원 늘리기"
          style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'var(--surface)', border: '2px solid var(--border)',
            fontSize: 30, fontWeight: 700,
          }}
        >
          +
        </button>
      </div>

      <button onClick={onNext} className="btn btn-primary" style={{ marginTop: 12, fontSize: 'var(--fs-lg)' }}>
        예약 정보 확인
      </button>
    </>
  )
}

function PaymentStep({ place, program, date, people, onPay }) {
  const total = program.price * people

  return (
    <>
      <p style={{ fontSize: 'var(--fs-xl)', fontWeight: 900 }}>결제 정보 확인</p>

      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '18px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <PayRow label="장소"     value={place.name}    />
        <PayRow label="프로그램" value={program.name}  />
        <PayRow label="날짜"     value={date}          />
        <PayRow label="인원"     value={`${people}명`} />
        <hr style={{ margin: '12px 0', border: 'none', borderTop: '2px solid var(--border)' }} />
        <PayRow
          label="결제 금액"
          value={total === 0 ? '무료' : `${total.toLocaleString()}원`}
          bold
        />
      </div>

      {total > 0 && (
        <div style={{
          background: '#f0f7ff', border: '2px solid var(--primary)',
          borderRadius: 'var(--radius)', padding: '14px 18px',
          fontSize: 'var(--fs-sm)', lineHeight: 1.7,
        }}>
          카드 번호 등 민감 정보는 결제 위젯에서 안전하게 처리됩니다.
          앱이 직접 카드 정보를 저장하지 않습니다.
        </div>
      )}

      <button
        onClick={onPay}
        className="btn btn-primary"
        style={{ fontSize: 'var(--fs-lg)' }}
      >
        {total === 0 ? '무료 예약 완료' : '결제하기'}
      </button>
    </>
  )
}

function CompleteScreen({ bookingNum, place, program, date, people, onDone }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 16 }}>
      <div style={{ fontSize: 80, marginBottom: 12 }}>✅</div>
      <p style={{ fontSize: 'var(--fs-xxl)', fontWeight: 900, marginBottom: 6 }}>예약 완료!</p>
      <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-soft)', marginBottom: 20 }}>
        예약이 성공적으로 접수되었습니다.
      </p>

      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)',
        padding: '18px', textAlign: 'left', marginBottom: 20,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <PayRow label="예약번호" value={bookingNum} bold />
        <PayRow label="장소"     value={place.name}    />
        <PayRow label="프로그램" value={program.name}  />
        <PayRow label="날짜"     value={date}          />
        <PayRow label="인원"     value={`${people}명`} />
      </div>

      <button onClick={onDone} className="btn btn-secondary">
        처음으로 돌아가기
      </button>
    </div>
  )
}

function PayRow({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-base)', fontWeight: bold ? 900 : 700 }}>{value}</span>
    </div>
  )
}
