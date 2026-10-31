import internalMatches from './internalMatches';
import { buildSummary, seasonData } from '../App';

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
