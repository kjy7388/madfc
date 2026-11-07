import {
  formatTimer,
  getTimerRemaining,
  normalizeMatchTimer,
  pauseQuarterTimer,
  resetQuarterTimer,
  setQuarterTimerDuration,
  startQuarterTimer,
} from './quarterTimerState';

test('creates independent 13 minute timers for every quarter', () => {
  const timer = normalizeMatchTimer(null, 8, 1000);
  expect(timer.defaultDurationSeconds).toBe(780);
  expect(timer.quarters).toHaveLength(8);
  expect(timer.quarters.every((quarter) => quarter.remainingSeconds === 780)).toBe(true);
});

test('accepts a zero duration while preventing the timer from running', () => {
  const timer = normalizeMatchTimer({
    defaultDurationSeconds: 0,
    quarters: [{ durationSeconds: 0, remainingSeconds: 0, running: false, endAt: null }],
  }, 1, 1000);
  const started = startQuarterTimer(timer, 0, 1000);

  expect(timer.quarters[0].durationSeconds).toBe(0);
  expect(started.quarters[0]).toMatchObject({ remainingSeconds: 0, running: false, endAt: null });
});

test('uses the real end time to restore a running timer', () => {
  const started = startQuarterTimer(normalizeMatchTimer(null, 2, 1000), 0, 1000);
  expect(started.quarters[0].endAt).toBe(781000);
  expect(getTimerRemaining(started.quarters[0], 61000)).toBe(720);

  const restored = normalizeMatchTimer(started, 2, 121000);
  expect(restored.quarters[0].remainingSeconds).toBe(660);
  expect(restored.quarters[0].running).toBe(true);
});

test('stops an expired timer at zero and never goes negative', () => {
  const started = startQuarterTimer(normalizeMatchTimer(null, 1, 0), 0, 0);
  const restored = normalizeMatchTimer(started, 1, 900000);
  expect(restored.quarters[0]).toMatchObject({
    remainingSeconds: 0,
    running: false,
    endAt: null,
  });
  expect(formatTimer(-10)).toBe('00:00');
});

test('pauses, changes and resets only the selected quarter', () => {
  const timer = startQuarterTimer(normalizeMatchTimer(null, 2, 1000), 0, 1000);
  const paused = pauseQuarterTimer(timer, 0, 11000);
  expect(paused.quarters[0].remainingSeconds).toBe(770);
  expect(paused.quarters[1].remainingSeconds).toBe(780);

  const changed = setQuarterTimerDuration(paused, 0, 600, 11000);
  expect(changed.quarters[0].remainingSeconds).toBe(600);
  expect(changed.quarters[1].remainingSeconds).toBe(780);

  const reset = resetQuarterTimer(changed, 0, 11000);
  expect(reset.quarters[0]).toMatchObject({ remainingSeconds: 600, running: false });
});
