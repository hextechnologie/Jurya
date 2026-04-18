# Guide de Déploiement Jurya — Pas à Pas

> Ce guide est écrit pour quelqu'un qui n'a jamais utilisé Supabase, Vercel ou Stripe.
> Chaque étape est détaillée avec des captures d'écran mentales et les boutons exacts à cliquer.

---

## Prérequis

- Un compte GitHub (vous l'avez déjà — votre repo est `hextechnologie/Jurya`)
- Un navigateur web moderne (Chrome recommandé)
- Une carte bancaire (pour Stripe, pas de frais avant d'avoir des clients)

---

## Étape 1 : Créer le projet Supabase (Base de données)

### 1.1 Créer un compte

1. Allez sur **[supabase.com](https://supabase.com)**
2. Cliquez **"Start your project"**
3. Connectez-vous avec votre compte **GitHub**
4. Autorisez l'accès

### 1.2 Créer un nouveau projet

1. Cliquez **"New project"**
2. Remplissez :
   - **Organization** : Créez-en une (ex: "HEX Technologies")
   - **Project name** : `jurya`
   - **Database Password** : Générez un mot de passe fort et **notez-le quelque part** (vous en aurez besoin plus tard)
   - **Region** : `West EU (Ireland)` ← le plus proche de la France
   - **Pricing Plan** : Free (suffisant pour commencer)
3. Cliquez **"Create new project"**
4. Attendez ~2 minutes que le projet se crée

### 1.3 Récupérer vos clés API

1. Dans votre projet Supabase, allez dans **Settings** (icône engrenage en bas à gauche)
2. Cliquez **"API"** dans le menu
3. Notez ces valeurs :
   - **Project URL** → c'est votre `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → c'est votre `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret key** → c'est votre `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Ne la partagez jamais

### 1.4 Créer les tables (schéma de base)

1. Dans Supabase, cliquez **"SQL Editor"** (icône terminal dans la barre latérale)
2. Cliquez **"New query"**
3. Ouvrez le fichier `supabase/schema.sql` de votre projet
4. Copiez **tout** le contenu et collez-le dans l'éditeur SQL
5. Cliquez **"Run"** (ou Ctrl+Enter)
6. Vous devriez voir "Success. No rows returned" — c'est normal !

### 1.5 Appliquer la migration V2

1. Toujours dans **SQL Editor**, cliquez **"New query"**
2. Ouvrez `supabase/migrations/002_jurya_v2_complete.sql`
3. Copiez-collez tout le contenu
4. Cliquez **"Run"**
5. Vérifiez dans **Table Editor** (icône tableau) que vous avez les nouvelles tables :
   - `candidate_profiles`, `simulation_turns`, `simulation_reports`, `subscription_plans`, `resources`, etc.

### 1.6 Insérer les données de base (seed)

1. Toujours dans **SQL Editor**, cliquez **"New query"**
2. Ouvrez `supabase/seed.sql`
3. Copiez-collez et cliquez **"Run"**
4. Vérifiez dans **Table Editor** que la table `concours` contient des données

### 1.7 Configurer l'authentification

1. Allez dans **Authentication** (icône personne dans la barre latérale)
2. Cliquez **"Providers"** dans le menu
3. Vérifiez que **Email** est activé
4. Dans **"Email Templates"**, personnalisez si vous le souhaitez (pas obligatoire)
5. Dans **URL Configuration** :
   - **Site URL** : `https://jurya.vercel.app` (vous le changerez après le déploiement)
   - **Redirect URLs** : ajoutez `https://jurya.vercel.app/**` et `http://localhost:3000/**`

---

## Étape 2 : Obtenir une clé API Claude (IA)

1. Allez sur **[console.anthropic.com](https://console.anthropic.com)**
2. Créez un compte ou connectez-vous
3. Allez dans **"API Keys"**
4. Cliquez **"Create Key"**
5. Nommez-la `jurya-production`
6. Copiez la clé → c'est votre `ANTHROPIC_API_KEY`
7. **Important** : Ajoutez du crédit dans **"Billing"** → **"Add funds"** (5€ suffisent pour commencer, chaque simulation coûte ~0.02€)

---

## Étape 3 : Configurer Stripe (Paiements)

### 3.1 Créer un compte

1. Allez sur **[stripe.com](https://stripe.com)**
2. Cliquez **"Commencer maintenant"**
3. Créez votre compte avec votre email professionnel
4. Complétez la vérification d'identité (KYC) — obligatoire pour recevoir des paiements

### 3.2 Récupérer les clés

1. Dans le dashboard Stripe, cliquez l'icône **"Développeurs"** (en haut à droite)
2. Cliquez **"Clés API"**
3. Notez :
   - **Clé publiable** (commence par `pk_test_...` ou `pk_live_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Clé secrète** (commence par `sk_test_...` ou `sk_live_...`) → `STRIPE_SECRET_KEY`

> 💡 **Astuce** : Commencez en mode **Test** (le toggle en haut). Vous basculerez en mode Live quand tout fonctionnera.

### 3.3 Créer les plans d'abonnement

1. Dans Stripe, allez dans **"Produits"**
2. Cliquez **"+ Ajouter un produit"**
3. Créez ces 2 produits :

**Produit 1 : Essentiel**
- Nom : `Jurya Essentiel`
- Prix : `9.00 EUR / mois` → notez l'ID du prix (ex: `price_1Abc...`) → `STRIPE_BASIC_PRICE_ID`

**Produit 2 : Pro**
- Nom : `Jurya Pro`
- Prix : `19.00 EUR / mois` → notez l'ID du prix → `STRIPE_PRO_PRICE_ID`

### 3.4 Configurer le webhook

1. Allez dans **Développeurs** → **Webhooks**
2. Cliquez **"+ Ajouter un endpoint"**
3. URL : `https://jurya.vercel.app/api/stripe/webhook` (à mettre à jour après déploiement)
4. Événements à écouter : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
5. Copiez le **Signing secret** (commence par `whsec_...`) → `STRIPE_WEBHOOK_SECRET`

### 3.5 Activer Stripe Connect (paiements des coaches)

1. Dans Stripe, allez dans **"Connect"** (menu latéral)
2. Cliquez **"Commencer"** et suivez les étapes
3. Choisissez le type **"Express"** (le plus simple)
4. Une fois activé, les coaches pourront recevoir des paiements directement

---

## Étape 4 : Configurer Resend (Emails)

1. Allez sur **[resend.com](https://resend.com)**
2. Créez un compte
3. Allez dans **"API Keys"** → créez une clé → `RESEND_API_KEY`
4. (Optionnel) Allez dans **"Domains"** → ajoutez `jurya.fr` pour envoyer depuis `noreply@jurya.fr`
   - Suivez les instructions pour ajouter les enregistrements DNS (MX, SPF, DKIM)

---

## Étape 5 : Déployer sur Vercel

### 5.1 Créer un compte

1. Allez sur **[vercel.com](https://vercel.com)**
2. Cliquez **"Sign Up"**
3. Choisissez **"Continue with GitHub"**
4. Autorisez l'accès

### 5.2 Importer le projet

1. Cliquez **"Add New..."** → **"Project"**
2. Dans la liste de vos repos GitHub, trouvez **`hextechnologie/Jurya`**
3. Cliquez **"Import"**
4. **Configuration** :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `jurya` ← IMPORTANT, car votre code est dans un sous-dossier
   - **Build Command** : `next build` (par défaut)
   - **Output Directory** : laisser vide (par défaut)

### 5.3 Ajouter les variables d'environnement

1. Avant de cliquer "Deploy", déroulez **"Environment Variables"**
2. Ajoutez chaque variable une par une :

| Clé | Valeur |
|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_BASIC_PRICE_ID` | `price_...` |
| `STRIPE_PRO_PRICE_ID` | `price_...` |
| `NEXT_PUBLIC_APP_URL` | `https://jurya.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://jurya.fr` |
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM_EMAIL` | `Jurya <noreply@jurya.fr>` |

3. Cliquez **"Deploy"**
4. Attendez ~2-3 minutes
5. Vercel vous donnera une URL comme `jurya-xxxx.vercel.app`

### 5.4 Mettre à jour les URLs

Après le premier déploiement :

1. **Supabase** → Authentication → URL Configuration → mettez à jour le Site URL avec votre URL Vercel
2. **Stripe** → Webhooks → mettez à jour l'URL de l'endpoint
3. **Vercel** → Settings → Domains → ajoutez `jurya.fr` si vous avez un nom de domaine

---

## Étape 6 : Configurer un nom de domaine (Optionnel)

### Si vous achetez `jurya.fr` :

1. Achetez le domaine chez un registrar (OVH, Gandi, Namecheap...)
2. Dans **Vercel** :
   - Allez dans votre projet → **Settings** → **Domains**
   - Ajoutez `jurya.fr` et `www.jurya.fr`
   - Vercel vous donnera des enregistrements DNS à configurer
3. Chez votre registrar :
   - Ajoutez un **CNAME** : `cname.vercel-dns.com` pour `www`
   - Ajoutez un **A record** : `76.76.21.21` pour `@`
4. Attendez 5-30 minutes pour la propagation DNS
5. Mettez à jour :
   - `NEXT_PUBLIC_SITE_URL` dans Vercel → `https://jurya.fr`
   - Site URL dans Supabase → `https://jurya.fr`
   - Webhook URL dans Stripe → `https://jurya.fr/api/stripe/webhook`

---

## Étape 7 : Vérification post-déploiement

### Checklist à vérifier :

- [ ] La page d'accueil s'affiche correctement
- [ ] L'inscription par email fonctionne (vérifiez dans Supabase → Authentication → Users)
- [ ] La connexion fonctionne
- [ ] Le dashboard s'affiche après connexion
- [ ] Une simulation peut être lancée (vérifie que Claude API répond)
- [ ] La page Tarifs affiche les plans
- [ ] Le paiement Stripe fonctionne en mode test (carte test : `4242 4242 4242 4242`, date future, CVC quelconque)
- [ ] Les emails sont reçus (vérifiez dans Resend → Logs)

### Carte de test Stripe :
- Numéro : `4242 4242 4242 4242`
- Date : n'importe quelle date future
- CVC : n'importe quels 3 chiffres
- Code postal : n'importe lequel

---

## Étape 8 : Passer en production

Quand tout fonctionne en mode test :

1. **Stripe** : Basculez le toggle "Test" → "Live" en haut du dashboard
2. Recréez les produits et prix en mode Live
3. Mettez à jour les clés API dans Vercel (remplacez `sk_test_` par `sk_live_`, etc.)
4. Recréez le webhook en mode Live
5. **Vercel** : Re-déployez (Settings → Deployments → Redeploy)

---

## Résumé des coûts

| Service | Plan gratuit | Plan payant |
|---------|-------------|-------------|
| **Supabase** | 500MB DB, 1GB stockage, 50K auth users | $25/mois (Pro) |
| **Vercel** | 100GB bandwidth, builds illimités | $20/mois (Pro) |
| **Claude API** | Aucun | ~0.02€/simulation (pay-as-you-go) |
| **Stripe** | Aucun frais fixe | 1.4% + 0.25€ par transaction (Europe) |
| **Resend** | 100 emails/jour | $20/mois (5000/jour) |
| **Domaine** | — | ~10-15€/an (.fr) |

**Coût total pour démarrer : ~0€/mois** (tout en plan gratuit + ~5€ de crédit Claude)

---

## Commandes utiles en local

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Construire pour la production
npm run build

# Vérifier les erreurs de lint
npm run lint
```

---

## Structure des fichiers importants

```
jurya/
├── app/                          # Pages de l'application
│   ├── page.tsx                  # Page d'accueil
│   ├── dashboard/page.tsx        # Tableau de bord candidat
│   ├── simulation/               # Simulation vocale
│   │   ├── setup/page.tsx        # Configuration de la simulation
│   │   ├── [id]/page.tsx         # Session de simulation en direct
│   │   └── report/[id]/page.tsx  # Rapport post-simulation
│   ├── profile/page.tsx          # Profil candidat
│   ├── calendar/page.tsx         # Calendrier des concours
│   ├── content/page.tsx          # Bibliothèque de ressources
│   ├── pathway/page.tsx          # Parcours de préparation 8 semaines
│   ├── coaches/page.tsx          # Marketplace des coaches
│   ├── testimonials/page.tsx     # Témoignages et taux de réussite
│   └── api/                      # Routes API
│       ├── simulation/           # API simulation (question, report)
│       └── stripe/               # API paiements (checkout, connect)
├── components/                   # Composants réutilisables
├── lib/                          # Utilitaires, hooks, types
│   ├── hooks/useVoice.ts         # Hooks vocaux (STT, TTS, enregistrement)
│   └── types/simulation.ts       # Types TypeScript simulation
├── public/                       # Fichiers statiques
│   ├── manifest.json             # Manifest PWA
│   └── sw.js                     # Service Worker
├── supabase/                     # Schéma et migrations DB
│   ├── schema.sql                # Schéma de base
│   ├── seed.sql                  # Données initiales
│   └── migrations/               # Migrations V2
├── .env.example                  # Variables d'environnement (template)
└── DEPLOYMENT.md                 # Ce fichier !
```

---

## Besoin d'aide ?

- **Supabase docs** : [supabase.com/docs](https://supabase.com/docs)
- **Vercel docs** : [vercel.com/docs](https://vercel.com/docs)
- **Next.js docs** : [nextjs.org/docs](https://nextjs.org/docs)
- **Stripe docs** : [stripe.com/docs](https://stripe.com/docs)
