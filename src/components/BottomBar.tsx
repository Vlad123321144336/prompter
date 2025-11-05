import { ChangeEvent, KeyboardEvent, memo } from 'react';
import {
  ArrowLeftRight,
  Cog,
  CornerUpLeft,
  CornerUpRight,
  Pause,
  Play,
  Pointer,
} from 'lucide-react';

interface BottomBarProps {
  isPlaying: boolean;
  speed: number;
  fontSizePx: number;
  mirror: boolean;
  minFontSize: number;
  maxFontSize: number;
  showPointer: boolean;
  pointerSize: number;
  pointerOpacity: number;
  pointerPulse: boolean;
  onStart: () => void;
  onPause: () => void;
  onSpeedChange: (value: number) => void;
  onFontSizeChange: (value: number) => void;
  onGoToStart: () => void;
  onGoToEnd: () => void;
  onMirrorToggle: () => void;
  onPointerToggle: () => void;
  onPointerSizeChange: (value: number) => void;
  onPointerOpacityChange: (value: number) => void;
  onPointerPulseToggle: () => void;
}

const SPEED_MIN = 1;
const SPEED_MAX = 50;

const BottomBar = memo(function BottomBar(props: BottomBarProps) {
  const {
    isPlaying,
    speed,
    fontSizePx,
    mirror,
    minFontSize,
    maxFontSize,
    showPointer,
    pointerSize,
    pointerOpacity,
    pointerPulse,
    onStart,
    onPause,
    onSpeedChange,
    onFontSizeChange,
    onGoToStart,
    onGoToEnd,
    onMirrorToggle,
    onPointerToggle,
    onPointerSizeChange,
    onPointerOpacityChange,
    onPointerPulseToggle,
  } = props;

  const handleSpeedInput = (event: ChangeEvent<HTMLInputElement>) => {
    onSpeedChange(Number(event.target.value));
  };

  const handleFontSizeInput = (event: ChangeEvent<HTMLInputElement>) => {
    onFontSizeChange(Number(event.target.value));
  };

  const handleSliderKey = (
    event: KeyboardEvent<HTMLInputElement>,
    deltaSmall: number,
    deltaLarge: number,
    onChange: (value: number) => void
  ) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onChange(Number(event.currentTarget.value) - (event.shiftKey ? deltaLarge : deltaSmall));
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onChange(Number(event.currentTarget.value) + (event.shiftKey ? deltaLarge : deltaSmall));
    }
  };

  return (
    <footer className="bottom-bar">
      <div className="bottom-bar__group">
        <button className="bottom-bar__icon-button bottom-bar__icon-button--disabled" type="button" disabled>
          <Cog size={18} strokeWidth={1.8} />
        </button>
        <button className="bottom-bar__icon-button" type="button" onClick={onGoToStart}>
          <CornerUpLeft size={18} strokeWidth={1.8} />
        </button>
        <button
          className="bottom-bar__icon-button bottom-bar__icon-button--primary"
          type="button"
          onClick={isPlaying ? onPause : onStart}
        >
          {isPlaying ? <Pause size={18} strokeWidth={2} /> : <Play size={18} strokeWidth={2} />}
        </button>
        <button className="bottom-bar__icon-button" type="button" onClick={onGoToEnd}>
          <CornerUpRight size={18} strokeWidth={1.8} />
        </button>
        <button
          className={`bottom-bar__icon-button ${mirror ? 'bottom-bar__icon-button--active' : ''}`}
          type="button"
          onClick={onMirrorToggle}
        >
          <ArrowLeftRight size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="bottom-bar__sliders">
        <label className="bottom-bar__slider">
          <span className="bottom-bar__slider-label" aria-hidden="true">
            <span role="img" aria-label="slow">
              🐢
            </span>
            <span role="img" aria-label="fast">
              🐇
            </span>
          </span>
          <input
            className="slider"
            type="range"
            min={SPEED_MIN}
            max={SPEED_MAX}
            value={speed}
            style={{ ['--slider-progress' as const]: `${((speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * 100}%` }}
            onChange={handleSpeedInput}
            onKeyDown={(event) => handleSliderKey(event, 1, 4, onSpeedChange)}
          />
          <span className="bottom-bar__slider-value">{speed}</span>
        </label>

        <label className="bottom-bar__slider">
          <span className="bottom-bar__slider-label" aria-hidden="true">
            <span className="bottom-bar__slider-text">A̱</span>
            <span className="bottom-bar__slider-text">A</span>
          </span>
          <input
            className="slider"
            type="range"
            min={minFontSize}
            max={maxFontSize}
            value={fontSizePx}
            style={{ ['--slider-progress' as const]: `${((fontSizePx - minFontSize) / (maxFontSize - minFontSize || 1)) * 100}%` }}
            onChange={handleFontSizeInput}
            onKeyDown={(event) => handleSliderKey(event, 1, 4, onFontSizeChange)}
          />
          <span className="bottom-bar__slider-value">{fontSizePx}</span>
        </label>
      </div>

      <div className="bottom-bar__pointer">
        <button
          className={`bottom-bar__icon-button ${showPointer ? 'bottom-bar__icon-button--active' : ''}`}
          type="button"
          onClick={onPointerToggle}
        >
          <Pointer size={18} strokeWidth={1.8} />
        </button>
        <div className="bottom-bar__pointer-controls">
          <label className="bottom-bar__pointer-slider">
            <span className="bottom-bar__pointer-label">Size</span>
            <input
              className="slider slider--compact"
              type="range"
              min={12}
              max={36}
              value={pointerSize}
              style={{ ['--slider-progress' as const]: `${((pointerSize - 12) / (36 - 12)) * 100}%` }}
              onChange={(event) => onPointerSizeChange(Number(event.target.value))}
            />
          </label>
          <label className="bottom-bar__pointer-slider">
            <span className="bottom-bar__pointer-label">Opacity</span>
            <input
              className="slider slider--compact"
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={pointerOpacity}
              style={{ ['--slider-progress' as const]: `${((pointerOpacity - 0.2) / (1 - 0.2)) * 100}%` }}
              onChange={(event) => onPointerOpacityChange(Number(event.target.value))}
            />
          </label>
          <label className="bottom-bar__pointer-toggle">
            <input
              type="checkbox"
              checked={pointerPulse}
              onChange={() => onPointerPulseToggle()}
            />
            <span>Pulse</span>
          </label>
        </div>
      </div>
    </footer>
  );
});

export default BottomBar;
