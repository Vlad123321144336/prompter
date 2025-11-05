import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import TrianglePointer from './TrianglePointer';

export interface TextViewportRef {
  scrollToStart: () => void;
  scrollToEnd: () => void;
  getScrollInfo: () => { scrollTop: number; scrollHeight: number; clientHeight: number };
  manualScroll: (delta: number) => void;
  getScrollElement: () => HTMLDivElement | null;
}

interface TextViewportProps {
  text: string;
  isPlaying: boolean;
  speed: number;
  fontSizePx: number;
  mirror: boolean;
  showPointer: boolean;
  pointerSize: number;
  pointerOpacity: number;
  pointerPulse: boolean;
  onScrollChange: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  onContainerHeightChange: (height: number) => void;
  onReachEnd: () => void;
}

const LINE_HEIGHT_EM = 1.3;
const DEAD_BAND = 1;

const TextViewport = memo(
  forwardRef<TextViewportRef, TextViewportProps>(function TextViewport(
    {
      text,
      isPlaying,
      speed,
      fontSizePx,
      mirror,
      showPointer,
      pointerSize,
      pointerOpacity,
      pointerPulse,
      onScrollChange,
      onContainerHeightChange,
      onReachEnd,
    },
    ref
  ) {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastTimestampRef = useRef<number | null>(null);
    const scrollAccumulatorRef = useRef<number>(0);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const lineHeightPx = useMemo(() => fontSizePx * LINE_HEIGHT_EM, [fontSizePx]);

    const getScrollInfo = useCallback(() => {
      const element = scrollContainerRef.current;
      if (!element) {
        return { scrollTop: 0, scrollHeight: 1, clientHeight: 1 };
      }
      return {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      };
    }, []);

    const notifyScroll = useCallback(() => {
      const info = getScrollInfo();
      onScrollChange(info.scrollTop, info.scrollHeight, info.clientHeight);
      const maxScroll = info.scrollHeight - info.clientHeight;
      if (maxScroll - info.scrollTop <= DEAD_BAND) {
        onReachEnd();
      }
    }, [getScrollInfo, onReachEnd, onScrollChange]);

    const scrollToStart = useCallback(() => {
      const element = scrollContainerRef.current;
      if (element) {
        element.scrollTo({ top: 0, behavior: 'auto' });
        notifyScroll();
      }
    }, [notifyScroll]);

    const scrollToEnd = useCallback(() => {
      const element = scrollContainerRef.current;
      if (element) {
        element.scrollTo({ top: element.scrollHeight, behavior: 'auto' });
        notifyScroll();
      }
    }, [notifyScroll]);

    const manualScroll = useCallback(
      (delta: number) => {
        const element = scrollContainerRef.current;
        if (!element) {
          return;
        }
        element.scrollBy({ top: delta, behavior: 'auto' });
        notifyScroll();
      },
      [notifyScroll]
    );

    const getScrollElement = useCallback(() => scrollContainerRef.current, []);

    useImperativeHandle(
      ref,
      () => ({
        scrollToStart,
        scrollToEnd,
        getScrollInfo,
        manualScroll,
        getScrollElement,
      }),
      [getScrollInfo, manualScroll, scrollToEnd, scrollToStart]
    );

    useEffect(() => {
      const element = scrollContainerRef.current;
      if (!element) {
        return;
      }

      const handleScroll = () => {
        if (!isPlaying) {
          notifyScroll();
        }
      };

      element.addEventListener('scroll', handleScroll, { passive: true });
      notifyScroll();

      return () => {
        element.removeEventListener('scroll', handleScroll);
      };
    }, [isPlaying, notifyScroll]);

    useEffect(() => {
      const element = scrollContainerRef.current;
      if (!element || typeof ResizeObserver === 'undefined') {
        return;
      }

      resizeObserverRef.current?.disconnect();
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onContainerHeightChange(entry.contentRect.height);
        }
      });
      observer.observe(element);
      resizeObserverRef.current = observer;

      return () => {
        observer.disconnect();
      };
    }, [onContainerHeightChange]);

    const tick = useCallback(
      (timestamp: number) => {
        if (!isPlaying) {
          lastTimestampRef.current = timestamp;
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const element = scrollContainerRef.current;
        if (!element) {
          lastTimestampRef.current = timestamp;
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        if (lastTimestampRef.current == null) {
          lastTimestampRef.current = timestamp;
        }
        const deltaSeconds = (timestamp - lastTimestampRef.current) / 1000;
        lastTimestampRef.current = timestamp;

        const t = (speed - 1) / 49;
        const linesPerSec = 0.5 + 9.5 * t;
        const pxPerSec = linesPerSec * lineHeightPx;
        const scrollDelta = pxPerSec * deltaSeconds;

        scrollAccumulatorRef.current += scrollDelta;
        const wholePixels = Math.floor(scrollAccumulatorRef.current);
        if (wholePixels !== 0) {
          element.scrollTop += wholePixels;
          scrollAccumulatorRef.current -= wholePixels;
          notifyScroll();
        }

        const maxScroll = element.scrollHeight - element.clientHeight;
        if (element.scrollTop >= maxScroll - DEAD_BAND) {
          onReachEnd();
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      },
      [isPlaying, lineHeightPx, notifyScroll, onReachEnd, speed]
    );

    useEffect(() => {
      animationFrameRef.current = requestAnimationFrame(tick);
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [tick]);

    useEffect(() => {
      const element = scrollContainerRef.current;
      if (!element) {
        return;
      }
      scrollAccumulatorRef.current = 0;
    }, [lineHeightPx]);

    const paragraphs = useMemo(() => {
      return text.split('\n').map((paragraph, index) => (
        <p key={`paragraph-${index}`}>{paragraph || '\u00A0'}</p>
      ));
    }, [text]);

    return (
      <div className="text-viewport">
        {showPointer && (
          <div
            className="text-viewport__pointer"
            style={{ opacity: pointerOpacity }}
            aria-hidden="true"
          >
            <TrianglePointer size={pointerSize} pulse={pointerPulse} />
          </div>
        )}
        <div
          ref={scrollContainerRef}
          className={`text-viewport__scroller ${mirror ? 'text-viewport__scroller--mirrored' : ''}`}
        >
          <div className="text-viewport__spacer text-viewport__spacer--top" />
          <div
            className="text-viewport__content"
            style={{ fontSize: `${fontSizePx}px`, lineHeight: `${LINE_HEIGHT_EM}em` }}
          >
            {paragraphs}
          </div>
          <div className="text-viewport__spacer text-viewport__spacer--bottom" />
        </div>
      </div>
    );
  })
);

export default TextViewport;
