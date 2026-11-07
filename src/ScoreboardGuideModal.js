import { useEffect, useRef, useState } from 'react';

const GUIDES = {
  internal: {
    title: '자체전 스코어보드 사용 가이드',
    steps: [
      { title: '참석 선수 등록', description: '정규 멤버와 용병의 출석 상태를 선택하세요.', visual: 'attendance', tip: '용병은 미선택 또는 출석만 선택하며 공식 출석점수에서 제외됩니다.' },
      { title: 'A팀/B팀 구성', description: '참석 선수를 A팀과 B팀으로 나누고 양 팀 구성을 확인하세요.', visual: 'teams' },
      { title: '쿼터별 출전 선수', description: '현재 쿼터에 실제로 뛰는 선수를 체크하세요.', visual: 'internalLineup', tip: '출전 체크는 출전 쿼터 수와 득실마진 계산에 사용됩니다.' },
      { title: '골·어시스트 기록', description: '선수별 + 버튼으로 득점과 어시스트를 원터치 기록하세요.', visual: 'internalRecord', tip: '자체전은 득점 순서나 득점자·어시스트 연결 관계를 별도로 기록하지 않습니다.' },
      { title: '쿼터 전환 및 점수 관리·타이머', description: '타이머를 시작하거나 멈추고, 쿼터 종료 후 다음 Q로 이동해 스코어 반영 여부를 설정하세요.', visual: 'internalQuarters', tip: '다음 쿼터는 기본 시간으로 대기하며 자동 시작되지 않습니다. 이전 쿼터의 남은 시간과 개인 기록은 유지됩니다.' },
      { title: '경기 결과 및 복사', description: '최종 스코어와 개인 기록을 확인한 뒤 전체 경기 기록 복사로 보관하세요.', visual: 'internalResult' },
    ],
  },
  external: {
    title: '상대전 스코어보드 사용 가이드',
    steps: [
      { title: '경기 정보 입력', description: '날짜, 장소, 상대팀 이름과 쿼터 수를 입력하세요. 기본값은 8쿼터입니다.', visual: 'matchInfo' },
      { title: '참석 선수 등록', description: '정규 멤버와 용병의 출석 상태를 선택하세요.', visual: 'attendance', tip: '정규 멤버는 점수가 자동 계산되고 용병은 공식 출석점수에서 제외됩니다.' },
      { title: '출전 선수 및 골키퍼', description: '현재 쿼터 출전 선수를 체크하고 체크된 선수 중 골키퍼를 선택하세요.', visual: 'externalLineup', tip: '출전 기록은 출전 쿼터 수와 득실마진 계산에 사용됩니다.' },
      { title: '득점·실점 기록', description: 'MAD FC 득점은 득점자와 어시스트를 선택하고, 상대 득점은 버튼 한 번으로 기록하세요.', visual: 'externalGoals', tip: '득점 순서는 자동 저장됩니다. 기록은 수정·삭제하거나 실행 취소할 수 있습니다.' },
      { title: '쿼터 전환 및 타이머', description: '타이머를 시작·일시정지하고, 쿼터가 끝나면 다음 Q로 이동하세요.', visual: 'externalQuarters', tip: '00:00에 자동 종료됩니다. 새 쿼터는 기본 시간으로 대기하며 이전 쿼터의 남은 시간은 복원할 수 있습니다.' },
      { title: '경기 결과 및 복사', description: '최종 스코어, 이벤트 순서와 개인 기록을 확인한 뒤 전체 상대전 기록 복사로 보관하세요.', visual: 'externalResult' },
    ],
  },
};

const ATTENDANCE_ROWS = [
  ['정상출석', '3점'],
  ['불참 후 참석변경', '2점'],
  ['지각', '1점'],
  ['불참', '0점'],
];

