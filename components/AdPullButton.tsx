'use client';

interface Props {
  onAdComplete: () => void;
  loading: boolean;
}

export function AdPullButton({ onAdComplete, loading }: Props) {
  const handleClick = () => {
    // In production: show rewarded ad (e.g. Google AdSense rewarded unit),
    // then call onAdComplete once the user finishes watching.
    // For now, we simulate ad completion immediately.
    // Replace this with actual ad SDK callback.
    if (typeof window !== 'undefined') {
      // TODO: integrate AdSense rewarded ad here
      // window.adsbygoogle?.push({ /* rewarded ad config */ });
      onAdComplete();
    }
  };

  return (
    <>
      <style>{`
        .ad-btn {
          width: 100%;
          max-width: 320px;
          padding: 14px 24px;
          border-radius: 14px;
          border: 2px solid #4a6fa5;
          background: transparent;
          color: #7ab4e8;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s ease, border-color 0.2s ease;
          font-family: inherit;
        }
        .ad-btn:hover:not(:disabled) {
          background: rgba(74,111,165,0.15);
          border-color: #7ab4e8;
        }
        .ad-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .ad-btn-icon {
          font-size: 18px;
        }
      `}</style>
      <button className="ad-btn" onClick={handleClick} disabled={loading}>
        <span className="ad-btn-icon">📺</span>
        Ver un anuncio y conseguir 2 tiradas
      </button>
    </>
  );
}
