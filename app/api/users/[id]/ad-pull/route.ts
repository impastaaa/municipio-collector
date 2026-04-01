import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { computePulls, MAX_PULLS } from '@/lib/pulls';

const AD_PULL_GRANT = 2;

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req);
  if (!userId || userId !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const pullState = await tx.pullState.findUnique({ where: { userId } });
    if (!pullState) throw new Error('Pull state not found');

    const { availablePulls } = computePulls(pullState);
    const newPulls = Math.min(availablePulls + AD_PULL_GRANT, MAX_PULLS);

    return tx.pullState.update({
      where: { userId },
      data: { availablePulls: newPulls },
    });
  });

  return NextResponse.json({ availablePulls: updated.availablePulls });
}
