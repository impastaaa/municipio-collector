import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { computePulls, MAX_PULLS } from '@/lib/pulls';

const TOTAL_MUNICIPIOS = 8131;

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req);
  if (!userId || userId !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      pullState: true,
      _count: { select: { collection: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const collectionCount = user._count.collection;

  // Bootstrap PullState if missing (defensive)
  const pullState =
    user.pullState ??
    (await prisma.pullState.create({
      data: { userId, availablePulls: 1, lastPullAt: new Date() },
    }));

  const { availablePulls, nextPullAt } = computePulls(pullState);

  return NextResponse.json({
    availablePulls,
    maxPulls: MAX_PULLS,
    nextPullAt: nextPullAt?.toISOString() ?? null,
    collectionCount,
    totalMunicipios: TOTAL_MUNICIPIOS,
    collectionComplete: collectionCount >= TOTAL_MUNICIPIOS,
  });
}
