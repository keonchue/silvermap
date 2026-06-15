import { useState } from 'react'
import { SearchIcon } from './icons.jsx'
import { searchByKeyword } from './placesService.js'

const PLACES_MOCK = [
  {
    id: '1', name: '강남 복지관', address: '서울 강남구 삼성로 100길 10', rating: 4.5,
    programs: [
      { id: 'p1', name: '노래교실',   time: '오전 10:00 ~ 12:00', price: 5000,  days: ['월', '수', '금'] },
      { id: 'p2', name: '요가교실',   time: '오후 2:00 ~ 3:30',   price: 8000,  days: ['화', '목'] },
      { id: 'p3', name: '건강검진 상담', time: '오전 9:00 ~ 11:00', price: 0,   days: ['월', '화', '수', '목', '금'] },
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
      { id: 'p8', name: '인지훈련 교실', time: '오전 9:30 ~ 11:30', price: 0,    days: ['월', '화', '수', '목', '금'] },
      { id: 'p9', name: '원예치료',      time: '오후 2:00 ~ 3:30',  price: 5000, days: ['화', '목'] },
    ],
  },
]

const DEFAULT_PROGRAMS = [
  { id: 'def-1', name: '방문 예약',    time: '평일 09:00 ~ 18:00', price: 0,     days: ['월', '화', '수', '목', '금'] },
  { id: 'def-2', name: '전화 상담',    time: '평일 10:00 ~ 16:00', price: 0,     days: ['월', '화', '수', '목', '금'] },
  { id: 'def-3', name: '프로그램 문의', time: '평일 09:00 ~ 17:00', price: 5000, days: ['화', '목'] },
]

function getAvailableDates() {
  const DAYS = ['일', '월', '화', '수', '목', '금', '토']
  const result = []
  for (let i = 0; result.length < 6; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const day = d.getDay()
    if (day === 0 || day === 6) continue
    const prefix = i === 0 ? '오늘 ' : i === 1 ? '내일 ' : ''
    result.push(`${prefix}${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[day]})`)
  }
  return result
}

function saveBooking(data) {
  try {
    const prev = JSON.parse(localStorage.getItem('silvermap_bookings') || '[]')
    prev.unshift(data)
    localStorage.setItem('silvermap_bookings', JSON.stringify(prev.slice(0, 20)))
  } catch {}
}

const CARD_COMPANIES = ['카드사 선택', '국민카드', '신한카드', '삼성카드', '현대카드', '롯데카드', '하나카드', '우리카드', 'NH농협카드']

function loadSavedCard() {
  try { return JSON.parse(localStorage.getItem('silvermap_card')) } catch { return null }
}

