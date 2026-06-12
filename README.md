# MatchPulse — Calendrier Esport Personnalisé

Suivez les compétitions esport qui vous intéressent : League of Legends, Valorant, Rocket League.  
Filtrez par jeu, équipe ou compétition. Construisez votre agenda personnalisé.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 15+ (App Router) |
| Langage | TypeScript |
| Base de données | PostgreSQL |
| ORM | Prisma |
| CSS | Tailwind CSS |
| API externe | PandaScore |
| Déploiement | Vercel |

---

## Variables d'environnement

Copiez `.env.example` → `.env.local` et remplissez les valeurs.

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | URL PostgreSQL (`postgresql://user:pass@host:port/db`) |
| `PANDASCORE_API_TOKEN` | ✅ | Token API PandaScore ([pandascore.co](https://pandascore.co)) |
| `PANDASCORE_BASE_URL` | ✅ | `https://api.pandascore.co` |
| `SYNC_SECRET` | ✅ | Secret pour `POST /api/sync/pandascore` (sync manuelle) |
| `CRON_SECRET` | ✅ | Secret pour `GET /api/cron/sync` (Vercel Cron) |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL publique de l'app (`http://localhost:3000` en dev) |
| `APP_ENV` | — | `development` ou `production` |

> Générer des secrets sécurisés : `openssl rand -hex 32`

---

## Installation locale

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- Un token PandaScore (gratuit sur [pandascore.co](https://pandascore.co))

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/Thomaslogeais/PlanEsport.git
cd PlanEsport

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# 4. Créer la base de données et appliquer les migrations
npx prisma migrate deploy

# 5. Seeder les jeux (League of Legends, Valorant, Rocket League)
npx prisma db seed

# 6. Lancer le serveur de développement
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

---

## Commandes Prisma

```bash
# Appliquer les migrations en développement
npx prisma migrate dev

# Appliquer les migrations en production
npx prisma migrate deploy

# Seeder la base (jeux)
npx prisma db seed

# Ouvrir Prisma Studio (interface BDD)
npx prisma studio

# Valider le schéma
npx prisma validate

# Regénérer le client
npx prisma generate
```

---

## Synchronisation manuelle

La route `POST /api/sync/pandascore` permet de déclencher une sync à la demande.

### Auth

```bash
# Via query param (dev uniquement)
curl -X POST "http://localhost:3000/api/sync/pandascore?game=league-of-legends&secret=your_sync_secret"

# Via header
curl -X POST "http://localhost:3000/api/sync/pandascore?game=valorant" \
     -H "x-sync-secret: your_sync_secret"
```

### Paramètre `game`

| Valeur | Effet |
|---|---|
| `league-of-legends` | Sync LoL uniquement |
| `valorant` | Sync Valorant uniquement |
| `rocket-league` | Sync Rocket League uniquement |
| `all` | Sync séquentielle des 3 jeux |

### Exemples complets

```bash
# Sync LoL
curl -X POST "http://localhost:3000/api/sync/pandascore?game=league-of-legends&secret=dev_sync_secret_changeme"

# Sync Valorant
curl -X POST "http://localhost:3000/api/sync/pandascore?game=valorant&secret=dev_sync_secret_changeme"

# Sync Rocket League
curl -X POST "http://localhost:3000/api/sync/pandascore?game=rocket-league&secret=dev_sync_secret_changeme"

# Sync tous les jeux
curl -X POST "http://localhost:3000/api/sync/pandascore?game=all&secret=dev_sync_secret_changeme"
```

### Réponse

```json
{
  "ok": true,
  "provider": "pandascore",
  "game": "valorant",
  "summary": {
    "competitions": { "created": 2, "updated": 10 },
    "tournaments":  { "created": 5, "updated": 20 },
    "teams":        { "created": 40, "updated": 60 },
    "matches":      { "created": 50, "updated": 0 },
    "matchTeams":   { "created": 100, "updated": 0 }
  },
  "errors": []
}
```

---

## Synchronisation cron

La route `GET /api/cron/sync` est dédiée à l'automatisation.  
Elle synchronise les 3 jeux séquentiellement : LoL → Valorant → Rocket League.

### Auth (3 niveaux)

| Méthode | Usage |
|---|---|
| `Authorization: Bearer <CRON_SECRET>` | Vercel Cron (production) |
| `x-sync-secret: <SYNC_SECRET>` | Compat sync manuelle |
| `?secret=<SYNC_SECRET>` | Dev local uniquement (ignoré en prod) |

### Exemples locaux

```bash
# Via query param (dev uniquement)
curl -X GET "http://localhost:3000/api/cron/sync?secret=dev_sync_secret_changeme"

# Via header custom
curl -X GET "http://localhost:3000/api/cron/sync" \
     -H "x-sync-secret: dev_sync_secret_changeme"

# Via Bearer token (comme Vercel Cron)
curl -X GET "http://localhost:3000/api/cron/sync" \
     -H "Authorization: Bearer your_cron_secret"
```

### Exemple en production (Vercel Cron)

Vercel envoie automatiquement le header :
```
Authorization: Bearer <CRON_SECRET>
```
La variable `CRON_SECRET` doit être configurée dans les variables d'environnement Vercel.

### Réponse (succès)

```json
{
  "ok": true,
  "provider": "pandascore",
  "source": "cron",
  "startedAt": "2026-06-12T11:00:00.000Z",
  "endedAt": "2026-06-12T11:00:45.123Z",
  "durationMs": 45123,
  "games": {
    "league-of-legends": { "ok": true, "summary": { "..." } },
    "valorant":          { "ok": true, "summary": { "..." } },
    "rocket-league":     { "ok": true, "summary": { "..." } }
  }
}
```

### Réponse (échec partiel)

```json
{
  "ok": false,
  "status": "partial",
  "provider": "pandascore",
  "source": "cron",
  "games": {
    "league-of-legends": { "ok": true },
    "valorant":          { "ok": true },
    "rocket-league":     { "ok": false, "errors": ["..."] }
  }
}
```

### Garde-fou anti double-exécution

La route vérifie si une sync cron est déjà en cours depuis moins de **10 minutes**.  
Si c'est le cas, elle retourne `409 Conflict` :

```json
{
  "ok": false,
  "status": "already_running",
  "message": "Une sync cron est déjà en cours (< 10 min). Réessayez plus tard."
}
```

---

## Configuration Vercel Cron

Le fichier `vercel.json` à la racine configure les cron jobs :

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

> `0 * * * *` = toutes les heures (à la minute 0 de chaque heure).

### Limites selon le plan Vercel

| Plan | Fréquence minimale | Notes |
|---|---|---|
| Hobby (gratuit) | 1x/jour | Utiliser `"0 5 * * *"` |
| Pro | 1x/heure | `"0 * * * *"` OK |
| Enterprise | Jusqu'à 1x/minute | |

Si vous êtes sur le plan Hobby, remplacez le schedule par une fréquence quotidienne :

```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 5 * * *"
    }
  ]
}
```

### Notes importantes

- Les cron jobs Vercel s'exécutent **uniquement sur le déploiement Production**.
- Ils ne s'exécutent pas en Preview ni en local.
- `CRON_SECRET` doit être configuré dans les **Environment Variables** de votre projet Vercel (Settings → Environment Variables).
- La durée maximale d'exécution d'une route est limitée selon le plan (60s sur Hobby, 300s sur Pro).  
  Si la sync des 3 jeux dépasse la limite, envisagez de séparer en 3 routes cron distinctes (`/api/cron/sync/lol`, `/api/cron/sync/valorant`, etc.).

---

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── cron/sync/route.ts        ← GET cron (Vercel Cron)
│   │   ├── sync/pandascore/route.ts  ← POST sync manuelle
│   │   ├── matches/route.ts
│   │   ├── tournaments/route.ts
│   │   ├── competitions/route.ts
│   │   ├── teams/route.ts
│   │   ├── agenda/route.ts
│   │   └── explore/facets/route.ts
│   ├── matches/        → liste + détail
│   ├── tournaments/    → liste + détail
│   ├── competitions/   → détail
│   ├── teams/          → liste + détail
│   ├── agenda/         → agenda personnalisé
│   └── explore/        → moteur de recherche global
│
├── lib/
│   ├── providers/pandascore/   ← client HTTP PandaScore (backend only)
│   ├── normalizers/            ← PandaScore → modèle interne
│   ├── sync/                   ← logique sync + upsert
│   └── db/                     ← requêtes Prisma
│
└── components/
    ├── matches/
    ├── tournaments/
    ├── competitions/
    ├── agenda/
    └── ui/
```

**Règle fondamentale** : le frontend n'appelle **jamais** PandaScore directement.  
Flux : PandaScore → `lib/providers` → `lib/normalizers` → `lib/sync` → PostgreSQL → `app/api` → Frontend.

---

## Limites actuelles (MVP)

- `perPage: 50` par statut de match → max ~150 matchs par jeu par sync
- Pas de pagination automatique lors de la sync (à prévoir pour le cron)
- `syncTournaments.ts` et `syncTeams.ts` sont des stubs — tout passe par les matchs
- `SyncLog` en statut `running` non terminé en cas de crash serveur (nettoyage manuel nécessaire)
- Timeout Vercel : si la sync dépasse la limite du plan, séparer en routes par jeu

---

## Prochaines étapes

| Étape | Description |
|---|---|
| Brackets | Afficher le bracket d'un tournoi depuis `rawJson` |
| Auth | Authentification utilisateur (NextAuth / Clerk) |
| Notifications | Alertes pour les matchs suivis |
| Export calendrier | Génération `.ics` pour l'agenda personnalisé |
| Pagination sync | `page=2, 3…` lors de la sync pour récupérer plus de matchs |
| Monitoring | Dashboard de suivi des SyncLogs |
| CS2 / TFT / Dota 2 | Ajout de nouveaux jeux via `PANDASCORE_GAME_SLUGS` |
