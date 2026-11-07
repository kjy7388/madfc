import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import QuarterTimer, { TimerDurationInput } from './QuarterTimer';
import { normalizeMatchTimer } from './quarterTimerState';

function TimerHarness({ initialTimer }) {
  const [timer, setTimer] = useState(initialTimer);
  return <QuarterTimer timer={timer} quarterIndex={0} onChange={setTimer} />;
}

function DurationHarness({ initialSeconds = 780, inline = false }) {
  const [duration, setDuration] = useState(initialSeconds);
  return (
    <>
      <TimerDurationInput durationSeconds={duration} onChange={setDuration} inline={inline} />
      <output data-testid="duration-value">{duration}</output>
    </>
  );
}

function pausedTimer(seconds = 32) {
  const timer = normalizeMatchTimer(null, 1, 0);
  timer.quarters[0] = {
    ...timer.quarters[0],
    remainingSeconds: seconds,
  };
  return timer;
}

describe('QuarterTimer rendering', () => {
  let now;
  let dateNow;

  beforeEach(() => {
    jest.useFakeTimers();
    now = 1000;
    dateNow = jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    dateNow.mockRestore();
    jest.useRealTimers();
  });

  test('does not flash an old or default value when starting from 00:32', () => {
    render(<TimerHarness initialTimer={pausedTimer(32)} />);
    expect(screen.getByText('00:32')).toBeInTheDocument();

    now = 600000;
    fireEvent.click(screen.getByRole('button', { name: '시작' }));

    expect(screen.getByText('00:32')).toBeInTheDocument();
    expect(screen.queryByText('13:00')).not.toBeInTheDocument();

    now += 1000;
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByText('00:31')).toBeInTheDocument();
  });

  test('keeps the visible value stable through repeated pause and restart actions', () => {
    render(<TimerHarness initialTimer={pausedTimer(32)} />);

    for (let index = 0; index < 10; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: '시작' }));
      expect(screen.getByText('00:32')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '일시정지' }));
      expect(screen.getByText('00:32')).toBeInTheDocument();
      now += 5000;
    }
  });

  test('preserves a paused value after remounting from saved timer state', () => {
    const savedTimer = pausedTimer(32);
    const { unmount } = render(<TimerHarness initialTimer={savedTimer} />);
    expect(screen.getByText('00:32')).toBeInTheDocument();
    unmount();

    now += 120000;
    render(<TimerHarness initialTimer={savedTimer} />);
    expect(screen.getByText('00:32')).toBeInTheDocument();
  });

  test('allows clearing and replacing minutes without inserting a leading zero', () => {
    render(<DurationHarness />);
    const minutes = screen.getByLabelText('기본 쿼터 시간 분');

    fireEvent.change(minutes, { target: { value: '' } });
    expect(minutes).toHaveValue('');
    expect(screen.getByTestId('duration-value')).toHaveTextContent('780');

    fireEvent.change(minutes, { target: { value: '12' } });
    expect(minutes).toHaveValue('12');
    fireEvent.blur(minutes);

    expect(minutes).toHaveValue('12');
    expect(screen.getByTestId('duration-value')).toHaveTextContent('720');
  });

  test('removes unnecessary leading zeros and commits only on blur', () => {
    render(<DurationHarness initialSeconds={0} inline />);
    const minutes = screen.getByLabelText('기본 쿼터 시간 분');

    fireEvent.change(minutes, { target: { value: '' } });
    fireEvent.change(minutes, { target: { value: '05' } });
    expect(minutes).toHaveValue('5');
    expect(screen.getByTestId('duration-value')).toHaveTextContent('0');

    fireEvent.blur(minutes);
    expect(screen.getByTestId('duration-value')).toHaveTextContent('300');
  });

  test('clamps seconds and treats an empty committed value as zero', () => {
    render(<DurationHarness initialSeconds={30} />);
    const seconds = screen.getByLabelText('기본 쿼터 시간 초');

    fireEvent.change(seconds, { target: { value: '' } });
    expect(seconds).toHaveValue('');
    fireEvent.change(seconds, { target: { value: '60' } });
    fireEvent.blur(seconds);
    expect(seconds).toHaveValue('59');
    expect(screen.getByTestId('duration-value')).toHaveTextContent('59');

    fireEvent.change(seconds, { target: { value: '' } });
    fireEvent.blur(seconds);
    expect(seconds).toHaveValue('0');
    expect(screen.getByTestId('duration-value')).toHaveTextContent('0');
  });

  test('keeps the timer stopped when the configured duration is 00:00', () => {
    const timer = normalizeMatchTimer({
      defaultDurationSeconds: 0,
      quarters: [{ durationSeconds: 0, remainingSeconds: 0, running: false, endAt: null }],
    }, 1);
    render(<TimerHarness initialTimer={timer} />);

    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '시작' })).toBeDisabled();
  });
});
