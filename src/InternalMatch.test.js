import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import InternalMatch, { createInitialInternalMatch, getMatchTotals } from './InternalMatch';

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
