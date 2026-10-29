// CH4T's side of the shared shell: hooks, menu sections, authorized actions, device kinds, what each plan adds.
// No hooks: no automatic message, no AI reply (spec rule: exception from Pierre required first).
import type { AppHooks } from '../hooks';
import type { AppAction, AppSection, DeviceKind, TierFeatures } from '../nav';

export const hooks: AppHooks = {};

export const sections: AppSection[] = [
  { slug: '', fr: 'Fils ouverts', en: 'Open threads', icon: 'chat', hintFr: 'Chaque demande d’un client, avec sa dernière commande Clover.', hintEn: 'Each customer request, with their last Clover order.' },
  { slug: 'new', fr: 'Nouveau fil', en: 'New thread', icon: 'plus', view: 'support.threads', hintFr: 'Un client appelle ou écrit : notez-le ici.', hintEn: 'A customer calls or writes: note it here.' },
  { slug: 'lookup', fr: 'Trouver un client', en: 'Find a customer', icon: 'search', view: 'support.lookup', hintFr: 'Par téléphone : sa fiche Clover et sa dernière commande.', hintEn: 'By phone: their Clover record and last order.' },
  { slug: 'closed', fr: 'Fils fermés', en: 'Closed threads', icon: 'archive', hintFr: 'Les demandes réglées.', hintEn: 'Requests that are settled.' },
  { slug: 'templates', fr: 'Réponses modèles', en: 'Reply templates', icon: 'template', hintFr: 'Des réponses prêtes à copier, en français et en anglais.', hintEn: 'Replies ready to copy, in French and English.' },
];

export const actions: AppAction[] = [
  { key: 'support.threads', fr: 'Ouvrir des fils, ajouter des notes, les fermer', en: 'Open threads, add notes, close them', min: 'employee' },
  { key: 'support.lookup', fr: 'Chercher un client par téléphone', en: 'Look up a customer by phone', min: 'employee' },
  { key: 'support.templates', fr: 'Ajouter des réponses modèles', en: 'Add reply templates', min: 'manager' },
];

export const deviceKinds: DeviceKind[] = [];

export const tierFeatures: TierFeatures = {
  base: [
    ['Fils de soutien par client, reconnu par son téléphone', 'Support threads per customer, recognised by phone'],
    ['Dernière commande Clover du client dans le fil', 'The customer’s last Clover order in the thread'],
    ['Réponses modèles en français et en anglais', 'Reply templates in French and English'],
    ['Aucun envoi automatique : vous gardez la main', 'No automatic sending: you stay in control'],
  ],
  premium: [
    ['Bientôt : historique complet des commandes du client, notifications d’état de commande', 'Coming: the customer’s full order history, order status notifications'],
  ],
  vip: [
    ['Bientôt : suivi TR4CKER et soldes LOY4LTY / REW4RDS dans le fil', 'Coming: TR4CKER tracking and LOY4LTY / REW4RDS balances in the thread'],
  ],
};
