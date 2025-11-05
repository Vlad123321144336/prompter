import { memo } from 'react';

interface TopBarProps {
  elapsedTime: string;
  remainingTime: string;
  progress: number;
  onNewScript: () => void;
}

const TopBar = memo(function TopBar({ elapsedTime, remainingTime, progress, onNewScript }: TopBarProps) {
  return (
    <header className="top-bar">
      <button className="top-bar__button top-bar__button--disabled" type="button" disabled>
        My Scripts
      </button>
      <div className="top-bar__timers">
        <span className="top-bar__time">{elapsedTime}</span>
        <div className="top-bar__progress">
          <div className="top-bar__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="top-bar__time top-bar__time--muted">{remainingTime}</span>
      </div>
      <button className="top-bar__button" type="button" onClick={onNewScript}>
        New Script
      </button>
    </header>
  );
});

export default TopBar;
