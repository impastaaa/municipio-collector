'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CardReveal } from '@/components/CardReveal';
import { PullButton } from '@/components/PullButton';
import { AdPullButton } from '@/components/AdPullButton';
import { AchievementToast } from '@/components/AchievementToast';
import { MunicipioCardData } from '@/components/MunicipioCard';

interface UserState {
  availablePulls: number;
  maxPulls: number;
  nextPullAt: string | null;
  collectionCount: number;
  totalMunicipios: number;
  collectionComplete: boolean;
}

interface NewAchievement {
  slug: string;
  nombre: string;
  icono: string | null;
}

const STORAGE_KEY = 'municipio_uid';
const COMPLETE_KEY = 'municipio_complete';

function authHeaders(uid: string) {
  return { Authorization: `Bearer ${uid}` };
}

export default function HomePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [userState, setUserState] = useState<UserState | null>(null);
  const [pulling, setPulling] = useState(false);
  const [revealed, setRevealed] = useState<MunicipioCardData | null>(null);
  const [achievements, setAchievements] = useState<NewAchievement[]>([]);
  const [showToasts, setShowToasts] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const isComplete = useRef(false);

  // ── Bootstrap user ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        const res = await fetch('/api/users', { method: 'POST' });
        const data = await res.json();
        id = data.id as string;
        localStorage.setItem(STORAGE_KEY, id);
      }
      setUid(id);
    }
    init();
  }, []);

  // ── Fetch pull state ────────────────────────────────────────────────────────
  const fetchState = useCallback(async (id: string) => {
    if (isComplete.current) return;
    const res = await fetch(`/api/users/${id}/state`, {
      headers: authHeaders(id),
    });
    if (!res.ok) return;
    const data: UserState = await res.json();
    setUserState(data);
    if (data.collectionComplete) {
      isComplete.current = true;
      localStorage.setItem(COMPLETE_KEY, '1');
    }
  }, []);

  useEffect(() => {
    if (!uid) return;
    if (localStorage.getItem(COMPLETE_KEY) === '1') {
      isComplete.current = true;
    }
    fetchState(uid);
  }, [uid, fetchState]);

  // ── Pull ───────────────────────────────────────────────────────────────────
  const handlePull = async () => {
    if (!uid || pulling) return;
    setPulling(true);
    // Optimistic decrement
    setUserState((s) =>
      s ? { ...s, availablePulls: Math.max(0, s.availablePulls - 1) } : s,
    );

    try {
      const res = await fetch(`/api/users/${uid}/pull`, {
        method: 'POST',
        headers: authHeaders(uid),
      });
      const data = await res.json();
      if (!res.ok) {
        await fetchState(uid);
        return;
      }
      setRevealed(data.municipio);
      if (data.newAchievements?.length > 0) {
        setAchievements(data.newAchievements);
      }
      await fetchState(uid);
    } finally {
      setPulling(false);
    }
  };

  // ── Ad pull ────────────────────────────────────────────────────────────────
  const handleAdComplete = async () => {
    if (!uid) return;
    setAdLoading(true);
    try {
      await fetch(`/api/users/${uid}/ad-pull`, {
        method: 'POST',
        headers: authHeaders(uid),
      });
      await fetchState(uid);
    } finally {
      setAdLoading(false);
    }
  };

  const handleRevealComplete = () => {
    if (achievements.length > 0) setShowToasts(true);
  };

  // ── Completion screen ──────────────────────────────────────────────────────
  if (userState?.collectionComplete || isComplete.current) {
    return (
      <main style={styles.main}>
        <div style={styles.completionWrap}>
          <div style={{ fontSize: 64 }}>🏆</div>
          <h1 style={styles.completionTitle}>¡Colección completa!</h1>
          <p style={styles.completionSub}>
            Has conseguido los {(8132).toLocaleString('es-ES')} municipios de España.
            Eres un verdadero coleccionista.
          </p>
          <button
            style={styles.shareBtn}
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'MunicipioCollector',
                  text: '¡He completado la colección de todos los municipios de España! 🏆',
                  url: window.location.href,
                });
              }
            }}
          >
            Compartir logro
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <style suppressHydrationWarning>{`
      .home-header {
        text-align: center;
        padding: 36px 16px 20px;
      }
      .home-title {
        font-family: 'Cinzel', serif;
        font-size: clamp(22px, 6vw, 34px);
        font-weight: 900;
        letter-spacing: 0.04em;
        background: linear-gradient(135deg, #e8e8ff 0%, #c9910a 50%, #e94560 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .home-subtitle {
        font-size: 13px;
        color: #4a4a7a;
        margin-top: 4px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .home-nav {
        display: flex;
        justify-content: center;
        gap: 4px;
        padding: 0 16px 24px;
      }
      .home-nav a {
        padding: 6px 14px;
        font-size: 12px;
        color: #6060a0;
        text-decoration: none;
        border-radius: 20px;
        border: 1px solid #1e1e3a;
        transition: all 0.15s;
        font-family: 'Crimson Text', serif;
      }
      .home-nav a:hover { color: #c0c0f0; border-color: #3a3a6a; }
      .home-content {
        padding: 0 16px 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 28px;
      }
      .home-collection-stat {
        font-size: 12px;
        color: #3a3a6a;
        text-align: center;
        letter-spacing: 0.06em;
      }
      .home-collection-stat strong { color: #5a5a9a; }
    `}</style>
      <main>
        <header className="home-header">
          <h1 className="home-title">MunicipioCollector</h1>
          <p className="home-subtitle">Colecciona los 8.132 municipios de España</p>
        </header>

        <nav className="home-nav">
          <a href="/coleccion">Mi colección</a>
          <a href="/logros">Logros</a>
          <a href="/ajustes">Ajustes</a>
          <a href="/creditos">Creditos</a>
        </nav>

        <div className="home-content">
          {/* Pull controls */}
          {userState && (
            <>
              {userState.availablePulls > 0 ? (
                <PullButton
                  availablePulls={userState.availablePulls}
                  maxPulls={userState.maxPulls}
                  nextPullAt={userState.nextPullAt}
                  loading={pulling}
                  onPull={handlePull}
                />
              ) : (
                <>
                  <PullButton
                    availablePulls={0}
                    maxPulls={userState.maxPulls}
                    nextPullAt={userState.nextPullAt}
                    loading={false}
                    onPull={() => { }}
                  />
                </>
              )}

              {userState.collectionCount > 0 && (
                <p className="home-collection-stat">
                  Colección:{' '}
                  <strong>
                    {userState.collectionCount.toLocaleString('es-ES')}
                  </strong>{' '}
                  / {userState.totalMunicipios.toLocaleString('es-ES')}
                </p>
              )}
            </>
          )}

          {/* Card reveal */}
          {revealed && (
            <CardReveal
              municipio={revealed}
              onRevealComplete={handleRevealComplete}
            />
          )}
          <AdPullButton onAdComplete={handleAdComplete} loading={adLoading} />
        </div>
      </main>

      {/* Achievement toasts */}
      {showToasts && achievements.length > 0 && (
        <AchievementToast achievements={achievements} />
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    background: '#07070f',
  },
  completionWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    textAlign: 'center',
    maxWidth: 320,
  },
  completionTitle: {
    fontFamily: "'Cinzel', serif",
    fontSize: 28,
    fontWeight: 900,
    color: '#c9910a',
  },
  completionSub: {
    fontSize: 15,
    color: '#8080b0',
    lineHeight: 1.6,
  },
  shareBtn: {
    marginTop: 8,
    padding: '14px 28px',
    borderRadius: 14,
    border: 'none',
    background: 'linear-gradient(135deg, #e94560 0%, #c4152e 100%)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
