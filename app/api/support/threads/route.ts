import { isCtx, requireMerchant } from '@/lib/core/guard';
import { fail, ok, readJson } from '@/lib/core/http';
import { addNote, listThreads, openThread } from '@/lib/domain/support';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const c = await requireMerchant(req);
  if (!isCtx(c)) return c;
  return ok({ threads: await listThreads(c.merchantId) });
}

// Open: { phone, subject, note? } · Note / close: { threadId, note?, close? }. Internal only: nothing is sent.
export async function POST(req: Request) {
  const c = await requireMerchant(req, 'base', { action: 'support.threads' });
  if (!isCtx(c)) return c;
  const b = await readJson(req);
  if (!b) return fail('JSON body required');
  const by = c.actor; // the signed-in person, never a name typed for someone else
  if (b.threadId) { const r = await addNote(c.merchantId, String(b.threadId), b.note, by, b.close === true || b.close === 'true'); return r.ok ? ok() : fail(r.error ?? 'Not saved'); }
  const r = await openThread(c.merchantId, { phone: b.phone, subject: b.subject, note: b.note, by });
  return r.ok ? ok({ thread: r.thread }) : fail(r.error);
}
