import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { computePulls, consumePull } from '@/lib/pulls';
import { evaluateAchievements } from '@/lib/achievements';
import { getEscudoUrl } from '@/lib/r2';

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const userId = getUserIdFromRequest(req);
  if (!userId || userId !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { pullState: true },
    });

    if (!user) throw { status: 401, message: 'User not found' };

    const pullState = user.pullState;
    if (!pullState) throw { status: 400, message: 'Pull state not initialised' };

    const { availablePulls } = computePulls(pullState);
    if (availablePulls <= 0) {
      throw { status: 400, message: 'No pulls available' };
    }

    // Draw a random uncollected municipio — entirely server-side
    const [totalUncollected] = await tx.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Municipio" m
      WHERE NOT EXISTS (
        SELECT 1 FROM "Collection" c
        WHERE c."userId" = ${userId} AND c."municipioId" = m."codigoIne"
      )
    `;

    if (totalUncollected.count === BigInt(0)) {
      throw { status: 400, message: 'Collection complete' };
    }

    const offset = Math.floor(Math.random() * Number(totalUncollected.count));

    const [municipio] = await tx.$queryRaw<
      {
        codigoIne: string;
        nombre: string;
        provincia: string;
        codigoProvincia: string;
        comunidadAutonoma: string;
        poblacion: number | null;
        poblacionYear: number | null;
        superficieKm2: number | null;
        altitudM: number | null;
        rareza: string;
        wikipediaUrl: string | null;
        escudoFilename: string | null;
      }[]
    >`
      SELECT m.*
      FROM "Municipio" m
      WHERE NOT EXISTS (
        SELECT 1 FROM "Collection" c
        WHERE c."userId" = ${userId} AND c."municipioId" = m."codigoIne"
      )
      OFFSET ${offset}
      LIMIT 1
    `;

    // Insert into collection
    await tx.collection.create({
      data: { userId, municipioId: municipio.codigoIne },
    });

    // Update pull state
    const { availablePulls: newPulls, lastPullAt } = consumePull(pullState);
    await tx.pullState.update({
      where: { userId },
      data: { availablePulls: newPulls, lastPullAt },
    });

    // Evaluate achievements atomically
    const newAchievements = await evaluateAchievements(userId, tx);

    return { municipio, newAchievements };
  }).catch((err) => {
    if (err?.status) return err as { status: number; message: string };
    throw err;
  });

  if ('status' in result && 'message' in result && !('municipio' in result)) {
    return NextResponse.json(
      { error: (result as { message: string }).message },
      { status: (result as { status: number }).status },
    );
  }

  const { municipio, newAchievements } = result as Awaited<
    ReturnType<typeof prisma.$transaction>
  > & {
    municipio: {
      codigoIne: string;
      nombre: string;
      provincia: string;
      codigoProvincia: string;
      comunidadAutonoma: string;
      poblacion: number | null;
      poblacionYear: number | null;
      superficieKm2: number | null;
      altitudM: number | null;
      rareza: string;
      wikipediaUrl: string | null;
      escudoFilename: string | null;
    };
    newAchievements: { slug: string; nombre: string; icono: string | null }[];
  };

  return NextResponse.json({
    municipio: {
      ...municipio,
      escudoUrl: getEscudoUrl(municipio.escudoFilename),
    },
    newAchievements,
  });
}
