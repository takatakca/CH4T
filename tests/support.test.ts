// CH4T: threads keyed by phone with the Clover customer, notes, closing, templates — and no sending at all.
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addNote, addTemplate, clearCustomerCache, findCustomer, lastOrder, listThreads, openThread, templates } from '@/lib/domain/support';
import { connect, fakeClover, MID } from './helpers';

beforeEach(async () => {
  clearCustomerCache();
  fakeClover([(u) => {
    if (u.pathname.endsWith('/customers')) return { elements: [{ id: 'CUSTANA00001', firstName: 'Ana', lastName: 'B', phoneNumbers: { elements: [{ phoneNumber: '+1 514 555 0101' }] } }] };
    if (u.pathname.endsWith('/customers/CUSTANA00001')) return { orders: { elements: [{ id: 'ORDOLD000001', createdTime: 1 }, { id: 'ORDNEW000001', createdTime: 9 }] } };
    if (u.pathname.endsWith('/orders/ORDNEW000001')) return { id: 'ORDNEW000001', total: 2300, createdTime: 9, lineItems: { elements: [{ name: 'Poutine' }] } };
    return undefined;
  }]);
  await connect();
});
afterEach(() => vi.unstubAllGlobals());

describe('support', () => {
  it('finds the Clover customer by phone and their last order', async () => {
    expect(await findCustomer(MID, '+15145550101')).toEqual({ id: 'CUSTANA00001', name: 'Ana B' });
    expect(await findCustomer(MID, '+15145550000')).toBeNull();
    expect(await lastOrder(MID, 'CUSTANA00001')).toEqual({ id: 'ORDNEW000001', totalCents: 2300, createdTime: 9, items: ['Poutine'] });
  });

  it('opens a thread, adds notes, closes it', async () => {
    expect(await openThread(MID, { phone: '12', subject: 'x' })).toMatchObject({ ok: false });
    const r = await openThread(MID, { phone: '514 555 0101', subject: 'Frites froides', note: 'Client a appelé' });
    if (!r.ok) throw new Error(r.error);
    expect(r.thread).toMatchObject({ customerName: 'Ana B', cloverCustomerId: 'CUSTANA00001', status: 'open' });
    expect(await addNote(MID, r.thread.id, '', 'Lee')).toMatchObject({ ok: false });
    expect(await addNote(MID, r.thread.id, 'Rabais offert', 'Lee', true)).toEqual({ ok: true });
    expect(await listThreads(MID, 'open')).toHaveLength(0);
    expect((await listThreads(MID, 'closed'))[0].notes.map((n) => n.text)).toEqual(['Client a appelé', 'Rabais offert']);
    expect(await addNote('OTHERMERCHANT', r.thread.id, 'x', 'y')).toMatchObject({ ok: false });
  });

  it('templates: defaults + the merchant’s own', async () => {
    expect(await addTemplate(MID, { title: '' })).toMatchObject({ ok: false });
    await addTemplate(MID, { title: 'Fermé', fr: 'Nous sommes fermés.' });
    expect((await templates(MID)).map((t) => t.title)).toContain('Fermé');
  });

  it('has no code that sends messages (spec: no outbound until Pierre grants an exception)', () => {
    const src = ['lib/domain/support.ts', 'lib/domain/index.ts'].map((f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8')).join('\n');
    expect(src).not.toMatch(/twilio|whatsapp\.com|graph\.facebook|sendSms|sendMessage|api\.anthropic|openai/i);
  });
});
