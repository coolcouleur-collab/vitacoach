# En attente, Solenn

## Chantier « application sportive », ouvert le 2 septembre 2026

Jean a demande que Programme devienne une vraie application sportive, et a
choisi de tout construire quitte a decaler le lancement.

### Fait et en ligne

- **Le catalogue.** Quatre programmes ecrits a la main, avec promesse, public
  vise, mecanisme, rythme, contre-indications et resultats attendus.
  Reequilibrage alimentaire (28j), Remise en mouvement (42j), Defi 21 jours,
  Sommeil et energie (21j). Le meme fichier sert au client et au serveur.
- **Le lecteur de seance.** Un exercice a la fois, photo, etapes, chronometre
  qui survit au verrouillage de l'ecran, repos decompte, bilan qui valide le
  jour. Ecran maintenu allume pendant l'effort.
- **Les rappels locaux.** Poses sur le telephone, fenetre glissante de 10
  jours a cause de la limite de 64 d'iOS, reposee a chaque ouverture.

### Fait aussi, et compile

- **Health Connect**, pont Kotlin ecrit a la main. Les permissions sante que
  le manifeste reclamait depuis toujours sont enfin utilisees. Kotlin ajoute
  au projet, minSdk passe de 24 a 26.
- **Le suivi de course.** Temps, distance, allure. Le filtrage GPS est la
  piece delicate et il est mesure : 0 metre pour un telephone immobile la ou
  un compteur naif en annonce 2382.
- **L'ecran de veille Android.** Service de premier plan, notification
  permanente, course qui survit au verrouillage.

### Ce qui reste, et qui demande un Mac

1. **La Live Activity iOS.** Ecrite dans `ios/LiveActivity/`, jamais
   compilee : c'est la seule partie du chantier qui n'est pas passee par un
   compilateur. Le LISEZ-MOI de ce dossier donne les etapes Xcode, dont le
   piege du fichier d'attributs qui doit appartenir aux DEUX cibles. Prevoir
   deux ou trois corrections a la premiere compilation.

2. **Le GPS en arriere plan sur iOS.** Le mode `location` est declare dans le
   Info.plist, mais `@capacitor/geolocation` ne demande pas
   `allowsBackgroundLocationUpdates` a CoreLocation. Ecran verrouille, le
   temps continuera, la distance se figera. Il faudra un petit pont
   CoreLocation, sur le modele de celui de Health Connect.

3. **Reconstruire les paquets.** Le bundle Android depose chez Google date du
   30 aout, l'iOS embarque du 21 juillet. Tout ce chantier n'y est pas.

### A verifier sur un vrai telephone, ce qu'aucun test ne remplace

- une course reelle, dehors, pour confronter la distance a un parcours connu
- le verrouillage de l'ecran pendant une course, sur Android
- la connexion Health Connect, et les metriques qui remontent
- les rappels du programme, qui doivent arriver aux heures prevues

### Ce qui ne pourra pas se faire sans une montre

Le rythme cardiaque EN DIRECT pendant l'effort ne vient pas de HealthKit. Il
suppose une Apple Watch executant une session d'entrainement, donc une
application watchOS compagnon, qui est un projet a part entiere. Sans elle, le
cardio est relu APRES la seance, ce que l'app fait deja. Les pas en direct,
eux, viennent du telephone seul, et la distance vient du GPS.

### Deja branche cote serveur, a rebrancher cote ecran

`agents/sync-sante.js` synchronise deja Withings, Oura et Garmin. Ce n'est pas
a construire, c'est a exposer.

---

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

**2. Resend.** ~~Attendre la propagation~~ : les trois enregistrements sont
en place et vérifiés le 1er septembre 2026 par deux résolveurs indépendants
(SPF `v=spf1 include:amazonses.com ~all` sur `send`, MX vers
`feedback-smtp.eu-west-1.amazonses.com`, DKIM `resend._domainkey`). Le SPF du
sous-domaine était le seul qui manquait. Reste : cliquer « Verify DNS Records »
dans Resend, créer la clé, puis `RESEND_API_KEY` dans les variables Render.
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

### ⚠️ La fiche Play a été REFAITE le 2026-08-30 — mauvais nom de package

L'ancienne fiche était enregistrée sous **`com.solenn.ap`**, sans le « p »
final : une faute de frappe faite à sa création. Tout le reste du projet dit
`com.solenn.app`, y compris les deux applications Firebase. Le nom de package
étant définitif chez Google, et l'ancienne fiche n'ayant jamais rien publié,
elle a été remplacée.

- **Nouvelle fiche, celle qui compte** : app `4974374457808147962`
- Ancienne, à supprimer une fois la nouvelle complète : `4972821536691969226`

Le bundle Android a été construit, déposé et accepté sur la nouvelle fiche le
2026-08-30 : version brouillon « 2 (1.1) », aucune erreur de package.

**Toutes les déclarations sont donc à refaire sur la nouvelle fiche.** Les
réponses sont dans `STORES.md`, il n'y a rien à réinventer.

