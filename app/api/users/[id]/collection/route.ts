import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { getEscudoUrl } from '@/lib/r2';

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

  const collection = await prisma.collection.findMany({
    where: { userId },
    include: { municipio: true },
    orderBy: { claimedAt: 'desc' },
  });

  const items = collection.map((c) => ({
    claimedAt: c.claimedAt.toISOString(),
    municipio: {
      codigoIne: c.municipio.codigoIne,
      nombre: c.municipio.nombre,
      provincia: c.municipio.provincia,
      codigoProvincia: c.municipio.codigoProvincia,
      comunidadAutonoma: c.municipio.comunidadAutonoma,
      poblacion: c.municipio.poblacion,
      poblacionYear: c.municipio.poblacionYear,
      superficieKm2: c.municipio.superficieKm2,
      altitudM: c.municipio.altitudM,
      rareza: c.municipio.rareza,
      wikipediaUrl: c.municipio.wikipediaUrl,
      escudoUrl: getEscudoUrl(c.municipio.escudoFilename),
    },
  }));

  return NextResponse.json({ items });
}
