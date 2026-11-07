export const DEFAULT_QUARTER_DURATION_SECONDS = 13 * 60;

const MAX_DURATION_SECONDS = 99 * 60 + 59;

export const clampDuration = (seconds) => {
  const parsed = Number(seconds);
  if (!Number.isFinite(parsed)) return DEFAULT_QUARTER_DURATION_SECONDS;
  return Math.min(MAX_DURATION_SECONDS, Math.max(0, Math.round(parsed)));
};

const createQuarterTimer = (durationSeconds) => ({
  durationSeconds,
  remainingSeconds: durationSeconds,
  running: false,
  endAt: null,
});

export const getTimerRemaining = (quarter, now = Date.now()) => {
  if (!quarter?.running || !quarter.endAt) {
    return Math.max(0, Number(quarter?.remainingSeconds) || 0);
  }
  return Math.max(0, Math.ceil((Number(quarter.endAt) - now) / 1000));
};

export const normalizeMatchTimer = (timer, quarterCount, now = Date.now()) => {
  const count = Math.max(1, Number(quarterCount) || 1);
  const defaultDurationSeconds = clampDuration(
    timer?.defaultDurationSeconds ?? DEFAULT_QUARTER_DURATION_SECONDS
  );
  const savedQuarters = Array.isArray(timer?.quarters) ? timer.quarters : [];
  const quarters = Array.from({ length: count }, (_, index) => {
    const saved = savedQuarters[index];
    if (!saved) return createQuarterTimer(defaultDurationSeconds);
    const durationSeconds = clampDuration(saved.durationSeconds ?? defaultDurationSeconds);
    const normalized = {
      durationSeconds,
      remainingSeconds: Math.min(
        durationSeconds,
        Math.max(0, Number(saved.remainingSeconds ?? durationSeconds) || 0)
      ),
      running: Boolean(saved.running && saved.endAt),
      endAt: saved.running && saved.endAt ? Number(saved.endAt) : null,
    };
    const remainingSeconds = getTimerRemaining(normalized, now);
    return {
      ...normalized,
      remainingSeconds,
      running: normalized.running && remainingSeconds > 0,
      endAt: normalized.running && remainingSeconds > 0 ? normalized.endAt : null,
    };
  });
  return { defaultDurationSeconds, quarters };
};

const updateQuarter = (timer, quarterIndex, updater, now = Date.now()) => {
  const normalized = normalizeMatchTimer(timer, timer?.quarters?.length || 1, now);
  return {
    ...normalized,
    quarters: normalized.quarters.map((quarter, index) =>
      index === quarterIndex ? updater(quarter) : quarter
    ),
  };
};

export const startQuarterTimer = (timer, quarterIndex, now = Date.now()) =>
  updateQuarter(timer, quarterIndex, (quarter) => {
    const remainingSeconds = getTimerRemaining(quarter, now);
    if (remainingSeconds <= 0) return { ...quarter, running: false, endAt: null };
    return {
      ...quarter,
      remainingSeconds,
      running: true,
      endAt: now + remainingSeconds * 1000,
    };
  }, now);

export const pauseQuarterTimer = (timer, quarterIndex, now = Date.now()) =>
  updateQuarter(timer, quarterIndex, (quarter) => ({
    ...quarter,
    remainingSeconds: getTimerRemaining(quarter, now),
    running: false,
    endAt: null,
  }), now);

export const resetQuarterTimer = (timer, quarterIndex, now = Date.now()) =>
  updateQuarter(timer, quarterIndex, (quarter) => ({
    ...quarter,
    remainingSeconds: quarter.durationSeconds,
    running: false,
    endAt: null,
  }), now);

export const setQuarterTimerDuration = (
  timer,
  quarterIndex,
  durationSeconds,
  now = Date.now()
) =>
  updateQuarter(timer, quarterIndex, (quarter) => {
    const duration = clampDuration(durationSeconds);
    return {
      ...quarter,
      durationSeconds: duration,
      remainingSeconds: duration,
      endAt: quarter.running ? now + duration * 1000 : null,
    };
  }, now);

export const setDefaultTimerDuration = (timer, durationSeconds, quarterCount) => {
  const duration = clampDuration(durationSeconds);
  const normalized = normalizeMatchTimer(timer, quarterCount);
  return {
    defaultDurationSeconds: duration,
    quarters: normalized.quarters.map(() => createQuarterTimer(duration)),
  };
};

export const stopExpiredQuarterTimer = (timer, quarterIndex, now = Date.now()) =>
  updateQuarter(timer, quarterIndex, (quarter) => {
    const remainingSeconds = getTimerRemaining(quarter, now);
    return remainingSeconds > 0
      ? { ...quarter, remainingSeconds }
      : { ...quarter, remainingSeconds: 0, running: false, endAt: null };
  }, now);

export const formatTimer = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(
    safeSeconds % 60
  ).padStart(2, '0')}`;
};
