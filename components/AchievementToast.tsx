'use client';

import { useEffect, useState } from 'react';

interface AchievementData {
  slug: string;
  nombre: string;
  icono: string | null;
}

interface Props {
  achievements: AchievementData[];
}

export function AchievementToast({ achievements }: Props) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievements.length === 0) return;
    setVisible(true);
    const show = () => {
      setVisible(true);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrent((c) => {
            const next = c + 1;
            if (next < achievements.length) {
              setVisible(true);
            }
            return next;
          });
        }, 400);
      }, 3000);
      return hideTimer;
    };
    const timer = show();
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, achievements]);

  if (current >= achievements.length) return null;

  const ach = achievements[current];

  return (
    <>
      <style>{`
        @keyframes toastIn {
          0%   { opacity: 0; transform: translateY(20px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }
        .achievement-toast {
          position: fixed;
          bottom: 90px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 1.5px solid #e94560;
          border-radius: 14px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 8px 32px rgba(233,69,96,0.3);
          z-index: 9999;
          min-width: 280px;
          max-width: calc(100vw - 48px);
        }
        .achievement-toast.entering {
          animation: toastIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .achievement-toast.leaving {
          animation: toastOut 0.3s ease forwards;
        }
        .toast-icon { font-size: 28px; flex-shrink: 0; }
        .toast-body { flex: 1; }
        .toast-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #e94560;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .toast-name {
          font-size: 15px;
          font-weight: 700;
          color: #e8e8ff;
        }
        .toast-counter {
          font-size: 10px;
          color: #6060a0;
          margin-top: 2px;
        }
      `}</style>
      <div className={`achievement-toast ${visible ? 'entering' : 'leaving'}`}>
        <span className="toast-icon">{ach.icono ?? '🏆'}</span>
        <div className="toast-body">
          <div className="toast-label">¡Logro desbloqueado!</div>
          <div className="toast-name">{ach.nombre}</div>
          {achievements.length > 1 && (
            <div className="toast-counter">
              {current + 1} / {achievements.length}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
