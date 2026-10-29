import { money, pick } from '@/lib/core/i18n';
import { maskPhone } from '@/lib/core/phone';
import type { PageCtx } from '@/lib/core/page';
import { lastOrder, listThreads, templates, type Thread } from '@/lib/domain/support';
import { ApiForm } from './ApiForm';
import { Badge, Banner, Card, Empty, Stat } from './ui';

// CH4T screens (lib/domain `sections`): open threads, new thread, find a customer, closed threads, reply templates.
// Nothing is sent to customers: staff reply with their usual channel.
const fmt = (ms: number | string, lang: 'fr' | 'en') => new Date(ms).toLocaleString(lang === 'en' ? 'en-CA' : 'fr-CA');

export async function Panel({ ctx, section }: { ctx: PageCtx; section: string; query?: Record<string, string> }) {
  const { lang, merchantId } = ctx;
  switch (section) {
    case '': return <OpenThreads ctx={ctx} />;
    case 'new': return (
      <Card title={pick(lang, 'Nouveau fil', 'New thread')} icon="plus" sub={pick(lang, 'Le client est retrouvé dans Clover par son téléphone.', 'The customer is found in Clover by phone.')}>
        <ApiForm action="/api/support/threads" fields={[
          { name: 'phone', label: pick(lang, 'Téléphone du client', 'Customer phone'), type: 'tel', required: true },
          { name: 'subject', label: pick(lang, 'Sujet', 'Subject'), required: true },
          { name: 'note', label: pick(lang, 'Note', 'Note'), type: 'textarea' },
        ]} submit={pick(lang, 'Ouvrir', 'Open')} done={pick(lang, 'Fil ouvert : voyez-le dans Fils ouverts.', 'Thread opened: see it in Open threads.')} />
      </Card>
    );
    case 'lookup': return (
      <Card title={pick(lang, 'Trouver un client', 'Find a customer')} icon="search" sub={pick(lang, 'Le numéro n’est jamais mis dans l’adresse de la page.', 'The number never goes into the page address.')}>
        <ApiForm action="/api/support/lookup" lang={lang} fields={[{ name: 'phone', label: pick(lang, 'Téléphone', 'Phone'), type: 'tel', required: true }]} submit={pick(lang, 'Chercher', 'Search')}
          result={pick(lang, '{customer?Client Clover : {customer.name}. Dernière commande : {lastOrder.totalCents|money}, {lastOrder.items}.|Aucun client Clover pour ce numéro.}', '{customer?Clover customer: {customer.name}. Last order: {lastOrder.totalCents|money}, {lastOrder.items}.|No Clover customer for this number.}')} />
      </Card>
    );
    case 'closed': {
      const closed = await listThreads(merchantId!, 'closed');
      return (
        <Card title={pick(lang, 'Fils fermés', 'Closed threads')} icon="archive" right={<Badge>{closed.length}</Badge>}>
          {closed.length === 0 ? <Empty icon="archive">{pick(lang, 'Aucun fil fermé.', 'No closed thread.')}</Empty> : (
            <div className="table-wrap"><table><thead><tr><th>{pick(lang, 'Sujet', 'Subject')}</th><th>{pick(lang, 'Client', 'Customer')}</th><th>{pick(lang, 'Notes', 'Notes')}</th><th>{pick(lang, 'Fermé', 'Closed')}</th></tr></thead>
              <tbody>{closed.map((t) => <tr key={t.id}><td>{t.subject}</td><td>{t.customerName ?? maskPhone(t.phone)}</td><td className="right">{t.notes.length}</td><td className="nowrap">{fmt(t.updatedAt, lang)}</td></tr>)}</tbody></table></div>
          )}
        </Card>
      );
    }
    case 'templates': return <Templates ctx={ctx} />;
    default: return null;
  }
}