export default function ReservePanel({ onTutAdvance, initialPlace, from }) {
  const [step, setStep]           = useState(initialPlace ? 1 : 0)
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState(PLACES_MOCK)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)
  const [place, setPlace]         = useState(initialPlace || null)
  const [program, setProgram]     = useState(null)
  const [date, setDate]           = useState(null)
  const [people, setPeople]       = useState(1)
  const [bookingNum, setBookingNum] = useState('')

  async function search(e) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) { setResults(PLACES_MOCK); setSearchError(null); return }
    setSearchLoading(true)
    setSearchError(null)
    try {
      const places = await searchByKeyword(q, from)
      setResults(places.length > 0 ? places : [])
    } catch {
      setSearchError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      setResults(PLACES_MOCK)
    }
    setSearchLoading(false)
    onTutAdvance?.()
  }

  function selectPlace(p) { setPlace(p); setStep(1); onTutAdvance?.() }
  function selectProgram(pr){ setProgram(pr); setStep(2) }

  function goPayment() {
    if (!date) return
    setStep(3)
  }

  function pay() {
    const num = 'SLV' + Date.now().toString().slice(-8)
    saveBooking({ bookingNum: num, placeName: place.name, programName: program.name, date, people, savedAt: new Date().toISOString() })
    setBookingNum(num)
    setStep(4)
  }

  function reset() {
    setStep(0); setQuery(''); setResults(PLACES_MOCK)
    setPlace(null); setProgram(null)
    setDate(null); setPeople(1); setBookingNum('')
    setSearchError(null)
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
          onSelect={selectPlace} loading={searchLoading}
          searchError={searchError}
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

function SearchStep({ query, setQuery, results, onSearch, onSelect, loading, searchError }) {
  return (
    <>
      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>어디를 예약할까요?</p>

      <form data-tutorial="reserve-search" onSubmit={onSearch} style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
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
        <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 22px', flexShrink: 0 }}>
          검색
        </button>
      </form>

      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 16, fontSize: 'var(--fs-base)' }}>
          찾는 중입니다...
        </p>
      )}

      {!loading && searchError && (
        <div style={{
          background: '#fff3f0', border: '2px solid var(--danger)',
          borderRadius: 'var(--radius)', padding: '16px 18px',
        }}>
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--danger)', fontWeight: 700 }}>
            ⚠️ {searchError}
          </p>
        </div>
      )}

      {!loading && results.length === 0 && !searchError && (
        <p style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 24, fontSize: 'var(--fs-base)' }}>
          검색 결과가 없습니다.
        </p>
      )}

      {!loading && !searchError && results.length > 0 && (
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
              {p.rating && (
                <div style={{ fontSize: 'var(--fs-sm)', color: '#f59e0b', marginTop: 4 }}>
                  ★ {p.rating}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function PlaceDetailStep({ place, onSelect }) {
  const programs = place.programs || DEFAULT_PROGRAMS
  return (
    <>
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
  const availableDates = useMemo(getAvailableDates, [])
  return (
    <>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '14px 18px',
      }}>
        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>{program.name}</div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)' }}>{program.time}</div>
      </div>

      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900 }}>날짜를 선택해주세요</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {availableDates.map((d) => (
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
        >−</button>
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
        >+</button>
      </div>

      <button
        onClick={onNext}
        disabled={!date}
        className="btn btn-primary"
        style={{ marginTop: 12, fontSize: 'var(--fs-lg)', opacity: date ? 1 : 0.45 }}
      >
        예약 정보 확인
      </button>
      {!date && (
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', textAlign: 'center', marginTop: 8 }}>
          날짜를 선택해주세요
        </p>
      )}
    </>
  )
}

function PaymentStep({ place, program, date, people, onPay }) {
  const total = program.price * people
  const [savedCard, setSavedCard] = useState(loadSavedCard)
  const [method, setMethod]       = useState(savedCard ? 'saved' : 'newcard')
  const [showCardForm, setShowCardForm] = useState(!savedCard)
  const [cardCompany, setCardCompany]   = useState('')
  const [showFamilySheet, setShowFamilySheet] = useState(false)

  // 카드 입력 폼
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

  function saveCard() {
    const last4 = cardNum.replace(/\s/g, '').slice(-4)
    const card = {
      maskedNum: `•••• •••• •••• ${last4}`,
      expiry: cardExp,
      holderName: cardName,
      company: cardCompany || '신용/체크카드',
    }
    localStorage.setItem('silvermap_card', JSON.stringify(card))
    setSavedCard(card)
    setShowCardForm(false)
    setMethod('saved')
  }

  const cardFormValid =
    cardNum.replace(/\s/g, '').length === 16 &&
    cardExp.length >= 5 &&
    cardCvc.length >= 3 &&
    cardName.trim().length > 0

  const canPay =
    method === 'saved' ||
    method === 'onsite' ||
    (method === 'newcard' && cardFormValid)

  function handlePay() {
    if (method === 'newcard' && cardFormValid) saveCard()
    onPay()
  }

  function callFamily() {
    const saved = localStorage.getItem('silvermap_family_tel')
    if (saved) {
      window.location.href = `tel:${saved}`
    } else {
      setShowFamilySheet(true)
    }
  }

  // 무료 예약
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
        <button
          onClick={callFamily}
          style={{
            display: 'block', margin: '16px auto 0',
            fontSize: 15, color: 'var(--text-soft)',
            background: 'none', border: 'none',
            textDecoration: 'underline', cursor: 'pointer',
          }}
        >
          📞 자녀에게 부탁하기
        </button>
        {showFamilySheet && <FamilySheet onClose={() => setShowFamilySheet(false)} />}
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
      <p style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, marginTop: 4 }}>결제 수단</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* 신용/체크카드 */}
        <div style={{
          borderRadius: 'var(--radius)',
          border: (method === 'saved' || method === 'newcard') ? '3px solid var(--primary)' : '2px solid var(--border)',
          background: '#fff', overflow: 'hidden',
        }}>
          {/* 라디오 헤더 */}
          <button
            onClick={() => {
              if (method === 'onsite') {
                setMethod(savedCard ? 'saved' : 'newcard')
                setShowCardForm(!savedCard)
              }
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', background: 'transparent', textAlign: 'left',
            }}
          >
            <RadioDot active={method === 'saved' || method === 'newcard'} />
            <span style={{ fontSize: 32, lineHeight: 1 }}>💳</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--text)' }}>신용/체크카드</div>
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 2 }}>한 번 등록하면 다음에도 바로 결제</div>
            </div>
          </button>

          {/* 등록된 카드 표시 or 카드 입력 폼 */}
          {(method === 'saved' || method === 'newcard') && (
            <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

              {savedCard && !showCardForm ? (
                /* 등록된 카드 */
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--surface)', borderRadius: 14, padding: '14px 16px',
                    border: '2px solid var(--border)',
                  }}>
                    <div>
                      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 900 }}>
                        {savedCard.company}
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 4, letterSpacing: 2 }}>
                        {savedCard.maskedNum}
                      </div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 2 }}>
                        {savedCard.holderName} · 유효기간 {savedCard.expiry}
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowCardForm(true); setMethod('newcard') }}
                      style={{
                        fontSize: 15, fontWeight: 700, color: 'var(--primary)',
                        background: 'var(--surface)', border: '2px solid var(--primary)',
                        borderRadius: 10, padding: '8px 16px', flexShrink: 0,
                      }}
                    >
                      변경
                    </button>
                  </div>

                  {/* 카드사 선택 */}
                  <select
                    value={cardCompany}
                    onChange={e => setCardCompany(e.target.value)}
                    style={{
                      width: '100%', padding: '14px 16px', fontSize: 'var(--fs-base)',
                      border: '2px solid var(--border)', borderRadius: 14,
                      background: 'var(--surface)', color: cardCompany ? 'var(--text)' : 'var(--text-soft)',
                      appearance: 'none', WebkitAppearance: 'none',
                    }}
                  >
                    {CARD_COMPANIES.map(c => (
                      <option key={c} value={c === '카드사 선택' ? '' : c}>{c}</option>
                    ))}
                  </select>
                </>
              ) : (
                /* 카드 입력 폼 */
                <>
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
                        background: 'var(--surface)', letterSpacing: 2, boxSizing: 'border-box',
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
                          background: 'var(--surface)', boxSizing: 'border-box',
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
                          background: 'var(--surface)', boxSizing: 'border-box',
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
                        background: 'var(--surface)', boxSizing: 'border-box',
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
                </>
              )}
            </div>
          )}
        </div>

        {/* 현장에서 결제 */}
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
          <RadioDot active={method === 'onsite'} color="var(--success)" />
          <span style={{ fontSize: 32, lineHeight: 1 }}>💵</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 900, color: 'var(--text)' }}>현장에서 결제</div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-soft)', marginTop: 2 }}>방문 후 현금 또는 카드로 결제</div>
          </div>
        </button>
      </div>

      {/* 결제 버튼 */}
      <button
        onClick={handlePay}
        className="btn btn-primary"
        disabled={!canPay}
        style={{ fontSize: 'var(--fs-lg)', marginTop: 4, opacity: canPay ? 1 : 0.45 }}
      >
        {method === 'onsite'
          ? '예약 완료 (현장 결제)'
          : `💳 ${total.toLocaleString()}원 결제하기`}
      </button>

      {!canPay && method === 'newcard' && (
        <p style={{ fontSize: 15, color: 'var(--text-soft)', textAlign: 'center' }}>
          카드 정보를 모두 입력해주세요.
        </p>
      )}

      {/* 자녀에게 부탁하기 */}
      <button
        onClick={callFamily}
        style={{
          display: 'block', margin: '8px auto 4px',
          fontSize: 15, color: 'var(--text-soft)',
          background: 'none', border: 'none',
          textDecoration: 'underline', cursor: 'pointer',
        }}
      >
        📞 자녀에게 부탁하기
      </button>
      {showFamilySheet && <FamilySheet onClose={() => setShowFamilySheet(false)} />}
    </>
  )
}

