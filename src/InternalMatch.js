import { useCallback, useEffect, useMemo, useState } from 'react';
import QuarterTimer, { TimerDurationInput } from './QuarterTimer';
import {
  normalizeMatchTimer,
  pauseQuarterTimer,
  setDefaultTimerDuration,
} from './quarterTimerState';
import './internal-match.css';

const STORAGE_KEY = 'madfc-internal-match-v1';
const QUARTER_COUNT = 8;
const MATCH_ATTENDANCE_OPTIONS = [
  { value: 'present', label: '정상출석', score: 3 },
  { value: 'changed', label: '불참 후 참석변경', score: 2 },
  { value: 'late', label: '지각', score: 1 },
  { value: 'absent', label: '불참', score: 0 },
];

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function emptyQuarter(index) {
  return {
    number: index + 1,
    scoreIncluded: true,
    initialized: false,
    rosters: { A: [], B: [] },
    attendance: {},
    attendanceRecorded: false,
    stats: {},
  };
}

export function createInitialInternalMatch() {
  return {
    version: 1,
    date: localDate(),
    phase: 'setup',
    currentQuarter: 0,
    assignments: {},
    matchAttendance: {},
    temporaryPlayers: [],
    quarters: Array.from({ length: QUARTER_COUNT }, (_, index) => emptyQuarter(index)),
    timer: normalizeMatchTimer(null, QUARTER_COUNT),
  };
}

function loadSavedMatch() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (saved?.version === 1 && Array.isArray(saved.quarters) && saved.quarters.length === QUARTER_COUNT) {
      return {
        ...saved,
        matchAttendance: saved.matchAttendance || {},
        timer: normalizeMatchTimer(saved.timer, QUARTER_COUNT),
        quarters: saved.quarters.map((quarter) => ({
          ...quarter,
          scoreIncluded: quarter.scoreIncluded !== false,
        })),
      };
    }
  } catch (error) {
    // A malformed browser entry should not prevent a new match from starting.
  }
  return createInitialInternalMatch();
}

function snapshotRosters(assignments, matchAttendance = {}) {
  return Object.entries(assignments).reduce((rosters, [playerId, team]) => {
    const hasAttendance = Object.prototype.hasOwnProperty.call(matchAttendance, playerId);
    const attends = !hasAttendance || ['present', 'changed', 'late'].includes(matchAttendance[playerId]);
    if ((team === 'A' || team === 'B') && attends) rosters[team].push(playerId);
    return rosters;
  }, { A: [], B: [] });
}

function initializeQuarter(quarter, assignments, matchAttendance = {}, previousQuarter = null) {
  if (quarter.initialized) return quarter;
  const rosters = snapshotRosters(assignments, matchAttendance);
  const attendance = Object.fromEntries(
    [...rosters.A, ...rosters.B].map((playerId) => [playerId, previousQuarter?.attendance?.[playerId] === true]),
  );
  return {
    ...quarter,
    initialized: true,
    rosters,
    attendance,
    attendanceRecorded: previousQuarter?.attendanceRecorded === true,
  };
}

function getQuarterScore(quarter) {
  return Object.entries(quarter.stats).reduce((score, [, stat]) => {
    if (stat.team === 'A' || stat.team === 'B') score[stat.team] += stat.goals || 0;
    return score;
  }, { A: 0, B: 0 });
}

export function getMatchTotals(quarters) {
  return quarters.reduce((totals, quarter) => {
    if (quarter.scoreIncluded === false) return totals;
    const score = getQuarterScore(quarter);
    totals.A += score.A;
    totals.B += score.B;
    return totals;
  }, { A: 0, B: 0 });
}

export function getActualTotals(quarters) {
  return quarters.reduce((totals, quarter) => {
    const score = getQuarterScore(quarter);
    totals.A += score.A;
    totals.B += score.B;
    return totals;
  }, { A: 0, B: 0 });
}

function getScoreBasis(quarters) {
  const included = quarters.filter((quarter) => quarter.scoreIncluded !== false).map((quarter) => quarter.number);
  if (!included.length) return '반영 쿼터 없음';

  const ranges = [];
  let start = included[0];
  let end = included[0];
  for (let index = 1; index < included.length; index += 1) {
    if (included[index] === end + 1) {
      end = included[index];
    } else {
      ranges.push(start === end ? `${start}Q` : `${start}Q~${end}Q`);
      start = included[index];
      end = included[index];
    }
  }
  ranges.push(start === end ? `${start}Q` : `${start}Q~${end}Q`);
  return `${ranges.join(', ')} 기준`;
}

