import matchAnalyses from './playerReviews';
import { buildSeasonStats, buildSummary, seasonData } from '../App';

const expectedStats = {
  고유순: { goals: 1, assists: 3, quarters: 6, plusMinus: 3, goalkeeperQuarters: 1 },
  곽찬웅: { goals: 7, assists: 2, quarters: 6, plusMinus: 6, goalkeeperQuarters: 1 },
  김장엽: { goals: 3, assists: 1, quarters: 6, plusMinus: 8, goalkeeperQuarters: 2 },
  이명건: { goals: 2, assists: 2, quarters: 5, plusMinus: 7, goalkeeperQuarters: 0 },
  전대영: { goals: 0, assists: 2, quarters: 6, plusMinus: 6, goalkeeperQuarters: 2 },
  전창욱: { goals: 1, assists: 4, quarters: 6, plusMinus: 8, goalkeeperQuarters: 1 },
  조도연: { goals: 6, assists: 2, quarters: 6, plusMinus: 3, goalkeeperQuarters: 1 },
};

test('2026-11-07 Samil FC match records are internally consistent', () => {
  const match = seasonData.matches.find((item) => item.id === '20261107');
  const playerMap = Object.fromEntries(seasonData.players.map((player) => [player.id, player]));
  const quarterTotals = match.quarters.reduce(
    (totals, quarter) => ({ for: totals.for + quarter.for, against: totals.against + quarter.against }),
    { for: 0, against: 0 },
  );
  const eventTotals = match.quarters.flatMap((quarter) => quarter.events).reduce(
    (totals, event) => ({
      goals: totals.goals + (event.type === 'goal' ? 1 : 0),
      assists: totals.assists + (event.type === 'goal' && event.assist ? 1 : 0),
      against: totals.against + (event.type === 'against' ? 1 : 0),
    }),
    { goals: 0, assists: 0, against: 0 },
  );

  expect(match).toMatchObject({ date: '2026-11-07', venue: '마포', opponent: '삼일FC', teamScore: 20, opponentScore: 12 });
  expect(quarterTotals).toEqual({ for: 20, against: 12 });
  expect(eventTotals).toEqual({ goals: 20, assists: 16, against: 12 });
  expect(match.quarters[7].players).toHaveLength(6);

  Object.entries(match.playerStats).forEach(([playerId, stat]) => {
    const player = playerMap[playerId];
    const plusMinus = match.quarters.reduce(
      (total, quarter, index) => total + (stat.appearances[index] ? quarter.for - quarter.against : 0),
      0,
    );
    expect(stat).toMatchObject({ goals: expectedStats[player.name].goals, assists: expectedStats[player.name].assists });
    expect(stat.appearances.filter(Boolean)).toHaveLength(expectedStats[player.name].quarters);
    expect(plusMinus).toBe(expectedStats[player.name].plusMinus);
    expect(stat.goalkeeperAppearances.filter(Boolean)).toHaveLength(expectedStats[player.name].goalkeeperQuarters);
  });

  expect(Object.values(match.playerStats).reduce((sum, stat) => sum + stat.goals, 0)).toBe(20);
  expect(Object.values(match.playerStats).reduce((sum, stat) => sum + stat.assists, 0)).toBe(16);
  expect(Object.values(match.playerStats).reduce((sum, stat) => sum + stat.goals + stat.assists, 0)).toBe(36);
  expect(Object.values(match.playerStats).reduce((sum, stat) => sum + stat.attendanceScore, 0)).toBe(12);
  expect(Object.values(match.playerStats).reduce((sum, stat) => sum + stat.goalkeeperAppearances.filter(Boolean).length, 0)).toBe(8);
  expect(matchAnalyses[match.id].playerReviews).toHaveProperty('p17');
  expect(matchAnalyses[match.id].nextMatchPlan.title).toBe('삼일FC와의 다음 경기 운영 방향');
});

test('new external match updates official summary and keeps guest filtering data separate', () => {
  expect(buildSummary(seasonData)).toEqual({
    matches: 4,
    goalsFor: 65,
    goalsAgainst: 51,
    goalDiff: 14,
    wins: 3,
    draws: 0,
    losses: 1,
  });

  const rows = buildSeasonStats(seasonData);
  const rowsByName = Object.fromEntries(rows.map((row) => [row.name, row]));
  expect(rowsByName.곽찬웅).toMatchObject({ guest: true, matches: 1, attendanceScore: 0, goals: 7, assists: 2, points: 9 });
  expect(rowsByName.이명건).toMatchObject({ guest: true, matches: 1, attendanceScore: 0, goals: 2, assists: 2, points: 4 });
  expect(rowsByName.전대영).toMatchObject({ id: 'p8', guest: true });
  expect(seasonData.players.filter((player) => player.name === '전대영')).toHaveLength(1);
});
