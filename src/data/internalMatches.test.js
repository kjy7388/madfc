import internalMatches from './internalMatches';
import matchAnalyses from './playerReviews';
import { buildSeasonStats, buildSummary, seasonData } from '../App';

test('2026-10-31 internal match totals are derived correctly', () => {
  const match = internalMatches[0];
  const quarterTotals = match.quarters.reduce(
    (totals, quarter) => ({ a: totals.a + quarter.for, b: totals.b + quarter.against }),
    { a: 0, b: 0 },
  );
  const playerTotals = Object.values(match.playerStats).reduce(
    (totals, stat) => ({
      ...totals,
      [stat.team]: {
        goals: totals[stat.team].goals + stat.goals,
        assists: totals[stat.team].assists + stat.assists,
      },
    }),
    { A: { goals: 0, assists: 0 }, B: { goals: 0, assists: 0 } },
  );

  expect(quarterTotals).toEqual({ a: 22, b: 19 });
  expect(playerTotals).toEqual({
    A: { goals: 22, assists: 17 },
    B: { goals: 19, assists: 18 },
  });
  expect(match.playerStats.p1).toMatchObject({ team: 'A', goals: 5, assists: 5 });
  expect(match.playerStats.p3).toMatchObject({ team: 'A', goals: 7, assists: 6 });
  expect(match.playerStats.p10).toMatchObject({ team: 'B', goals: 7, assists: 0 });
});

test('internal matches are excluded from official season summary', () => {
  expect(buildSummary(seasonData)).toEqual({
    matches: 3,
    goalsFor: 45,
    goalsAgainst: 39,
    goalDiff: 6,
    wins: 2,
    draws: 0,
    losses: 1,
  });
});

test('internal match analysis uses player ids without changing match records', () => {
  const analysis = matchAnalyses['internal-20261031'];
  expect(Object.keys(analysis.teamReviews.A.playerReviews)).toHaveLength(5);
  expect(Object.keys(analysis.teamReviews.B.playerReviews)).toHaveLength(6);
  expect(internalMatches[0]).toMatchObject({ teamScore: 22, opponentScore: 19 });
  expect(internalMatches[0].quarters[0]).toMatchObject({ for: 0, against: 0 });
  expect(internalMatches[0].quarters[1]).toMatchObject({ for: 0, against: 0 });
});

test('canonical names keep the existing player ids and records', () => {
  expect(seasonData.players.find((player) => player.id === 'p16')?.name).toBe('정연규');
  expect(seasonData.players.find((player) => player.id === 'p8')?.name).toBe('전대영');
  expect(seasonData.players.filter((player) => ['정연규', '전대영'].includes(player.name))).toHaveLength(2);
  expect(seasonData.matches.find((match) => match.id === '20261024')?.playerStats.p16).toMatchObject({ goals: 1, assists: 1 });
  expect(internalMatches[0].playerStats.p16).toMatchObject({ goals: 4, assists: 1 });
});

test('internal attendance affects only member match and attendance totals', () => {
  const rows = buildSeasonStats(seasonData);
  const rowsById = Object.fromEntries(rows.map((row) => [row.id, row]));
  const expectedMembers = {
    p1: { externalMatches: 3, matches: 4, externalAttendanceScore: 6, attendanceScore: 9 },
    p3: { externalMatches: 3, matches: 4, externalAttendanceScore: 8, attendanceScore: 11 },
    p4: { externalMatches: 3, matches: 4, externalAttendanceScore: 9, attendanceScore: 12 },
    p6: { externalMatches: 2, matches: 3, externalAttendanceScore: 2, attendanceScore: 3 },
    p7: { externalMatches: 2, matches: 3, externalAttendanceScore: 6, attendanceScore: 9 },
    p9: { externalMatches: 0, matches: 1, externalAttendanceScore: 0, attendanceScore: 3 },
    p10: { externalMatches: 0, matches: 1, externalAttendanceScore: 0, attendanceScore: 3 },
    p11: { externalMatches: 2, matches: 3, externalAttendanceScore: 4, attendanceScore: 5 },
  };

  Object.entries(expectedMembers).forEach(([playerId, expected]) => {
    expect(rowsById[playerId]).toMatchObject({ ...expected, internalMatches: 1 });
  });

  expect(rowsById.p16).toMatchObject({ internalMatches: 0, goals: 1, assists: 1 });
  expect(rowsById.p12.internalMatches).toBe(0);
  expect(rowsById.p4).toMatchObject({ goals: 6, assists: 3, points: 9, averageGoals: 2, averageAssists: 1, averagePoints: 3 });
});