export function getPlayerTotals(quarters) {
  const totals = {};
  quarters.forEach((quarter) => {
    const score = getQuarterScore(quarter);
    ['A', 'B'].forEach((team) => {
      quarter.rosters[team].forEach((playerId) => {
        const stat = quarter.stats[playerId] || {};
        const key = `${team}:${playerId}`;
        if (!totals[key]) totals[key] = { playerId, team, goals: 0, assists: 0, appearances: 0, plusMinus: 0, attendanceKnown: true };
        totals[key].goals += stat.team === team ? stat.goals || 0 : 0;
        totals[key].assists += stat.team === team ? stat.assists || 0 : 0;
        if (quarter.attendanceRecorded !== true) {
          totals[key].attendanceKnown = false;
        } else if (quarter.attendance?.[playerId] === true) {
          totals[key].appearances += 1;
          totals[key].plusMinus += team === 'A' ? score.A - score.B : score.B - score.A;
        }
      });
    });
  });
  return Object.values(totals);
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : `${value}`;
}

function getMatchAttendance(match, playerId) {
  const value = match.matchAttendance?.[playerId] || (match.assignments?.[playerId] ? 'present' : '');
  return MATCH_ATTENDANCE_OPTIONS.find((option) => option.value === value) || null;
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

export function formatExportText(match, playerMap) {
  const totals = getMatchTotals(match.quarters);
  const actualTotals = getActualTotals(match.quarters);
  const playerTotals = getPlayerTotals(match.quarters);
  const excludedQuarters = match.quarters.filter((quarter) => quarter.scoreIncluded === false);
  const lines = [
    '[MAD FC 자체전 기록]',
    '',
    `경기일: ${match.date}`,
    '경기 유형: 자체전',
    '',
    '[출석 상태]',
    ...Object.keys(match.assignments || {})
      .filter((playerId) => match.assignments[playerId] === 'A' || match.assignments[playerId] === 'B')
      .map((playerId) => {
        const player = playerMap[playerId];
        const attendance = getMatchAttendance(match, playerId);
        const guest = isGuestPlayer(player);
        const label = guest ? (guestAttendanceValue(match.matchAttendance?.[playerId]) ? '출석' : '미선택') : attendance?.label || '미선택';
        const score = guest ? '집계 제외' : `${attendance?.score ?? 0}점`;
        return `${player?.name || '알 수 없는 선수'}: ${label} / ${score}`;
      }),
    '',
    '[최종 승부 스코어]',
    `A팀 ${totals.A} : ${totals.B} B팀`,
    `스코어 반영: ${getScoreBasis(match.quarters)}`,
    '',
    '[전체 실제 득점]',
    `A팀 ${actualTotals.A}골`,
    `B팀 ${actualTotals.B}골`,
    '',
    '[스코어 제외 쿼터]',
    excludedQuarters.length ? excludedQuarters.map((quarter) => `${quarter.number}Q`).join(', ') : '없음',
    '',
    '[쿼터별 실제 스코어]',
    ...match.quarters.map((quarter) => {
      const score = getQuarterScore(quarter);
      const excluded = quarter.scoreIncluded === false ? ' (승부 스코어 제외)' : '';
      return `${quarter.number}Q: A팀 ${score.A} - ${score.B} B팀${excluded}`;
    }),
    '',
    '[쿼터별 출전 선수]',
  ];

  match.quarters.forEach((quarter) => {
    lines.push('', `${quarter.number}Q`);
    if (quarter.attendanceRecorded !== true) {
      lines.push('A팀: 출전 정보 미입력', 'B팀: 출전 정보 미입력');
      return;
    }
    ['A', 'B'].forEach((team) => {
      const names = quarter.rosters[team]
        .filter((playerId) => quarter.attendance?.[playerId] === true)
        .map((playerId) => playerMap[playerId]?.name || '알 수 없는 선수');
      lines.push(`${team}팀: ${names.length ? names.join(', ') : '출전 선수 없음'}`);
    });
  });

  lines.push(
    '',
    '[선수별 최종 기록]',
    '※ 제외된 쿼터를 포함한 전체 기록',
  );

  ['A', 'B'].forEach((team) => {
    lines.push('', `${team}팀`);
    const rows = playerTotals.filter((row) => row.team === team);
    if (!rows.length) lines.push('기록 없음');
    rows.forEach((row) => {
      const attendance = row.attendanceKnown ? `${row.appearances}쿼터 출전 / 득실마진 ${formatSigned(row.plusMinus)}` : '출전쿼터 — / 득실마진 —';
      lines.push(`${playerMap[row.playerId]?.name || '알 수 없는 선수'}: ${row.goals}골 ${row.assists}도움 / ${attendance}`);
    });
  });

  lines.push('', '[쿼터별 상세 기록]');
  match.quarters.forEach((quarter) => {
    const score = getQuarterScore(quarter);
    const excluded = quarter.scoreIncluded === false ? ' (승부 스코어 제외)' : '';
    lines.push('', `[${quarter.number}Q]`, `스코어: A팀 ${score.A} - ${score.B} B팀${excluded}`);
    ['A', 'B'].forEach((team) => {
      lines.push('', `${team}팀`);
      const rows = Object.entries(quarter.stats)
        .filter(([, stat]) => stat.team === team && (stat.goals || stat.assists));
      if (!rows.length) lines.push('기록 없음');
      rows.forEach(([playerId, stat]) => lines.push(`${playerMap[playerId]?.name || '알 수 없는 선수'}: ${stat.goals || 0}골 ${stat.assists || 0}도움`));
    });
  });

  return lines.join('\n');
}

export default function InternalMatch({ players, modeSwitcher = null }) {
  const [match, setMatch] = useState(loadSavedMatch);
  const [temporaryName, setTemporaryName] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [fallbackText, setFallbackText] = useState('');
  const [isScoreSettingsOpen, setIsScoreSettingsOpen] = useState(false);
  const allPlayers = useMemo(() => [...players, ...match.temporaryPlayers], [players, match.temporaryPlayers]);
  const playerMap = useMemo(() => Object.fromEntries(allPlayers.map((player) => [player.id, player])), [allPlayers]);
  const totals = getMatchTotals(match.quarters);
  const actualTotals = getActualTotals(match.quarters);
  const hasExcludedQuarters = match.quarters.some((quarter) => quarter.scoreIncluded === false);
  const activeQuarter = match.quarters[match.currentQuarter];
  const playerTotals = getPlayerTotals(match.quarters);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
  }, [match]);

  const updateTimer = useCallback((updater) => {
    setMatch((current) => ({
      ...current,
      timer: updater(normalizeMatchTimer(current.timer, QUARTER_COUNT)),
    }));
  }, []);

  function updateAssignment(playerId, team) {
    setMatch((current) => ({
      ...current,
      assignments: { ...current.assignments, [playerId]: team },
      matchAttendance: {
        ...(current.matchAttendance || {}),
        ...(team && !current.matchAttendance?.[playerId] ? { [playerId]: 'present' } : {}),
      },
    }));
  }

  function updateMatchAttendance(playerId, status) {
    setMatch((current) => ({
      ...current,
      matchAttendance: { ...(current.matchAttendance || {}), [playerId]: status },
    }));
  }

  function addTemporaryPlayer(event) {
    event.preventDefault();
    const name = temporaryName.trim();
    if (!name) return;
    const player = { id: `temp-${Date.now()}`, name, temporary: true };
    setMatch((current) => ({
      ...current,
      temporaryPlayers: [...current.temporaryPlayers, player],
      assignments: { ...current.assignments, [player.id]: 'A' },
      matchAttendance: { ...(current.matchAttendance || {}), [player.id]: 'present' },
    }));
    setTemporaryName('');
  }

  function startMatch() {
    const rosters = snapshotRosters(match.assignments, match.matchAttendance);
    const hasA = rosters.A.length > 0;
    const hasB = rosters.B.length > 0;
    if (!hasA || !hasB) {
      window.alert('A팀과 B팀에 각각 한 명 이상 배정해 주세요.');
      return;
    }
    setMatch((current) => {
      const quarters = [...current.quarters];
      quarters[0] = initializeQuarter(quarters[0], current.assignments, current.matchAttendance);
      return {
        ...current,
        phase: 'running',
        currentQuarter: 0,
        quarters,
        timer: normalizeMatchTimer(current.timer, QUARTER_COUNT),
      };
    });
  }

  function selectQuarter(index) {
    setMatch((current) => {
      const quarters = [...current.quarters];
      quarters[index] = initializeQuarter(quarters[index], current.assignments, current.matchAttendance, index > 0 ? quarters[index - 1] : null);
      let timer = normalizeMatchTimer(current.timer, QUARTER_COUNT);
      timer = pauseQuarterTimer(timer, current.currentQuarter);
      timer = pauseQuarterTimer(timer, index);
      return { ...current, currentQuarter: index, quarters, timer };
    });
  }

  function changeStat(playerId, team, field, delta) {
    setMatch((current) => {
      const quarters = [...current.quarters];
      const quarter = { ...quarters[current.currentQuarter], stats: { ...quarters[current.currentQuarter].stats } };
      const previous = quarter.stats[playerId] || { team, goals: 0, assists: 0 };
      quarter.stats[playerId] = {
        ...previous,
        team: previous.team || team,
        [field]: Math.max(0, (previous[field] || 0) + delta),
      };
      if (delta > 0) {
        quarter.attendance = { ...(quarter.attendance || {}), [playerId]: true };
        quarter.attendanceRecorded = true;
      }
      quarters[current.currentQuarter] = quarter;
      return { ...current, quarters };
    });
  }

  function toggleAttendance(playerId) {
    const currentQuarter = match.quarters[match.currentQuarter];
    const isAttending = currentQuarter.attendance?.[playerId] === true;
    const stat = currentQuarter.stats[playerId];
    if (isAttending && ((stat?.goals || 0) > 0 || (stat?.assists || 0) > 0)) {
      const confirmed = window.confirm('해당 선수의 골·어시스트 기록이 존재합니다. 출전 체크를 해제하시겠습니까?');
      if (!confirmed) return;
    }

    setMatch((current) => {
      const quarters = [...current.quarters];
      const quarter = quarters[current.currentQuarter];
      quarters[current.currentQuarter] = {
        ...quarter,
        attendance: { ...(quarter.attendance || {}), [playerId]: !isAttending },
        attendanceRecorded: true,
      };
      return { ...current, quarters };
    });
  }

  function finishMatch() {
    setMatch((current) => ({ ...current, phase: 'finished' }));
  }

  function toggleQuarterScore(quarterIndex) {
    setMatch((current) => {
      const quarters = [...current.quarters];
      quarters[quarterIndex] = {
        ...quarters[quarterIndex],
        scoreIncluded: quarters[quarterIndex].scoreIncluded === false,
      };
      return { ...current, quarters };
    });
  }

  async function copyMatch() {
    const text = formatExportText(match, playerMap);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(text);
      setFallbackText('');
      setCopyStatus('전체 경기 기록을 복사했습니다.');
    } catch (error) {
      setFallbackText(text);
      setCopyStatus('자동 복사가 지원되지 않습니다. 아래 텍스트를 길게 눌러 직접 복사해 주세요.');
    }
  }

  function resetMatch() {
    const confirmed = window.confirm('현재 기록이 삭제됩니다. 먼저 전체 경기 기록을 복사했는지 확인해 주세요. 새 경기를 시작할까요?');
    if (!confirmed) return;
    setMatch(createInitialInternalMatch());
    setCopyStatus('');
    setFallbackText('');
  }

  return (
    <div className="internal-page">
      <header className="internal-scoreboard">
        <div className="internal-topline">
          <a href="/" className="internal-back">← 공식 기록</a>
          {modeSwitcher}
          <span>INTERNAL MATCH</span>
        </div>
        <div className="scoreboard-header-content">
          <div className="scoreboard-match-info">
            <h1>MAD FC 자체전</h1>
            <time dateTime={match.date}>{match.date.replaceAll('-', '.')}</time>
            <div className="internal-main-score" aria-label={`A팀 ${totals.A} 대 ${totals.B} B팀`}>
              <span>A TEAM</span><strong>{totals.A}</strong><em>:</em><strong>{totals.B}</strong><span>B TEAM</span>
            </div>
            <p>
              현재 진행: {match.currentQuarter + 1} / {QUARTER_COUNT} QUARTER
              {hasExcludedQuarters ? <span className="score-basis"> · 승부 스코어: {getScoreBasis(match.quarters)}</span> : null}
            </p>
          </div>
          <QuarterTimer timer={match.timer} quarterIndex={match.currentQuarter} onChange={updateTimer} />
        </div>
      </header>

      {match.phase === 'setup' ? (
        <main className="internal-shell">
          <section className="internal-card setup-card">
            <div className="internal-section-head"><span>01</span><div><b>MATCH SETUP</b><h2>경기 및 팀 설정</h2></div></div>
            <div className="internal-setup-basics">
              <label className="internal-date">경기 날짜<input type="date" value={match.date} onChange={(event) => setMatch((current) => ({ ...current, date: event.target.value }))} /></label>
              <TimerDurationInput
                durationSeconds={match.timer.defaultDurationSeconds}
                onChange={(seconds) =>
                  setMatch((current) => ({
                    ...current,
                    timer: setDefaultTimerDuration(current.timer, seconds, QUARTER_COUNT),
                  }))
                }
              />
            </div>
            <p className="internal-help">선수를 A팀 또는 B팀에 배정하세요. 배정하지 않은 선수는 이번 자체전에 포함되지 않습니다.</p>
            <AssignmentGroups players={allPlayers} assignments={match.assignments} attendance={match.matchAttendance} onAssignmentChange={updateAssignment} onAttendanceChange={updateMatchAttendance} />
            <form className="temporary-player-form" onSubmit={addTemporaryPlayer}>
              <input value={temporaryName} onChange={(event) => setTemporaryName(event.target.value)} placeholder="임시 선수 이름" aria-label="임시 선수 이름" />
              <button type="submit">선수 추가</button>
            </form>
            <button className="internal-primary" type="button" onClick={startMatch}>경기 시작</button>
          </section>
        </main>
      ) : (
        <main className="internal-shell">
          <section className="internal-card quarter-control-card">
            <div className="quarter-tabs" role="tablist" aria-label="쿼터 선택">
              {match.quarters.map((quarter, index) => {
                const score = getQuarterScore(quarter);
                const excluded = quarter.scoreIncluded === false;
                return <button type="button" className={`${index === match.currentQuarter ? 'active' : ''} ${excluded ? 'score-excluded' : ''}`} onClick={() => selectQuarter(index)} key={quarter.number}><b>{quarter.number}Q</b><small>{score.A}:{score.B}</small>{excluded ? <em>제외</em> : null}</button>;
              })}
            </div>
            <div className="quarter-actions">
              {match.currentQuarter < QUARTER_COUNT - 1 ? <button className="internal-primary" type="button" onClick={() => selectQuarter(match.currentQuarter + 1)}>다음 Q</button> : null}
              <button className="internal-secondary" type="button" onClick={finishMatch}>결과 보기</button>
              <button className="internal-secondary score-settings-button" type="button" onClick={() => setIsScoreSettingsOpen(true)}><span className="settings-label-full">⚙ 스코어 반영 설정</span><span className="settings-label-compact">⚙ 설정</span></button>
            </div>
          </section>

          <section className="internal-team-grid">
            {['A', 'B'].map((team) => (
              <TeamRecorder team={team} playerIds={activeQuarter.rosters[team]} stats={activeQuarter.stats} attendance={activeQuarter.attendance || {}} playerMap={playerMap} onChange={changeStat} onToggleAttendance={toggleAttendance} key={team} />
            ))}
          </section>

          <section className="internal-card live-roster-card">
            <details>
              <summary>다음 미기록 쿼터의 팀 구성 변경</summary>
              <p className="internal-help">변경 내용은 아직 열지 않은 다음 쿼터부터 반영되며, 이전 쿼터 명단과 기록은 유지됩니다.</p>
              <AssignmentGroups players={allPlayers} assignments={match.assignments} attendance={match.matchAttendance} onAssignmentChange={updateAssignment} onAttendanceChange={updateMatchAttendance} compact />
              <form className="temporary-player-form" onSubmit={addTemporaryPlayer}>
                <input value={temporaryName} onChange={(event) => setTemporaryName(event.target.value)} placeholder="임시 선수 이름" />
                <button type="submit">선수 추가</button>
              </form>
            </details>
          </section>

          {match.phase === 'finished' ? (
            <ResultSummary match={match} totals={totals} actualTotals={actualTotals} playerTotals={playerTotals} playerMap={playerMap} onCopy={copyMatch} copyStatus={copyStatus} fallbackText={fallbackText} />
          ) : null}

          <button className="internal-reset" type="button" onClick={resetMatch}>새 경기 시작</button>
        </main>
      )}
      {isScoreSettingsOpen ? <ScoreSettings quarters={match.quarters} onToggle={toggleQuarterScore} onClose={() => setIsScoreSettingsOpen(false)} /> : null}
    </div>
  );
}

