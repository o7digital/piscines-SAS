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
HF_TOKEN=
HF_MODEL=Qwen/Qwen3-235B-A22B-Instruct-2507:novita
```

Les analyses des mesures et des rapports utilisent Hugging Face avec `HF_TOKEN` et `HF_MODEL`, uniquement côté serveur. Ajouter ces variables à `.env.local` en local et aux environnements Vercel du projet lié. Le jeton doit permettre les appels aux Inference Providers. Ne jamais utiliser de variable `PUBLIC_` pour ce jeton.

`OPENAI_API_KEY` et `LLM_API_KEY` ne sont pas utilisées par ce reporting.

## Reporting avec Hugging Face

- `/app/measurements` : analyse individuelle de chaque relevé (pH, chlore, température, ORP, alcalinité, dureté), avec contexte mensuel et recommandations. La saisie d'une nouvelle mesure lance automatiquement l'analyse.
- `/app/reports` : filtres par mois et bassin, indicateurs calculés sur tous les relevés de la période, courbes, synthèse IA automatique et exports PDF/CSV. Rapports également disponibles sur `/en/app/reports` et `/es/app/reports`.
- `POST /api/reports/summary` : JSON `{ "month": "2026-05", "pool": "pool-villa-azur", "measurement": "mea-1", "lang": "fr" }`. `pool` et `measurement` sont facultatifs.
- `POST /api/measurements` : valide et enregistre une mesure, puis retourne `analysis` et `persisted` en plus des champs du relevé.
- `POST /api/exports/monthly` : mêmes filtres ; génère le PDF avec l'analyse Hugging Face. `GET` exporte une synthèse calculée sans appel facturé. `/api/reports/export?month=2026-05` exporte le CSV.

Les valeurs restent calculées par le serveur. Hugging Face reçoit des observations anonymisées sans noms, adresses ni notes. Le contexte détaillé est borné à 200 mesures récentes et 30 bassins ; les statistiques couvrent toujours tous les relevés, et les limites de détail sont signalées dans le contexte IA. Un relevé sélectionné est toujours transmis intégralement. Les recommandations doivent être relues par le pisciniste.

Les réponses IA sont validées avant affichage. En cas d'indisponibilité, de configuration manquante, d'erreur d'authentification ou de réponse incorrecte, la synthèse calculée est clairement identifiée. Les appels identiques sont regroupés et mis en cache 15 minutes par instance ; un limiteur de 5 requêtes/minute par adresse et par instance protège les endpoints d'analyse. Une limitation persistante à l'échelle du déploiement pourra être ajoutée à l'infrastructure d'hébergement.

Sans `DATABASE_URL`, les données de mai 2026 sont des exemples. Les nouvelles mesures sont analysées sans sauvegarde durable ; elles restent dans la session du navigateur et peuvent être incluses dans leur PDF grâce à une observation validée envoyée au serveur. Les données de PostgreSQL sont utilisées dès que la base est configurée. L'Eco-Score est une estimation MVP, pas une économie environnementale mesurée.

Tests : `npm test`. Pour les tests navigateur, installer Chromium avec `npx playwright install chromium`, puis lancer `npm run test:e2e` (le serveur de test démarre automatiquement). `TEST_BASE_URL` permet de vérifier un serveur existant.

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
