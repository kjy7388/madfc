import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Scoreboard from './Scoreboard';

const players = [
  { id: 'p1', name: '김장엽', position: 'DF' },
  { id: 'p2', name: '박경민', position: 'DF' },
];

beforeEach(() => {
  window.localStorage.clear();
  document.body.style.overflow = '';
});

test('shows the selected scoreboard guide and preserves internal match storage', async () => {
  render(<Scoreboard players={players} />);
  await waitFor(() => expect(window.localStorage.getItem('madfc-internal-match-v1')).toBeTruthy());
  const storedMatch = window.localStorage.getItem('madfc-internal-match-v1');
  const guideButton = screen.getByRole('button', { name: 'ⓘ 사용 가이드' });

  guideButton.focus();
  fireEvent.click(guideButton);

  const dialog = screen.getByRole('dialog', { name: '자체전 스코어보드 사용 가이드' });
  const stepButtons = within(dialog).getAllByRole('button', { name: /STEP [1-6]/ });
  expect(stepButtons).toHaveLength(6);
  stepButtons.forEach((button) => expect(button).toHaveAttribute('aria-expanded', 'false'));

  const scoreStep = within(dialog).getByRole('button', { name: /STEP 5.*쿼터 전환 및 점수 관리/ });
  fireEvent.click(scoreStep);
  expect(scoreStep).toHaveAttribute('aria-expanded', 'true');
  expect(within(dialog).getByText(/스코어 반영 여부/)).toBeInTheDocument();
  expect(within(dialog).getByText('스코어 예시')).toBeInTheDocument();
  expect(within(dialog).getByText('쿼터별 점수 반영 설정')).toBeInTheDocument();
  expect(within(dialog).getAllByText('OFF')).toHaveLength(2);

  const recordStep = within(dialog).getByRole('button', { name: /STEP 4.*골·어시스트 기록/ });
  fireEvent.click(recordStep);
  expect(recordStep).toHaveAttribute('aria-expanded', 'true');
  expect(scoreStep).toHaveAttribute('aria-expanded', 'false');
  expect(within(dialog).getByLabelText('자체전 원터치 기록 예시')).toBeInTheDocument();
  expect(within(dialog).getByText('기록 예시')).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: /STEP 6.*경기 결과 및 복사/ }));
  expect(within(dialog).getByRole('button', { name: '전체 경기 기록 복사' })).toBeDisabled();
  expect(document.body.style.overflow).toBe('hidden');
  expect(window.localStorage.getItem('madfc-internal-match-v1')).toBe(storedMatch);

  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe('');
  expect(guideButton).toHaveFocus();
  expect(window.localStorage.getItem('madfc-internal-match-v1')).toBe(storedMatch);

  fireEvent.click(guideButton);
  within(screen.getByRole('dialog')).getAllByRole('button', { name: /STEP [1-6]/ }).forEach((button) => expect(button).toHaveAttribute('aria-expanded', 'false'));
});

test('shows external match instructions and closes on the backdrop', () => {
  render(<Scoreboard players={players} />);
  fireEvent.click(screen.getByRole('tab', { name: '상대전' }));
  fireEvent.click(screen.getByRole('button', { name: 'ⓘ 사용 가이드' }));

  const dialog = screen.getByRole('dialog', { name: '상대전 스코어보드 사용 가이드' });
  expect(within(dialog).getAllByRole('button', { name: /STEP [1-6]/ })).toHaveLength(6);
  fireEvent.click(within(dialog).getByRole('button', { name: /STEP 1.*경기 정보 입력/ }));
  expect(within(dialog).getByText('입력 예시')).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: /STEP 4.*득점·실점 기록/ }));
  expect(within(dialog).getByText(/MAD FC 득점 \+/)).toBeInTheDocument();
  expect(within(dialog).getByText(/상대팀 득점 \+/)).toBeInTheDocument();
  expect(within(dialog).getByText(/실점 자동 기록/)).toBeInTheDocument();
  expect(within(dialog).getByText('득점 선수')).toBeInTheDocument();
  expect(within(dialog).getByText('어시스트')).toBeInTheDocument();
  expect(within(dialog).getByText(/어시스트가 없으면 없음 선택/)).toBeInTheDocument();
  expect(within(dialog).getByLabelText('상대전 득점 실점 기록 예시')).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole('button', { name: /STEP 6.*경기 결과 및 복사/ }));
  expect(within(dialog).getByRole('button', { name: '전체 상대전 기록 복사' })).toBeDisabled();

  fireEvent.mouseDown(document.querySelector('.scoreboard-guide-overlay'));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
