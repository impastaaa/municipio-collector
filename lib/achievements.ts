import { Rareza } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Evaluate and award any newly unlocked achievements for a user.
 * Must be called inside the same transaction as the collection insert.
 *
 * Returns the list of newly awarded Achievement records.
 */
export async function evaluateAchievements(
  userId: string,
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<{ slug: string; nombre: string; icono: string | null }[]> {
  // Load current collection with municipio data
  const collection = await tx.collection.findMany({
    where: { userId },
    include: {
      municipio: {
        select: {
          rareza: true,
          codigoProvincia: true,
        },
      },
    },
  });

  const totalCount = collection.length;

  // Count by rareza
  const byRareza = collection.reduce<Record<Rareza, number>>(
    (acc, c) => {
      acc[c.municipio.rareza] = (acc[c.municipio.rareza] ?? 0) + 1;
      return acc;
    },
    {} as Record<Rareza, number>,
  );

  // Provinces where ALL municipios are collected
  const allMunicipiosByProvince = await tx.municipio.groupBy({
    by: ['codigoProvincia'],
    _count: { codigoIne: true },
  });

  const collectedByProvince = collection.reduce<Record<string, number>>(
    (acc, c) => {
      acc[c.municipio.codigoProvincia] =
        (acc[c.municipio.codigoProvincia] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const completedProvinces = allMunicipiosByProvince
    .filter(
      (p) =>
        (collectedByProvince[p.codigoProvincia] ?? 0) >= p._count.codigoIne,
    )
    .map((p) => p.codigoProvincia);

  // Fetch all achievements and already-unlocked ones
  const [allAchievements, unlockedIds] = await Promise.all([
    tx.achievement.findMany(),
    tx.userAchievement
      .findMany({ where: { userId }, select: { achievementId: true } })
      .then((rows) => new Set(rows.map((r) => r.achievementId))),
  ]);

  const toAward: typeof allAchievements = [];

  for (const ach of allAchievements) {
    if (unlockedIds.has(ach.id)) continue;

    let earned = false;

    if (ach.categoria === 'COLECCIONISTA') {
      earned = checkMilestoneAchievement(ach.slug, totalCount);
    } else if (ach.categoria === 'RAREZA') {
      earned = checkRarezaAchievement(ach.slug, byRareza);
    } else if (ach.categoria === 'PROVINCIA') {
      // slug format: provincia_{codigoProvincia}
      const codigoProvincia = ach.slug.replace('provincia_', '');
      earned = completedProvinces.includes(codigoProvincia);
    }

    if (earned) toAward.push(ach);
  }

  if (toAward.length > 0) {
    await tx.userAchievement.createMany({
      data: toAward.map((a) => ({ userId, achievementId: a.id })),
      skipDuplicates: true,
    });
  }

  return toAward.map((a) => ({
    slug: a.slug,
    nombre: a.nombre,
    icono: a.icono,
  }));
}

// ---------------------------------------------------------------------------
// Milestone thresholds (COLECCIONISTA category)
// ---------------------------------------------------------------------------
const MILESTONE_THRESHOLDS: Record<string, number> = {
  col_1: 1,
  col_10: 10,
  col_50: 50,
  col_100: 100,
  col_250: 250,
  col_500: 500,
  col_1000: 1000,
  col_2000: 2000,
  col_4000: 4000,
  col_complete: 8131,
};

function checkMilestoneAchievement(slug: string, total: number): boolean {
  const threshold = MILESTONE_THRESHOLDS[slug];
  if (threshold === undefined) return false;
  return total >= threshold;
}

// ---------------------------------------------------------------------------
// Rareza thresholds (RAREZA category)
// ---------------------------------------------------------------------------
const RAREZA_THRESHOLDS: Record<string, { rareza: Rareza; count: number }> = {
  rareza_gran_ciudad_1: { rareza: 'GRAN_CIUDAD', count: 1 },
  rareza_gran_ciudad_all: { rareza: 'GRAN_CIUDAD', count: 60 },
  rareza_ciudad_10: { rareza: 'CIUDAD', count: 10 },
  rareza_ciudad_all: { rareza: 'CIUDAD', count: 360 },
  rareza_gran_pueblo_50: { rareza: 'GRAN_PUEBLO', count: 50 },
  rareza_gran_pueblo_all: { rareza: 'GRAN_PUEBLO', count: 1450 },
  rareza_pueblo_100: { rareza: 'PUEBLO', count: 100 },
  rareza_pueblo_all: { rareza: 'PUEBLO', count: 3800 },
  rareza_espana_vacia_1: { rareza: 'ESPANA_VACIA', count: 1 },
  rareza_espana_vacia_all: { rareza: 'ESPANA_VACIA', count: 2460 },
};

function checkRarezaAchievement(
  slug: string,
  byRareza: Record<Rareza, number>,
): boolean {
  const rule = RAREZA_THRESHOLDS[slug];
  if (!rule) return false;
  return (byRareza[rule.rareza] ?? 0) >= rule.count;
}