async function OpenThreads({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  const [open, closed] = await Promise.all([listThreads(merchantId!, 'open'), listThreads(merchantId!, 'closed')]);
  const contexts = await Promise.all(open.slice(0, 15).map((t) => (t.cloverCustomerId ? lastOrder(merchantId!, t.cloverCustomerId).catch(() => null) : Promise.resolve(null))));
  const can = ctx.can('support.threads');
  return (
    <>
      <Banner tone="info">{pick(lang, 'CH4T n’envoie aucun message aux clients pour l’instant (WhatsApp et réponses IA fermés tant qu’une exception n’est pas accordée par Pierre). Notez ici, répondez avec votre canal habituel.', 'CH4T sends no message to customers for now (WhatsApp and AI replies are closed until Pierre grants an exception). Take notes here, reply with your usual channel.')}</Banner>
      <div className="grid">
        <Stat label={pick(lang, 'Fils ouverts', 'Open threads')} value={open.length} tone={open.length > 10 ? 'warn' : undefined} />
        <Stat label={pick(lang, 'Fermés', 'Closed')} value={closed.length} />
      </div>
      {open.length === 0 ? <Card title={pick(lang, 'Fils ouverts', 'Open threads')} icon="chat"><Empty icon="chat">{pick(lang, 'Aucune demande en cours.', 'No request in progress.')}</Empty></Card>
        : open.slice(0, 15).map((t, i) => <ThreadCard key={t.id} ctx={ctx} t={t} last={contexts[i]} can={can} />)}
    </>
  );
}

function ThreadCard({ ctx, t, last, can }: { ctx: PageCtx; t: Thread; last: Awaited<ReturnType<typeof lastOrder>>; can: boolean }) {
  const { lang } = ctx;
  return (
    <Card title={t.subject} icon="chat" sub={`${t.customerName ?? maskPhone(t.phone)} · ${pick(lang, 'ouvert le', 'opened')} ${fmt(t.createdAt, lang)}`}>
      {last && <p className="muted small">{pick(lang, 'Dernière commande Clover', 'Last Clover order')} : {money(last.totalCents, lang)} · {fmt(last.createdTime, lang)} · {last.items.join(', ')}</p>}
      {t.notes.length > 0 && <ol className="notes">{t.notes.map((n, j) => <li key={j}><div className="note-head"><strong>{n.by}</strong><span className="muted small">{fmt(n.at, lang)}</span></div><p>{n.text}</p></li>)}</ol>}
      {can && <ApiForm action="/api/support/threads" extra={{ threadId: t.id }} fields={[{ name: 'note', label: pick(lang, 'Ajouter une note', 'Add a note'), type: 'textarea' }, { name: 'close', label: pick(lang, 'Fermer le fil ?', 'Close the thread?'), type: 'select', options: [{ value: 'false', label: pick(lang, 'Non', 'No') }, { value: 'true', label: pick(lang, 'Oui', 'Yes') }] }]} submit={pick(lang, 'Enregistrer', 'Save')} done={pick(lang, 'Enregistré.', 'Saved.')} />}
    </Card>
  );
}

async function Templates({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  const tpl = await templates(merchantId!);
  return (
    <>
      <Card title={pick(lang, 'Réponses modèles', 'Reply templates')} icon="template" right={<Badge>{tpl.length}</Badge>}>
        {tpl.length === 0 ? <Empty icon="template">{pick(lang, 'Aucune réponse modèle.', 'No reply template.')}</Empty>
          : tpl.map((x) => <details key={x.id} className="tpl"><summary>{x.title}</summary><p>{x.fr}</p>{x.en && <p className="muted">{x.en}</p>}</details>)}
      </Card>
      {ctx.can('support.templates') && (
        <Card title={pick(lang, 'Nouvelle réponse', 'New reply')} icon="plus">
          <ApiForm action="/api/support/templates" fields={[{ name: 'title', label: pick(lang, 'Titre', 'Title'), required: true }, { name: 'fr', label: 'Français', type: 'textarea' }, { name: 'en', label: 'English', type: 'textarea' }]} submit={pick(lang, 'Ajouter', 'Add')} done={pick(lang, 'Ajoutée.', 'Added.')} />
        </Card>
      )}
    </>
  );
}
