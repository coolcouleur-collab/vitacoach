# En attente — Solenn

Point au **25 août 2026**, fin de journée. Ce fichier remplace la mémoire de la
conversation : tout ce qui reste à faire est ici, avec le pourquoi.

---

## À faire par Jean

### Bloquant avant les bêta-testeurs

**1. Passe d'usage sur iPhone.** La seule chose que personne ne peut faire à ta
place. L'inscription en entier, le chat avec la dictée, un programme généré, la
routine, la nutrition, les Soins, les Paramètres. C'est là que sortiront les
problèmes de rendu mobile, jamais vérifiés jusqu'ici.

**2. Resend.** Attendre que le domaine passe au vert (SPF et DMARC en
propagation), créer la clé, puis `RESEND_API_KEY` dans les variables Render.
Sans elle, la suppression de compte fonctionne mais n'envoie aucun email de
confirmation.

**3. Une erreur non élucidée.** Tu as vu un message d'erreur en ouvrant les
Paramètres. Impossible à reproduire : la page s'ouvre proprement sur la version
en ligne, aucune erreur en console. Si elle revient, noter le message exact.

### Notifications natives — quand tu auras accès à un Mac

Tout le reste est prêt et vérifié : table `push_tokens` créée, routes serveur en
place, `FIREBASE_SERVICE_ACCOUNT` lue par Render (`envoiConfigure: true`), clé
APNs déposée dans Firebase, interrupteur branché côté app.

Il ne manque que la compilation :

- Déposer `GoogleService-Info.plist` dans `ios/App/App/`
- Déposer `google-services.json` dans `android/app/`
- Compiler et installer sur iPhone via TestFlight

**Testable AVANT le Mac, depuis le PC** : la même chaîne Firebase sert Android.
Compiler l'app Android avec Android Studio valide tout sauf la partie Apple.

Pour compiler iOS sans posséder de Mac : Codemagic, gratuit jusqu'à 500 minutes
par mois, part directement du dépôt GitHub. Demande une **clé API App Store
Connect**, à créer dans le compte Apple. Les dossiers `ios/` et `android/` sont
déjà versionnés, rien à préparer.

### Conformité magasins — jamais fait, trouvé le 2026-08-25

~~Incohérence 21 / 14 jours d'essai~~ **RÉGLÉE le 2026-08-25** : Jean a tranché
pour 21 jours. L'essai couvre désormais un programme entier, et la fiche des
magasins, qui promettait déjà 21 jours, redevient exacte.

**Classification du contenu : FAITE le 2026-08-30.** Le questionnaire IARC a
été refait en entier, l'interaction entre utilisateurs passée à non. Résultat
PEGI 3, USK Tous publics. Le Brésil reste à 14+, conséquence honnête du contenu
en ligne, et ce n'est pas un problème.

**Health apps, Data safety et politique de confidentialité : FAITS le
2026-08-30.** Cinq catégories bien-être déclarées, aucune médicale, donc le
compte personnel reste suffisant. Data safety corrigé sur quatre points au-delà
de ce qui était prévu : l'URL de suppression pointait vers une route morte, la
suppression partielle était sur non, les données de santé étaient déclarées
partagées alors que Groq est un sous-traitant, et les messages étaient déclarés
éphémères alors qu'ils sont stockés dans `solenn_chats`. La fiche affiche
désormais « Aucune donnée partagée avec des tiers ». Les conditions de Groq ont
été vérifiées avant de décocher : pas de rétention sur l'inférence, journaux
temporaires trente jours, aucun entraînement sur les données d'API.

**Health Connect : BLOQUÉ, et ce n'est pas un oubli.** La déclaration n'existe
pas encore dans la console, parce que Google ne la fait apparaître qu'après
avoir lu les permissions dans le manifeste d'un bundle. Or aucun bundle n'a
jamais été déposé, le canal de tests internes est inactif.

**La suite passe donc par la construction de l'app Android**, faisable depuis le
PC sans aucun Mac. Tout est prêt : le keystore de signature existe déjà
(`android/app/solenn-release.keystore`, alias `solenn`), `key.properties` est
configuré, et `google-services.json` a été déposé dans `android/app/` le
2026-08-30. Le greffon Google Services s'active automatiquement dès que ce
fichier est présent.

Cette même construction débloque **trois choses d'un coup** : la déclaration
Health Connect, le test réel des notifications natives, et l'ouverture du canal
de tests internes.

À surveiller : l'ID du certificat IARC affiche encore un tiret. C'est normal
tant que l'app est en brouillon ; s'il reste vide après la première soumission
d'une version pour examen, il faudra creuser.

### Vérification de sécurité — faite le 2026-08-25

Mesuré depuis le navigateur, sur le compte réel :

- **Connectée** : 9 challenges, 6 rapports, 7 conversations, 1 profil, dont
  **0 appartenant à quelqu'un d'autre**.
- **Sans aucun compte** : **0 ligne lisible**, sur toutes les tables, forum
  compris.

Le durcissement du 2026-08-12 tient donc.