export default function ScoreboardGuideModal({ isOpen, matchType, onClose }) {
  const [activeStep, setActiveStep] = useState(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    setActiveStep(null);
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = [...modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.disabled && element.tabIndex !== -1);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const guide = GUIDES[matchType] || GUIDES.internal;

  return (
    <div className="scoreboard-guide-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <article ref={modalRef} className="scoreboard-guide-modal" role="dialog" aria-modal="true" aria-labelledby="scoreboard-guide-title">
        <header>
          <div><span>SCOREBOARD GUIDE</span><h2 id="scoreboard-guide-title">{guide.title}</h2></div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="사용 가이드 닫기">×</button>
        </header>

        <div className="scoreboard-guide-accordion">
          {guide.steps.map((step, index) => {
            const expanded = activeStep === index;
            const panelId = `scoreboard-guide-panel-${matchType}-${index}`;
            return (
              <section className={`scoreboard-guide-item ${expanded ? 'active' : ''}`} key={step.title}>
                <button className="scoreboard-guide-trigger" type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setActiveStep(expanded ? null : index)}>
                  <span>STEP {index + 1}</span><strong>{step.title}</strong><i aria-hidden="true">{expanded ? '−' : '+'}</i>
                </button>
                {expanded ? (
                  <div className="scoreboard-guide-panel" id={panelId}>
                    <p>{step.description}</p>
                    <GuideVisual type={step.visual} />
                    {step.tip ? <aside><b>TIP</b><span>{step.tip}</span></aside> : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="scoreboard-guide-notices">
          <section className="scoreboard-guide-notice">
            <span>AUTO SAVE</span><h3>자동 저장 ON</h3>
            <p>현재 브라우저에 자동 저장됩니다. 다른 기기와 동기화되지 않으므로 경기 종료 후 기록 복사를 권장합니다.</p>
          </section>
          <section className="scoreboard-guide-notice policy">
            <span>STAT POLICY</span><h3>공식 통계는 별도 등록 후 반영</h3>
            <ul><li>경기 수·출석점수: 외부전 + 자체전</li><li>공격 기록: 외부전만</li><li>공격 평균: 외부전 경기 수 기준</li></ul>
            <p>용병은 정규 멤버의 공식 경기 수와 출석점수 집계에서 제외됩니다.</p>
          </section>
        </div>

        <button className="scoreboard-guide-confirm" type="button" onClick={onClose}>확인</button>
      </article>
    </div>
  );
}

function GuideVisual({ type }) {
  if (type === 'attendance') return <AttendanceVisual />;
  if (type === 'matchInfo') return <MatchInfoVisual />;
  if (type === 'teams') return <TeamVisual />;
  if (type === 'internalLineup') return <LineupVisual goalkeeper={false} />;
  if (type === 'externalLineup') return <LineupVisual goalkeeper />;
  if (type === 'internalRecord') return <InternalRecordVisual />;
  if (type === 'externalGoals') return <ExternalGoalsVisual />;
  if (type === 'internalQuarters') return <QuarterVisual scoreSettings />;
  if (type === 'externalQuarters') return <QuarterVisual />;
  if (type === 'internalResult') return <ResultVisual external={false} />;
  if (type === 'externalResult') return <ResultVisual external />;
  return null;
}

function MatchInfoVisual() {
  return <div className="guide-mini-ui guide-match-info" aria-label="경기 정보 입력 예시"><ExampleBadge>입력 예시</ExampleBadge>{[['경기 날짜', '2026-11-03'], ['경기 장소', '용산'], ['상대팀 이름', '상대팀'], ['전체 쿼터 수', '8']].map(([label, value]) => <label key={label}>{label}<span>{value}</span></label>)}</div>;
}

function AttendanceVisual() {
  return (
    <div className="guide-mini-ui guide-attendance" aria-label="출석점수 안내">
      <div className="guide-attendance-badges">{ATTENDANCE_ROWS.map(([status, score]) => <span key={status}><b>{status}</b><em>{score}</em></span>)}</div>
      <p><b>용병</b><span>미선택 / 출석</span><em>집계 제외</em></p>
    </div>
  );
}

function TeamVisual() {
  return <div className="guide-mini-ui guide-team-list" aria-label="A팀 B팀 배정 예시"><ExampleBadge>구성 예시</ExampleBadge>{['김장엽', '박경민', '고유순'].map((name, index) => <p key={name}><b>{name}</b><span className={index === 1 ? 'team-b' : 'team-a'}>{index === 1 ? 'B팀' : 'A팀'}</span><em>제외</em></p>)}</div>;
}

function LineupVisual({ goalkeeper }) {
  return (
    <div className="guide-mini-ui guide-lineup" aria-label="3쿼터 출전 선수 예시">
      <ExampleBadge>라인업 예시</ExampleBadge>
      <header><b>3Q 출전 선수</b><span>2 : 1</span></header>
      {['김장엽', '박경민', '고유순', '유재홍'].map((name, index) => <p key={name}><span aria-hidden="true">{index < 3 ? '✓' : ''}</span><b>{name}</b></p>)}
      {goalkeeper ? <label>골키퍼 <span>박경민⌄</span></label> : null}
    </div>
  );
}

function InternalRecordVisual() {
  return <div className="guide-mini-ui guide-record-row" aria-label="자체전 원터치 기록 예시"><ExampleBadge>기록 예시</ExampleBadge><b>박경민</b><span>득점 <i>−</i><strong>2</strong><i>+</i></span><span>어시 <i>−</i><strong>1</strong><i>+</i></span></div>;
}

function ExternalGoalsVisual() {
  return (
    <div className="guide-mini-ui guide-goal-visual" aria-label="상대전 득점 실점 기록 예시">
      <ExampleBadge>기록 예시</ExampleBadge>
      <button type="button" disabled>MAD FC 득점 +</button><p>득점 버튼 <i>→</i> 득점자 <i>→</i> 어시스트 <i>→</i> 저장</p>
      <div className="guide-goal-form">
        <b>MAD FC 득점 기록 예시</b>
        <label>득점 선수<span>박경민⌄</span></label>
        <label>어시스트<span>고유순⌄</span></label>
        <button type="button" disabled>저장</button>
        <small>어시스트가 없으면 없음 선택</small>
      </div>
      <button className="opponent" type="button" disabled>상대팀 득점 +</button><p>버튼 한 번 <i>→</i> <b>실점 자동 기록</b></p>
      <small>실행 취소 · 이벤트 수정 · 삭제 가능</small>
    </div>
  );
}

function QuarterVisual({ scoreSettings = false }) {
  return (
    <div className="guide-mini-ui guide-quarter-wrap" aria-label="쿼터 이동 예시">
      <ExampleBadge>스코어 예시</ExampleBadge>
      <div className="guide-timer-visual">
        <span>3Q 남은 시간</span>
        <strong>13:00</strong>
        <div><button type="button" disabled>시작</button><button type="button" disabled>초기화</button><button type="button" disabled>시간 설정</button></div>
        <small>기본 시간 설정 · 일시정지 · 00:00 자동 종료</small>
      </div>
      <div className="guide-quarter-visual">{[1, 2, 3, 4, 5, 6, 7, 8].map((quarter) => <span className={quarter === 3 ? 'active' : ''} key={quarter}>{quarter}Q<small>{quarter === 3 ? '2:1' : '0:0'}</small></span>)}<b>다음 Q</b></div>
      {scoreSettings ? <ScoreSettingsVisual /> : null}
    </div>
  );
}

function ResultVisual({ external }) {
  return (
    <div className="guide-mini-ui guide-result-visual" aria-label="경기 결과 및 복사 예시">
      <ExampleBadge>기록 예시</ExampleBadge>
      <span>FINAL SCORE</span><strong>{external ? 'MAD FC 7 : 5 상대팀' : 'A TEAM 12 : 11 B TEAM'}</strong><p>박경민 <b>3골 · 2도움 · 5P</b></p>
      <button type="button" disabled>{external ? '전체 상대전 기록 복사' : '전체 경기 기록 복사'}</button>
    </div>
  );
}

function ScoreSettingsVisual() {
  const rows = [
    ['1Q', '0 : 0', false],
    ['2Q', '0 : 0', false],
    ['3Q', '4 : 4', true],
  ];
  return (
    <div className="guide-score-settings">
      <h4>쿼터별 점수 반영 설정</h4>
      <p>특정 쿼터를 최종 스코어에서 제외하려면 해당 쿼터의 점수 반영 설정을 변경하세요.</p>
      {rows.map(([quarter, score, included]) => <div key={quarter}><b>{quarter}</b><span>{score}</span><em className={included ? 'on' : 'off'}><i />{included ? 'ON' : 'OFF'}</em></div>)}
      <small>최종 스코어는 ON 쿼터만 합산</small>
    </div>
  );
}

function ExampleBadge({ children }) {
  return <span className="guide-example-badge">{children}</span>;
}
