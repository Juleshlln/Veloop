# Veloop

> **Vous et votre voiture, en sécurité à destination.**

Veloop est un service de raccompagnement : un chauffeur rejoint le client **à vélo pliable**, range son vélo dans le coffre, puis raccompagne le client **avec sa propre voiture**. À l'arrivée, le chauffeur récupère son vélo et repart.

Ce dépôt contient un **MVP fonctionnel et navigable** (Next.js + TypeScript), pensé mobile-first, pour la zone de **Lille et sa métropole**.

---

## ✨ Mode démonstration (zéro configuration)

L'application démarre **sans aucune clé API**. Dans ce mode :

- **Authentification** par cookie (comptes de démo fournis) ;
- **Données** servies par un store en mémoire pré-rempli (5 clients, 5 chauffeurs, 10 véhicules, 15 courses, avis, 2 incidents) ;
- **Stripe** et **Mapbox** simulés, clairement signalés par un bandeau « Mode démonstration ».

Dès que les variables d'environnement correspondantes sont présentes, l'architecture est prête à brancher Supabase, Stripe et Mapbox réels (voir plus bas).

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|------|--------|--------------|
| Client | `client@veloop.fr` | `veloop123` |
| Chauffeur | `chauffeur@veloop.fr` | `veloop123` |
| Administrateur | `admin@veloop.fr` | `veloop123` |

La page de connexion propose aussi une **connexion démo en 1 clic** pour chaque rôle.

---

## 🚀 Lancement local

```bash
npm install
npm run dev
# http://localhost:3000
```

Aucune variable d'environnement n'est requise pour le mode démo.

Pour activer les intégrations réelles, copiez `.env.example` vers `.env.local` et renseignez les clés voulues :

```bash
cp .env.example .env.local
```

---

## 🧱 Stack technique

- **Next.js 16** (App Router, Server Actions, route handlers) + **React 19**
- **TypeScript strict**
- **Tailwind CSS v4** (design tokens en CSS natif `@theme`)
- Composants **shadcn-style** maison + **Lucide** + **Motion**
- **Zod** (validation serveur) + **React Hook Form**
- **Supabase** (PostgreSQL, Auth, Storage, RLS) — *prêt à brancher*
- **Stripe** (Payment Intents, capture manuelle, webhook) — *prêt à brancher*
- **Mapbox** (géocodage / autocomplétion) — *prêt à brancher*

---

## 🗂️ Structure du projet

```
app/
  (public)/        Landing + pages marketing + légales
  (auth)/          /connexion, /inscription
  (client)/app/    Espace client (/app/*)
  (driver)/driver/ Espace chauffeur (/driver/*)
  (admin)/admin/   Espace administrateur (/admin/*)
  api/             places (autocomplete), stripe/webhook
components/
  ui/              Primitives (Button, Card, Input, Sheet, Toaster…)
  veloop/          Composants métier (RideProgress, DriverCard, MapPreview…)
lib/
  config.ts        Détection des clés → IS_DEMO, zone de lancement
  types.ts         Types du domaine + machine à états des courses
  pricing.ts       Moteur de tarification (source de vérité, côté serveur)
  geo.ts           Géocodage/distance (demo Lille ou Mapbox)
  payments.ts      Wrapper Stripe (demo ou réel)
  data/store.ts    Repository (store mémoire, API async = swap Supabase facile)
  demo/seed.ts     Jeu de données de démonstration
  auth/            Session (cookie) + Server Actions d'auth
  actions/         Server Actions (rides, driver, admin, account, demo)
  supabase/        Clients Supabase (server/browser) — pour le branchement réel
proxy.ts           Garde d'accès des routes protégées (ex-middleware)
supabase/
  migrations/      0001_init.sql (schéma) + 0002_rls.sql (RLS)
  seed.sql         Paramètres tarifaires
```

---

## 🔐 Rôles & sécurité

- 3 rôles : **client**, **chauffeur**, **administrateur** (l'admin n'est jamais créable publiquement).
- `proxy.ts` redirige tout accès non authentifié vers `/connexion`.
- Chaque layout d'espace applique `requireRole(...)` côté serveur.
- Toutes les **Server Actions** vérifient session, rôle **et propriété** de la ressource.
- Validation des entrées avec **Zod**, aucune clé secrète exposée au client.
- En production Supabase : la **RLS** (`0002_rls.sql`) protège chaque table ; les clients ne voient que leurs données, les chauffeurs leur profil + les courses attribuées/ouvertes, l'admin tout.

---

## 💶 Tarification

`lib/pricing.ts` centralise le calcul (toujours exécuté côté serveur) :

```
prix = prise en charge + (km × tarif/km) + (min × tarif/min)
       → prix minimum → majoration nocturne → forte demande → code promo
```

Valeurs par défaut : prise en charge **15 €**, **1,50 €/km**, **0,35 €/min**, minimum **29 €**, majoration nocturne **×1,2**, forte demande **×1,0** (désactivée). Modifiables en direct depuis **/admin/tarification**.

