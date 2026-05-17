# Bluu3

Bluu3 — Votre piscine, toujours sous contrôle.

MVP v1 pour transformer la landing + démo visuelle existante en application SaaS piscine utilisable par des pilotes : dashboard pisciniste B2B, espace propriétaire B2C, PostgreSQL, API Node, Eco-Score MVP, Pool Passport MVP et exports PDF simples.

## Stack

- Frontend : Astro + React
- Backend/API : Node.js via endpoints Astro server-side, préparé Railway
- Base : PostgreSQL
- Infra MVP : GitHub + Railway
- Mobile : web app responsive/PWA ensuite, pas d'app native en v1

## Installation locale

```bash
npm install
cp .env.example .env
npm run dev
```

Sans `DATABASE_URL`, l'application utilise les données seed locales TypeScript pour tester immédiatement les écrans.

## Variables d'environnement

```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:4321
NODE_ENV=development
OPENAI_API_KEY=
LLM_API_KEY=
```

`OPENAI_API_KEY` ou `LLM_API_KEY` sont réservées aux futures fonctions IA. Le MVP actuel n'en dépend pas.

## Base PostgreSQL

```bash
npm run db:migrate
npm run db:seed
```

Le schéma crée :

- `users`
- `properties`
- `pools`
- `measurements`
- `operational_checks`
- `interventions`
- `eco_scores`
- `pool_passports`
- `reports`

Le seed crée 1 admin, 1 provider, 2 owners, 3 propriétés, 4 piscines, 12 mesures, 8 checks opérationnels, 5 interventions, 4 Eco-Scores, 4 Pool Passports et 3 rapports.

## Railway

1. Créer un projet Railway.
2. Ajouter un service PostgreSQL.
3. Ajouter le service web depuis le repo GitHub et la branche `bluu3`.
4. Configurer `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `NODE_ENV=production` et `LLM_API_KEY` si nécessaire.
5. Lancer `npm run db:migrate` puis `npm run db:seed` dans un shell Railway ou en local avec l'URL Railway.
6. Déployer avec la commande de start Railway : `node ./dist/server/entry.mjs`.

Commandes Railway recommandées :

```bash
npm install && npm run build
node ./dist/server/entry.mjs
```

OVH reste uniquement une option future d'industrialisation, pas l'infrastructure MVP v1.

## Fonctionnel MVP

- Rebranding Bluu3 sur landing, metadata, dashboard et README
- Routes `/app`, `/app/owner`, `/app/provider`, `/app/pools`, `/app/measurements`, `/app/interventions`, `/app/passport`, `/app/eco-score`, `/app/admin`
- Auth simple MVP : `POST /api/auth/login` par email seed, cookie `bluu3_user`
- CRUD API de base : `GET/POST /api/pools`, `/api/measurements`, `/api/checks`, `/api/interventions`, `/api/reports`
- Eco-Score MVP calculé par `calculateEcoScore(pool, measurements, interventions)`
- Pool Passport MVP visible dans l'app
- Exports PDF : `/api/exports/monthly`, `/api/exports/passport`, `/api/exports/intervention`

## Roadmap MVP

1. Brancher les formulaires UI sur les endpoints POST.
2. Ajouter édition/suppression API pour CRUD complet.
3. Ajouter auth mot de passe ou magic link.
4. Ajouter migrations versionnées.
5. Ajouter CI GitHub build + checks.
6. Activer staging et production Railway.
7. Préparer PWA et wrapper mobile en phase 2.
