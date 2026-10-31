const quarterData = [
  { label: '1쿼터', for: 0, against: 0, teamStats: { A: {}, B: {} } },
  { label: '2쿼터', for: 0, against: 0, teamStats: { A: {}, B: {} } },
  {
    label: '3쿼터', for: 4, against: 4,
    teamStats: {
      A: { p3: [1, 1], p12: [2, 1], p16: [1, 1] },
      B: { p13: [0, 1], p10: [3, 0], p6: [0, 2], p7: [1, 1] },
    },
  },
  {
    label: '4쿼터', for: 6, against: 3,
    teamStats: {
      A: { p1: [1, 4], p16: [2, 0], p3: [2, 2], p12: [1, 0] },
      B: { p9: [1, 0], p10: [2, 0], p13: [0, 1], p11: [0, 1] },
    },
  },
  {
    label: '5쿼터', for: 5, against: 3,
    teamStats: {
      A: { p3: [2, 2], p12: [0, 2], p1: [1, 0], p4: [1, 0], p16: [1, 0] },
      B: { p6: [0, 1], p11: [2, 0], p7: [1, 1], p13: [0, 1] },
    },
  },
  {
    label: '6쿼터', for: 0, against: 2,
    teamStats: {
      A: {},
      B: { p10: [1, 0], p13: [0, 1], p9: [1, 0], p6: [0, 1] },
    },
  },
  {
    label: '7쿼터', for: 1, against: 5,
    teamStats: {
      A: { p1: [0, 1], p12: [1, 0] },
      B: { p11: [2, 2], p6: [1, 2], p9: [0, 1], p13: [1, 0], p7: [1, 0] },
    },
  },
  {
    label: '8쿼터', for: 6, against: 2,
    teamStats: {
      A: { p1: [3, 0], p4: [1, 1], p12: [0, 1], p3: [2, 1] },
      B: { p11: [1, 1], p10: [1, 0], p9: [0, 1] },
    },
  },
];

const defaultTeams = {
  p1: 'A', p12: 'A', p4: 'A', p3: 'A', p16: 'A',
  p7: 'B', p9: 'B', p11: 'B', p13: 'B', p6: 'B', p10: 'B',
};

const attendanceRecords = {
  p1: { attended: true, attendanceStatus: 'present', attendanceScore: 3 },
  p3: { attended: true, attendanceStatus: 'present', attendanceScore: 3 },
  p4: { attended: true, attendanceStatus: 'present', attendanceScore: 3 },
  p6: { attended: true, attendanceStatus: 'late', attendanceScore: 1 },
  p7: { attended: true, attendanceStatus: 'present', attendanceScore: 3 },
  p9: { attended: true, attendanceStatus: 'present', attendanceScore: 3 },
  p10: { attended: true, attendanceStatus: 'present', attendanceScore: 3 },
  p11: { attended: true, attendanceStatus: 'late', attendanceScore: 1 },
};

function buildPlayerStats(quarters) {
  const stats = {};

  quarters.forEach((quarter) => {
    Object.entries(quarter.teamStats).forEach(([team, teamStats]) => {
      Object.entries(teamStats).forEach(([playerId, [goals, assists]]) => {
        const current = stats[playerId] ?? { team: defaultTeams[playerId] ?? team, goals: 0, assists: 0 };
        current.goals += goals;
        current.assists += assists;
        stats[playerId] = current;
      });
    });
  });

  Object.entries(defaultTeams).forEach(([playerId, team]) => {
    stats[playerId] ??= { team, goals: 0, assists: 0 };
  });

  Object.entries(attendanceRecords).forEach(([playerId, attendance]) => {
    stats[playerId] = { ...stats[playerId], ...attendance };
  });

  return stats;
}

const internalMatches = [
  {
    id: 'internal-20261031',
    matchType: 'internal',
    date: '2026-10-31',
    venue: '용산',
    title: 'MAD FC 자체전',
    teamA: 'MAD FC A팀',
    teamB: 'MAD FC B팀',
    opponent: 'MAD FC B팀',
    teamScore: 22,
    opponentScore: 19,
    defaultTeams,
    teamOverrides: {},
    playerOrder: ['p1', 'p12', 'p4', 'p3', 'p16', 'p7', 'p9', 'p11', 'p13', 'p6', 'p10'],
    quarters: quarterData.map((quarter) => ({
      ...quarter,
      cumulativeScore: `${quarter.for}:${quarter.against}`,
      attendanceKnown: false,
    })),
    playerStats: buildPlayerStats(quarterData),
  },
];

export default internalMatches;