**Bloquant côté Jean, personne ne peut le faire à sa place** : la case des
conditions IARC, et les identifiants du compte d'examen. Voir la section
« Compte d'examen » de `STORES.md` : compte dédié, jamais le compte personnel,
et à rendre Pro définitivement sous peine de rejet à la première mise à jour.

**Health Connect : devrait maintenant apparaître**, un bundle ayant enfin été
déposé. Trois permissions exactement : pas, fréquence cardiaque, sommeil. Le
manifeste en déclarait une quatrième, la distance, retirée le 2026-08-30 :
Google lit ce manifeste, une permission en trop devient une donnée déclarée que
l'app ne consulte jamais.

~~**Health Connect : BLOQUÉ, et ce n'est pas un oubli.**~~ La déclaration n'existe
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

## Après le lancement, chantier n°1 : le vrai thème sombre

Décidé le 1er septembre 2026. Le mode Nuit ne colore aujourd'hui QUE l'accueil :
`HomeTab` peint `document.body` en `#070f1e` tant qu'il est monté, et lui seul.
Étendre aux autres pages représente environ 600 couleurs écrites en dur, donc
un risque de régression réel à quelques jours de la sortie.

Décision : ne pas étendre maintenant, nommer la limite. Le réglage s'appelle
« Ambiance de l'accueil » et le dit explicitement. Ce n'est pas un abandon :
une app dont le moment signature est « Prépare ton sommeil » aura besoin d'un
vrai thème sombre, et les testeuses le demanderont.

`src/palette.js` a été créé pour ça. Le jour où on l'étend, il suffira de
donner une variante nuit aux six jetons au lieu de chasser 600 valeurs.

## Pourquoi les corrections de couleur en oubliaient toujours

Relevé le 1er septembre 2026, après quatre passages successifs. Une couleur
n'est presque jamais écrite en clair dans ce code. Cinq mécanismes la cachent,
et chacun a survécu à au moins un passage :

1. **Fabriques** : `am(0.8)`, `warmText(op)`. Une fonction construit la couleur.
2. **Constantes locales** : `TXT_MAIN`, `ACCENT`. Une valeur pour vingt textes.
3. **Suffixe d'alpha hexadécimal** collé à la couleur, qui la délave.
4. **Ternaires**, y compris à l'intérieur d'un attribut JSX.
5. **Attributs d'icône**, qui s'écrivent avec un égal et non deux points, et
   relèvent du seuil 3,0 et non 4,5.

Avant toute nouvelle campagne de lisibilité, chercher ces cinq formes, pas
seulement les valeurs littérales.

Non trouvé : l'option « moins de 5h » de sommeil signalée comme manquante.
Le seul réglage de durée est le curseur du check-in du matin, qui va de 2h à
12h. Moins de 5h y est donc déjà possible.


## Photos d'exercices : 14 manquantes sur 25, chiffre verifie

Compte du 1er septembre 2026 dans `src/ExercicesGuide.jsx` : la table
`PHOTOS_EXOS` contient 11 entrees, la bibliotheque en compte 25.

Avec photo : squat, gainage, fente, pont, chaise, chatvache, marche,
etirement, pompe, dips, superman.

Sans photo, donc affiches avec la silhouette animee de repli : pompegenoux,
mountainclimber, jumpingjack, crunch, russiantwist, birddog, donkeykick,
mollets, stepup, genouxhauts, squatsaute, fentelaterale, planchelateral,
legraise.

Ce n'est pas casse : `PhotoExo` retombe volontairement sur `<exo.Anim />`.
Mais le melange se voit, onze photos et quatorze dessins. Deux issues, au
choix de Jean : trouver 14 photos, ou passer les 25 a l'animation pour que ce
soit homogene en attendant. Je n'invente pas d'adresses Unsplash : une
reference non verifiee donne une image absente ou hors sujet.

## Le croisement des contre-indications

Décidé le 1er septembre 2026. Les 36 fiches de Soins portent déjà des
contre-indications précises, mais elles sont imprimées sur la fiche : c'est à
l'utilisatrice de se diagnostiquer elle-même. Personne ne fait le lien.

`src/contreIndications.js` fait le croisement. Mesuré sur les vraies fiches :

- **enceinte : 10 fiches sur 36** lui sont déconseillées
- **sous anticoagulant : 9 sur 36**
- **les deux, plus un trouble thyroïdien : 15 sur 36**
- **aucune situation déclarée : 0**, donc aucun faux signalement

Aujourd'hui, une femme enceinte qui ouvre Soins voit ces dix fiches comme les
autres.

Le moteur ne fait aucune interprétation : chaque situation connaît les mots qui
la désignent dans les contre-indications écrites à la main, et on les cherche
littéralement. Vérifiable, et il échoue du bon côté, en signalant trop plutôt
que pas assez.

Reste à faire : trois questions facultatives à l'inscription (grossesse ou
allaitement, traitements réguliers, opération prévue), et l'affichage sur la
fiche. La phrase signale, n'interdit pas, et renvoie au pharmacien : Solenn
n'est pas un dispositif médical, et la mention doit le rester.
