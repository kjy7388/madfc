import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import madfcLogo from './assets/images/madfc-logo.png';
import madfcWordmark from './assets/images/madfc-wordmark.png';
import './index.css';

const seasonData = {
  club: 'Mad FC',
  season: '2026 시즌',
  players: [
    { id: 'p1', name: '박경민', position: 'DF' },
    { id: 'p2', name: '최용호', position: 'MF', guest: true },
    { id: 'p3', name: '고유순', position: 'FW' },
    { id: 'p4', name: '김장엽', position: 'DF' },
    { id: 'p5', name: '이현규', position: 'DF', guest: true },
    { id: 'p6', name: '전창욱', position: 'MF' },
    { id: 'p7', name: '박진규', position: 'FW' },
    { id: 'p8', name: '대영', position: 'FW', guest: true },
    { id: 'p9', name: '이동섭', position: 'DF' },
    { id: 'p10', name: '조도연', position: 'FW' },
    { id: 'p11', name: '유재홍', position: 'MF' },
    { id: 'p12', name: '황훈식', position: 'MF', guest: true },
    { id: 'p13', name: '허진강', position: 'DF', guest: true },
    { id: 'p14', name: '류경상', position: 'FW', guest: true },
  ],
  matches: [
    {
      id: '20260905',
      date: '2026-09-05',
      venue: '용산',
      opponent: '연규네',
      teamScore: 21,
      opponentScore: 12,
      quarters: [
        { label: '1쿼터', cumulativeScore: '3:1', players: ['김장엽', '이현규', '고유순', '대영', '최용호'], for: 3, against: 1, events: [{ type: 'goal', scorer: '김장엽', assist: '최용호' }, { type: 'goal', scorer: '고유순', assist: '이현규' }, { type: 'goal', scorer: '고유순', assist: '이현규' }, { type: 'against' }] },
        { label: '2쿼터', cumulativeScore: '4:5', players: ['박경민', '전창욱', '박진규', '대영', '최용호'], for: 1, against: 4, events: [{ type: 'against' }, { type: 'against' }, { type: 'against' }, { type: 'goal', scorer: '최용호' }, { type: 'against' }] },
        { label: '3쿼터', cumulativeScore: '10:5', players: ['최용호', '박경민', '이현규', '김장엽', '고유순'], for: 6, against: 0, events: [{ type: 'goal', scorer: '박경민' }, { type: 'goal', scorer: '최용호', assist: '박경민' }, { type: 'goal', scorer: '이현규' }, { type: 'goal', scorer: '박경민' }, { type: 'goal', scorer: '박경민', assist: '최용호' }, { type: 'goal', scorer: '최용호', assist: '박경민' }] },
        { label: '4쿼터', cumulativeScore: '14:6', players: ['박진규', '전창욱', '김장엽', '대영', '이현규'], for: 4, against: 1, events: [{ type: 'goal', scorer: '김장엽', assist: '전창욱' }, { type: 'goal', scorer: '김장엽', assist: '박진규' }, { type: 'goal', scorer: '이현규' }, { type: 'goal', scorer: '전창욱', assist: '김장엽' }, { type: 'against' }] },
        { label: '5쿼터', cumulativeScore: '15:6', players: ['이현규', '최용호', '고유순', '박경민', '대영'], for: 1, against: 0, events: [{ type: 'goal', scorer: '고유순', assist: '최용호' }] },
        { label: '6쿼터', cumulativeScore: '15:8', players: ['박진규', '김장엽', '대영', '전창욱', '고유순'], for: 0, against: 2, events: [{ type: 'against' }, { type: 'against' }] },
        { label: '7쿼터', cumulativeScore: '17:11', players: ['최용호', '고유순', '전창욱', '대영', '박경민'], for: 2, against: 3, events: [{ type: 'goal', scorer: '고유순', assist: '최용호' }, { type: 'against' }, { type: 'against' }, { type: 'against' }, { type: 'goal', scorer: '전창욱' }] },
        { label: '8쿼터', cumulativeScore: '21:12', players: ['박진규', '최용호', '김장엽', '고유순', '박경민'], for: 4, against: 1, events: [{ type: 'goal', scorer: '박경민', assist: '김장엽' }, { type: 'goal', scorer: '박진규' }, { type: 'goal', scorer: '박경민', assist: '박진규' }, { type: 'goal', scorer: '고유순', assist: '박경민' }, { type: 'against' }] },
      ],
      playerStats: {
        p1: { attendanceScore: 2, goals: 5, assists: 3, appearances: [false, true, true, false, true, false, true, true] },
        p2: { attendanceScore: 0, goals: 3, assists: 4, appearances: [true, true, true, false, true, false, true, true] },
        p3: { attendanceScore: 2, goals: 5, assists: 0, appearances: [true, false, true, false, true, true, true, true] },
        p4: { attendanceScore: 3, goals: 3, assists: 2, appearances: [true, false, true, true, false, true, false, true] },
        p5: { attendanceScore: 0, goals: 2, assists: 2, appearances: [true, false, true, true, true, false, false, false] },
        p6: { attendanceScore: 1, goals: 2, assists: 1, appearances: [false, true, false, true, false, true, true, false] },
        p7: { attendanceScore: 3, goals: 1, assists: 2, appearances: [false, true, false, true, false, true, false, true] },
        p8: { attendanceScore: 0, goals: 0, assists: 0, appearances: [true, true, false, true, true, true, true, false] },
      },
    },
    {
      id: '20261003',
      date: '2026-10-03',
      venue: '광명',
      opponent: 'Hey FC',
      teamScore: 17,
      opponentScore: 15,
      quarters: [
        { label: '1쿼터', cumulativeScore: '0:2', players: ['고유순', '황훈식', '김장엽', '박경민', '허진강', '유재홍'], for: 0, against: 2, events: [{ type: 'against' }, { type: 'against' }] },
        { label: '2쿼터', cumulativeScore: '1:4', players: ['고유순', '박경민', '전창욱', '허진강', '유재홍', '황훈식'], for: 1, against: 2, events: [{ type: 'against' }, { type: 'against' }, { type: 'goal', scorer: '고유순', assist: '허진강' }] },
        { label: '3쿼터', cumulativeScore: '3:4', players: ['고유순', '류경상', '전창욱', '허진강', '김장엽', '황훈식'], for: 2, against: 0, events: [{ type: 'goal', scorer: '류경상', assist: '고유순' }, { type: 'goal', scorer: '류경상', assist: '고유순' }] },
        { label: '4쿼터', cumulativeScore: '5:8', players: ['박경민', '전창욱', '김장엽', '황훈식', '유재홍', '고유순'], for: 2, against: 4, events: [{ type: 'against' }, { type: 'goal', scorer: '김장엽' }, { type: 'against' }, { type: 'against' }, { type: 'goal', scorer: '황훈식', assist: '유재홍' }, { type: 'against' }] },
        { label: '5쿼터', cumulativeScore: '11:9', players: ['황훈식', '고유순', '박경민', '류경상', '허진강', '유재홍'], for: 6, against: 1, events: [{ type: 'goal', scorer: '고유순', assist: '황훈식' }, { type: 'goal', scorer: '고유순', assist: '황훈식' }, { type: 'goal', scorer: '류경상', assist: '허진강' }, { type: 'goal', scorer: '박경민', assist: '허진강' }, { type: 'goal', scorer: '황훈식', assist: '고유순' }, { type: 'against' }, { type: 'goal', scorer: '황훈식' }] },
        { label: '6쿼터', cumulativeScore: '13:13', players: ['전창욱', '허진강', '유재홍', '박경민', '류경상', '김장엽'], for: 2, against: 4, events: [{ type: 'goal', scorer: '허진강', assist: '박경민' }, { type: 'against' }, { type: 'against' }, { type: 'goal', scorer: '유재홍', assist: '김장엽' }, { type: 'against' }, { type: 'against' }] },
        { label: '7쿼터', cumulativeScore: '17:15', players: ['전창욱', '허진강', '황훈식', '고유순', '류경상', '김장엽'], for: 4, against: 2, events: [{ type: 'goal', scorer: '황훈식', assist: '고유순' }, { type: 'goal', scorer: '류경상', assist: '황훈식' }, { type: 'against' }, { type: 'goal', scorer: '전창욱', assist: '류경상' }, { type: 'goal', scorer: '고유순', assist: '황훈식' }, { type: 'against' }] },
      ],
      playerStats: {
        p1: { attendanceScore: 3, goals: 1, assists: 1, appearances: [true, true, false, true, true, true, false] },
        p3: { attendanceScore: 3, goals: 4, assists: 4, appearances: [true, true, true, true, true, false, true] },
        p4: { attendanceScore: 3, goals: 1, assists: 1, appearances: [true, false, true, true, false, true, true] },
        p6: { attendanceScore: 1, goals: 1, assists: 0, appearances: [false, true, true, true, false, true, true] },
        p11: { attendanceScore: 1, goals: 1, assists: 1, appearances: [true, true, false, true, true, true, false] },
        p12: { attendanceScore: 0, goals: 4, assists: 4, appearances: [true, true, true, true, true, false, true] },
        p13: { attendanceScore: 0, goals: 1, assists: 3, appearances: [true, true, true, false, true, true, true] },
        p14: { attendanceScore: 0, goals: 4, assists: 1, appearances: [false, false, true, false, true, true, true] },
      },
    },
  ],
};

