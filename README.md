# CH4T by TAKATAK

**App ID Clover (production) :** `RGE4PFGC9SR7C`
**Développeur :** TAKATAK (compte développeur Clover 9KJ25ATT15TTW)
**État au portail :** brouillon (draft) — rien de soumis.
**Dépôt :** takatakca/CH4T

## Ce que fait l'app

Messagerie et soutien client de la suite TAKATAK. À ce stade : SPEC SEULEMENT — soutien WhatsApp en spécification, aucune prise de contrôle WhatsApp, aucune API, aucun message client, réponses IA FERMÉES tant qu'une exception n'est pas accordée par Pierre. Côté Clover : le contexte client/commande dans la conversation.

## Paliers (doctrine de prix de Matt, 2026-10-28)

Chaque app a SES propres paliers. Base = le nécessaire essentiel · Premium = plus d'avantages · VIP = le full kit, tout ce que Clover offre pour la catégorie.

- **Base 50 $/mois** — fil de soutien par client reconnu par téléphone ; dernière commande du client visible dans la conversation ; réponses modèles humaines (aucune automatisation IA sans exception accordée).
- **Premium 100 $/mois** — + historique complet des commandes du client ; notifications d'état de commande (webhooks Orders) ; transfert ticket vers un humain avec contexte complet.
- **VIP 150 $/mois** — full kit : branchement TR4CKER (lien de suivi en direct) et LOY4LTY/REW4RDS (soldes visibles) ; si l'exception est accordée : réponses IA avec garde-fous (jamais de prix/menu inventé — base GitHub seulement).

Prix facturés via les plans d'abonnement du Clover App Market (à créer au portail — voir DEPLOY.md).

## Permissions Clover visées

Customers R · Orders R · Merchant R

## Structure

- `docs/listing/` — fiche marketplace (description FR/EN) et textes légaux, depuis le package de soumission local (`~/workspace/clover-apps/`)
- `app/api/clover/` — points d'entrée webhook + OAuth (scaffold, même patron que Food Hub)
- `lib/clover/config.ts` — configuration par variables d'environnement (aucun secret dans le code)
- `config/app.config.json` — identité de l'app et paliers
- `DEPLOY.md` — ce qui reste à faire, étape par étape, pour la vague portail

## Le système unique TAKATAK

Cette application fait partie de la suite TAKATAK sur Clover : toutes les apps partagent le même dos d'événements (webhooks Clover), le même **client unique reconnu par son numéro de téléphone** (+ courriel), et les mêmes commandes et paiements Clover. Aucune app ne vit en silo : les données qu'elle produit alimentent les autres apps de la suite (voir « Clover API — Main Stuff — Robot Notepad », section 3, déposé au Drive Opérations et dans `~/workspace/clover-apps/`).

