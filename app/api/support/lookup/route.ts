import { isCtx, requireMerchant } from '@/lib/core/guard';
import { fail, ok, readJson } from '@/lib/core/http';
import { normalizePhone } from '@/lib/core/phone';
import { findCustomer, lastOrder } from '@/lib/domain/support';

export const dynamic = 'force-dynamic';

// The Clover customer behind a phone number and their last order (support.lookup).
// POST { phone } keeps the number out of addresses and logs; GET ?phone= stays for older callers.
async function lookup(req: Request, raw: unknown) {
  const c = await requireMerchant(req, 'base', { action: 'support.lookup' });
  if (!isCtx(c)) return c;
  const phone = normalizePhone(raw);
  if (!phone) return fail('Phone number is not valid.');
  const cust = await findCustomer(c.merchantId, phone);
  if (!cust) return ok({ customer: null, lastOrder: null });
  return ok({ customer: cust, lastOrder: await lastOrder(c.merchantId, cust.id) });
}

export async function POST(req: Request) {
  return lookup(req, (await readJson(req))?.phone);
}

export async function GET(req: Request) {
  return lookup(req, new URL(req.url).searchParams.get('phone'));
}
