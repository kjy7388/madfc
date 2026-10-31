import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import InternalMatch, { createInitialInternalMatch, formatExportText, getActualTotals, getMatchTotals, getPlayerTotals } from './InternalMatch';

const players = [
  { id: 'p1', name: '김장엽', position: 'DF' },
  { id: 'p2', name: '박경민', position: 'DF' },
];

beforeEach(() => {
  window.localStorage.clear();
});

test('records each quarter independently and updates the total score', () => {
  render(<InternalMatch players={players} />);

  fireEvent.click(within(screen.getByText('김장엽').closest('.assignment-row')).getByText('A팀'));
  fireEvent.click(within(screen.getByText('박경민').closest('.assignment-row')).getByText('B팀'));
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));

  fireEvent.click(screen.getAllByRole('button', { name: '득점 추가' })[0]);
  expect(screen.getByLabelText('A팀 1 대 0 B팀')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /2Q/ }));
  fireEvent.click(screen.getAllByRole('button', { name: '득점 추가' })[1]);
  expect(screen.getByLabelText('A팀 1 대 1 B팀')).toBeInTheDocument();

  const firstQuarterButton = screen.getByRole('button', { name: /1Q/ });
  fireEvent.click(firstQuarterButton);
  expect(within(firstQuarterButton).getByText('1:0')).toBeInTheDocument();
});

test('never calculates a negative score', () => {
  const match = createInitialInternalMatch();
  expect(getMatchTotals(match.quarters)).toEqual({ A: 0, B: 0 });
});

test('restores an in-progress match from localStorage', async () => {
  const firstRender = render(<InternalMatch players={players} />);
  fireEvent.click(within(screen.getByText('김장엽').closest('.assignment-row')).getByText('A팀'));
  fireEvent.click(within(screen.getByText('박경민').closest('.assignment-row')).getByText('B팀'));
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  fireEvent.click(screen.getAllByRole('button', { name: '득점 추가' })[0]);

  await waitFor(() => expect(window.localStorage.getItem('madfc-internal-match-v1')).toContain('"goals":1'));
  firstRender.unmount();
  render(<InternalMatch players={players} />);

  expect(screen.getByLabelText('A팀 1 대 0 B팀')).toBeInTheDocument();
});

test('copies the complete match record after finishing', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<InternalMatch players={players} />);
  fireEvent.click(within(screen.getByText('김장엽').closest('.assignment-row')).getByText('A팀'));
  fireEvent.click(within(screen.getByText('박경민').closest('.assignment-row')).getByText('B팀'));
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  fireEvent.click(screen.getAllByRole('button', { name: '득점 추가' })[0]);
  fireEvent.click(screen.getByRole('button', { name: '결과 보기' }));
  fireEvent.click(screen.getByRole('button', { name: '전체 경기 기록 복사' }));

  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  const copied = writeText.mock.calls[0][0];
  expect(copied).toContain('[MAD FC 자체전 기록]');
  expect(copied).toContain('A팀 1 : 0 B팀');
  expect(copied).toContain('[8Q]');
});

test('excludes a quarter only from the match score and keeps player records', () => {
  const match = createInitialInternalMatch();
  match.quarters[0] = {
    ...match.quarters[0],
    initialized: true,
    scoreIncluded: false,
    rosters: { A: ['p1'], B: ['p2'] },
    stats: {
      p1: { team: 'A', goals: 5, assists: 2 },
      p2: { team: 'B', goals: 2, assists: 1 },
    },
  };
  match.quarters[1] = {
    ...match.quarters[1],
    initialized: true,
    rosters: { A: ['p1'], B: ['p2'] },
    stats: {
      p1: { team: 'A', goals: 2, assists: 0 },
      p2: { team: 'B', goals: 3, assists: 0 },
    },
  };

  expect(getMatchTotals(match.quarters)).toEqual({ A: 2, B: 3 });
  expect(getActualTotals(match.quarters)).toEqual({ A: 7, B: 5 });

  const copied = formatExportText(match, Object.fromEntries(players.map((player) => [player.id, player])));
  expect(copied).toContain('A팀 2 : 3 B팀');
  expect(copied).toContain('A팀 7골');
  expect(copied).toContain('1Q: A팀 5 - 2 B팀 (승부 스코어 제외)');
  expect(copied).toContain('김장엽: 7골 2도움');
});

test('toggles quarter score inclusion and saves it without deleting the quarter score', async () => {
  render(<InternalMatch players={players} />);
  fireEvent.click(within(screen.getByText('김장엽').closest('.assignment-row')).getByText('A팀'));
  fireEvent.click(within(screen.getByText('박경민').closest('.assignment-row')).getByText('B팀'));
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
  fireEvent.click(screen.getAllByRole('button', { name: '득점 추가' })[0]);
  fireEvent.click(screen.getByRole('button', { name: /스코어 반영 설정/ }));

  const firstQuarterToggle = screen.getByRole('switch', { name: '1쿼터 스코어 반영' });
  fireEvent.click(firstQuarterToggle);
  expect(screen.getByLabelText('A팀 0 대 0 B팀')).toBeInTheDocument();
  expect(within(screen.getByRole('button', { name: /1Q/ })).getByText('1:0')).toBeInTheDocument();
  await waitFor(() => expect(window.localStorage.getItem('madfc-internal-match-v1')).toContain('"scoreIncluded":false'));

  fireEvent.click(firstQuarterToggle);
  expect(screen.getByLabelText('A팀 1 대 0 B팀')).toBeInTheDocument();
});

