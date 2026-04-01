'use client';

import { useEffect, useState } from 'react';

interface Props {
  availablePulls: number;
  maxPulls: number;
  nextPullAt: string | null; // ISO timestamp
  loading: boolean;
  onPull: () => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PullButton({
  availablePulls,
  maxPulls,
  nextPullAt,
  loading,
  onPull,
}: Props) {
  const [msRemaining, setMsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!nextPullAt) { setMsRemaining(0); return; }
    const tick = () => {
      const diff = new Date(nextPullAt).getTime() - Date.now();
      setMsRemaining(Math.max(0, diff));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextPullAt]);

  const atMax = availablePulls >= maxPulls;

  return (
    <>
      <style>{`
        .pull-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .pull-count {
          font-size: 13px;
          color: #a0a0c0;
          letter-spacing: 0.04em;
        }
        .pull-count strong {
          color: #e8e8ff;
        }
        .pull-btn {
          width: 100%;
          max-width: 320px;
          padding: 18px 24px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #e94560 0%, #c4152e 100%);
          color: #fff;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(233,69,96,0.5);
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          font-family: inherit;
        }
        .pull-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(233,69,96,0.7);
        }
        .pull-btn:active:not(:disabled) {
          transform: translateY(1px);
        }
        .pull-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pull-btn.loading {
          background: linear-gradient(135deg, #5a5a8a 0%, #3a3a6a 100%);
          box-shadow: none;
        }
        .countdown-text {
          font-size: 12px;
          color: #6060a0;
        }
        .countdown-text span {
          font-variant-numeric: tabular-nums;
          color: #8080c0;
          font-weight: 600;
        }
        .pulls-bar {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .pull-pip {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #2a2a4a;
          border: 1.5px solid #4a4a7a;
          transition: background 0.3s ease;
        }
        .pull-pip.filled {
          background: #e94560;
          border-color: #e94560;
          box-shadow: 0 0 6px rgba(233,69,96,0.6);
        }
      `}</style>
      <div className="pull-section">
        {/* Pip indicators */}
        <div className="pulls-bar">
          {Array.from({ length: maxPulls }).map((_, i) => (
            <div
              key={i}
              className={`pull-pip ${i < availablePulls ? 'filled' : ''}`}
            />
          ))}
        </div>

        <p className="pull-count">
          {atMax ? (
            <>¡Tiradas al máximo! <strong>({availablePulls}/{maxPulls})</strong></>
          ) : (
            <>
              Tienes <strong>{availablePulls}</strong> tirada
              {availablePulls !== 1 ? 's' : ''} disponible
              {availablePulls !== 1 ? 's' : ''}
            </>
          )}
        </p>

        <button
          className={`pull-btn ${loading ? 'loading' : ''}`}
          onClick={onPull}
          disabled={loading || availablePulls <= 0}
        >
          {loading ? 'Revelando...' : '¡Conseguir municipio!'}
        </button>

        {!atMax && nextPullAt && msRemaining > 0 && (
          <p className="countdown-text">
            Próxima tirada en{' '}
            <span>{formatCountdown(msRemaining)}</span>
          </p>
        )}
      </div>
    </>
  );
}
