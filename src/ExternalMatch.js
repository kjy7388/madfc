import { useEffect, useMemo, useState } from 'react';
import './external-match.css';

export const EXTERNAL_STORAGE_KEY = 'madfc-external-match-v1';
const DEFAULT_QUARTERS = 8;

export const ATTENDANCE_OPTIONS = [
  { value: '', label: '미선택', score: 0, attended: false },
  { value: 'present', label: '정상출석', score: 3, attended: true },
  { value: 'changed', label: '불참 후 참석변경', score: 2, attended: true },
  { value: 'late', label: '지각', score: 1, attended: true },
  { value: 'absent', label: '불참', score: 0, attended: false },
];
const GUEST_ATTENDANCE_OPTIONS = [
  { value: '', label: '미선택' },
  { value: 'present', label: '출석' },
];

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function emptyQuarter(index) {
  return {
    number: index + 1,
    initialized: false,
    lineup: {},
    lineupRecorded: false,
    goalkeeperId: null,
  };
}

export function createInitialExternalMatch() {
  return {
    version: 1,
    matchType: 'external-scoreboard',
    date: localDate(),
    venue: '',
    opponent: '',
    quarterCount: DEFAULT_QUARTERS,
    quarterMinutes: '',
    phase: 'setup',
    currentQuarter: 0,
    attendance: {},
    temporaryPlayers: [],
    quarters: Array.from({ length: DEFAULT_QUARTERS }, (_, index) => emptyQuarter(index)),
    events: [],
    nextSequence: 1,
  };
}

function loadSavedExternalMatch() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(EXTERNAL_STORAGE_KEY));
    if (saved?.version === 1 && Array.isArray(saved.quarters) && Array.isArray(saved.events)) {
      return {
        ...createInitialExternalMatch(),
        ...saved,
        attendance: saved.attendance || {},
        temporaryPlayers: saved.temporaryPlayers || [],
        quarters: saved.quarters.map((quarter, index) => ({ ...emptyQuarter(index), ...quarter, lineup: quarter.lineup || {} })),
      };
    }
  } catch (error) {
    // Invalid browser data should not block the scoreboard.
  }
  return createInitialExternalMatch();
}

function getAttendanceOption(status) {
  return ATTENDANCE_OPTIONS.find((option) => option.value === status) || ATTENDANCE_OPTIONS[0];
}

function isAttending(status) {
  return getAttendanceOption(status).attended;
}

function isGuestPlayer(player) {
  return player?.guest === true || player?.temporary === true;
}

function guestAttendanceValue(status) {
  return status === 'present' || status === 'changed' || status === 'late' ? 'present' : '';
}

function sortPlayersByName(players) {
  return [...players].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
}

function initializeQuarter(quarter, playerIds, previousQuarter = null) {
  if (quarter.initialized) return quarter;
  const lineup = Object.fromEntries(playerIds.map((playerId) => [playerId, previousQuarter?.lineup?.[playerId] === true]));
  const goalkeeperId = previousQuarter?.goalkeeperId && lineup[previousQuarter.goalkeeperId]
    ? previousQuarter.goalkeeperId
    : null;
  return {
    ...quarter,
    initialized: true,
    lineup,
    lineupRecorded: previousQuarter?.lineupRecorded === true,
    goalkeeperId,
  };
}

function eventsForQuarter(match, quarterNumber) {
  return match.events
    .filter((event) => event.quarter === quarterNumber)
    .sort((a, b) => a.sequence - b.sequence);
}

export function getExternalQuarterScore(match, quarterNumber) {
  return eventsForQuarter(match, quarterNumber).reduce((score, event) => {
    if (event.team === 'MAD') score.mad += 1;
    if (event.team === 'OPPONENT') score.opponent += 1;
    return score;
  }, { mad: 0, opponent: 0 });
}

export function getExternalTotals(match) {
  return match.events.reduce((score, event) => {
    if (event.team === 'MAD') score.mad += 1;
    if (event.team === 'OPPONENT') score.opponent += 1;
    return score;
  }, { mad: 0, opponent: 0 });
}

