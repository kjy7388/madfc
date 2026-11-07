import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

test('renders the Mad FC report page', () => {
  render(<App />);
  expect(screen.getByRole('img', { name: /Mad FC/i })).toBeInTheDocument();
  expect(screen.getByText('전체 누적 스탯')).toBeInTheDocument();
});

test('renders collapsible internal match team reviews', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('경기일정'), { target: { value: 'internal-20261031' } });

  expect(screen.getByText('개인 기량과 조직력의 맞대결')).toBeInTheDocument();
  expect(screen.getByText('개인 역량으로 승리했지만, 전술적 대응은 숙제로 남았다.')).toBeInTheDocument();
  expect(screen.getByText('초반의 위축을 극복하고, 조직력으로 역전까지 만들어냈다.')).toBeInTheDocument();

  const aToggle = screen.getByRole('button', { name: /A팀 선수별 평가 펼치기/ });
  expect(screen.queryByText(/후방에서 수비의 중심을 잡고 공격 방향을 전환했으며/)).not.toBeInTheDocument();
  fireEvent.click(aToggle);
  const aCard = aToggle.closest('.internal-team-review-card');
  expect(within(aCard).getAllByRole('article')).toHaveLength(5);
  expect(within(aCard).getByText('2골 · 1도움')).toBeInTheDocument();

  const bToggle = screen.getByRole('button', { name: /B팀 선수별 평가 펼치기/ });
  fireEvent.click(bToggle);
  const bCard = bToggle.closest('.internal-team-review-card');
  expect(within(bCard).getAllByRole('article')).toHaveLength(6);
  expect(within(bCard).getByText('7골 · 0도움')).toBeInTheDocument();
});

test('uses canonical player names without creating duplicate players', () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText('경기일정'), { target: { value: 'internal-20261031' } });
  expect(screen.getAllByText('정연규').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: '용병 포함' }));
  expect(screen.getAllByText('전대영').length).toBeGreaterThan(0);
  expect(screen.queryByText(/^연규$/)).not.toBeInTheDocument();
  expect(screen.queryByText(/^대영$/)).not.toBeInTheDocument();
});

test('opens and closes the cumulative stats policy dialog', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'ⓘ 통계 기준' }));
  expect(screen.getByRole('dialog', { name: 'MAD FC 누적 스탯 반영 기준' })).toBeInTheDocument();
  expect(screen.getByText('정상출석: 3점')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(screen.queryByRole('dialog', { name: 'MAD FC 누적 스탯 반영 기준' })).not.toBeInTheDocument();
});

test('renders the 2026-11-07 Samil FC detail and analysis', () => {
  render(<App />);

  fireEvent.change(screen.getByLabelText('경기일정'), { target: { value: '20261107' } });
  expect(screen.getByText('Mad FC vs 삼일FC')).toBeInTheDocument();
  expect(screen.getByText(/최종 스코어 20 : 12/)).toBeInTheDocument();
  expect(screen.getAllByText(/GK ·/)).toHaveLength(8);

  fireEvent.click(screen.getByRole('button', { name: '경기 분석' }));
  expect(screen.getByText('11월 7일 삼일FC전 총평')).toBeInTheDocument();
  expect(screen.getByText('삼일FC와의 다음 경기 운영 방향')).toBeInTheDocument();
  expect(screen.getAllByText(/득실마진/).length).toBeGreaterThanOrEqual(7);
});

test('defaults match detail to the latest registered match', () => {
  render(<App />);

  const matchSelect = screen.getByLabelText('경기일정');
  expect(matchSelect).toHaveValue('20261107');
  expect(screen.getByText('Mad FC vs 삼일FC')).toBeInTheDocument();

  const optionValues = within(matchSelect)
    .getAllByRole('option')
    .map((option) => option.value);
  expect(optionValues[0]).toBe('20261107');
});

test('shows up to five official recent matches from newest to oldest', () => {
  const { container } = render(<App />);
  const recentButtons = [...container.querySelectorAll('.mobile-recent-form .form-chip')];

  expect(recentButtons).toHaveLength(4);
  expect(recentButtons.map((button) => button.getAttribute('aria-label'))).toEqual([
    expect.stringContaining('11월 7일'),
    expect.stringContaining('10월 24일'),
    expect.stringContaining('10월 3일'),
    expect.stringContaining('9월 5일'),
  ]);
});
