import { fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';

test('renders the Mad FC report page', () => {
  render(<App />);
  expect(screen.getByRole('img', { name: /Mad FC/i })).toBeInTheDocument();
  expect(screen.getByText('전체 누적 스탯')).toBeInTheDocument();
});

test('renders collapsible internal match team reviews', () => {
  render(<App />);

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
  expect(screen.getAllByText('정연규').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: '용병 포함' }));
  expect(screen.getAllByText('전대영').length).toBeGreaterThan(0);
  expect(screen.queryByText(/^연규$/)).not.toBeInTheDocument();
  expect(screen.queryByText(/^대영$/)).not.toBeInTheDocument();
});