function FamilySheet({ onClose }) {
  const stored = localStorage.getItem('silvermap_family_tel') || ''
  const fmt = stored ? stored.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3') : ''
  const [tel, setTel] = useState(fmt)
  const valid = tel.replace(/[^0-9]/g, '').length >= 9

  function call() {
    const clean = tel.replace(/[^0-9]/g, '')
    if (!valid) return
    localStorage.setItem('silvermap_family_tel', clean)
    window.location.href = `tel:${clean}`
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(16,30,58,.55)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)', width: '100%',
          borderRadius: '24px 24px 0 0',
          padding: '24px 24px max(24px, env(safe-area-inset-bottom))',
          display: 'flex', flexDirection: 'column', gap: 14,
        }}
      >
        <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 900 }}>자녀에게 부탁하기</h3>
        <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-soft)', lineHeight: 1.6 }}>
          전화번호를 저장해두면 다음에 바로 전화할 수 있어요
        </p>
        <input
          type="tel"
          value={tel}
          onChange={e => setTel(e.target.value)}
          placeholder="010-1234-5678"
          autoFocus
          style={{
            width: '100%', padding: '16px 18px', fontSize: 'var(--fs-lg)', fontWeight: 700,
            border: '2px solid var(--border)', borderRadius: 'var(--radius)',
            background: 'var(--surface)', outline: 'none', boxSizing: 'border-box',
          }}
        />
        <button onClick={call} disabled={!valid} className="btn btn-primary" style={{ opacity: valid ? 1 : 0.45 }}>
          📞 전화 걸기
        </button>
        <button onClick={onClose} className="btn btn-secondary">취소</button>
      </div>
    </div>
  )
}

function RadioDot({ active, color }) {
  const c = color || 'var(--primary)'
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${active ? c : 'var(--border)'}`,
      background: active ? c : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {active && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />}
    </div>
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
