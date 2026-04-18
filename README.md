# Jurya

**Plateforme de preparation aux concours oraux** -- Simulation d'oraux par IA + coaching par d'anciens membres de jury.

## English

Jurya is a French oral exam preparation platform for *concours* (competitive public-service exams, bar exam, *grandes ecoles*). It combines AI-powered jury simulation with coaching by former jury members.

Built with Next.js 14 (App Router), Supabase, Claude API, Stripe, and Tailwind CSS.

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript 5.3, Tailwind CSS 3.4, Framer Motion |
| Backend | Next.js API Routes, Supabase (PostgreSQL + Auth + RLS) |
| IA | Claude API (claude-sonnet-4-6 pour les simulations, claude-haiku-4-5 pour la classification) |
| Paiements | Stripe (Connect pour les paiements aux jurys, commission 20%) |
| Email | Resend |
| Deploiement | Vercel |

## Installation

```bash
# 1. Cloner le depot
git clone https://github.com/hextechnologie/Jurya.git
cd Jurya

# 2. Installer les dependances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir les valeurs dans .env.local

# 4. Lancer le serveur de developpement
npm run dev
```

Le site est accessible sur http://localhost:3000.

## Variables d'environnement

Voir .env.example pour la liste complete. Les principales :

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_SUPABASE_URL | URL du projet Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Cle anonyme Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Cle service Supabase (cote serveur uniquement) |
| ANTHROPIC_API_KEY | Cle API Claude |
| STRIPE_SECRET_KEY | Cle secrete Stripe |
| STRIPE_WEBHOOK_SECRET | Secret du webhook Stripe |
| RESEND_API_KEY | Cle API Resend |
| NEXT_PUBLIC_SITE_URL | https://jurya.fr |

## Structure du projet

```
app/
  fr/
    calendrier/    - Calendrier des concours
    concours/[id]/ - Fiche detaillee d'un concours
  page.tsx         - Page d'accueil
lib/
  claude.ts        - Integration Claude (prompts jury)
  types/
    concours.ts    - Types domaine (Concours, Simulation, etc.)
  countries.ts     - Configuration multi-pays
  metadata.ts      - SEO / Open Graph
components/
  country/         - Selecteur de pays
locales/
  fr.json          - Chaines i18n (francais)
seed/
  concours.json              - Donnees de reference (5 concours)
  concours_sessions_2026.json - Sessions 2026 (dates a confirmer)
supabase/
  migrations/      - Migrations SQL
backend/
  prompts/         - Templates de prompts (examinateur, feedback)
```

## TODO

Les elements marques TODO(mouj) dans le code indiquent les taches restantes :

- Connecter les rappels email (notifications d'inscription)
- Ajouter les donnees concours pour BE, LU, CH, CA, MA, TN
- Creer les pages de simulation (/simulation/setup, /simulation/[id])
- Implementer le dashboard candidat
- Configurer Stripe Connect pour les paiements aux jurys
- Ajouter les dates reelles des sessions 2026 quand publiees
- Tests unitaires et e2e

## Licence

Proprietaire -- (c) 2026 HEX Technologies.