test('treats legacy saved quarters without inclusion settings as enabled', () => {
  const legacyMatch = createInitialInternalMatch();
  legacyMatch.phase = 'running';
  legacyMatch.assignments = { p1: 'A', p2: 'B' };
  legacyMatch.quarters = legacyMatch.quarters.map((quarter, index) => {
    const { scoreIncluded, ...legacyQuarter } = quarter;
    return index === 0
      ? { ...legacyQuarter, initialized: true, rosters: { A: ['p1'], B: ['p2'] } }
      : legacyQuarter;
  });
  window.localStorage.setItem('madfc-internal-match-v1', JSON.stringify(legacyMatch));

  render(<InternalMatch players={players} />);
  fireEvent.click(screen.getByRole('button', { name: /스코어 반영 설정/ }));
  expect(screen.getAllByRole('switch').every((toggle) => toggle.getAttribute('aria-checked') === 'true')).toBe(true);
});

test('copies attendance to a new quarter and keeps it when returning', () => {
  render(<InternalMatch players={players} />);
  fireEvent.click(within(screen.getByText('김장엽').closest('.assignment-row')).getByText('A팀'));
  fireEvent.click(within(screen.getByText('박경민').closest('.assignment-row')).getByText('B팀'));
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));

  fireEvent.click(screen.getByRole('checkbox', { name: '김장엽 출전' }));
  fireEvent.click(screen.getByRole('button', { name: '다음 Q' }));
  expect(screen.getByRole('checkbox', { name: '김장엽 출전' })).toBeChecked();

  fireEvent.click(screen.getByRole('checkbox', { name: '김장엽 출전' }));
  fireEvent.click(screen.getByRole('button', { name: /1Q/ }));
  expect(screen.getByRole('checkbox', { name: '김장엽 출전' })).toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: /2Q/ }));
  expect(screen.getByRole('checkbox', { name: '김장엽 출전' })).not.toBeChecked();
});

test('adding a goal checks attendance and removing it keeps attendance checked', () => {
  render(<InternalMatch players={players} />);
  fireEvent.click(within(screen.getByText('김장엽').closest('.assignment-row')).getByText('A팀'));
  fireEvent.click(within(screen.getByText('박경민').closest('.assignment-row')).getByText('B팀'));
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));

  const attendance = screen.getByRole('checkbox', { name: '김장엽 출전' });
  fireEvent.click(screen.getAllByRole('button', { name: '득점 추가' })[0]);
  expect(attendance).toBeChecked();
  fireEvent.click(screen.getAllByRole('button', { name: '득점 취소' })[0]);
  expect(attendance).toBeChecked();
});

test('calculates appearances and plus-minus from actual quarter scores including excluded quarters', () => {
  const match = createInitialInternalMatch();
  match.quarters[0] = {
    ...match.quarters[0], initialized: true, scoreIncluded: false,
    rosters: { A: ['p1'], B: ['p2'] }, attendance: { p1: true, p2: true }, attendanceRecorded: true,
    stats: { p1: { team: 'A', goals: 3, assists: 0 }, p2: { team: 'B', goals: 1, assists: 0 } },
  };
  match.quarters[1] = {
    ...match.quarters[1], initialized: true,
    rosters: { A: ['p1'], B: ['p2'] }, attendance: { p1: true, p2: false }, attendanceRecorded: true,
    stats: { p1: { team: 'A', goals: 1, assists: 0 }, p2: { team: 'B', goals: 2, assists: 0 } },
  };

  const totals = getPlayerTotals(match.quarters);
  expect(totals.find((row) => row.playerId === 'p1')).toMatchObject({ appearances: 2, plusMinus: 1, attendanceKnown: true });
  expect(totals.find((row) => row.playerId === 'p2')).toMatchObject({ appearances: 1, plusMinus: -2, attendanceKnown: true });

  const copied = formatExportText(match, Object.fromEntries(players.map((player) => [player.id, player])));
  expect(copied).toContain('[쿼터별 출전 선수]');
  expect(copied).toContain('A팀: 김장엽');
  expect(copied).toContain('김장엽: 4골 0도움 / 2쿼터 출전 / 득실마진 +1');
});

test('keeps attendance unknown for legacy quarter data', () => {
  const match = createInitialInternalMatch();
  match.quarters[0] = {
    number: 1, initialized: true, scoreIncluded: true,
    rosters: { A: ['p1'], B: ['p2'] },
    stats: { p1: { team: 'A', goals: 1, assists: 0 }, p2: { team: 'B', goals: 0, assists: 0 } },
  };
  const copied = formatExportText(match, Object.fromEntries(players.map((player) => [player.id, player])));
  expect(copied).toContain('A팀: 출전 정보 미입력');
  expect(copied).toContain('김장엽: 1골 0도움 / 출전쿼터 — / 득실마진 —');
});
