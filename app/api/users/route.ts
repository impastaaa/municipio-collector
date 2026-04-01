import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(): Promise<NextResponse> {
  const user = await prisma.user.create({
    data: {
      pullState: {
        create: {
          availablePulls: 1,
          lastPullAt: new Date(),
        },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
