import { isCtx, requireMerchant } from '@/lib/core/guard';
import { fail, ok, readJson } from '@/lib/core/http';
import { addTemplate, templates } from '@/lib/domain/support';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const c = await requireMerchant(req);
  if (!isCtx(c)) return c;
  return ok({ templates: await templates(c.merchantId) });
}

// { title, fr, en } — a human reply template (copied by staff; never sent by the app).
export async function POST(req: Request) {
  const c = await requireMerchant(req);
  if (!isCtx(c)) return c;
  const b = await readJson(req);
  if (!b) return fail('JSON body required');
  const r = await addTemplate(c.merchantId, b);
  return r.ok ? ok() : fail(r.error ?? 'Not saved');
}
