import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withNextErrorResponse } from '@/src/api/core/middlewares';
import { resendConfirmationServer } from '@/src/api/auctions-api/requests/auth';

const bodySchema = z.object({ email: z.string().email().max(254) });

const resendConfirmation = async (req: Request) => {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid email' }, { status: 400 });
  }
  const result = await resendConfirmationServer(parsed.data.email);
  return NextResponse.json(result);
};

export const POST = withNextErrorResponse(resendConfirmation);
