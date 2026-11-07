import { useEffect, useState } from 'react';
import {
  formatTimer,
  getTimerRemaining,
  pauseQuarterTimer,
  resetQuarterTimer,
  setQuarterTimerDuration,
  startQuarterTimer,
  stopExpiredQuarterTimer,
} from './quarterTimerState';
import './quarter-timer.css';

const sanitizeTimeDraft = (value) =>
  String(value).replace(/\D/g, '').replace(/^0+(?=\d)/, '');

const normalizeTimePart = (value, max) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || value === '') return 0;
  return Math.min(max, Math.max(0, Math.floor(parsed)));
};

const selectInputValue = (event) => event.currentTarget.select();

export function TimerDurationInput({ durationSeconds, onChange, className = '', inline = false }) {
  const [minutes, setMinutes] = useState(String(Math.floor(durationSeconds / 60)));
  const [seconds, setSeconds] = useState(String(durationSeconds % 60));

  useEffect(() => {
    setMinutes(String(Math.floor(durationSeconds / 60)));
    setSeconds(String(durationSeconds % 60));
  }, [durationSeconds]);

  const commit = (nextMinutes = minutes, nextSeconds = seconds) => {
    const validMinutes = normalizeTimePart(nextMinutes, 99);
    const validSeconds = normalizeTimePart(nextSeconds, 59);
    setMinutes(String(validMinutes));
    setSeconds(String(validSeconds));
    onChange(validMinutes * 60 + validSeconds);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.blur();
    }
  };

  const minuteInput = (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={minutes}
      onFocus={selectInputValue}
      onChange={(event) => setMinutes(sanitizeTimeDraft(event.target.value))}
      onBlur={() => commit(minutes, seconds)}
      onKeyDown={handleKeyDown}
      aria-label="기본 쿼터 시간 분"
    />
  );
  const secondInput = (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={seconds}
      onFocus={selectInputValue}
      onChange={(event) => setSeconds(sanitizeTimeDraft(event.target.value))}
      onBlur={() => commit(minutes, seconds)}
      onKeyDown={handleKeyDown}
      aria-label="기본 쿼터 시간 초"
    />
  );

  if (inline) {
    return (
      <div className={`timer-duration-inline ${className}`.trim()}>
        <span className="timer-duration-title">기본 쿼터 시간</span>
        <div className="timer-duration-inline-fields">
          <label>{minuteInput}<span>분</span></label>
          <label>{secondInput}<span>초</span></label>
        </div>
      </div>
    );
  }

  return (
    <fieldset className={`timer-duration-input ${className}`.trim()}>
      <legend>기본 쿼터 시간</legend>
      <label>{minuteInput}분</label>
      <label>{secondInput}초</label>
    </fieldset>
  );
}

function TimerSettings({ quarter, onSave, onClose }) {
  const [minutes, setMinutes] = useState(String(Math.floor(quarter.remainingSeconds / 60)));
  const [seconds, setSeconds] = useState(String(quarter.remainingSeconds % 60));
  const save = () => {
    const validMinutes = normalizeTimePart(minutes, 99);
    const validSeconds = normalizeTimePart(seconds, 59);
    setMinutes(String(validMinutes));
    setSeconds(String(validSeconds));
    onSave(validMinutes * 60 + validSeconds);
    onClose();
  };
  const normalizeDraft = () => {
    setMinutes(String(normalizeTimePart(minutes, 99)));
    setSeconds(String(normalizeTimePart(seconds, 59)));
  };
  const handleSettingsKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      save();
    }
  };

  return (
    <div className="quarter-timer-settings" role="dialog" aria-label="현재 쿼터 시간 설정">
      <div className="quarter-timer-settings-fields">
        <label><input type="text" inputMode="numeric" pattern="[0-9]*" value={minutes} onFocus={selectInputValue} onChange={(event) => setMinutes(sanitizeTimeDraft(event.target.value))} onBlur={normalizeDraft} onKeyDown={handleSettingsKeyDown} aria-label="현재 쿼터 시간 분" />분</label>
        <label><input type="text" inputMode="numeric" pattern="[0-9]*" value={seconds} onFocus={selectInputValue} onChange={(event) => setSeconds(sanitizeTimeDraft(event.target.value))} onBlur={normalizeDraft} onKeyDown={handleSettingsKeyDown} aria-label="현재 쿼터 시간 초" />초</label>
      </div>
      <div className="quarter-timer-settings-actions">
        <button type="button" onClick={() => setMinutes((value) => Math.max(0, Number(value) - 1))}>-1분</button>
        <button type="button" onClick={() => setMinutes((value) => Math.min(99, Number(value) + 1))}>+1분</button>
        <button type="button" className="is-primary" onClick={save}>적용</button>
        <button type="button" onClick={onClose}>취소</button>
      </div>
    </div>
  );
}

export default function QuarterTimer({ timer, quarterIndex, onChange }) {
  const [now, setNow] = useState(Date.now());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const quarter = timer.quarters[quarterIndex];
  const remaining = getTimerRemaining(quarter, now);

  useEffect(() => {
    if (!quarter?.running) return undefined;
    const intervalId = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(intervalId);
  }, [quarter?.running, quarter?.endAt]);

  useEffect(() => {
    if (quarter?.running && remaining <= 0) {
      onChange((current) => stopExpiredQuarterTimer(current, quarterIndex));
    }
  }, [onChange, quarter?.running, quarterIndex, remaining]);

  useEffect(() => {
    setSettingsOpen(false);
    setNow(Date.now());
  }, [quarterIndex]);

  const urgency = remaining === 0
    ? 'is-ended'
    : remaining <= 10
      ? 'is-danger'
      : remaining <= 60
        ? 'is-warning'
        : '';

  const toggleTimer = () => {
    const actionTime = Date.now();
    setNow(actionTime);
    onChange((current) =>
      quarter.running
        ? pauseQuarterTimer(current, quarterIndex, actionTime)
        : startQuarterTimer(current, quarterIndex, actionTime)
    );
  };

  const resetTimer = () => {
    const actionTime = Date.now();
    setNow(actionTime);
    onChange((current) => resetQuarterTimer(current, quarterIndex, actionTime));
  };

  const saveDuration = (seconds) => {
    const actionTime = Date.now();
    setNow(actionTime);
    onChange((current) =>
      setQuarterTimerDuration(current, quarterIndex, seconds, actionTime)
    );
  };

  return (
    <section className="quarter-timer" aria-label={`${quarterIndex + 1}쿼터 타이머`}>
      <p className="quarter-timer-label">{quarterIndex + 1}Q 남은 시간</p>
      <strong className={`quarter-timer-display ${urgency}`.trim()} aria-live="polite">{formatTimer(remaining)}</strong>
      {remaining === 0 && <span className="quarter-timer-ended">종료</span>}
      <div className="quarter-timer-controls">
        <button
          type="button"
          className="is-primary"
          onClick={toggleTimer}
          disabled={remaining <= 0 && !quarter.running}
        >
          {quarter.running ? '일시정지' : '시작'}
        </button>
        <button type="button" onClick={resetTimer}>초기화</button>
        <button type="button" onClick={() => setSettingsOpen((open) => !open)}>시간 설정</button>
      </div>
      {settingsOpen && (
        <TimerSettings
          quarter={{ ...quarter, remainingSeconds: remaining }}
          onSave={saveDuration}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </section>
  );
}
