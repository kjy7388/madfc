import { useCallback, useEffect, useState } from 'react';
import InternalMatch from './InternalMatch';
import ExternalMatch from './ExternalMatch';
import ScoreboardGuideModal from './ScoreboardGuideModal';
import './scoreboard.css';

const MODE_KEY = 'madfc-scoreboard-mode-v1';

export default function Scoreboard({ players }) {
  const [mode, setMode] = useState(() => window.localStorage.getItem(MODE_KEY) || 'internal');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const closeGuide = useCallback(() => setIsGuideOpen(false), []);

  useEffect(() => {
    window.localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  const modeSwitcher = (
    <div className="scoreboard-controls">
      <div className="scoreboard-mode-tabs" role="tablist" aria-label="스코어보드 경기 유형">
        <button type="button" role="tab" aria-selected={mode === 'internal'} className={mode === 'internal' ? 'active' : ''} onClick={() => setMode('internal')}>자체전</button>
        <button type="button" role="tab" aria-selected={mode === 'external'} className={mode === 'external' ? 'active' : ''} onClick={() => setMode('external')}>상대전</button>
      </div>
      <button className="scoreboard-guide-button" type="button" onClick={() => setIsGuideOpen(true)}>ⓘ 사용 가이드</button>
    </div>
  );

  return (
    <>
      {mode === 'internal'
        ? <InternalMatch players={players} modeSwitcher={modeSwitcher} />
        : <ExternalMatch players={players} modeSwitcher={modeSwitcher} />}
      <ScoreboardGuideModal isOpen={isGuideOpen} matchType={mode} onClose={closeGuide} />
    </>
  );
}
