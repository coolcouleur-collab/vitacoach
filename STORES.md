# Fiches stores & conformité — Solenn

Préparé le 2026-07-21 à partir de l'étude de marché et des politiques officielles
Apple (App Review Guidelines) et Google Play (Health Content and Services).
⚠️ Re-vérifier les politiques juste avant chaque soumission — elles évoluent vite.

---

## 1. Google Play — fiche store

### Description (le disclaimer DOIT être dans le premier paragraphe)

> **Solenn — Ton soleil au quotidien**
>
> Solenn est un coach bien-être basé sur l'intelligence artificielle : nutrition
> intuitive, sommeil, routines et challenges 21 jours, connectés à tes données
> santé. *Solenn n'est pas un dispositif médical et ne diagnostique, ne traite,
> ne guérit ni ne prévient aucune maladie ou condition médicale. Ses conseils ne
> remplacent pas l'avis d'un professionnel de santé.*
>
> • Un coach IA qui te connaît vraiment — il s'appuie sur ton sommeil, tes pas,
>   ton énergie du jour pour adapter ses conseils
> • Challenge 21 jours personnalisé pour installer des habitudes durables
> • Routines du matin et du soir à ta mesure
> • Connexion Apple Health, Withings, Garmin
> • 21 premiers jours offerts, sans engagement

### Checklist Play Console (à faire par Jean)

- [ ] **Déclaration « Health apps »** : Play Console → App content → Health apps
      → cocher les catégories : wellness / sleep / nutrition / mindfulness.
- [ ] **Compte développeur Organisation vérifié** (obligatoire pour les apps
      santé depuis le 28/01/2026 — un compte individuel ne suffit plus).
- [ ] **Politique de confidentialité** : URL publique non géo-bloquée, pas de
      PDF → https://meet-solenn.com/confidentialite ✅ (page déjà en ligne).
- [ ] **Permissions Health Connect** : ne demander QUE les types de données
      utilisés (pas, sommeil, poids, FC) — Google cible le « data overreach ».
- [ ] **Data safety form** : déclarer données santé collectées, chiffrées en
      transit, non partagées à des fins publicitaires.

## 2. Apple App Store

### Points de vigilance App Review

- **3.1.1 — Paiements** : le build iOS ne montre AUCUN checkout Stripe ✅
  (fait dans le code : `passerPro()` et `PaywallOffre` masquent l'achat sur
  natif). Ne pas ajouter de lien « achète sur le site » sans passer par les
  entitlements DMA/External Purchase Link — c'est un motif de rejet.
- **5.1.2(vi) — HealthKit** : aucune donnée HealthKit vers marketing/analytics.
  ✅ Audit du 2026-07-21 : aucun SDK analytics/tracking dans le projet ; les
  données santé ne partent que vers Supabase (stockage) et Groq (coaching).
  À maintenir : si un jour un outil d'analytics est ajouté, il ne doit JAMAIS
  recevoir de donnée santé.
- **1.4.1 — Médical** : l'app rappelle de consulter un médecin ✅ (disclaimer
  réglages + onboarding santé + note sous le chat + page confidentialité).
- **Nov. 2025 — IA tierce** : déclarer que les conversations passent par un
  modèle IA tiers (Groq) et obtenir le consentement → la page
  /confidentialite le mentionne ; prévoir une case de consentement à
  l'inscription si App Review le réclame.
- **Abonnements** : pour vendre l'abonnement DANS l'app iOS, il faudra
  implémenter l'IAP Apple (StoreKit — via le Small Business Program, commission
  15 % la 1re année sous 1 M$). En attendant, l'app iOS fonctionne en
  lecture du statut Pro synchronisé depuis le web.

### Description App Store (proposition)

> Solenn est ton coach bien-être au quotidien, propulsé par l'IA : nutrition,
> sommeil, routines et challenges 21 jours, adaptés à tes données réelles
> (Apple Santé, Withings, Garmin). 21 premiers jours offerts.
> Solenn n'est pas un dispositif médical ; ses conseils ne remplacent pas
> l'avis d'un professionnel de santé.

## 3. AI Act (UE) — échéance août 2026

- **Transparence chatbot (art. 50)** : l'utilisateur doit savoir qu'il parle à
  une IA ✅ (mention sous le titre du chat + réglages + paywall).
- **Rester hors « dispositif médical »** : ne JAMAIS utiliser dans l'app ou le
  marketing les mots : diagnostic, détecte, traite, guérit, prévient (une
  maladie). Le positionnement « bien-être / habitudes / accompagnement » est le
  bon côté de la frontière réglementaire.
- Pas d'obligation « haut risque » tant que Solenn ne fait aucune allégation
  médicale — c'est une décision produit à protéger dans le temps.

## 4. SQL à exécuter dans Supabase (nouvelles fonctionnalités)

- `db/morning-messages.sql` → tables `morning_messages` (messages matinaux)
  et `push_tokens` (tokens natifs iOS/Android).

## 5. Ce qui a changé côté monétisation (2026-07-21)

| Avant | Après |
|---|---|
| Freemium 5 msg/jour (compteur client contournable) | Essai complet 21 jours (daté serveur via `auth.users.created_at`), puis 5 msg/jour |
| 4,99 €/mois seul | **44,99 €/an (offre principale)** ou 7,99 €/mois |
| Pas d'écran d'offre | Paywall post-onboarding « 21 jours offerts » |
| Stripe visible partout (y compris natif) | Stripe masqué sur iOS/Android natif |
| Résiliation Stripe cassée (stripeCustomerId jamais stocké) | Corrigée (webhook) |
