import { useEffect, useRef } from 'react';

interface GamepadControls {
  onPlayPause: () => void;
  onSpeedDecrease: () => void;
  onSpeedIncrease: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onMirrorToggle: () => void;
  onFullscreenToggle: () => void;
  onFontSizeDecrease: () => void;
  onFontSizeIncrease: () => void;
  onManualScroll: (delta: number) => void;
  onPauseFromManualScroll: () => void;
  isPlaying: boolean;
  currentSpeed: number;
}

const BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  L3: 10,
  R3: 11,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
} as const;

const DEADZONE = 0.15;
const DEBOUNCE_TIME = 200;
const SMOOTH_FACTOR = 0.9;
const MANUAL_SCROLL_MIN = 5;
const MANUAL_SCROLL_MAX = 25;

function useGamepad(controls: GamepadControls) {
  const lastPressRef = useRef<Record<number, number>>({});
  const lastTimestampRef = useRef<number | null>(null);
  const smoothedScrollSpeedRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const poll = (timestamp: number) => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const buttonsHandled: Array<() => void> = [];

      for (const gamepad of gamepads) {
        if (!gamepad) {
          continue;
        }

        const pressedButtons = gamepad.buttons;
        const now = timestamp;
        const lastPress = lastPressRef.current;

        const registerPress = (index: number, action: () => void) => {
          const last = lastPress[index] ?? 0;
          if (now - last >= DEBOUNCE_TIME) {
            buttonsHandled.push(action);
            lastPress[index] = now;
          }
        };

        if (pressedButtons[BUTTONS.A]?.pressed) {
          registerPress(BUTTONS.A, controls.onPlayPause);
        }
        if (pressedButtons[BUTTONS.Y]?.pressed) {
          registerPress(BUTTONS.Y, controls.onMirrorToggle);
        }
        if (pressedButtons[BUTTONS.X]?.pressed) {
          registerPress(BUTTONS.X, controls.onFullscreenToggle);
        }
        if (pressedButtons[BUTTONS.LB]?.pressed) {
          registerPress(BUTTONS.LB, controls.onJumpToStart);
        }
        if (pressedButtons[BUTTONS.RB]?.pressed) {
          registerPress(BUTTONS.RB, controls.onJumpToEnd);
        }
        if (pressedButtons[BUTTONS.DPAD_LEFT]?.pressed) {
          registerPress(BUTTONS.DPAD_LEFT, controls.onSpeedDecrease);
        }
        if (pressedButtons[BUTTONS.DPAD_RIGHT]?.pressed) {
          registerPress(BUTTONS.DPAD_RIGHT, controls.onSpeedIncrease);
        }
        if (pressedButtons[BUTTONS.DPAD_UP]?.pressed) {
          registerPress(BUTTONS.DPAD_UP, controls.onFontSizeIncrease);
        }
        if (pressedButtons[BUTTONS.DPAD_DOWN]?.pressed) {
          registerPress(BUTTONS.DPAD_DOWN, controls.onFontSizeDecrease);
        }

        const leftStickY = gamepad.axes[1] ?? 0;
        const magnitude = Math.abs(leftStickY);
        if (magnitude > DEADZONE) {
          const direction = leftStickY > 0 ? 1 : -1;
          const normalized = (magnitude - DEADZONE) / (1 - DEADZONE);
          const targetSpeed = direction * (MANUAL_SCROLL_MIN + (MANUAL_SCROLL_MAX - MANUAL_SCROLL_MIN) * Math.pow(normalized, 2));

          if (controls.isPlaying) {
            controls.onPauseFromManualScroll();
          }

          let deltaTime = 0;
          if (lastTimestampRef.current != null) {
            deltaTime = (timestamp - lastTimestampRef.current) / 1000;
          }
          lastTimestampRef.current = timestamp;

          smoothedScrollSpeedRef.current =
            smoothedScrollSpeedRef.current * SMOOTH_FACTOR + targetSpeed * (1 - SMOOTH_FACTOR);
          const scrollDelta = smoothedScrollSpeedRef.current * deltaTime * 50;
          if (Number.isFinite(scrollDelta) && deltaTime > 0) {
            controls.onManualScroll(scrollDelta);
          }
        } else {
          smoothedScrollSpeedRef.current = 0;
          lastTimestampRef.current = timestamp;
        }
      }

      for (const action of buttonsHandled) {
        action();
      }

      animationFrameRef.current = requestAnimationFrame(poll);
    };

    animationFrameRef.current = requestAnimationFrame(poll);

    const disconnect = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    const handleConnect = () => undefined;
    const handleDisconnect = () => undefined;
    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);

    return () => {
      disconnect();
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
    };
  }, [controls]);
}

export default useGamepad;
