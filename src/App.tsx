import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TopBar from './components/TopBar';
import BottomBar from './components/BottomBar';
import TextViewport, { TextViewportRef } from './components/TextViewport';
import OrientationOverlay from './components/OrientationOverlay';
import useGamepad from './hooks/useGamepad';

const DEFAULT_SCRIPT = `Good morning and welcome to the minimalist teleprompter demo.\n\nThis sample script is intentionally short so you can test scrolling, font size adjustments, and pointer visibility.\n\nPaste your own script at any time by tapping the New Script button in the top right corner.\n\nHave a great shoot!`;

const TIMER_INTERVAL = 100;
const MIN_SPEED = 1;
const MAX_SPEED = 50;
const MIN_FONT_SIZE = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const secs = (total % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function App() {
  const [isLandscape, setIsLandscape] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(20);
  const [fontSizePx, setFontSizePx] = useState<number>(72);
  const [mirror, setMirror] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [scriptText, setScriptText] = useState<string>(DEFAULT_SCRIPT);
  const [showPointer, setShowPointer] = useState<boolean>(true);
  const [pointerSize, setPointerSize] = useState<number>(18);
  const [pointerOpacity, setPointerOpacity] = useState<number>(0.5);
  const [pointerPulse, setPointerPulse] = useState<boolean>(false);

  const textViewportRef = useRef<TextViewportRef>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  const maxFontSize = useMemo(() => {
    return containerHeight > 0 ? Math.floor(containerHeight / 3) : 192;
  }, [containerHeight]);

  useEffect(() => {
    if (fontSizePx > maxFontSize) {
      setFontSizePx(maxFontSize);
    }
  }, [fontSizePx, maxFontSize]);

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = window.setInterval(() => {
      if (!startTimeRef.current) {
        return;
      }
      const elapsedSeconds = (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000;
      setElapsedTime(elapsedSeconds);
    }, TIMER_INTERVAL);

    return () => window.clearInterval(interval);
  }, [isPlaying]);

  const handleScrollChange = useCallback(
    (scrollTop: number, scrollHeight: number, clientHeight: number) => {
      const maxScroll = Math.max(scrollHeight - clientHeight, 1);
      const progressPercent = clamp((scrollTop / maxScroll) * 100, 0, 100);
      setProgress(progressPercent);

      const remainingScroll = Math.max(maxScroll - scrollTop, 0);
      const lineHeightPx = fontSizePx * 1.3;
      const t = (speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED);
      const curved = Math.pow(t, 1.2);
      const linesPerSec = 0.2 + 4.8 * curved;
      const pxPerSec = linesPerSec * lineHeightPx;
      const remainingSeconds = pxPerSec > 0 ? remainingScroll / pxPerSec : 0;
      setRemainingTime(remainingSeconds);
    },
    [fontSizePx, speed]
  );

  const handleContainerHeightChange = useCallback((height: number) => {
    setContainerHeight(height);
  }, []);

  const resetTimers = useCallback(() => {
    setElapsedTime(0);
    setRemainingTime(0);
    setProgress(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    pauseStartRef.current = null;
    setIsPlaying(false);
  }, []);

  const handleStart = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
    }
    if (pauseStartRef.current) {
      pausedTimeRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    if (isPlaying) {
      pauseStartRef.current = Date.now();
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const handleSpeedChange = useCallback((value: number) => {
    setSpeed(clamp(Math.round(value), MIN_SPEED, MAX_SPEED));
  }, []);

  const handleFontSizeChange = useCallback(
    (value: number) => {
      const clamped = clamp(Math.round(value), MIN_FONT_SIZE, maxFontSize);
      setFontSizePx(clamped);
    },
    [maxFontSize]
  );

  const handleMirrorToggle = useCallback(() => {
    setMirror((prev) => !prev);
  }, []);

  const handleGoToStart = useCallback(() => {
    textViewportRef.current?.scrollToStart();
    resetTimers();
  }, [resetTimers]);

  const handleGoToEnd = useCallback(() => {
    textViewportRef.current?.scrollToEnd();
  }, []);

  const handleManualScroll = useCallback((delta: number) => {
    textViewportRef.current?.manualScroll(delta);
  }, []);

  const handleNewScript = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        setScriptText(text.trim());
        textViewportRef.current?.scrollToStart();
        resetTimers();
      }
    } catch (error) {
      // Clipboard errors are silently ignored.
      console.error('Failed to read clipboard contents', error);
    }
  }, [resetTimers]);

  const handlePauseFromManualScroll = useCallback(() => {
    if (isPlaying) {
      handlePause();
    }
  }, [handlePause, isPlaying]);

  const gamepadControls = useMemo(() => ({
    onPlayPause: () => {
      if (isPlaying) {
        handlePause();
      } else {
        handleStart();
      }
    },
    onSpeedDecrease: () => handleSpeedChange(speed - 1),
    onSpeedIncrease: () => handleSpeedChange(speed + 1),
    onJumpToStart: handleGoToStart,
    onJumpToEnd: handleGoToEnd,
    onMirrorToggle: handleMirrorToggle,
    onFullscreenToggle: () => {
      if (!document.fullscreenElement) {
        void document.documentElement.requestFullscreen().catch(() => undefined);
      } else {
        void document.exitFullscreen().catch(() => undefined);
      }
    },
    onFontSizeDecrease: () => handleFontSizeChange(fontSizePx - 1),
    onFontSizeIncrease: () => handleFontSizeChange(fontSizePx + 1),
    onManualScroll: handleManualScroll,
    onPauseFromManualScroll: handlePauseFromManualScroll,
    isPlaying,
    currentSpeed: speed,
  }), [
    fontSizePx,
    handleFontSizeChange,
    handleGoToEnd,
    handleGoToStart,
    handleManualScroll,
    handleMirrorToggle,
    handlePause,
    handlePauseFromManualScroll,
    handleSpeedChange,
    handleStart,
    isPlaying,
    speed,
  ]);

  useGamepad(gamepadControls);

  useEffect(() => {
    if (!isPlaying && startTimeRef.current) {
      setElapsedTime((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000);
    }
  }, [isPlaying]);

  const layoutStyle = useMemo(() => ({
    width: 'clamp(640px, 100dvw, 1000px)',
    height: 'clamp(360px, 100dvh, 560px)',
    transform: mirror ? 'scaleX(-1)' : 'none',
    transition: 'transform 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  }), [mirror]);

  return (
    <div className="app-shell">
      <div style={layoutStyle}>
        <TopBar
          elapsedTime={formatTime(elapsedTime)}
          remainingTime={formatTime(remainingTime)}
          progress={progress}
          onNewScript={handleNewScript}
        />
        <TextViewport
          ref={textViewportRef}
          text={scriptText}
          isPlaying={isPlaying}
          speed={speed}
          fontSizePx={fontSizePx}
          mirror={mirror}
          showPointer={showPointer}
          pointerSize={pointerSize}
          pointerOpacity={pointerOpacity}
          pointerPulse={pointerPulse}
          onScrollChange={handleScrollChange}
          onContainerHeightChange={handleContainerHeightChange}
          onReachEnd={() => {
            setIsPlaying(false);
          }}
        />
        <BottomBar
          isPlaying={isPlaying}
          speed={speed}
          fontSizePx={fontSizePx}
          mirror={mirror}
          minFontSize={MIN_FONT_SIZE}
          maxFontSize={maxFontSize}
          showPointer={showPointer}
          pointerSize={pointerSize}
          pointerOpacity={pointerOpacity}
          pointerPulse={pointerPulse}
          onStart={handleStart}
          onPause={handlePause}
          onSpeedChange={handleSpeedChange}
          onFontSizeChange={handleFontSizeChange}
          onGoToStart={handleGoToStart}
          onGoToEnd={handleGoToEnd}
          onMirrorToggle={handleMirrorToggle}
          onPointerToggle={() => setShowPointer((prev) => !prev)}
          onPointerSizeChange={setPointerSize}
          onPointerOpacityChange={setPointerOpacity}
          onPointerPulseToggle={() => setPointerPulse((prev) => !prev)}
        />
      </div>
      <OrientationOverlay show={!isLandscape} />
    </div>
  );
}

export default App;
