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

// 검색 결과로 선택된 장소에 programs 정보가 없을 때 사용하는 기본값
const DEFAULT_PROGRAMS = [
  { id: 'def-1', name: '방문 예약',    time: '평일 09:00 ~ 18:00', price: 0,     days: ['월', '화', '수', '목', '금'] },
  { id: 'def-2', name: '전화 상담',    time: '평일 10:00 ~ 16:00', price: 0,     days: ['월', '화', '수', '목', '금'] },
  { id: 'def-3', name: '프로그램 문의', time: '평일 09:00 ~ 17:00', price: 5000, days: ['화', '목'] },
]

const AVAILABLE_DATES = [
  '5월 27일 (화)', '5월 28일 (수)', '5월 29일 (목)',
  '5월 30일 (금)', '6월 2일 (월)',  '6월 3일 (화)',
]

export default function ReservePanel({ onTutAdvance, initialPlace }) {
  const [step, setStep]           = useState(initialPlace ? 1 : 0) // 0:검색 1:장소 2:예약상세 3:결제 4:완료
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState(PLACES_MOCK)
  const [place, setPlace]         = useState(initialPlace || null)
  const [program, setProgram]     = useState(null)
  const [date, setDate]           = useState(null)
  const [people, setPeople]       = useState(1)
  const [bookingNum, setBookingNum] = useState('')

  function search(e) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) { setResults(PLACES_MOCK); return }
    setResults(
      PLACES_MOCK.filter(
        (p) => p.name.includes(q) || p.address.includes(q)
      )
    )
    onTutAdvance?.()
  }

  function selectPlace(p) { setPlace(p); setStep(1); onTutAdvance?.() }
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
  const programs = place.programs || DEFAULT_PROGRAMS
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
        {place.rating && (
          <div style={{ fontSize: 'var(--fs-base)', color: '#f59e0b', marginTop: 6 }}>
            ★ {place.rating}
          </div>
        )}
      </div>

      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>어떤 프로그램을 예약할까요?</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {programs.map((pr) => (
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
  const [method, setMethod]     = useState(null)
  const [cardNum, setCardNum]   = useState('')
  const [cardExp, setCardExp]   = useState('')
  const [cardCvc, setCardCvc]   = useState('')
  const [cardName, setCardName] = useState('')

  function fmtCardNum(v) {
    const digits = v.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }
  function fmtExp(v) {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + ' / ' + digits.slice(2)
    return digits
  }

  const canPay = method === 'free'
    || method === 'kakaopay'
    || method === 'tosspay'
    || method === 'onsite'
    || (method === 'card' && cardNum.replace(/\s/g,'').length === 16 && cardExp.length >= 5 && cardCvc.length >= 3)

  if (total === 0) {
    return (
      <>
        <p style={{ fontSize: 'var(--fs-xl)', fontWeight: 900 }}>예약 정보 확인</p>
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '18px',
          display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 4,
        }}>
          <PayRow label="장소"     value={place.name}   />
          <PayRow label="프로그램" value={program.name} />
          <PayRow label="날짜"     value={date}         />
          <PayRow label="인원"     value={`${people}명`}/>
          <hr style={{ margin: '12px 0', border: 'none', borderTop: '2px solid var(--border)' }} />
          <PayRow label="결제 금액" value="무료" bold />
        </div>
        <button onClick={onPay} className="btn btn-primary" style={{ fontSize: 'var(--fs-lg)' }}>
          무료 예약 완료
        </button>
      </>
    )
  }

  return (
    <>
      <p style={{ fontSize: 'var(--fs-xl)', fontWeight: 900 }}>결제하기</p>

      {/* 예약 요약 */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '16px 18px',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <PayRow label="장소"     value={place.name}   />
        <PayRow label="프로그램" value={program.name} />
        <PayRow label="날짜"     value={date}         />
        <PayRow label="인원"     value={`${people}명`}/>
        <hr style={{ margin: '10px 0', border: 'none', borderTop: '2px solid var(--border)' }} />
        <PayRow label="결제 금액" value={`${total.toLocaleString()}원`} bold />
      </div>

      {/* 결제 수단 */}
      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, marginTop: 4 }}>결제 수단 선택</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* 카카오페이 */}
        <button
          onClick={() => setMethod('kakaopay')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px', borderRadius: 'var(--radius)',
            border: method === 'kakaopay' ? '3px solid #3c1e1e' : '2px solid var(--border)',
            background: method === 'kakaopay' ? '#fee500' : '#fff',
            transition: 'all 120ms', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 32, lineHeight: 1 }}>💛</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: '#3c1e1e' }}>카카오페이</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: '#7a5a00', marginTop: 2 }}>카카오 계정으로 간편 결제</div>
          </div>
          {method === 'kakaopay' && <span style={{ fontSize: 22, color: '#3c1e1e' }}>✓</span>}
        </button>

        {/* 토스페이 */}
        <button
          onClick={() => setMethod('tosspay')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px', borderRadius: 'var(--radius)',
            border: method === 'tosspay' ? '3px solid #0064ff' : '2px solid var(--border)',
            background: method === 'tosspay' ? '#e8f0ff' : '#fff',
            transition: 'all 120ms', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 32, lineHeight: 1 }}>💙</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: '#0064ff' }}>토스페이</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: '#3a5fa8', marginTop: 2 }}>토스 앱으로 간편 결제</div>
          </div>
          {method === 'tosspay' && <span style={{ fontSize: 22, color: '#0064ff' }}>✓</span>}
        </button>

        {/* 신용·체크카드 */}
        <div style={{
          borderRadius: 'var(--radius)',
          border: method === 'card' ? '3px solid var(--primary)' : '2px solid var(--border)',
          background: '#fff', overflow: 'hidden', transition: 'border 120ms',
        }}>
          <button
            onClick={() => setMethod(method === 'card' ? null : 'card')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', background: 'transparent', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 32, lineHeight: 1 }}>💳</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--text)' }}>신용·체크카드</div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 2 }}>국내외 모든 카드 사용 가능</div>
            </div>
            <span style={{ fontSize: 20, color: 'var(--text-soft)' }}>{method === 'card' ? '▲' : '▼'}</span>
          </button>

          {method === 'card' && (
            <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-soft)', display: 'block', marginBottom: 6 }}>
                  카드 번호
                </label>
                <input
                  type="tel" inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={cardNum}
                  onChange={e => setCardNum(fmtCardNum(e.target.value))}
                  style={{
                    width: '100%', padding: '14px 16px', fontSize: 'var(--fs-base)',
                    border: '2px solid var(--border)', borderRadius: 14,
                    background: 'var(--surface)', letterSpacing: 2,
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-soft)', display: 'block', marginBottom: 6 }}>
                    유효기간
                  </label>
                  <input
                    type="tel" inputMode="numeric"
                    placeholder="MM / YY"
                    value={cardExp}
                    onChange={e => setCardExp(fmtExp(e.target.value))}
                    style={{
                      width: '100%', padding: '14px 16px', fontSize: 'var(--fs-base)',
                      border: '2px solid var(--border)', borderRadius: 14,
                      background: 'var(--surface)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-soft)', display: 'block', marginBottom: 6 }}>
                    CVC
                  </label>
                  <input
                    type="tel" inputMode="numeric"
                    placeholder="123"
                    maxLength={4}
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value.replace(/\D/g,'').slice(0,4))}
                    style={{
                      width: '100%', padding: '14px 16px', fontSize: 'var(--fs-base)',
                      border: '2px solid var(--border)', borderRadius: 14,
                      background: 'var(--surface)',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-soft)', display: 'block', marginBottom: 6 }}>
                  카드 소유자 이름
                </label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 16px', fontSize: 'var(--fs-base)',
                    border: '2px solid var(--border)', borderRadius: 14,
                    background: 'var(--surface)',
                  }}
                />
              </div>
              <div style={{
                background: '#f0f7ff', border: '2px solid var(--primary)',
                borderRadius: 12, padding: '10px 14px',
                fontSize: 15, color: 'var(--text-soft)', lineHeight: 1.6,
              }}>
                🔒 카드 정보는 암호화되어 안전하게 처리됩니다
              </div>
            </div>
          )}
        </div>

        {/* 현장 결제 */}
        <button
          onClick={() => setMethod('onsite')}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 18px', borderRadius: 'var(--radius)',
            border: method === 'onsite' ? '3px solid var(--success)' : '2px solid var(--border)',
            background: method === 'onsite' ? '#e8f5ed' : '#fff',
            transition: 'all 120ms', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 32, lineHeight: 1 }}>💵</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--text)' }}>현장에서 결제</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 2 }}>방문 후 현금 또는 카드로 결제</div>
          </div>
          {method === 'onsite' && <span style={{ fontSize: 22, color: 'var(--success)' }}>✓</span>}
        </button>
      </div>

      <button
        onClick={onPay}
        className="btn btn-primary"
        disabled={!canPay}
        style={{ fontSize: 'var(--fs-lg)', marginTop: 4, opacity: canPay ? 1 : 0.45 }}
      >
        {method === 'kakaopay' ? `💛 카카오페이로 ${total.toLocaleString()}원 결제`
          : method === 'tosspay' ? `💙 토스페이로 ${total.toLocaleString()}원 결제`
          : method === 'card' ? `💳 카드로 ${total.toLocaleString()}원 결제`
          : method === 'onsite' ? `예약 완료 (현장 결제)`
          : '결제 수단을 선택해주세요'}
      </button>
      {!canPay && method && (
        <p style={{ fontSize: 15, color: 'var(--text-soft)', textAlign: 'center' }}>
          {method === 'card' ? '카드 정보를 모두 입력해주세요.' : ''}
        </p>
      )}
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
