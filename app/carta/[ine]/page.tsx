import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getEscudoUrl } from '@/lib/r2';
import { CardExportWrapper } from './CardExportWrapper';

interface Props {
  params: { ine: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const municipio = await prisma.municipio.findUnique({
    where: { codigoIne: params.ine },
  });
  if (!municipio) return { title: 'Municipio no encontrado' };

  const title = `${municipio.nombre} — MunicipioCollector`;
  const description = `Carta de ${municipio.nombre} (${municipio.provincia}). ${
    municipio.poblacion
      ? `Población: ${municipio.poblacion.toLocaleString('es-ES')} hab.`
      : ''
  }`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/carta/${params.ine}`,
      siteName: 'MunicipioCollector',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CartaPage({ params }: Props) {
  const municipio = await prisma.municipio.findUnique({
    where: { codigoIne: params.ine },
  });
  if (!municipio) notFound();

  const cardData = {
    codigoIne: municipio.codigoIne,
    nombre: municipio.nombre,
    provincia: municipio.provincia,
    comunidadAutonoma: municipio.comunidadAutonoma,
    poblacion: municipio.poblacion,
    poblacionYear: municipio.poblacionYear,
    superficieKm2: municipio.superficieKm2,
    altitudM: municipio.altitudM,
    rareza: municipio.rareza as any,
    wikipediaUrl: municipio.wikipediaUrl,
    escudoUrl: getEscudoUrl(municipio.escudoFilename),
  };

  return <CardExportWrapper municipio={cardData} />;
}
