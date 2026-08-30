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

- [ ] **Déclaration « Health apps »** : Play Console → Contenu de l'application
      → Applis de santé. CINQ catégories, toutes en bien-être, AUCUNE en
      catégorie médicale (le compte personnel ne suffirait plus) :
      activité et remise en forme · **suivi des règles** · gestion du sommeil ·
      gestion du stress · nutrition et gestion du poids.
      ⚠️ Le suivi des règles manquait dans la première version de ce document,
      écrite avant l'ajout de l'onglet Cycle. Vérifié dans le code le
      2026-08-30 : l'onglet existe, s'active depuis les Paramètres et écrit
      dans `cycle_periods` et `cycle_symptoms`. La déclaration est donc juste.
      Conséquence pour le Data safety : les données de cycle sont
      particulièrement sensibles, à déclarer explicitement en santé, ni
      partagées ni publicitaires.
- [x] **Type de compte développeur** : vérifié le 2026-07-25 sur la doc
      officielle Google — le compte Organisation n'est exigé QUE pour les
      catégories « Applications médicales » et « Recherche sur sujets
      humains ». Solenn est déclarée bien-être uniquement (activité,
      nutrition, sommeil, stress, cycle) → **le compte personnel suffit**.
      Ne pas déclarer de catégorie médicale sans migrer d'abord.
- [ ] **Politique de confidentialité** : URL publique non géo-bloquée, pas de
      PDF → https://meet-solenn.com/confidentialite ✅ (page déjà en ligne).
- [ ] **URL de suppression de compte** →
      **https://meet-solenn.com/suppression-compte**
      ⚠️ Le champ contenait https://meet-solenn.com/privacy, une route qui
      n'existait pas : le visiteur retombait sur l'écran d'accueil de l'app.
      Google ouvre ce lien pendant l'examen, c'était un motif de rejet certain
      (relevé le 2026-08-30). La page a été créée le même jour, et /privacy
      redirige désormais vers la politique pour qu'aucun lien déjà déposé ne
      tombe dans le vide.
- [ ] **Permissions Health Connect** : déclarer EXACTEMENT trois types, et
      seulement ceux-là : **pas, fréquence cardiaque, sommeil**.
      ⚠️ Pas le poids : il est saisi à la main dans l'app, jamais lu depuis
      Health. Le code demandait huit types (dont distance, calories, poids,
      taille, activité) et n'en lisait que trois ; ramené à trois le
      2026-08-25 dans `useCapacitor.js`. Google cible le « data overreach »,
      Apple aussi (5.1.1). La déclaration doit refléter le code, pas l'inverse.
- [x] **Classification du contenu (IARC)** : refait et envoyé le 2026-08-30.
      Interaction entre utilisateurs = NON (le forum est retiré), contenu en
      ligne = OUI (réponses IA et programmes générés côté serveur), achats
      numériques = OUI, navigateur intégré = NON, produit d'actualité ou
      d'éducation = NON. Résultat : PEGI 3, ESRB Tout public, USK Tous
      publics, Brésil ClassInd 14+ (conséquence honnête du contenu en ligne).
      « Interactivité des utilisateurs » et « risques de communication
      accrus » ont disparu. Le questionnaire ne s'édite pas : il se refait en
      entier via Contenu de l'application → Classification du contenu →
      Gérer → Répondre au nouveau questionnaire.
- [ ] **Data safety form** : déclarer données santé collectées, chiffrées en
      transit, non partagées à des fins publicitaires.
- [ ] **Contenu généré par les utilisateurs : NON.** ⚠️ Une réponse « oui »
      avait été cochée à l'époque où le forum était prévu. Le forum a été retiré
      du lancement le 2026-07-21 et vérifié inaccessible le 2026-08-25 : les
      trois barres de navigation l'excluent, et le seul déclencheur restant
      n'est branché nulle part. **Décocher cette réponse dans Play Console.**

      Ne pas la laisser par confort : déclarer du contenu généré par les
      utilisateurs impose un outil de signalement, un moyen de bloquer un
      utilisateur, une modération démontrable et un délai de traitement, chez
      Google comme chez Apple (article 1.2, motif de rejet fréquent). S'engager
      à tout ça pour une fonctionnalité que personne ne peut ouvrir n'apporte
      rien et attire le contrôle sur un sujet sans bénéfice.

      Le code du forum est conservé et réactivable. Si tu le rouvres un jour,
      il faudra REPRENDRE cette déclaration **et** construire la modération
      avant de soumettre.