Le cinquième test, « le forum en écriture », est **sans objet** : il datait de
l'époque où le forum devait être dans l'app. Il en est retiré et personne ne
peut y accéder, donc rien à vérifier. À rouvrir si le forum revient.

### Point ouvert dans le code — sans gravité

`/api/business/dashboard` ne vérifie pas son jeton d'organisation, mais il ne
renvoie que des chiffres inventés et il est derrière `adminGuard`. Vérifié le
2026-08-25 : la route répond 401 sans la clé, donc `AGENTS_TRIGGER_KEY` est bien
définie en production. À reprendre le jour où le B2B devient réel.

### Administratif

- Digidom : signature du contrat de domiciliation
- INPI : transfert de siège social
- Échéance IA à couper avant février 2027

### Optionnel

- Un nouveau code promotionnel à 100 % dans Stripe pour voir le bloc de
  résiliation avec de vraies données. Le compte de Jean est Pro « manuel »,
  sans abonnement Stripe : le bouton n'apparaît donc pas, c'est volontaire.
  L'ancien code `TESTSOLENN` était limité à une utilisation, il est consommé.
- Le portail client Stripe : la configuration a été enregistrée, mais rien ne
  prouve qu'elle fonctionne tant qu'un vrai abonné n'a pas cliqué sur le lien
  secondaire « Changer de carte ou voir mes factures ».

---

## À faire côté code

### Signalé, non corrigé faute d'accord ou de preuve

**SettingsSheet porte la même fragilité d'animation** que celle qui a coûté
l'après-midi du 25 août : `animation: ... both` maintient la position de départ
tant que l'animation n'a pas tourné, hors écran. Elle fonctionne aujourd'hui,
mais peut se bloquer de la même façon. Correctif : supprimer l'animation de
glissement, comme fait pour la feuille d'abonnement.

**`Auth.jsx` porte le même motif que le questionnaire d'inscription** :
`minHeight: 100vh` avec `overflow: hidden`, alors que `body` est en
`position: fixed`. Le formulaire est court et centré donc invisible en pratique,
mais il clipperait sur un petit écran. Non touché faute de signalement, et parce
que centrage flex et défilement se combinent mal.

### Chantiers décidés mais non commencés

- **Photos des 13 nouveaux exercices.** Ils ont leurs animations, ce qui suffit
  à montrer le geste. La recherche de photos justes se fait en lot : le taux de
  photos réellement exactes est faible, voir l'épisode des pompes sur genoux.
- **Chantier C, le catalogue de programmes signés.** Évoqué, jamais tranché.

### Après le lancement

- Relecture des contre-indications de Santé Naturelle par un pharmacien
- Traductions : décidé explicitement pour APRÈS la finalisation de l'app

---

## Fait et vérifié le 25 août

Trois choses validées de bout en bout, mesures à l'appui, pas sur parole :

1. **La chaîne de paiement.** Coupon 100 %, compte jetable, paiement à 0 €,
   webhook Stripe qui écrit `isPro: true` en base. Vérifié dans la base.
2. **La suppression de compte.** Efface les données ET résilie l'abonnement
   Stripe. Vérifié : l'abonnement de test est passé en « Annulé » tout seul.
3. **Les notifications web.** Activation, enregistrement côté serveur,
   désactivation qui retire vraiment la ligne, réactivation. Vérifié dans
   Chrome sur le compte réel.

Bugs corrigés, dont plusieurs anciens et invisibles :

- **Aucun profil rempli dans l'app n'atteignait la base**, depuis toujours :
  une colonne `updated_at` inexistante faisait rejeter toute l'écriture par
  PostgREST, en silence. Les profils ne vivaient que dans le navigateur, et
  toute déconnexion les détruisait définitivement.
- **La clé VAPID était invalide**, 64 octets au lieu de 65 : aucun abonnement
  aux notifications n'a jamais pu être créé, pour personne. Remplacée.
- **Le statut Pro fuyait d'un compte à l'autre** sur le même navigateur : la
  déconnexion n'effaçait pas le drapeau, et la base ne savait qu'accorder,
  jamais révoquer.
- **La session Stripe n'était rattachée à personne** : n'importe quel
  identifiant de session valide permettait de se déclarer Pro.
- **Terminer l'inscription effaçait l'abonnement** de quelqu'un qui venait de
  payer, en écrasant le profil entier avec un `isPro: false` codé en dur.
- **L'inscription se bloquait sans issue** : deux tapes rapprochées sautaient
  par-dessus la dernière étape, et l'étape était mémorisée.
- **Les dernières questions étaient inatteignables** : conteneur sans hauteur
  bornée sous un `body` en `position: fixed`.
- **Un abonné ne pouvait pas résilier.** La gestion d'abonnement vit désormais
  dans Paramètres → Mon Abonnement, obligation légale depuis juin 2023.
- **Couper les rappels ne les coupait pas** : le désabonnement envoyait le
  prénom au lieu de l'identifiant du compte.
- **293 tirets cadratins** supprimés de toute l'interface.

Ajouts : le cycle 2 en fin de programme, la bibliothèque passée de 12 à 25
exercices.
