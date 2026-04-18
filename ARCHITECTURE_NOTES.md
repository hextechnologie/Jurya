# Jurya — Notes d'architecture

> Ce document décrit l'architecture héritée du projet source (AI Interview Coach)
> et les transformations appliquées pour créer Jurya.

## 1. Stack technique (héritée)

| Couche         | Technologie                              |
|----------------|------------------------------------------|
| Framework      | Next.js 14 (App Router, TypeScript 5.3)  |
| UI             | React 18, Tailwind CSS 3.4, Framer Motion |
| Base de données| Supabase (PostgreSQL) + RLS              |
| Auth           | Supabase Auth (cookie-based sessions)    |
| IA             | Claude API via `@anthropic-ai/sdk`       |
| Paiements      | Stripe (abonnements + crédits + Connect) |
| Email          | Resend                                   |
| Déploiement    | Vercel                                   |
| Package mgr    | npm                                      |

## 2. Structure du projet source

```
interview_coach/
├── app/                    # Next.js App Router
│   ├── api/                # Routes API (bookings, credits, earnings, interview, stripe…)
│   ├── dashboard/          # Tableau de bord candidat
│   ├── interview/          # Session d'entretien (setup → chat → summary)
│   ├── coaches/            # Marketplace de coachs
│   ├── coach/              # Dashboard coach (profil, dispo, messages, revenus)
│   ├── pricing/            # Plans d'abonnement
│   └── …                   # login, signup, about, faq, contact, terms, privacy
├── components/             # Composants React réutilisables
│   ├── AuthProvider.tsx    # Contexte d'authentification
│   ├── LanguageProvider.tsx# i18n maison (contexte + locales/*.json)
│   ├── feedback/           # Composants de feedback (score, métrique, badges)
│   └── ui/                 # Composants génériques (Button, Card, Modal…)
├── lib/                    # Utilitaires
│   ├── claude.ts           # Intégration Claude API
│   ├── credits.ts          # Système de crédits + commission 20 %
│   ├── stripe.ts           # Helpers Stripe
│   ├── supabase.ts         # Client Supabase
│   ├── auth.ts             # Helpers auth
│   └── types/              # Types TypeScript
├── locales/                # Fichiers i18n (en, fr, es, ar)
├── supabase/               # Schéma SQL + migrations
└── public/                 # Assets statiques
```

## 3. Flux d'une session (source)

1. **Setup** (`/interview/setup`) — l'utilisateur choisit un poste, un niveau, upload un CV, colle une offre d'emploi.
2. **Création** (`POST /api/interview/create`) — crée `interview_sessions` avec `interview_config` (JSONB).
3. **Boucle de questions** (6 questions) — `POST /api/interview/question` génère la question suivante via Claude ; `POST /api/interview/answer` évalue la réponse et renvoie un feedback JSON structuré.
4. **Résumé** (`/interview/summary/[id]`) — score global, graphiques, badges.

## 4. Intégration Claude

- **Modèle** : `claude-sonnet-4-6` (pour les questions et le feedback).
- **Prompt système** : rôle « senior interview coach », sortie JSON contrainte.
- **Max tokens** : 1024 (questions), 1200 (feedback).
- **Prompt caching** : non implémenté dans le source.

### Adaptation Jurya

- `claude-sonnet-4-6` pour la session principale (jury simulé).
- `claude-haiku-4-5` pour la génération de questions et la classification.
- Prompt caching activé sur la rubrique + description du concours.
- Nouveaux prompts : `examiner_fr.md`, `feedback_fr.md`.

## 5. Modèle de données — Correspondances

| Source (Interview Coach)    | Jurya                    | Notes                                  |
|-----------------------------|--------------------------|----------------------------------------|
| `interview_sessions`        | `simulations`            | + champ `type` (grand_oral, mise_en_situation…) |
| `interview_answers`         | `simulation_answers`     | Structure feedback adaptée /5          |
| Job role (texte libre)      | `concours` (table)       | Entité à part entière avec type, grade… |
| `coach_profiles`            | `coach_jury`             | + `ancien_membre_jury`, `spécialités_concours` |
| —                           | `concours_sessions`      | **NOUVEAU** : calendrier des sessions  |
| —                           | `user_concours_reminders`| **NOUVEAU** : rappels par concours     |
| `profiles`                  | `profiles`               | Inchangé                               |
| `bookings`, `earnings`, etc.| Conservés                | Commission 20 % maintenue              |

## 6. Marketplace / Commission

- **Commission plateforme** : 20 % (`PLATFORM_FEE_PERCENTAGE = 20` dans `lib/credits.ts`).
- Stripe Connect pour les reversements aux coachs.
- Système de crédits : achat → escrow → libération après session.
- Politique d'annulation : gratuite >48h, partielle 24–48h, aucune <24h.

## 7. i18n (source)

- Système maison : `LanguageProvider` + `LanguageSwitcher`.
- Fichiers JSON dans `locales/` (en, fr, es, ar + stubs pour de, it, pt, zh, ja, ko).
- Les prompts Claude sont paramétrés pour répondre dans la langue choisie.

### Adaptation Jurya

- Locale par défaut : `fr-FR`.
- Refonte i18n pour supporter le routage par pays (`/fr/concours/…`).
- Seules les chaînes FR sont traduites pour le moment.

## 8. Variables d'environnement

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_BASIC_PRICE_ID
STRIPE_PRO_PRICE_ID
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SITE_URL
```

## 9. Décisions d'architecture pour Jurya

- **Code identifiers** restent en anglais ; seul le contenu utilisateur est en français.
- **Country-first routing** : `/fr/concours/…` (préparation multi-pays).
- **ConcoursSession** : modèle calendrier dès le départ (dates d'inscription, épreuves, résultats).
- **Prompt caching** : activé sur les descriptions de concours + rubriques jury (réduction coûts).
- **Modèles Claude** : `claude-sonnet-4-6` (session) + `claude-haiku-4-5` (classification).
