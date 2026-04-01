'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MunicipioCard, MunicipioCardData } from './MunicipioCard';

interface Props {
  municipio: MunicipioCardData;
  onRevealComplete?: () => void;
}

type Phase = 'back' | 'flipping-out' | 'flipping-in' | 'front' | 'done';

export function CardReveal({ municipio, onRevealComplete }: Props) {
  const [displayedMunicipio, setDisplayedMunicipio] = useState<MunicipioCardData>(municipio);
  const [phase, setPhase] = useState<Phase>('back');
  const router = useRouter();

  useEffect(() => {
    setPhase('back');

    // Step 1 – rotate to 90° (edge-on, invisible)
    const t1 = setTimeout(() => setPhase('flipping-out'), 400);

    // Step 2 – swap content while invisible, then hold at 90°
    const t2 = setTimeout(() => {
      setDisplayedMunicipio(municipio);
      setPhase('flipping-in');
    }, 750);

    // Step 3 – rotate back to 0°, revealing new card
    const t3 = setTimeout(() => setPhase('front'), 950);

    // Step 4 – done
    const t4 = setTimeout(() => {
      setPhase('done');
      onRevealComplete?.();
    }, 1500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipio.codigoIne]);

  const handleCardClick = () => {
    if (phase === 'front' || phase === 'done') {
      router.push(`/carta/${displayedMunicipio.codigoIne}`);
    }
  };

  return (
    <>
      <style>{`
        @keyframes cardGlow {
          0%   { filter: brightness(1); }
          50%  { filter: brightness(1.5); }
          100% { filter: brightness(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .reveal-scene {
          perspective: 1200px;
          width: 280px;  /* ← single source of truth for card size in this view */
          margin: 0 auto;
        }
        .reveal-card-wrap {
          transform-style: preserve-3d;
          position: relative;
          transform: rotateY(0deg);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal-card-wrap.flipping-out {
          transform: rotateY(90deg);
        }
        .reveal-card-wrap.flipping-in {
          transform: rotateY(90deg);
          transition: none; /* snap to 90° instantly before rotating back in */
        }
        .reveal-card-wrap.front {
          transform: rotateY(0deg);
          animation: cardGlow 0.6s ease-in-out 0.25s;
        }
        .reveal-card-wrap.done {
          transform: rotateY(0deg);
        }

        /* Back face — exact same dimensions as the front card */
        .reveal-card-back {
          width: 100%;
          height: 210px;
          border-radius: 16px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          border: 2px solid #e94560;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }

        /* Front wrapper — fills the scene width, card inside fills it too */
        .reveal-card-front {
          width: 100%;
          cursor: pointer;
        }

        .reveal-tap-hint {
          text-align: center;
          font-size: 12px;
          color: #4a4a7a;
          margin-top: 8px;
          letter-spacing: 0.05em;
          animation: fadeIn 0.4s ease-in-out 0.3s both;
        }
      `}</style>

      <div className="reveal-scene">
        <div className={`reveal-card-wrap ${phase}`}>
          {(phase === 'back' || phase === 'flipping-out') ? (
            <div className="reveal-card-back">🗺️</div>
          ) : (
            <div className="reveal-card-front" onClick={handleCardClick}>
              <MunicipioCard municipio={displayedMunicipio} />
            </div>
          )}
        </div>

        {(phase === 'front' || phase === 'done') && (
          <p className="reveal-tap-hint">Toca la carta para ver más detalles →</p>
        )}
      </div>
    </>
  );
}
