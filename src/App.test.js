import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Mad FC report page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: /Mad FC/i })).toBeInTheDocument();
  expect(screen.getByText('전체 누적 스탯')).toBeInTheDocument();
});
