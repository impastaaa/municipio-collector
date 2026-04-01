import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getEscudoUrl } from '@/lib/r2';

export async function GET(
  _req: Request,
  { params }: { params: { ine: string } },
): Promise<NextResponse> {
  const municipio = await prisma.municipio.findUnique({
    where: { codigoIne: params.ine },
  });

  if (!municipio) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    codigoIne: municipio.codigoIne,
    nombre: municipio.nombre,
    provincia: municipio.provincia,
    codigoProvincia: municipio.codigoProvincia,
    comunidadAutonoma: municipio.comunidadAutonoma,
    poblacion: municipio.poblacion,
    poblacionYear: municipio.poblacionYear,
    superficieKm2: municipio.superficieKm2,
    altitudM: municipio.altitudM,
    rareza: municipio.rareza,
    wikipediaUrl: municipio.wikipediaUrl,
    escudoUrl: getEscudoUrl(municipio.escudoFilename),
  });
}
