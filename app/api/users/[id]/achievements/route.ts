import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req);
  if (!userId || userId !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const [allAchievements, userAchievements] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ categoria: 'asc' }, { id: 'asc' }] }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true },
    }),
  ]);

  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
  );

  const items = allAchievements.map((a) => {
    const unlockedAt = unlockedMap.get(a.id);
    return {
      id: a.id,
      slug: a.slug,
      nombre: a.nombre,
      descripcion: a.descripcion,
      icono: a.icono,
      categoria: a.categoria,
      unlocked: unlockedAt !== undefined,
      unlockedAt: unlockedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json({ items });
}