export function getExternalPlayerTotals(match, playerMap) {
  const ids = new Set();
  Object.entries(match.attendance).forEach(([playerId, status]) => {
    if (isAttending(status)) ids.add(playerId);
  });
  match.quarters.forEach((quarter) => Object.keys(quarter.lineup || {}).forEach((playerId) => ids.add(playerId)));
  match.events.forEach((event) => {
    if (event.scorerId) ids.add(event.scorerId);
    if (event.assistId) ids.add(event.assistId);
  });

  const totals = Object.fromEntries([...ids].map((playerId) => [playerId, {
    playerId,
    goals: 0,
    assists: 0,
    appearances: 0,
    plusMinus: 0,
    goalkeeperQuarters: 0,
  }]));

  match.events.forEach((event) => {
    if (event.team !== 'MAD') return;
    if (event.scorerId && totals[event.scorerId]) totals[event.scorerId].goals += 1;
    if (event.assistId && totals[event.assistId]) totals[event.assistId].assists += 1;
  });

  match.quarters.forEach((quarter) => {
    const score = getExternalQuarterScore(match, quarter.number);
    Object.entries(quarter.lineup || {}).forEach(([playerId, played]) => {
      if (!played || !totals[playerId]) return;
      totals[playerId].appearances += 1;
      totals[playerId].plusMinus += score.mad - score.opponent;
    });
    if (quarter.goalkeeperId && totals[quarter.goalkeeperId]) totals[quarter.goalkeeperId].goalkeeperQuarters += 1;
  });

  return Object.values(totals)
    .filter((row) => playerMap[row.playerId])
    .sort((a, b) => (playerMap[a.playerId]?.name || '').localeCompare(playerMap[b.playerId]?.name || '', 'ko-KR'));
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function attendanceLabel(match, playerId, player) {
  const option = getAttendanceOption(match.attendance[playerId]);
  if (isGuestPlayer(player)) return `${guestAttendanceValue(match.attendance[playerId]) ? '출석' : '미선택'} / 출석점수 제외`;
  return `${option.label} / ${option.score}점`;
}

function eventDescription(event, playerMap) {
  if (event.team === 'OPPONENT') return '실점';
  const scorer = playerMap[event.scorerId]?.name || '알 수 없는 선수';
  const assist = event.assistId ? `${playerMap[event.assistId]?.name || '알 수 없는 선수'} 도움` : '도움 없음';
  return `${scorer} 득점 / ${assist}`;
}

export function formatExternalExportText(match, playerMap) {
  const totals = getExternalTotals(match);
  const playerTotals = getExternalPlayerTotals(match, playerMap);
  const lines = [
    '[MAD FC 상대전 기록]', '',
    `경기일: ${match.date}`,
    `장소: ${match.venue || '미입력'}`,
    `상대팀: ${match.opponent || '미입력'}`,
    `전체 쿼터: ${match.quarterCount}쿼터`,
    '', '[최종 스코어]', `MAD FC ${totals.mad} : ${totals.opponent} ${match.opponent || '상대팀'}`,
    '', '[쿼터별 스코어]',
    ...match.quarters.map((quarter) => {
      const score = getExternalQuarterScore(match, quarter.number);
      return `${quarter.number}Q: MAD FC ${score.mad} - ${score.opponent} ${match.opponent || '상대팀'}`;
    }),
    '', '[쿼터별 득점 기록]',
  ];

  match.quarters.forEach((quarter) => {
    const events = eventsForQuarter(match, quarter.number);
    lines.push('', `[${quarter.number}Q]`);
    if (!events.length) lines.push('기록 없음');
    events.forEach((event, index) => lines.push(`${index + 1}. ${eventDescription(event, playerMap)}`));
  });

  lines.push('', '[쿼터별 출전 선수 및 골키퍼]');
  match.quarters.forEach((quarter) => {
    const names = Object.entries(quarter.lineup || {})
      .filter(([, played]) => played)
      .map(([playerId]) => playerMap[playerId]?.name || '알 수 없는 선수');
    const goalkeeper = quarter.goalkeeperId ? playerMap[quarter.goalkeeperId]?.name || '알 수 없는 선수' : '미선택';
    lines.push(`${quarter.number}Q: ${quarter.lineupRecorded ? (names.join(', ') || '출전 선수 없음') : '출전 정보 미입력'} / GK ${goalkeeper}`);
  });

  lines.push('', '[선수별 최종 기록]');
  playerTotals.forEach((row) => {
    const player = playerMap[row.playerId];
    const status = attendanceLabel(match, row.playerId, player);
    lines.push(`${player.name}: ${row.goals}골 ${row.assists}도움 ${row.goals + row.assists}P / ${row.appearances}쿼터 / 득실마진 ${formatSigned(row.plusMinus)} / GK ${row.goalkeeperQuarters}쿼터 / ${status}`);
  });

  return lines.join('\n');
}

function makeEventId() {
  return `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ExternalMatch({ players, modeSwitcher = null }) {
  const [match, setMatch] = useState(loadSavedExternalMatch);
  const [temporaryName, setTemporaryName] = useState('');
  const [eventDraft, setEventDraft] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [fallbackText, setFallbackText] = useState('');
  const allPlayers = useMemo(() => [...players, ...match.temporaryPlayers], [players, match.temporaryPlayers]);
  const playerMap = useMemo(() => Object.fromEntries(allPlayers.map((player) => [player.id, player])), [allPlayers]);
  const attendingIds = allPlayers.filter((player) => isAttending(match.attendance[player.id])).map((player) => player.id);
  const activeQuarter = match.quarters[match.currentQuarter];
  const activePlayerIds = [...new Set([...Object.keys(activeQuarter?.lineup || {}), ...attendingIds])];
  const totals = getExternalTotals(match);
  const activeScore = getExternalQuarterScore(match, activeQuarter?.number || 1);
  const playerTotals = getExternalPlayerTotals(match, playerMap);

  useEffect(() => {
    window.localStorage.setItem(EXTERNAL_STORAGE_KEY, JSON.stringify(match));
  }, [match]);

  function updateInfo(field, value) {
    setMatch((current) => ({ ...current, [field]: value }));
  }

  function changeQuarterCount(value) {
    const quarterCount = Math.min(12, Math.max(1, Number(value) || DEFAULT_QUARTERS));
    setMatch((current) => {
      const quarters = Array.from({ length: quarterCount }, (_, index) => current.quarters[index] || emptyQuarter(index));
      return { ...current, quarterCount, quarters, currentQuarter: Math.min(current.currentQuarter, quarterCount - 1) };
    });
  }

  function updateAttendance(playerId, status) {
    setMatch((current) => ({ ...current, attendance: { ...current.attendance, [playerId]: status } }));
  }

  function addTemporaryPlayer(event) {
    event.preventDefault();
    const name = temporaryName.trim();
    if (!name) return;
    const player = { id: `temp-${Date.now()}`, name, temporary: true, guest: true };
    setMatch((current) => ({
      ...current,
      temporaryPlayers: [...current.temporaryPlayers, player],
      attendance: { ...current.attendance, [player.id]: 'present' },
    }));
    setTemporaryName('');
  }

  function startMatch() {
    if (!match.opponent.trim()) {
      window.alert('상대팀 이름을 입력해 주세요.');
      return;
    }
    if (!attendingIds.length) {
      window.alert('실제 참석 선수를 한 명 이상 선택해 주세요.');
      return;
    }
    setMatch((current) => {
      const currentAttendees = allPlayers.filter((player) => isAttending(current.attendance[player.id])).map((player) => player.id);
      const quarters = [...current.quarters];
      quarters[0] = initializeQuarter(quarters[0], currentAttendees);
      return { ...current, phase: 'running', currentQuarter: 0, quarters };
    });
  }

  function selectQuarter(index) {
    setMatch((current) => {
      const currentAttendees = allPlayers.filter((player) => isAttending(current.attendance[player.id])).map((player) => player.id);
      const quarters = [...current.quarters];
      quarters[index] = initializeQuarter(quarters[index], currentAttendees, index > 0 ? quarters[index - 1] : null);
      return { ...current, currentQuarter: index, quarters };
    });
  }

  function toggleLineup(playerId) {
    setMatch((current) => {
      const quarters = [...current.quarters];
      const quarter = quarters[current.currentQuarter];
      const nextPlayed = quarter.lineup?.[playerId] !== true;
      quarters[current.currentQuarter] = {
        ...quarter,
        lineup: { ...(quarter.lineup || {}), [playerId]: nextPlayed },
        lineupRecorded: true,
        goalkeeperId: !nextPlayed && quarter.goalkeeperId === playerId ? null : quarter.goalkeeperId,
      };
      return { ...current, quarters };
    });
  }

  function changeGoalkeeper(playerId) {
    setMatch((current) => {
      const quarters = [...current.quarters];
      const quarter = quarters[current.currentQuarter];
      quarters[current.currentQuarter] = { ...quarter, goalkeeperId: playerId || null };
      return { ...current, quarters };
    });
  }

  function addOpponentGoal() {
    setMatch((current) => ({
      ...current,
      events: [...current.events, {
        id: makeEventId(), quarter: current.currentQuarter + 1, sequence: current.nextSequence,
        team: 'OPPONENT', type: 'goal', scorerId: null, assistId: null, createdAt: new Date().toISOString(),
      }],
      nextSequence: current.nextSequence + 1,
    }));
  }

  function openMadGoal() {
    const lineupIds = activePlayerIds.filter((playerId) => activeQuarter.lineup?.[playerId] === true);
    if (!lineupIds.length) {
      window.alert('현재 쿼터 출전 선수를 먼저 선택해 주세요.');
      return;
    }
    setEventDraft({ id: null, team: 'MAD', quarter: activeQuarter.number, scorerId: '', assistId: '' });
  }

  function openEvent(event) {
    setEventDraft({ ...event });
  }

  function saveEventDraft() {
    if (!eventDraft) return;
    if (eventDraft.team === 'MAD' && !eventDraft.scorerId) {
      window.alert('득점 선수를 선택해 주세요.');
      return;
    }
    if (eventDraft.scorerId && eventDraft.scorerId === eventDraft.assistId) {
      window.alert('득점자와 어시스트 선수는 같을 수 없습니다.');
      return;
    }
    setMatch((current) => {
      if (eventDraft.id) {
        return { ...current, events: current.events.map((event) => event.id === eventDraft.id ? { ...event, ...eventDraft } : event) };
      }
      const event = {
        ...eventDraft,
        id: makeEventId(),
        sequence: current.nextSequence,
        type: 'goal',
        createdAt: new Date().toISOString(),
      };
      return { ...current, events: [...current.events, event], nextSequence: current.nextSequence + 1 };
    });
    setEventDraft(null);
  }

  function deleteEvent(eventId) {
    if (!window.confirm('이 득점 기록을 삭제할까요?')) return;
    setMatch((current) => ({ ...current, events: current.events.filter((event) => event.id !== eventId) }));
    setEventDraft(null);
  }

  function undoLastEvent() {
    if (!match.events.length) return;
    const lastEvent = [...match.events].sort((a, b) => b.sequence - a.sequence)[0];
    setMatch((current) => ({ ...current, events: current.events.filter((event) => event.id !== lastEvent.id) }));
  }

  async function copyMatch() {
    const text = formatExternalExportText(match, playerMap);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      setFallbackText('');
      setCopyStatus('전체 상대전 기록을 복사했습니다.');
    } catch (error) {
      setFallbackText(text);
      setCopyStatus('자동 복사가 지원되지 않습니다. 아래 텍스트를 직접 복사해 주세요.');
    }
  }

  function resetMatch() {
    if (!window.confirm('현재 상대전 기록이 삭제됩니다. 기록을 복사했는지 확인한 뒤 새 경기를 시작할까요?')) return;
    setMatch(createInitialExternalMatch());
    setEventDraft(null);
    setCopyStatus('');
    setFallbackText('');
  }

  const activeEvents = eventsForQuarter(match, activeQuarter?.number || 1);

  return (
    <div className="internal-page external-page">
      <header className="internal-scoreboard external-scoreboard">
        <div className="internal-topline"><a href="/" className="internal-back">← 공식 기록</a>{modeSwitcher}<span>EXTERNAL MATCH</span></div>
        <h1>{match.opponent ? `MAD FC vs ${match.opponent}` : 'MAD FC 상대전'}</h1>
        <time dateTime={match.date}>{match.date.replaceAll('-', '.')}</time>
        <div className="internal-main-score" aria-label={`MAD FC ${totals.mad} 대 ${totals.opponent} ${match.opponent || '상대팀'}`}>
          <span>MAD FC</span><strong>{totals.mad}</strong><em>:</em><strong>{totals.opponent}</strong><span>{match.opponent || 'OPPONENT'}</span>
        </div>
        <p>현재 {match.currentQuarter + 1}Q · {activeScore.mad} : {activeScore.opponent}</p>
      </header>

      {match.phase === 'setup' ? (
        <main className="internal-shell">
          <section className="internal-card external-setup-card">
            <div className="internal-section-head"><span>01</span><div><b>MATCH SETUP</b><h2>상대전 경기 설정</h2></div></div>
            <ExternalInfoFields match={match} onChange={updateInfo} onQuarterCountChange={changeQuarterCount} />
            <AttendanceEditor players={allPlayers} attendance={match.attendance} onChange={updateAttendance} temporaryName={temporaryName} onTemporaryNameChange={setTemporaryName} onAddTemporary={addTemporaryPlayer} />
            <button className="internal-primary external-start" type="button" onClick={startMatch}>경기 시작</button>
          </section>
        </main>
      ) : (
        <main className="internal-shell external-shell">
          <section className="internal-card quarter-control-card external-quarter-control">
            <div className="quarter-tabs" role="tablist" aria-label="쿼터 선택">
              {match.quarters.map((quarter, index) => {
                const score = getExternalQuarterScore(match, quarter.number);
                return <button type="button" className={index === match.currentQuarter ? 'active' : ''} onClick={() => selectQuarter(index)} key={quarter.number}><b>{quarter.number}Q</b><small>{score.mad}:{score.opponent}</small></button>;
              })}
            </div>
            <div className="quarter-actions external-quarter-actions">
              {match.currentQuarter > 0 ? <button className="internal-secondary" type="button" onClick={() => selectQuarter(match.currentQuarter - 1)}>이전 Q</button> : null}
              {match.currentQuarter < match.quarterCount - 1 ? <button className="internal-primary" type="button" onClick={() => selectQuarter(match.currentQuarter + 1)}>다음 Q</button> : null}
              <button className="internal-secondary" type="button" onClick={() => setMatch((current) => ({ ...current, phase: 'finished' }))}>결과 보기</button>
            </div>
          </section>

          <section className="external-live-grid">
            <section className="internal-card external-lineup-card">
              <header><div><span>{activeQuarter.number}Q</span><h2>출전 선수</h2></div><strong>{activeScore.mad} : {activeScore.opponent}</strong></header>
              <label className="goalkeeper-select">골키퍼
                <select value={activeQuarter.goalkeeperId || ''} onChange={(event) => changeGoalkeeper(event.target.value)}>
                  <option value="">미선택</option>
                  {activePlayerIds.filter((playerId) => activeQuarter.lineup?.[playerId] === true).map((playerId) => <option value={playerId} key={playerId}>{playerMap[playerId]?.name}</option>)}
                </select>
              </label>
              <div className="external-lineup-list">
                {activePlayerIds.map((playerId) => {
                  const row = playerTotals.find((item) => item.playerId === playerId) || { goals: 0, assists: 0 };
                  return (
                    <label className="external-lineup-row" key={playerId}>
                      <input type="checkbox" checked={activeQuarter.lineup?.[playerId] === true} onChange={() => toggleLineup(playerId)} />
                      <span>{playerMap[playerId]?.name}{playerMap[playerId]?.guest ? <small>용병</small> : null}</span>
                      <em>{row.goals}골 · {row.assists}도움</em>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="internal-card external-events-card">
              <div className="external-goal-actions">
                <button className="mad-goal-button" type="button" onClick={openMadGoal}>MAD FC 득점 +</button>
                <button className="opponent-goal-button" type="button" onClick={addOpponentGoal}>{match.opponent || '상대팀'} 득점 +</button>
                <button className="undo-event-button" type="button" onClick={undoLastEvent} disabled={!match.events.length}>실행 취소</button>
              </div>
              <header><div><span>GOAL EVENTS</span><h2>{activeQuarter.number}Q 득점 순서</h2></div></header>
              <div className="external-event-list">
                {!activeEvents.length ? <p className="internal-empty">아직 득점 기록이 없습니다.</p> : null}
                {activeEvents.map((event, index) => (
                  <article className={`external-event-row ${event.team === 'OPPONENT' ? 'opponent' : ''}`} key={event.id}>
                    <b>{index + 1}</b><span>{eventDescription(event, playerMap)}</span>
                    <button type="button" onClick={() => openEvent(event)}>수정</button>
                    <button type="button" onClick={() => deleteEvent(event.id)}>삭제</button>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <section className="internal-card live-roster-card external-live-settings">
            <details>
              <summary>경기 정보 및 참석 선수 수정</summary>
              <ExternalInfoFields match={match} onChange={updateInfo} onQuarterCountChange={changeQuarterCount} compact />
              <AttendanceEditor players={allPlayers} attendance={match.attendance} onChange={updateAttendance} temporaryName={temporaryName} onTemporaryNameChange={setTemporaryName} onAddTemporary={addTemporaryPlayer} compact />
            </details>
          </section>

          {match.phase === 'finished' ? <ExternalResultSummary match={match} playerMap={playerMap} playerTotals={playerTotals} onCopy={copyMatch} copyStatus={copyStatus} fallbackText={fallbackText} /> : null}
          <button className="internal-reset" type="button" onClick={resetMatch}>새 상대전 시작</button>
        </main>
      )}

      {eventDraft ? <EventEditor draft={eventDraft} match={match} playerMap={playerMap} onChange={setEventDraft} onSave={saveEventDraft} onDelete={eventDraft.id ? () => deleteEvent(eventDraft.id) : null} onClose={() => setEventDraft(null)} /> : null}
    </div>
  );
}

function ExternalInfoFields({ match, onChange, onQuarterCountChange, compact = false }) {
  return (
    <div className={`external-info-grid ${compact ? 'compact' : ''}`}>
      <label>경기 날짜<input type="date" value={match.date} onChange={(event) => onChange('date', event.target.value)} /></label>
      <label>경기 장소<input value={match.venue} onChange={(event) => onChange('venue', event.target.value)} placeholder="예: 용산" /></label>
      <label>상대팀 이름<input value={match.opponent} onChange={(event) => onChange('opponent', event.target.value)} placeholder="상대팀" /></label>
      <label>전체 쿼터 수<input type="number" min="1" max="12" value={match.quarterCount} disabled={match.phase !== 'setup'} onChange={(event) => onQuarterCountChange(event.target.value)} /></label>
    </div>
  );
}

function AttendanceEditor({ players, attendance, onChange, temporaryName, onTemporaryNameChange, onAddTemporary, compact = false }) {
  const memberPlayers = sortPlayersByName(players.filter((player) => !isGuestPlayer(player)));
  const guestPlayers = sortPlayersByName(players.filter(isGuestPlayer));
  return (
    <section className={`external-attendance ${compact ? 'compact' : ''}`}>
      <div className="external-subhead"><span>ATTENDANCE</span><h2>참석 선수 및 출석 상태</h2></div>
      <div className="attendance-groups">
        <AttendanceGroup title="정규 멤버" players={memberPlayers} attendance={attendance} onChange={onChange} />
        <AttendanceGroup title="용병" players={guestPlayers} attendance={attendance} onChange={onChange} guest />
      </div>
      <form className="temporary-player-form" onSubmit={onAddTemporary}>
        <input value={temporaryName} onChange={(event) => onTemporaryNameChange(event.target.value)} placeholder="임시 용병 이름" aria-label="임시 용병 이름" />
        <button type="submit">용병 추가</button>
      </form>
    </section>
  );
}

function AttendanceGroup({ title, players, attendance, onChange, guest = false }) {
  return (
    <section className={`attendance-group ${guest ? 'guest' : 'member'}`}>
      <h3>{title}</h3>
      <div className="external-attendance-list">
        {players.length ? players.map((player) => {
          const option = getAttendanceOption(attendance[player.id]);
          const value = guest ? guestAttendanceValue(attendance[player.id]) : attendance[player.id] || '';
          const options = guest ? GUEST_ATTENDANCE_OPTIONS : ATTENDANCE_OPTIONS;
          return (
            <label className="external-attendance-row" key={player.id}>
              <span>{player.name}{guest ? <small>용병</small> : null}</span>
              <select value={value} onChange={(event) => onChange(player.id, event.target.value)} aria-label={`${player.name} 출석 상태`}>
                {options.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
              <em>{guest ? '집계 제외' : `${option.score}점`}</em>
            </label>
          );
        }) : <p className="attendance-group-empty">등록된 선수가 없습니다.</p>}
      </div>
    </section>
  );
}

function EventEditor({ draft, match, playerMap, onChange, onSave, onDelete, onClose }) {
  const quarter = match.quarters[draft.quarter - 1];
  const lineupIds = Object.entries(quarter?.lineup || {}).filter(([, played]) => played).map(([playerId]) => playerId);
  return (
    <div className="external-event-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="external-event-modal" role="dialog" aria-modal="true" aria-labelledby="event-editor-title">
        <header><div><span>GOAL EVENT</span><h2 id="event-editor-title">{draft.id ? '득점 기록 수정' : 'MAD FC 득점 기록'}</h2></div><button type="button" onClick={onClose} aria-label="득점 기록 닫기">×</button></header>
        <label>쿼터<select value={draft.quarter} onChange={(event) => onChange({ ...draft, quarter: Number(event.target.value), scorerId: '', assistId: '' })}>{match.quarters.map((item) => <option value={item.number} key={item.number}>{item.number}Q</option>)}</select></label>
        {draft.team === 'MAD' ? (
          <>
            <label>득점 선수<select value={draft.scorerId || ''} onChange={(event) => onChange({ ...draft, scorerId: event.target.value, assistId: event.target.value === draft.assistId ? '' : draft.assistId })}><option value="">선택</option>{lineupIds.map((playerId) => <option value={playerId} key={playerId}>{playerMap[playerId]?.name}</option>)}</select></label>
            <label>어시스트<select value={draft.assistId || ''} onChange={(event) => onChange({ ...draft, assistId: event.target.value })}><option value="">없음</option>{lineupIds.filter((playerId) => playerId !== draft.scorerId).map((playerId) => <option value={playerId} key={playerId}>{playerMap[playerId]?.name}</option>)}</select></label>
          </>
        ) : <p>실점 이벤트의 쿼터를 수정할 수 있습니다.</p>}
        <div className="external-event-modal-actions">{onDelete ? <button className="delete" type="button" onClick={onDelete}>삭제</button> : null}<button type="button" onClick={onClose}>취소</button><button className="save" type="button" onClick={onSave}>저장</button></div>
      </section>
    </div>
  );
}

function ExternalResultSummary({ match, playerMap, playerTotals, onCopy, copyStatus, fallbackText }) {
  const totals = getExternalTotals(match);
  return (
    <section className="internal-card result-summary external-result-summary">
      <div className="internal-section-head"><span>FINAL</span><div><b>MATCH RESULT</b><h2>상대전 경기 결과</h2></div></div>
      <div className="external-result-info"><span>{match.date}</span><span>{match.venue || '장소 미입력'}</span><span>{match.quarterCount}쿼터</span></div>
      <div className="final-score">MAD FC <strong>{totals.mad} : {totals.opponent}</strong> {match.opponent}</div>
      <div className="external-result-grid">
        <div className="external-result-block"><h3>쿼터별 스코어</h3><table><thead><tr><th>쿼터</th><th>MAD FC</th><th>{match.opponent}</th></tr></thead><tbody>{match.quarters.map((quarter) => { const score = getExternalQuarterScore(match, quarter.number); return <tr key={quarter.number}><td>{quarter.number}Q</td><td>{score.mad}</td><td>{score.opponent}</td></tr>; })}</tbody></table></div>
        <div className="external-result-block"><h3>선수별 기록</h3><div className="external-result-players">{playerTotals.map((row) => <p key={row.playerId}><b>{playerMap[row.playerId]?.name}</b><span>{row.goals}골 · {row.assists}도움 · {row.goals + row.assists}P</span><em>{row.appearances}쿼터 · {formatSigned(row.plusMinus)} · GK {row.goalkeeperQuarters}Q</em><small>{attendanceLabel(match, row.playerId, playerMap[row.playerId])}</small></p>)}</div></div>
      </div>
      <div className="external-quarter-events-result"><h3>쿼터별 득점 기록</h3>{match.quarters.map((quarter) => { const events = eventsForQuarter(match, quarter.number); return <article key={quarter.number}><b>{quarter.number}Q · GK {quarter.goalkeeperId ? playerMap[quarter.goalkeeperId]?.name : '미선택'}</b>{events.length ? events.map((event, index) => <span key={event.id}>{index + 1}. {eventDescription(event, playerMap)}</span>) : <span>기록 없음</span>}</article>; })}</div>
      <button className="internal-primary" type="button" onClick={onCopy}>전체 상대전 기록 복사</button>
      {copyStatus ? <p className="copy-status" role="status">{copyStatus}</p> : null}
      {fallbackText ? <textarea className="copy-fallback" value={fallbackText} readOnly onFocus={(event) => event.target.select()} aria-label="직접 복사할 상대전 기록" /> : null}
    </section>
  );
}