const RANK_METRICS = [
  { key: 'goals', label: '득점' },
  { key: 'assists', label: '어시스트' },
  { key: 'points', label: '공격P' },
];

function App() {
  const reportRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const data = seasonData;
  const [selectedMatchId, setSelectedMatchId] = useState(data.matches.at(-1)?.id ?? '');
  const [includeGuests, setIncludeGuests] = useState(false);
  const [rankingMetric, setRankingMetric] = useState('goals');
  const [activeMatchTab, setActiveMatchTab] = useState('summary');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const selectedMatch = data.matches.find((match) => match.id === selectedMatchId) ?? data.matches.at(-1);
  const seasonRows = buildSeasonStats(data);
  const selectedPlayerDetail = selectedPlayerId ? buildPlayerDetail(data, seasonRows, selectedPlayerId) : null;
  const visibleSeasonRows = includeGuests ? seasonRows : seasonRows.filter((row) => !row.guest);
  const summary = buildSummary(data);
  const winRate = summary.matches ? Math.round((summary.wins / summary.matches) * 100) : 0;
  const recentResults = data.matches.slice(-8).map(getResult);
  const rankingRows = buildRankingRows(visibleSeasonRows, rankingMetric).slice(0, 5);
  const topRankingValue = Math.max(...rankingRows.map((row) => row.rankValue), 1);

  useEffect(() => {
    if (!selectedPlayerDetail) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setSelectedPlayerId(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPlayerDetail]);

  async function downloadImage() {
    if (!reportRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#101624',
        pixelRatio: 2,
        filter: (node) => !node.classList?.contains('no-export'),
      });
      const link = document.createElement('a');
      link.download = `mad-fc-${selectedMatch.id}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="export-stage">
      <main className="mad-page" ref={reportRef}>
        <section className="hero-panel">
          <img className="hero-watermark" src={madfcLogo} alt="" aria-hidden="true" />
          <div className="club-brand">
            <div className="club-title">
              <img className="club-wordmark" src={madfcWordmark} alt="MAD FC" />
              <p>FUTSAL CLUB</p>
              <p>SINCE 2012</p>
            </div>
          </div>

          <div className="hero-actions">
            <span className="season-badge">2026 SEASON</span>
            <button className="download-button no-export" type="button" onClick={downloadImage} disabled={isDownloading}>
              {isDownloading ? '이미지 생성 중' : '이미지 다운로드'}
            </button>
          </div>
        </section>

        <section className="top-kpis">
          <MetricCard icon="%" label="승률" value={`${winRate}%`} note={`${summary.wins}승 ${summary.draws}무 ${summary.losses}패`} tone="gold" />
          <MetricCard icon="G" label="총 득점" value={summary.goalsFor} note={`경기당 ${toFixed(summary.goalsFor / summary.matches)}골`} tone="blue" />
          <MetricCard icon="+/-" label="득실차" value={formatSigned(summary.goalDiff)} note={`${summary.goalsFor}득점 / ${summary.goalsAgainst}실점`} tone="green" />
          <MetricCard icon="W" label="최근 흐름" value={recentResults.join('')} note={`최근 ${recentResults.length}경기`} tone="red" />
        </section>

        <section className="stats-filter-row" aria-label="용병 통계 필터">
          <div className="guest-filter" role="group" aria-label="용병 포함 여부">
            <button type="button" className={!includeGuests ? 'active' : ''} onClick={() => setIncludeGuests(false)}>
              용병 제외
            </button>
            <button type="button" className={includeGuests ? 'active' : ''} onClick={() => setIncludeGuests(true)}>
              용병 포함
            </button>
          </div>
        </section>

        <section className="insight-grid">
          <article className="panel-card">
            <SectionTitle eyebrow="Season Record" title="시즌 전적" />
            <ResultBar label="승" value={summary.wins} total={summary.matches} tone="win" />
            <ResultBar label="무" value={summary.draws} total={summary.matches} tone="draw" />
            <ResultBar label="패" value={summary.losses} total={summary.matches} tone="loss" />
            <div className="mini-summary">
              <StatBlock label="전체 선수" value={`${data.players.length}명`} />
              <StatBlock label="팀득점" value={summary.goalsFor} />
              <StatBlock label="팀실점" value={summary.goalsAgainst} />
            </div>
          </article>

          <article className="panel-card">
            <SectionTitle eyebrow="Recent Form" title="최근 전적" />
            <div className="form-row">
              {recentResults.map((result, index) => (
                <span className={`form-chip ${resultClass(result)}`} key={`${result}-${index}`}>{result}</span>
              ))}
            </div>
            <div className="match-line">
              <span>{formatDate(selectedMatch.date)}</span>
              <strong>{data.club} {selectedMatch.teamScore} : {selectedMatch.opponentScore} {selectedMatch.opponent}</strong>
            </div>
          </article>

          <article className="panel-card scoring-card">
            <SectionTitle eyebrow="Scoring Rank" title="득점 랭킹" />
            <div className="rank-tabs" role="tablist" aria-label="랭킹 종류">
              {RANK_METRICS.map((metric) => (
                <button
                  type="button"
                  className={rankingMetric === metric.key ? 'active' : ''}
                  aria-selected={rankingMetric === metric.key}
                  onClick={() => setRankingMetric(metric.key)}
                  key={metric.key}
                >
                  {metric.label}
                </button>
              ))}
            </div>
            {rankingRows.map((row) => (
              <div className="rank-line" key={row.id}>
                <span>{row.rank}</span>
                <b><PlayerName player={row} onClick={() => setSelectedPlayerId(row.id)} /></b>
                <div className="rank-track"><i style={{ width: `${(row.rankValue / topRankingValue) * 100}%` }} /></div>
                <em>{formatRankValue(row.rankValue, rankingMetric)}</em>
              </div>
            ))}
          </article>
        </section>

        <section className="report-section">
          <SectionTitle eyebrow="Season Total" title="전체 누적 스탯" />
          <div className="table-panel">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>선수</th>
                  <th>포지션</th>
                  <th>경기</th>
                  <th>출석점수</th>
                  <th>득점</th>
                  <th>어시스트</th>
                  <th>공격포인트</th>
                  <th>득실마진</th>
                </tr>
              </thead>
              <tbody>
                {visibleSeasonRows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="rank">#{index + 1}</td>
                    <td className="player"><PlayerName player={row} onClick={() => setSelectedPlayerId(row.id)} /></td>
                    <td>{row.position}</td>
                    <td>{row.matches}</td>
                    <td>{row.attendanceScore}</td>
                    <td>{row.goals}</td>
                    <td>{row.assists}</td>
                    <td className="highlight">{row.points}</td>
                    <td className={row.plusMinus >= 0 ? 'positive' : 'negative'}>{formatSigned(row.plusMinus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="report-section match-section">
          <div className="match-section-head">
            <SectionTitle eyebrow="Match Detail" title="특정일 경기 정보" />
            <label className="match-filter">
              <span>경기일정</span>
              <select
                value={selectedMatch.id}
                onChange={(event) => {
                  setSelectedMatchId(event.target.value);
                  setActiveMatchTab('summary');
                }}
              >
                {data.matches.map((match) => (
                  <option value={match.id} key={match.id}>
                    {formatDate(match.date)} · {match.venue} · {match.opponent}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="match-tabs no-export" role="tablist" aria-label="모바일 경기 상세 탭">
            <button type="button" className={activeMatchTab === 'summary' ? 'active' : ''} onClick={() => setActiveMatchTab('summary')}>
              경기 요약
            </button>
            <button type="button" className={activeMatchTab === 'quarters' ? 'active' : ''} onClick={() => setActiveMatchTab('quarters')}>
              쿼터 기록
            </button>
            <button type="button" className={activeMatchTab === 'players' ? 'active' : ''} onClick={() => setActiveMatchTab('players')}>
              개인 기록
            </button>
          </div>

          <div className={`match-header match-tab-panel ${activeMatchTab === 'summary' ? 'active' : ''}`}>
            <div>
              <span>{formatDate(selectedMatch.date)}</span>
              <h2>{data.club} vs {selectedMatch.opponent}</h2>
              <p>{selectedMatch.venue} | 최종 스코어 {selectedMatch.teamScore} : {selectedMatch.opponentScore}</p>
            </div>
            <strong className={resultClass(getResult(selectedMatch))}>{getResult(selectedMatch)}</strong>
          </div>

          <div className={`quarter-strip match-tab-panel ${activeMatchTab === 'quarters' ? 'active' : ''}`} aria-label="쿼터별 결과">
            {selectedMatch.quarters.map((quarter) => (
              <QuarterCard quarter={quarter} key={quarter.label} />
            ))}
          </div>

          <div className={`table-panel match-stats-panel match-tab-panel ${activeMatchTab === 'players' ? 'active' : ''}`}>
            <table className="match-stats-table">
              <thead>
                <tr>
                  <th>선수</th>
                  <th>포지션</th>
                  <th>출석점수</th>
                  <th>득점</th>
                  <th>어시스트</th>
                  <th>공격포인트</th>
                  <th>출전쿼터</th>
                  <th>득실마진</th>
                </tr>
              </thead>
              <tbody>
                {data.players.filter((player) => selectedMatch.playerStats[player.id]?.appearances?.some(Boolean)).map((player) => {
                  const stat = selectedMatch.playerStats[player.id] ?? {};
                  const points = (stat.goals ?? 0) + (stat.assists ?? 0);
                  const plusMinus = getPlusMinusFromAppearances(selectedMatch, stat.appearances);

                  return (
                    <tr key={player.id}>
                      <td className="player"><PlayerName player={player} onClick={() => setSelectedPlayerId(player.id)} /></td>
                      <td>{player.position}</td>
                      <td>{stat.attendanceScore ?? 0}</td>
                      <td>{stat.goals ?? 0}</td>
                      <td>{stat.assists ?? 0}</td>
                      <td className="highlight">{points}</td>
                      <td><AppearanceDots appearances={stat.appearances} total={selectedMatch.quarters.length} /></td>
                      <td className={plusMinus >= 0 ? 'positive' : 'negative'}>{formatSigned(plusMinus)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <PlayerDetailModal detail={selectedPlayerDetail} onClose={() => setSelectedPlayerId(null)} />
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, note, tone }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span className="metric-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <em>{note}</em>
      </div>
    </article>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="section-title">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function ResultBar({ label, value, total, tone }) {
  const percent = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className="result-bar">
      <span>{label}</span>
      <div><i className={tone} style={{ width: `${percent}%` }} /></div>
      <b>{value}</b>
      <em>{percent}%</em>
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="stat-block">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function QuarterCard({ quarter }) {
  const margin = quarter.for - quarter.against;

  return (
    <article className="quarter-card">
      <div className="quarter-title">
        <span>{quarter.label}</span>
        <em>{quarter.cumulativeScore}</em>
      </div>
      <strong>{quarter.for} : {quarter.against}</strong>
      <p className={margin >= 0 ? 'positive' : 'negative'}>{formatSigned(margin)}</p>
      <div className="lineup">{quarter.players.join(' · ')}</div>
      <div className="event-list">
        {quarter.events.map((event, index) => (
          <EventRow event={event} key={`${quarter.label}-${index}`} />
        ))}
      </div>
    </article>
  );
}

function EventRow({ event }) {
  if (event.type === 'against') {
    return (
      <div className="event-row against">
        <span className="event-icon">실</span>
        <b>실점</b>
      </div>
    );
  }

  return (
    <div className="event-row">
      <span className="event-icon goal">G</span>
      <b>{event.scorer}</b>
      {event.assist ? (
        <>
          <span className="event-icon assist">A</span>
          <b>{event.assist}</b>
        </>
      ) : null}
    </div>
  );
}

function AppearanceDots({ appearances = [], total = 8 }) {
  const dots = Array.from({ length: total }, (_, index) => Boolean(appearances[index]));
  const playedCount = dots.filter(Boolean).length;

  return (
    <div className="appearance-cell" aria-label={`총 ${playedCount}쿼터 출전`}>
      <b>{playedCount}쿼터</b>
      <div className="appearance-dots" style={{ '--quarter-count': total }}>
        {dots.map((played, index) => (
          <span
            className={played ? 'appearance-dot played' : 'appearance-dot missed'}
            title={`${index + 1}쿼터 ${played ? '출전' : '미출전'}`}
            aria-label={`${index + 1}쿼터 ${played ? '출전' : '미출전'}`}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerName({ player, onClick }) {
  const content = (
    <>
      {player.name}
      {player.guest ? <span className="guest-badge">용병</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button className="player-name-button player-with-badge" type="button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <span className="player-with-badge">{content}</span>;
}

function PlayerDetailModal({ detail, onClose }) {
  if (!detail) return null;

  const { player, season, totalQuarters, matches } = detail;
  const stats = [
    { label: '출석', value: season.attendanceScore },
    { label: '득점', value: season.goals },
    { label: '어시스트', value: season.assists },
    { label: '공격P', value: season.points },
    { label: '출전쿼터', value: totalQuarters },
    { label: '득실마진', value: formatSigned(season.plusMinus), tone: season.plusMinus >= 0 ? 'positive' : 'negative' },
  ];

  return (
    <div className="player-modal-overlay no-export" role="presentation" onClick={onClose}>
      <article className="player-modal" role="dialog" aria-modal="true" aria-label={`${player.name} 선수 상세 기록`} onClick={(event) => event.stopPropagation()}>
        <header className="player-modal-head">
          <div>
            <div className="player-modal-name">
              <h2>{player.name}</h2>
              {player.guest ? <span className="guest-badge">용병</span> : null}
            </div>
            <span>2026 SEASON</span>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="선수 상세 닫기">×</button>
        </header>

        <div className="player-summary-grid">
          {stats.map((stat) => (
            <div className="player-summary-item" key={stat.label}>
              <span>{stat.label}</span>
              <strong className={stat.tone ?? ''}>{stat.value}</strong>
            </div>
          ))}
        </div>

        <section className="player-match-list">
          <h3>경기별 기록</h3>
          {matches.map((match) => (
            <article className="player-match-row" key={match.id}>
              <div className="player-match-title">
                <div>
                  <span>{formatShortDate(match.date)}</span>
                  <strong>vs {match.opponent}</strong>
                </div>
                <em className={resultClass(match.result)}>{match.result}</em>
              </div>
              <div className="player-match-stats">
                <span>{match.goals}골</span>
                <span>{match.assists}도움</span>
                <span>{match.points}P</span>
                <span>{match.quarters}쿼터</span>
                <strong className={match.plusMinus >= 0 ? 'positive' : 'negative'}>{formatSigned(match.plusMinus)}</strong>
              </div>
            </article>
          ))}
        </section>
      </article>
    </div>
  );
}

function buildSummary(data) {
  return data.matches.reduce(
    (acc, match) => {
      const result = getResult(match);

      acc.matches += 1;
      acc.goalsFor += match.teamScore;
      acc.goalsAgainst += match.opponentScore;
      acc.goalDiff += match.teamScore - match.opponentScore;
      acc.wins += result === '승' ? 1 : 0;
      acc.draws += result === '무' ? 1 : 0;
      acc.losses += result === '패' ? 1 : 0;
      return acc;
    },
    { matches: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, wins: 0, draws: 0, losses: 0 },
  );
}

function buildSeasonStats(data) {
  const rows = data.players.map((player) => ({
    ...player,
    matches: 0,
    attendanceScore: 0,
    goals: 0,
    assists: 0,
    points: 0,
    plusMinus: 0,
  }));
  const rowsById = Object.fromEntries(rows.map((row) => [row.id, row]));

  data.matches.forEach((match) => {
    Object.entries(match.playerStats).forEach(([playerId, stat]) => {
      const row = rowsById[playerId];
      if (!row) return;

      row.matches += stat.appearances?.some(Boolean) ? 1 : 0;
      row.attendanceScore += stat.attendanceScore ?? 0;
      row.goals += stat.goals ?? 0;
      row.assists += stat.assists ?? 0;
      row.points += (stat.goals ?? 0) + (stat.assists ?? 0);
      row.plusMinus += getPlusMinusFromAppearances(match, stat.appearances);
    });
  });

  return rows.sort((a, b) => b.points - a.points || b.goals - a.goals || b.plusMinus - a.plusMinus || a.name.localeCompare(b.name, 'ko-KR'));
}

function buildPlayerDetail(data, seasonRows, playerId) {
  const player = data.players.find((item) => item.id === playerId);
  const season = seasonRows.find((row) => row.id === playerId);

  if (!player || !season) return null;

  const matches = data.matches
    .map((match) => {
      const stat = match.playerStats[playerId];
      const appearances = stat?.appearances ?? [];

      if (!appearances.some(Boolean)) return null;

      const goals = stat.goals ?? 0;
      const assists = stat.assists ?? 0;
      const quarters = appearances.filter(Boolean).length;
      const plusMinus = getPlusMinusFromAppearances(match, appearances);

      return {
        id: match.id,
        date: match.date,
        opponent: match.opponent,
        result: getResult(match),
        goals,
        assists,
        points: goals + assists,
        quarters,
        plusMinus,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    player,
    season,
    totalQuarters: matches.reduce((total, match) => total + match.quarters, 0),
    matches,
  };
}

function buildRankingRows(rows, metric) {
  let previousValue = null;
  let previousRank = 0;

  return rows
    .filter((row) => row[metric] > 0)
    .sort((a, b) => b[metric] - a[metric] || b.points - a.points || b.goals - a.goals || b.plusMinus - a.plusMinus || a.name.localeCompare(b.name, 'ko-KR'))
    .map((row, index) => {
      const rankValue = row[metric];
      const rank = rankValue === previousValue ? previousRank : index + 1;

      previousValue = rankValue;
      previousRank = rank;

      return {
        ...row,
        rank,
        rankValue,
      };
    });
}

function getPlusMinusFromAppearances(match, appearances = []) {
  return match.quarters.reduce((total, quarter, index) => {
    if (!appearances[index]) return total;
    return total + quarter.for - quarter.against;
  }, 0);
}

function getResult(match) {
  if (match.teamScore > match.opponentScore) return '승';
  if (match.teamScore < match.opponentScore) return '패';
  return '무';
}

function resultClass(result) {
  if (result === '승') return 'win';
  if (result === '패') return 'loss';
  return 'draw';
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(dateString));
}

function formatShortDate(dateString) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(dateString));
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : value;
}

function formatRankValue(value, metric) {
  if (metric === 'goals') return `${value}골`;
  if (metric === 'assists') return `${value}도움`;
  return `${value}P`;
}

function toFixed(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '0.0';
}

export default App;