Codes promo de démo : `VELOOP10` (-10 %), `BIENVENUE` (-5 €).

---

## 🔌 Brancher les services réels

### Supabase
1. Créez un projet Supabase.
2. Exécutez les migrations dans l'ordre (SQL Editor ou `supabase db push`) :
   `0001_init` (schéma) → `0002_rls` → `0003_helper_functions` → `0004_security_hardening`
   → `0005_business_rpcs` → `0006_fix_rls_recursion`.
3. (Optionnel) `supabase/seed.sql` pour les paramètres tarifaires.
4. Renseignez `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (la présence de
   ces deux variables fait basculer l'app en mode Supabase). `SUPABASE_SERVICE_ROLE_KEY` est
   optionnelle : la logique métier transverse passe par des fonctions `SECURITY DEFINER`.
5. Le trigger `on_auth_user_created` crée automatiquement le profil (et le profil chauffeur) à
   l'inscription via les métadonnées `role/first_name/last_name`.
6. (Recommandé) Activez *Leaked password protection* dans Authentication → Policies.

> **Bascule automatique.** `lib/data/store.ts` choisit entre `demo-store.ts` (mémoire) et
> `supabase-store.ts` (PostgREST + RLS + RPC) selon la configuration. `lib/auth/` bascule de la
> même façon entre cookie de démo et Supabase Auth. Aucune page ni action à modifier.

> **Mutations & RLS.** Les opérations transverses (assignation, changement de statut, paiement,
> validation chauffeur, notifications inter-utilisateurs) sont des fonctions `SECURITY DEFINER`
> (`supabase/migrations/0005`, `0006`) qui appliquent leurs propres contrôles d'autorisation —
> ce qui évite d'exposer la clé `service_role` côté serveur.

### Stripe (mode test)
1. `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. Webhook vers `/api/stripe/webhook`, secret dans `STRIPE_WEBHOOK_SECRET`.
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Les PaymentIntents sont créés en **capture manuelle** (pré-autorisation avant la course, capture du montant final à la fin). Architecture **Stripe Connect-ready** pour rémunérer les chauffeurs ultérieurement.

### Mapbox
`NEXT_PUBLIC_MAPBOX_TOKEN` → géocodage et autocomplétion réels (sinon jeu d'adresses Lille simulé).

---

## ▲ Déploiement Vercel

1. Importez le dépôt sur Vercel.
2. Ajoutez les variables d'environnement (Project Settings → Environment Variables).
3. Build : `next build` (par défaut). Déployez.
4. Configurez l'URL de production dans `NEXT_PUBLIC_APP_URL` et le webhook Stripe vers `https://<votre-domaine>/api/stripe/webhook`.

---

## ✅ Fonctionnalités terminées

- Landing premium (hero, fonctionnement, cas d'usage, sécurité, zone, CTA, footer)
- Inscription / connexion par e-mail + sélection du rôle + redirections
- Parcours client : commande → carte → **estimation serveur** → confirmation → suivi temps quasi réel → checklist véhicule → paiement → **évaluation** → reçu
- Véhicules, adresses favorites, profil, support (incident)
- Parcours chauffeur : en ligne/hors ligne, file de courses, accepter/refuser, étapes (en route → arrivé → vérif → démarrer → terminer), **checklist avant départ**, gains, documents, onboarding
- Dashboard admin : 9 KPIs, courses live, **assignation manuelle**, changement de statut, validation/refus chauffeurs, clients (suspension), paiements, incidents, **édition tarifaire en direct**
- Notifications internes, bouton d'urgence, partage de trajet (simulé)
- Migrations SQL + politiques **RLS** complètes

## 🧪 Fonctionnalités simulées (mode démo)

- Authentification par cookie (à la place de Supabase Auth)
- Persistance en mémoire (réinitialisée au redémarrage du serveur)
- Affectation automatique « simulée » + bouton **« Simuler l'étape suivante »** pour parcourir une course en solo
- Paiement Stripe et carte Mapbox simulés
- Upload de documents / photos (Supabase Storage à brancher)

## 🚧 Limites du MVP

- Pas de dispatch temps réel ni de tarification dynamique avancée
- Messagerie chauffeur/client non implémentée (boutons signalés)
- Notifications uniquement in-app (architecture prête pour SMS/e-mail/push)
- Données démo non partagées entre instances serverless (usage local recommandé pour la démo)
- **Mentions importantes :** assurances, responsabilités, conditions d'exercice et règles réglementaires liées au raccompagnement de véhicules **doivent être validées avant tout lancement commercial**. Aucune promesse d'assurance n'est faite dans ce MVP.

## 🎯 Prochaines priorités produit

1. Brancher Supabase (Auth + DB + Storage + Realtime) et migrer le store.
2. Activer Stripe test de bout en bout (pré-autorisation → capture finale) + Stripe Connect chauffeurs.
3. Intégrer Mapbox (itinéraires réels, position chauffeur live).
4. Messagerie client/chauffeur et notifications push/SMS.
5. Affiner le dispatch semi-automatique et la planification des courses.
