import { isCtx, requireMerchant } from '@/lib/core/guard';
import { fail, ok } from '@/lib/core/http';
import { normalizePhone } from '@/lib/core/phone';
import { findCustomer, lastOrder } from '@/lib/domain/support';

export const dynamic = 'force-dynamic';

// GET ?phone= → the Clover customer and (Premium) their last order.
export async function GET(req: Request) {
  const c = await requireMerchant(req);
  if (!isCtx(c)) return c;
  const phone = normalizePhone(new URL(req.url).searchParams.get('phone'));
  if (!phone) return fail('Phone number is not valid.');
  const cust = await findCustomer(c.merchantId, phone);
  if (!cust) return ok({ customer: null, lastOrder: null });
  return ok({ customer: cust, lastOrder: await lastOrder(c.merchantId, cust.id) });
}