## 1 bis. Compte d'examen pour Google et Apple

Les deux magasins exigent des identifiants de test permettant aux examinateurs
d'entrer dans l'application. Chez Google : Contenu de l'application →
Informations de connexion. Chez Apple : App Review Information.

**Ne JAMAIS donner le compte personnel de Jean.** Les examinateurs verraient de
vraies conversations, de vraies mesures de santé et un vrai suivi de cycle.

### Le compte à créer

Adresse : `coolcouleur+review@gmail.com`, mot de passe saisi par Jean elle-même.
Inscription complète dans l'app, avec des réponses neutres.

### ⚠️ Le rendre Pro DÉFINITIVEMENT, sinon rejet à la première mise à jour

L'essai dure 21 jours. Un compte neuf a donc tout, et le premier examen se passe
bien. Mais à la mise à jour suivante l'essai aura expiré, les examinateurs
tomberont sur l'écran d'abonnement, et le motif de rejet est classique : « nous
n'avons pas pu accéder à l'ensemble des fonctionnalités ».

Après l'inscription, dans l'éditeur SQL de Supabase :

**Le schema de `profils`, verifie le 2026-08-30 contre la base elle-meme**, apres
qu'une session eut propose une requete fausse : la table a exactement deux
colonnes utiles, `user_id` et `profil`, cette derniere en JSONB. Il n'existe
**ni colonne `isPro`, ni `proManuel`, ni meme `id`** : les trois renvoient
`42703 column does not exist`. Toute requete qui les traite comme des colonnes
echoue. Les champs vivent DANS le JSON.

D'abord le diagnostic, pour savoir ou on en est :

```sql
select u.id, u.email, (p.user_id is not null) as profil_existe
from auth.users u
left join profils p on p.user_id = u.id
where u.email = 'coolcouleur+review@gmail.com';
```

Aucune ligne → le compte n'est pas cree. `profil_existe = false` → le compte
existe mais l'inscription n'est pas allee a son terme, la finir dans l'app.

Puis la mise a Pro :

```sql
update profils
set profil = coalesce(profil, '{}'::jsonb) || '{"isPro": true, "proManuel": true}'::jsonb
where user_id = (
  select id from auth.users where email = 'coolcouleur+review@gmail.com'
)
returning user_id, profil->>'nom' as nom, profil->>'isPro' as pro, profil->>'proManuel' as manuel;
```

Une ligne avec `pro = true` et `manuel = true` : c'est bon. Le `returning` est
le seul garde-fou, ne rien conclure sans le lire.

Pas de `proSince` : verifie le meme jour, ce champ n'est jamais lu pour
calculer quoi que ce soit, il est purement informatif. Inutile d'inventer une
date que personne n'a demandee.

Même mécanisme que le compte de Jean : `proManuel`, sans aucun abonnement
Stripe derrière. La page d'abonnement affichera « accès offert, rien à gérer »,
ce qui est correct.

### Ordre des opérations

1. Créer le compte et terminer l'inscription
2. Lancer le SQL ci-dessus
3. Saisir identifiant et mot de passe dans Play Console

C'est seulement à ce moment que « Cible et contenu » se débloque, donc la
tranche d'âge 18 et plus.

### Ce que Jean doit faire elle-même, et personne d'autre

- **La case « J'accepte les Conditions d'utilisation de l'IARC »** au début du
  questionnaire de classification. C'est un engagement juridique à son nom.
- **Les deux déclarations à la création d'une application** : respect du
  règlement du programme pour les développeurs, et lois américaines sur
  l'exportation.
- **Tout mot de passe.** Aucune session Claude n'en saisit, jamais.

---

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
