import { RotateCw } from 'lucide-react';

interface OrientationOverlayProps {
  show: boolean;
}

function OrientationOverlay({ show }: OrientationOverlayProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="orientation-overlay" role="presentation">
      <div className="orientation-overlay__content">
        <RotateCw className="orientation-overlay__icon" strokeWidth={1.5} />
        <h1>Rotate to landscape</h1>
        <p>This app works in landscape mode only</p>
      </div>
    </div>
  );
}

export default OrientationOverlay;
