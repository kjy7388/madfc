import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ExternalMatch, {
  createInitialExternalMatch,
  EXTERNAL_STORAGE_KEY,
  formatExternalExportText,
  getExternalPlayerTotals,
  getExternalQuarterScore,
  getExternalTotals,
} from './ExternalMatch';

const players = [
  { id: 'p1', name: '김장엽', position: 'DF' },
  { id: 'p2', name: '박경민', position: 'DF' },
  { id: 'p3', name: '용병A', position: 'FW', guest: true },
];

beforeEach(() => {
  window.localStorage.clear();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(window, 'confirm').mockImplementation(() => true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

function configureAndStart() {
  render(<ExternalMatch players={players} />);
  fireEvent.change(screen.getByLabelText('상대팀 이름'), { target: { value: '테스트 FC' } });
  const jangRow = screen.getByText('김장엽').closest('.external-attendance-row');
  const parkRow = screen.getByText('박경민').closest('.external-attendance-row');
  fireEvent.change(within(jangRow).getByRole('combobox'), { target: { value: 'present' } });
  fireEvent.change(within(parkRow).getByRole('combobox'), { target: { value: 'late' } });
  fireEvent.click(screen.getByRole('button', { name: '경기 시작' }));
}

function getLineupRow(playerName) {
  return within(document.querySelector('.external-lineup-list')).getByText(playerName).closest('.external-lineup-row');
}

test('records ordered goal events and recalculates score with undo', () => {
  configureAndStart();
  fireEvent.click(within(getLineupRow('김장엽')).getByRole('checkbox'));
  fireEvent.click(within(getLineupRow('박경민')).getByRole('checkbox'));

  fireEvent.click(screen.getByRole('button', { name: 'MAD FC 득점 +' }));
  fireEvent.change(screen.getByLabelText('득점 선수'), { target: { value: 'p1' } });
  fireEvent.change(screen.getByLabelText('어시스트'), { target: { value: 'p2' } });
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
  fireEvent.click(screen.getByRole('button', { name: '테스트 FC 득점 +' }));

  expect(screen.getByLabelText('MAD FC 1 대 1 테스트 FC')).toBeInTheDocument();
  expect(screen.getByText('김장엽 득점 / 박경민 도움')).toBeInTheDocument();
  expect(screen.getByText('실점')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '실행 취소' }));
  expect(screen.getByLabelText('MAD FC 1 대 0 테스트 FC')).toBeInTheDocument();
});

test('copies lineup and goalkeeper only when entering a new quarter', () => {
  configureAndStart();
  const jangRow = getLineupRow('김장엽');
  fireEvent.click(within(jangRow).getByRole('checkbox'));
  fireEvent.change(screen.getByLabelText('골키퍼'), { target: { value: 'p1' } });
  fireEvent.click(screen.getByRole('button', { name: '다음 Q' }));

  expect(within(getLineupRow('김장엽')).getByRole('checkbox')).toBeChecked();
  expect(screen.getByLabelText('골키퍼')).toHaveValue('p1');

  fireEvent.click(within(getLineupRow('김장엽')).getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: /1Q/ }));
  expect(within(getLineupRow('김장엽')).getByRole('checkbox')).toBeChecked();
});

test('calculates event stats, appearances, plus-minus and goalkeeper quarters', () => {
  const match = createInitialExternalMatch();
  match.opponent = '테스트 FC';
  match.attendance = { p1: 'present', p2: 'late' };
  match.quarters[0] = { ...match.quarters[0], initialized: true, lineupRecorded: true, lineup: { p1: true, p2: true }, goalkeeperId: 'p2' };
  match.quarters[1] = { ...match.quarters[1], initialized: true, lineupRecorded: true, lineup: { p1: true, p2: false }, goalkeeperId: null };
  match.events = [
    { id: 'e1', quarter: 1, sequence: 1, team: 'MAD', type: 'goal', scorerId: 'p1', assistId: 'p2' },
    { id: 'e2', quarter: 1, sequence: 2, team: 'OPPONENT', type: 'goal', scorerId: null, assistId: null },
    { id: 'e3', quarter: 2, sequence: 3, team: 'MAD', type: 'goal', scorerId: 'p1', assistId: null },
  ];
  const playerMap = Object.fromEntries(players.map((player) => [player.id, player]));
  const rows = Object.fromEntries(getExternalPlayerTotals(match, playerMap).map((row) => [row.playerId, row]));

  expect(getExternalQuarterScore(match, 1)).toEqual({ mad: 1, opponent: 1 });
  expect(getExternalTotals(match)).toEqual({ mad: 2, opponent: 1 });
  expect(rows.p1).toMatchObject({ goals: 2, assists: 0, appearances: 2, plusMinus: 1, goalkeeperQuarters: 0 });
  expect(rows.p2).toMatchObject({ goals: 0, assists: 1, appearances: 1, plusMinus: 0, goalkeeperQuarters: 1 });

  const copied = formatExternalExportText(match, playerMap);
  expect(copied).toContain('MAD FC 2 : 1 테스트 FC');
  expect(copied).toContain('1. 김장엽 득점 / 박경민 도움');
  expect(copied).toContain('2. 실점');
  expect(copied).not.toContain('상대팀 득점');
  expect(copied).toContain('김장엽: 2골 0도움 2P / 2쿼터 / 득실마진 +1');
  expect(copied).toContain('박경민: 0골 1도움 1P / 1쿼터 / 득실마진 0 / GK 1쿼터 / 지각 / 1점');
});

test('separates and sorts members and guests while simplifying legacy guest attendance', () => {
  const match = createInitialExternalMatch();
  match.attendance = { p3: 'late' };
  window.localStorage.setItem(EXTERNAL_STORAGE_KEY, JSON.stringify(match));
  const mixedPlayers = [
    { id: 'p2', name: '박경민' },
    { id: 'g2', name: '황훈식', guest: true },
    { id: 'p1', name: '고유순' },
    { id: 'p3', name: '용병A', guest: true },
    { id: 'g1', name: '류경상', guest: true },
  ];

  render(<ExternalMatch players={mixedPlayers} />);

  const memberGroup = screen.getByRole('heading', { name: '정규 멤버' }).closest('.attendance-group');
  const guestGroup = screen.getByRole('heading', { name: '용병' }).closest('.attendance-group');
  expect([...memberGroup.querySelectorAll('.external-attendance-row > span')].map((node) => node.textContent)).toEqual(['고유순', '박경민']);
  expect([...guestGroup.querySelectorAll('.external-attendance-row > span')].map((node) => node.firstChild.textContent)).toEqual(['류경상', '용병A', '황훈식']);

  const guestSelect = screen.getByLabelText('용병A 출석 상태');
  expect(guestSelect).toHaveValue('present');
  expect([...guestSelect.options].map((option) => option.text)).toEqual(['미선택', '출석']);
  expect(screen.queryByLabelText('쿼터당 시간(선택)')).not.toBeInTheDocument();
});

test('saves external match separately without touching internal match storage', async () => {
  window.localStorage.setItem('madfc-internal-match-v1', '{"preserved":true}');
  configureAndStart();
  fireEvent.click(within(getLineupRow('김장엽')).getByRole('checkbox'));

  await waitFor(() => expect(window.localStorage.getItem(EXTERNAL_STORAGE_KEY)).toContain('"opponent":"테스트 FC"'));
  expect(window.localStorage.getItem('madfc-internal-match-v1')).toBe('{"preserved":true}');
});
