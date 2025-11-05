import { memo } from 'react';

interface TrianglePointerProps {
  size: number;
  opacity?: number;
  pulse?: boolean;
}

const TrianglePointer = memo(function TrianglePointer({ size, pulse = false }: TrianglePointerProps) {
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`triangle-pointer ${pulse ? 'triangle-pointer--pulse' : ''}`}
    >
      <path d="M2 2 L14 10 L2 18 Z" fill="#FFFFFF" />
    </svg>
  );
});

export default TrianglePointer;