function AttendanceSelect({ player, value, assigned, onChange }) {
  const guest = isGuestPlayer(player);
  const storedStatus = value || (assigned ? 'present' : '');
  const status = guest ? guestAttendanceValue(storedStatus) : storedStatus;
  const option = MATCH_ATTENDANCE_OPTIONS.find((item) => item.value === status);
  const options = guest
    ? [{ value: '', label: '미선택' }, { value: 'present', label: '출석' }]
    : [{ value: '', label: '미선택' }, ...MATCH_ATTENDANCE_OPTIONS];
  return (
    <label className="match-attendance-select">
      <span className="sr-only">{player.name} 출석 상태</span>
      <select value={status} onChange={(event) => onChange(player.id, event.target.value)} aria-label={`${player.name} 출석 상태`}>
        {options.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
      </select>
      <em>{guest ? '집계 제외' : option ? `${option.score}점` : '0점'}</em>
    </label>
  );
}

function AssignmentGroups({ players, assignments, attendance, onAssignmentChange, onAttendanceChange, compact = false }) {
  const groups = [
    { title: '정규 멤버', players: sortPlayersByName(players.filter((player) => !isGuestPlayer(player))), guest: false },
    { title: '용병', players: sortPlayersByName(players.filter(isGuestPlayer)), guest: true },
  ];
  return (
    <div className={`assignment-groups ${compact ? 'compact' : ''}`}>
      {groups.map((group) => (
        <section className={`assignment-group ${group.guest ? 'guest' : 'member'}`} key={group.title}>
          <h3>{group.title}</h3>
          <div className="assignment-list">
            {group.players.length ? group.players.map((player) => (
              <div className="assignment-row" key={player.id}>
                <span>{player.name}{group.guest ? <small>용병</small> : null}</span>
                <div className="team-choice" role="group" aria-label={`${player.name} 팀 배정`}>
                  {['A', 'B', ''].map((team) => <button type="button" className={assignments[player.id] === team ? 'active' : ''} onClick={() => onAssignmentChange(player.id, team)} key={team || 'none'}>{team ? `${team}팀` : '제외'}</button>)}
                </div>
                <AttendanceSelect player={player} value={attendance?.[player.id]} assigned={Boolean(assignments[player.id])} onChange={onAttendanceChange} />
              </div>
            )) : <p className="assignment-group-empty">등록된 선수가 없습니다.</p>}
          </div>
        </section>
      ))}
    </div>
  );
}

function TeamRecorder({ team, playerIds, stats, attendance, playerMap, onChange, onToggleAttendance }) {
  return (
    <section className={`internal-card team-recorder team-${team.toLowerCase()}`}>
      <header><span>{team} TEAM</span><strong>{playerIds.reduce((sum, id) => sum + (stats[id]?.goals || 0), 0)} GOALS</strong></header>
      {!playerIds.length ? <p className="internal-empty">이 쿼터에 배정된 선수가 없습니다.</p> : null}
      {playerIds.map((playerId) => {
        const stat = stats[playerId] || { goals: 0, assists: 0 };
        return (
          <article className="recorder-row" key={playerId}>
            <label className="attendance-check">
              <input type="checkbox" checked={attendance[playerId] === true} onChange={() => onToggleAttendance(playerId)} aria-label={`${playerMap[playerId]?.name || '선수'} 출전`} />
              <span aria-hidden="true" />
            </label>
            <h3>{playerMap[playerId]?.name || '알 수 없는 선수'}</h3>
            <Counter label="득점" value={stat.goals || 0} onMinus={() => onChange(playerId, team, 'goals', -1)} onPlus={() => onChange(playerId, team, 'goals', 1)} />
            <Counter label="어시" value={stat.assists || 0} onMinus={() => onChange(playerId, team, 'assists', -1)} onPlus={() => onChange(playerId, team, 'assists', 1)} />
          </article>
        );
      })}
    </section>
  );
}

function Counter({ label, value, onMinus, onPlus }) {
  return (
    <div className="record-counter">
      <span>{label}</span>
      <div><button type="button" onClick={onMinus} aria-label={`${label} 취소`}>−</button><strong>{value}</strong><button type="button" onClick={onPlus} aria-label={`${label} 추가`}>+</button></div>
    </div>
  );
}

function ScoreSettings({ quarters, onToggle, onClose }) {
  return (
    <div className="score-settings-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="score-settings-panel" role="dialog" aria-modal="true" aria-labelledby="score-settings-title">
        <header>
          <div><span>SCORE SETTINGS</span><h2 id="score-settings-title">스코어 반영 설정</h2></div>
          <button type="button" onClick={onClose} aria-label="스코어 반영 설정 닫기">×</button>
        </header>
        <div className="score-settings-list">
          {quarters.map((quarter, index) => {
            const score = getQuarterScore(quarter);
            const included = quarter.scoreIncluded !== false;
            return (
              <div className="score-setting-row" key={quarter.number}>
                <b>{quarter.number}Q</b>
                <span>{score.A} : {score.B}</span>
                <button type="button" className={`score-toggle ${included ? 'on' : 'off'}`} role="switch" aria-checked={included} aria-label={`${quarter.number}쿼터 스코어 반영`} onClick={() => onToggle(index)}>
                  <i />
                  <em>{included ? 'ON' : 'OFF'}</em>
                </button>
              </div>
            );
          })}
        </div>
        <p>OFF 쿼터의 골·어시스트 기록은 유지되고 최종 승부 스코어에서만 제외됩니다.</p>
        <button className="internal-primary score-settings-close" type="button" onClick={onClose}>닫기</button>
      </section>
    </div>
  );
}

function ResultSummary({ match, totals, actualTotals, playerTotals, playerMap, onCopy, copyStatus, fallbackText }) {
  return (
    <section className="internal-card result-summary">
      <div className="internal-section-head"><span>FINAL</span><div><b>MATCH RESULT</b><h2>경기 결과</h2></div></div>
      <div className="final-score"><small>최종 승부 스코어</small>A TEAM <strong>{totals.A} : {totals.B}</strong> B TEAM<em>{getScoreBasis(match.quarters)}</em></div>
      <p className="actual-score">전체 실제 득점 · A팀 {actualTotals.A}골 / B팀 {actualTotals.B}골</p>
      <div className="result-tables">
        <table><thead><tr><th>쿼터</th><th>A팀</th><th>B팀</th><th>반영</th></tr></thead><tbody>{match.quarters.map((quarter) => { const score = getQuarterScore(quarter); const included = quarter.scoreIncluded !== false; return <tr className={included ? '' : 'excluded-result-row'} key={quarter.number}><td>{quarter.number}Q</td><td>{score.A}</td><td>{score.B}</td><td>{included ? 'ON' : '제외'}</td></tr>; })}<tr><th>실제 합계</th><th>{actualTotals.A}</th><th>{actualTotals.B}</th><th>-</th></tr></tbody></table>
        {['A', 'B'].map((team) => (
          <div className="final-player-list" key={team}>
            <h3>{team} TEAM</h3>
            {playerTotals.filter((row) => row.team === team).map((row) => (
              <p key={`${team}-${row.playerId}`}>
                <b>{playerMap[row.playerId]?.name}</b>
                <span>
                  {row.goals}골 · {row.assists}도움 · {row.goals + row.assists}P
                  <small>{row.attendanceKnown ? `${row.appearances}쿼터 · 득실마진 ${formatSigned(row.plusMinus)}` : '출전쿼터 — · 득실마진 —'}</small>
                </span>
              </p>
            ))}
          </div>
        ))}
      </div>
      <button className="internal-primary" type="button" onClick={onCopy}>전체 경기 기록 복사</button>
      {copyStatus ? <p className="copy-status" role="status">{copyStatus}</p> : null}
      {fallbackText ? <textarea className="copy-fallback" value={fallbackText} readOnly onFocus={(event) => event.target.select()} aria-label="직접 복사할 경기 기록" /> : null}
      <p className="storage-notice">기록은 이 브라우저에만 저장됩니다. 브라우저 데이터를 삭제하거나 다른 기기를 사용하면 자동으로 옮겨지지 않습니다.</p>
    </section>
  );
}
