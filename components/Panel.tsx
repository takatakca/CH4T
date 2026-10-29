import { money, pick } from '@/lib/core/i18n';
import { maskPhone } from '@/lib/core/phone';
import type { PageCtx } from '@/lib/core/page';
import { lastOrder, listThreads, templates } from '@/lib/domain/support';
import { ApiForm } from './ApiForm';
import { Banner, Card, Stat } from './ui';

// CH4T dashboard: open support threads with the customer's Clover context, notes, templates. Nothing is sent.
export async function Panel({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  if (!merchantId) return null;
  const [open, closed, tpl] = await Promise.all([listThreads(merchantId, 'open'), listThreads(merchantId, 'closed'), templates(merchantId)]);
  const contexts = await Promise.all(open.slice(0, 10).map((t) => (t.cloverCustomerId ? lastOrder(merchantId, t.cloverCustomerId).catch(() => null) : Promise.resolve(null))));
  const fmt = (ms: number) => new Date(ms).toLocaleString(lang === 'en' ? 'en-CA' : 'fr-CA');
  return (
    <>
      <Banner tone="info">{pick(lang, 'CH4T n’envoie aucun message aux clients pour l’instant (WhatsApp et réponses IA fermés tant qu’une exception n’est pas accordée par Pierre). Notez ici, répondez avec votre canal habituel.', 'CH4T sends no message to customers for now (WhatsApp and AI replies are closed until Pierre grants an exception). Take notes here, reply with your usual channel.')}</Banner>
      <div className="grid">
        <Stat label={pick(lang, 'Fils ouverts', 'Open threads')} value={open.length} />
        <Stat label={pick(lang, 'Fermés', 'Closed')} value={closed.length} />
      </div>
      <Card title={pick(lang, 'Nouveau fil', 'New thread')}>
        <ApiForm action="/api/support/threads" fields={[
          { name: 'phone', label: pick(lang, 'Téléphone du client', 'Customer phone'), type: 'tel', required: true },
          { name: 'subject', label: pick(lang, 'Sujet', 'Subject'), required: true },
          { name: 'note', label: pick(lang, 'Note', 'Note'), type: 'textarea' },
        ]} submit={pick(lang, 'Ouvrir', 'Open')} />
      </Card>
      {open.map((t, i) => (
        <Card key={t.id} title={`${t.subject} · ${t.customerName ?? maskPhone(t.phone)}`}>
          {contexts[i] && <p className="muted">{pick(lang, 'Dernière commande Clover', 'Last Clover order')} : {money(contexts[i]!.totalCents, lang)} · {fmt(contexts[i]!.createdTime)} · {contexts[i]!.items.join(', ')}</p>}
          {t.notes.map((n, j) => <p key={j}><strong>{n.by}</strong> <span className="muted">{new Date(n.at).toLocaleString(lang === 'en' ? 'en-CA' : 'fr-CA')}</span><br />{n.text}</p>)}
          <ApiForm action="/api/support/threads" extra={{ threadId: t.id }} fields={[{ name: 'note', label: pick(lang, 'Ajouter une note', 'Add a note'), type: 'textarea' }, { name: 'close', label: pick(lang, 'Fermer ?', 'Close?'), type: 'select', options: [{ value: 'false', label: pick(lang, 'Non', 'No') }, { value: 'true', label: pick(lang, 'Oui', 'Yes') }] }]} submit={pick(lang, 'Enregistrer', 'Save')} />
        </Card>
      ))}
      <Card title={pick(lang, 'Réponses modèles', 'Reply templates')}>
        {tpl.map((x) => <details key={x.id}><summary>{x.title}</summary><p>{pick(lang, x.fr || x.en, x.en || x.fr)}</p></details>)}
        <ApiForm action="/api/support/templates" fields={[{ name: 'title', label: pick(lang, 'Titre', 'Title'), required: true }, { name: 'fr', label: 'Français', type: 'textarea' }, { name: 'en', label: 'English', type: 'textarea' }]} submit={pick(lang, 'Ajouter', 'Add')} />
      </Card>
    </>
  );
}
