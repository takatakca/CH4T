// CH4T — customer support threads for the team, with the customer's Clover context.
// Spec rule (README): NO message is sent to customers from this app, NO WhatsApp, and AI replies stay OFF until an
// exception is granted (Pierre). So this module has no sending code at all: it keeps internal threads (notes, status)
// and human reply templates the staff copy into their own channel.
//  - A thread is keyed by the customer's phone; it shows the Clover customer and their last order.
import crypto from 'node:crypto';
import { cloverGet, cloverGetAll, mpath } from '../clover/api';
import { normalizePhone } from '../core/phone';
import { getStore } from '../core/store';

export interface Note { text: string; by: string; at: string }
export interface Thread { id: string; phone: string; customerName: string | null; cloverCustomerId: string | null; status: 'open' | 'closed'; subject: string; notes: Note[]; createdAt: string; updatedAt: string }
export interface Template { id: string; title: string; fr: string; en: string }
export const THREADS = 'threads';
export const TEMPLATES = 'templates';
export const DEFAULT_TEMPLATES: Template[] = [
  { id: 'delay', title: 'Retard / Delay', fr: 'Bonjour ! Votre commande a un léger retard, elle sera prête dans environ {min} minutes. Merci de votre patience.', en: 'Hi! Your order is running a little late; it will be ready in about {min} minutes. Thank you for your patience.' },
  { id: 'missing', title: 'Article manquant / Missing item', fr: 'Nous sommes désolés pour l’article manquant. Nous vous proposons {offre}.', en: 'We are sorry about the missing item. We would like to offer you {offer}.' },
  { id: 'thanks', title: 'Merci / Thanks', fr: 'Merci de votre message ! Toute l’équipe vous remercie.', en: 'Thank you for your message! The whole team thanks you.' },
];

const cache = new Map<string, { at: number; byPhone: Map<string, any> }>();
/** Clover customer with this phone (customers read once every 5 minutes per merchant). */
export async function findCustomer(mid: string, phone: string): Promise<{ id: string; name: string | null } | null> {
  let c = cache.get(mid);
  if (!c || Date.now() - c.at > 5 * 60_000) {
    const r = await cloverGetAll<any>(mid, mpath(mid, '/customers'), { expand: 'phoneNumbers' }, 50_000);
    const byPhone = new Map<string, any>();
    for (const x of r.items) for (const p of (x.phoneNumbers?.elements ?? []) as any[]) { const n = normalizePhone(p.phoneNumber); if (n && !byPhone.has(n)) byPhone.set(n, x); }
    c = { at: Date.now(), byPhone };
    cache.set(mid, c);
  }
  const x = c.byPhone.get(phone);
  return x ? { id: String(x.id), name: [x.firstName, x.lastName].filter(Boolean).join(' ').trim() || null } : null;
}

/** The customer's last Clover order (number of items, total, date). */
export async function lastOrder(mid: string, customerId: string): Promise<{ id: string; totalCents: number; createdTime: number; items: string[] } | null> {
  const r = await cloverGet<any>(mid, mpath(mid, `/customers/${encodeURIComponent(customerId)}`), { expand: 'orders' });
  const orders = ((r.json?.orders?.elements ?? []) as any[]).filter((o) => o.id).sort((a, b) => (Number(b.createdTime) || 0) - (Number(a.createdTime) || 0));
  if (!orders.length) return null;
  const o = await cloverGet<any>(mid, mpath(mid, `/orders/${encodeURIComponent(orders[0].id)}`), { expand: 'lineItems' });
  if (!o.ok || !o.json) return null;
  return { id: String(o.json.id), totalCents: Number(o.json.total) || 0, createdTime: Number(o.json.createdTime) || 0, items: ((o.json.lineItems?.elements ?? []) as any[]).map((l) => String(l.name ?? '')).slice(0, 20) };
}

export async function openThread(mid: string, input: { phone?: unknown; subject?: unknown; note?: unknown; by?: string }): Promise<{ ok: true; thread: Thread } | { ok: false; error: string }> {
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: 'Phone number is not valid.' };
  const subject = String(input.subject ?? '').trim().slice(0, 100);
  if (!subject) return { ok: false, error: 'Give a subject.' };
  const cust = await findCustomer(mid, phone).catch(() => null);
  const now = new Date().toISOString();
  const t: Thread = { id: crypto.randomUUID(), phone, customerName: cust?.name ?? null, cloverCustomerId: cust?.id ?? null, status: 'open', subject, notes: [], createdAt: now, updatedAt: now };
  if (input.note) t.notes.push({ text: String(input.note).slice(0, 2000), by: (input.by ?? 'Équipe').slice(0, 60), at: now });
  await getStore().put(THREADS, t.id, mid, t, now);
  return { ok: true, thread: t };
}

export async function addNote(mid: string, id: string, text: unknown, by: string, close = false): Promise<{ ok: boolean; error?: string }> {
  const d = await getStore().get<Thread>(THREADS, id);
  if (!d || d.merchantId !== mid) return { ok: false, error: 'Not found.' };
  const body = String(text ?? '').trim().slice(0, 2000);
  if (!body && !close) return { ok: false, error: 'Write a note.' };
  const now = new Date().toISOString();
  const t = { ...d.data, notes: body ? [...d.data.notes, { text: body, by: by.slice(0, 60), at: now }] : d.data.notes, status: close ? 'closed' as const : d.data.status, updatedAt: now };
  await getStore().put(THREADS, id, mid, t, d.at);
  return { ok: true };
}

export async function listThreads(mid: string, status?: 'open' | 'closed'): Promise<Thread[]> {
  return (await getStore().list<Thread>(THREADS, { merchantId: mid, limit: 500 })).map((d) => d.data).filter((t) => !status || t.status === status);
}

export async function templates(mid: string): Promise<Template[]> {
  return [...DEFAULT_TEMPLATES, ...(await getStore().list<Template>(TEMPLATES, { merchantId: mid, limit: 100 })).map((d) => d.data)];
}

export async function addTemplate(mid: string, input: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const t: Template = { id: crypto.randomUUID(), title: String(input.title ?? '').trim().slice(0, 60), fr: String(input.fr ?? '').trim().slice(0, 600), en: String(input.en ?? '').trim().slice(0, 600) };
  if (!t.title || (!t.fr && !t.en)) return { ok: false, error: 'Title and at least one language.' };
  await getStore().put(TEMPLATES, t.id, mid, t);
  return { ok: true };
}

export const clearCustomerCache = () => cache.clear();
