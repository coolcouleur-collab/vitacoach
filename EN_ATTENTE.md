# En attente, Solenn

## PREMIERE SESSION SUR UN VRAI IPHONE, 6 septembre 2026

Solenn a tourne pour la premiere fois sur un iPhone (16 Pro Max, iOS 26.6.1,
build Debug par cable, console attachee depuis le Mac avec
`xcrun devicectl device process launch --console`). Cinq defauts qui ne
pouvaient se voir nulle part ailleurs, tous corriges et commites :

1. **La course affichait « position non disponible ».** useCourse.js appelle
   sur iPhone un greffon natif « PositionCourse » dont le Swift n'existait
   pas. Ecrit : `ios/App/App/PositionCoursePlugin.swift`, enregistre par
   `SolennViewController` (Main.storyboard pointe dessus). Verifie sur
   l'iPhone : points a 9 a 17 m de precision. Le mode arriere-plan
   `location` est donc utilise pour de vrai ; la question de le retirer est
   close. L'autorisation demandee est « pendant l'utilisation », qui suffit
   pour une sortie lancee a la main ; la cle « toujours » d'Info.plist reste
   sans etre demandee.
2. **Apple Sante restait muet.** Trois causes empilees : la fenetre
   d'accueil « Autoriser l'acces » ne demandait rien (elle posait un drapeau)
   ; le chargeur du greffon faisait `await` sur un Proxy Capacitor, qui
   repond a `then` et n'aboutit jamais ; et les noms de types d'autorisation
   n'etaient pas ceux du greffon. Puis la lecture des resultats utilisait la
   cle `quantity` au lieu de `value`, et `d.value === 'ASLEEP'` au lieu de
   `sleepState === 'Asleep'` avec `duration` en heures.
3. **Les appels `/api/...` relatifs n'avaient pas de serveur en natif** :
   capacitor://localhost servait la page HTML avec un 200, et chaque
   `r.json()` echouait en silence. Trente-cinq appels, iPhone ET Android.
   `src/api.js`, importe en premier dans main.jsx, les route vers
   VITE_API_URL en natif. Rien ne change sur le web.
4. **Une seance enregistree n'apparaissait pas** dans « Tes seances » avant
   un rechargement : App.jsx passe sa copie du profil aux onglets, et
   seances.js n'ecrivait que localStorage. Evenement `solenn:profil` emis,
   suivi dans App.jsx.
5. Les echecs muets (enregistrement de seance, Apple Sante) ecrivent leur
   raison dans la console, et une ecriture Supabase refusee rend ok:false.

### Constats qui ne sont pas des bugs

- Une seance de moins de trente secondes est refusee (« trop courte »), par
  conception. Deux essais de Jean ont dure 3 et 10 secondes.
- Progres (l'onglet « sante » du code) n'affiche la progression qu'a partir
  de trois jours de donnees, et ne compare qu'a sept. Un iPhone neuf n'a
  qu'un jour.
- Sur l'iPhone de Jean, Apple Sante n'a que des pas : sommeil, frequence
  cardiaque et poids ont rendu zero releve. Il faut une montre ou une saisie
  manuelle dans l'app Sante pour les voir remonter. Non verifie : une saisie
  de poids dans Sante puis « Sync » doit faire apparaitre le poids.
- Le petit son au toucher vient de Web Audio, qui respecte le mode
  silencieux sur iOS. Jean n'a pas dit si l'iPhone etait en silencieux.

### Pour relancer sur l'iPhone

`npm run build && npx cap sync ios`, puis dans Xcode choisir l'iPhone et
Run ; ou en ligne de commande, `xcodebuild ... -destination 'id=<UDID>'
-allowProvisioningUpdates build` puis `xcrun devicectl device install app`.
Le mode developpeur est active sur l'iPhone, l'appareil est enregistre sur
le compte, le profil de developpement existe. Un build Debug expire au bout
de sept jours.


## ETAT DU MAC, 6 septembre 2026 (mis a jour dans la nuit)

Xcode 26.3 (build 17C529) est installe dans Applications, avec le SDK iOS 26.2
et le simulateur iOS 26.3. **Le projet compile, s'installe et s'ouvre sur
l'ecran de connexion dans le simulateur iPhone 17 Pro**, avec l'icone Solenn.
Tout est commite.

### Ce qui a ete fait sur le Mac

- Les trois gestes du bloc de reprise : equipe de signature, `App.entitlements`
  (HealthKit, push), `PrivacyInfo.xcprivacy` dans la phase Resources. Verifie
  dans le bundle produit : le manifeste y est. Xcode a reecrit `Info.plist` en
  dedoublonnant les cles ; les commentaires ont disparu, le contenu est le meme.
- **Node.js 22.23.2 installe dans `~/.local/node`** (pas de Homebrew, pas de
  droits admin, Mac Intel sous Sequoia 15.7.9). `~/.zprofile` l'ajoute au PATH.
  Dans une session Claude, faire `export PATH="$HOME/.local/node/bin:$PATH"`
  avant npm.
- **`.env` cree sur le Mac avec la seule variable que lit le front** :
  `VITE_API_URL=https://solenn-api.onrender.com` (l'URL de vercel.json). Sans
  elle, le bundle iOS appelle l'API en relatif et les ecrans qui passent par
  Render echouent en silence. `.env.example` pointait encore vers Railway,
  corrige. Les cles serveur ne sont pas sur le Mac, elles ne servent qu'a
  `server.js`.
- **`Package.swift` regenere avec des barres obliques.** Ecrit depuis Windows,
  il portait des antislashs que Swift Package Manager ne resout pas. Commite
  depuis le Mac ; si une session Windows refait `cap sync`, le recommiter d'ici.

### Deux defauts trouves et corriges, qui auraient fait rejeter l'app

**1. Apple Sante n'etait pas dans le binaire iOS.** `@perfood/capacitor-healthkit`
n'a pas de `Package.swift` : Capacitor 8 en mode SPM l'exclut a chaque
`cap sync` (« does not have a Package.swift ») alors que `capacitor.config.json`
demande la classe `CapacitorHealthkitPlugin`. La 2.0.0-alpha.2 a le meme
defaut. Le fichier Swift du greffon (MIT) est copie dans
`ios/App/App/CapacitorHealthkitPlugin.swift`, converti a `CAPBridgedPlugin`,
et ajoute a la cible App. Verifie : la classe est dans le binaire et HealthKit
est lie. Si le greffon npm change de version, reporter la difference a la main.
**Le simulateur ne peut pas tester HealthKit** : la preuve finale reste le
vrai iPhone.

**2. L'icone iOS etait le logo par defaut de Capacitor** (croix bleue sur
grille). La note du 4 septembre disait « l'icone fait 1024x1024 », c'etait vrai
et trompeur. `public/icons/ios-1024.png` (l'orbe avec le S, comme sur Android)
existait depuis mai mais n'avait jamais ete copie dans le catalogue Xcode, et
il a une couche alpha, qu'App Store Connect refuse. Version opaque generee :
l'orbe pose sur un carre de la couleur exacte de son bord (40, 22, 12), sans
liseré. **Jean valide le rendu** : si elle prefere un autre fond de coins,
le script est trivial a refaire.

### Ce qui reste, et que seule Jean peut faire

- Menage dans Telechargements : `Xcode.app` (4,7 Go) et
  `Xcode_26.3_Universal.xip` (2,7 Go) sont des doublons de la copie installee
  (inode different, meme version). A mettre a la corbeille.
- Le test de course de trois minutes ecran verrouille sur un vrai iPhone, qui
  tranche le sort de `location` dans `UIBackgroundModes` (voir plus bas).
- ~~Le numero de build~~ : regle le 6 septembre au soir. App Store Connect
  affiche « Aucune app », rien n'a jamais ete envoye, le build 1 de la
  version 1.1 est bon. En passant, deux prealables a la soumission Apple ont
  ete reperes, consignes dans STORES.md section 2 : le contrat de licence a
  accepter par Jean, et le statut de commercant UE (DSA) a declarer.
- Brancher l'iPhone et lancer depuis Xcode : `npm run cap:ios` ouvre le projet
  avec le bundle a jour.


## REPRISE SUR LE MAC, 4 septembre 2026 au soir

Jean passe sur son MacBook pour la partie iOS. Une session Claude Code ne se
transfere pas d'une machine a l'autre : ce bloc est le passage de relais. Lire
aussi `CLAUDE.md` a la racine, qui porte les regles de Jean et les deux defauts
qui reviennent sans cesse dans ce depot.

### La version de Xcode a installer, et elle n'est pas evidente

Le Mac de Jean est sur **macOS Sequoia 15.7.9** et ne peut pas monter en
macOS 26 : la mise a niveau ne lui est pas proposee. L'App Store refuse donc
Xcode en disant « macOS 26.2 requis », parce qu'il ne propose que la derniere
version.

**Prendre Xcode 26.3 sur `developer.apple.com/download/all`, pas l'App Store.**

Verifie sur la page officielle des exigences systeme le 4 septembre :
- Xcode 26.3 demande macOS Sequoia **15.6** minimum, donc il tourne sur 15.7.9
- il embarque le **SDK iOS 26.2**
- or depuis le **28 avril 2026**, un envoi sur App Store Connect doit etre
  construit avec le SDK iOS 26 ou plus recent

Xcode 26.3 est donc exactement le plafond de cette machine, et il suffit a
publier. Xcode 26.4 et au-dela exigent Tahoe : ne pas les proposer. Le jour ou
Apple exigera le SDK iOS 27, cette machine sera bloquee et il faudra soit un Mac
plus recent, soit un service de compilation dans le cloud du type Codemagic.

### Les trois gestes dans Xcode, avant meme de compiler

1. L'equipe de signature, avec le compte developpeur de Jean.
2. **Ajouter les capacites HealthKit et Push Notifications** dans Signing &
   Capabilities. Il n'existe AUCUN fichier d'entitlements dans le projet, Xcode
   le cree en ajoutant la capacite. Sans lui, HealthKit ne peut pas fonctionner
   et Apple rejette une app qui declare des types de sante sans la capacite.
   Cela veut dire que l'integration Apple Sante n'a jamais tourne sur iPhone.
3. **Glisser `ios/App/App/PrivacyInfo.xcprivacy` dans le navigateur de projet et
   cocher la cible App.** Le fichier existe deja sur le disque, mais Xcode doit
   le connaitre, sinon il n'est pas embarque et l'envoi est rejete
   automatiquement (le manifeste de confidentialite est exige depuis mai 2024).

### Le test qui tranche une question ouverte

`UIBackgroundModes` contient `location` et le texte de la permission promet que
la course continue ecran verrouille. Or rien ne l'implemente : le code ne demande
jamais l'autorisation Always, aucun Swift n'active
`allowsBackgroundLocationUpdates`, et le projet iOS ne contient que l'AppDelegate
par defaut la ou Android a `CourseService.kt`.

**Faire une course de test de trois minutes avec verrouillage de l'ecran, sur un
vrai iPhone.** Selon le resultat : soit ecrire l'equivalent iOS de CourseService,
soit retirer `location` de `UIBackgroundModes` et la chaine Always. Un mode
d'arriere-plan declare et inutilise est un motif de rejet frequent.

### Ce qui est deja fait et n'a pas besoin d'etre refait

Les cibles iOS concordent (tout exige iOS 15 au plus, le projet est a 15.0),
l'icone fait 1024x1024, `LaunchScreen.storyboard` existe et est declare,
`ITSAppUsesNonExemptEncryption` est pose. `MARKETING_VERSION` vaut 1.1 et
`CURRENT_PROJECT_VERSION` vaut 1 : si un build 1 a deja ete envoye pour la
version 1.1, passer a 2, App Store Connect refuse les doublons.

Le simulateur ne sert a rien ici : ni HealthKit ni le GPS n'y existent.

### Cote Android, rien n'attend le Mac

Google Play ne demande aucun Mac. Il reste a Jean : coller le paragraphe validee
dans la fiche (voir STORES.md), les captures d'ecran, et filmer trente secondes
de course pour le formulaire « Services en avant-plan » que Google presentera au
prochain depot du bundle.


## SUR LE MAC : ce qui a ete prepare d'avance (4 septembre)

Verifie depuis Windows pendant l'installation de Xcode, pour ne pas le decouvrir
en route : les cibles iOS concordent (tout exige iOS 15 au plus, le projet est a
15.0), l'icone fait bien 1024x1024, et `LaunchScreen.storyboard` existe et est
declare. Rien de ce cote-la ne bloquera la compilation.

**Deux fichiers ont ete ajoutes, ils demandent UN geste dans Xcode.**

`ios/App/App/PrivacyInfo.xcprivacy` : le manifeste de confidentialite exige par
Apple depuis mai 2024. Son absence fait rejeter l'envoi automatiquement, avant
toute relecture humaine. Capacitor fournit le sien pour ses frameworks, ce qui
ne dispense pas l'app du sien. **Il faut le glisser dans le navigateur de projet
Xcode et cocher la cible App**, sinon il ne sera pas embarque dans le bundle :
un fichier pose sur le disque ne suffit pas, Xcode doit le connaitre.

`ITSAppUsesNonExemptEncryption = false` a ete ajoute a `Info.plist`. Solenn
n'utilise que HTTPS, elle entre donc dans l'exemption. Cette cle evite qu'App
Store Connect repose la question a chaque envoi.

## Les deux vrais points d'attention iOS


**1. Il n'existe aucun fichier d'entitlements.** `find ios -name "*.entitlements"`
ne renvoie rien. HealthKit et les notifications push en exigent un. Xcode le
cree tout seul quand on ajoute la capacite dans l'onglet Signing & Capabilities,
mais tant que ce n'est pas fait, HealthKit ne peut pas fonctionner sur iOS et
Apple rejette une app qui declare des types de sante sans la capacite. C'est le
tout premier geste a faire dans Xcode, avant meme d'essayer de compiler.

**2. La position en arriere-plan est declaree mais rien ne l'utilise.**
`UIBackgroundModes` contient `location`, et le texte de
`NSLocationAlwaysAndWhenInUseUsageDescription` promet « Solenn continue de
mesurer ta sortie quand l'ecran est verrouille ». Or :
- le code ne demande jamais l'autorisation Always,
- aucun fichier Swift n'active `allowsBackgroundLocationUpdates`,
- le projet iOS ne contient que l'AppDelegate par defaut, la ou Android a trois
  fichiers Kotlin dont `CourseService.kt` qui fait vraiment le travail.

Deux consequences possibles, a verifier sur un vrai iPhone : la course s'arrete
sans doute de compter quand l'ecran se verrouille, et Apple rejette souvent un
mode d'arriere-plan declare que l'app n'utilise pas.

Deux issues, au choix de Jean :
- ecrire le code natif iOS qui active la mise a jour de position en arriere-plan
  (l'equivalent de CourseService), ce qui tient la promesse faite a l'ecran ;
- ou retirer `location` de `UIBackgroundModes` et la chaine Always, et assumer
  que sur iPhone la course se mesure ecran allume.

Ne rien decider avant d'avoir teste : le comportement reel se constate en une
course de trois minutes avec verrouillage de l'ecran.


## UNE DECISION QUI REVIENT A JEAN : les photos deja en base

MISE A JOUR DU 4 SEPTEMBRE, APRES COUP : ne pas lancer la requete SQL plus bas
sauf necessite. `solenn_chats` figure dans `TABLES_UTILISATEUR` (server.js),
donc supprimer un compte de test efface ses conversations, photos comprises.
Passer par la suppression de compte depuis l'app evite d'executer un `update`
non teste sur la table de production. La requete reste consignee ici au cas ou
un vrai compte serait concerne.

L'EXCEPTION : le compte d'examen coolcouleur+review@gmail.com ne doit PAS etre
supprime, Google en a besoin. Le bouton « Nouvelle conversation » ne supprime
rien cote serveur, il n'existe aucune route d'effacement de conversation. Le
plus simple est donc de ne pas envoyer de photo de repas depuis ce compte.


Depuis le commit `06e4cf8`, les photos de repas ne partent plus vers
`solenn_chats`. Mais les conversations ecrites AVANT ce correctif peuvent
encore en contenir, en base64 dans la colonne `messages`.

Je ne peux pas compter les lignes concernees : seule la cle anonyme est sur
cette machine, et RLS renvoie zero ligne (verifie le 4 septembre, `*/0`). Il
faut donc la console SQL de Supabase.

La requete ci-dessous retire uniquement la cle `image` de chaque message et
laisse tout le reste intact. Elle est encadree par une transaction : rien n'est
definitif tant que le `commit` n'est pas lance, et le compte final doit valoir
zero avant de le lancer. Le garde-fou `jsonb_typeof(messages) = 'array'` evite
d'ecraser une ligne dont la colonne ne serait pas un tableau.

```sql
begin;

-- 1. combien de conversations sont concernees
select count(*) as a_nettoyer, count(distinct user_id) as comptes
from solenn_chats
where jsonb_typeof(messages) = 'array' and messages::text like '%data:image%';

-- 2. retirer la cle image, en preservant l'ordre des messages
update solenn_chats
set messages = (
  select coalesce(jsonb_agg(e - 'image' order by n), '[]'::jsonb)
  from jsonb_array_elements(messages) with ordinality as t(e, n)
)
where jsonb_typeof(messages) = 'array' and messages::text like '%data:image%';

-- 3. doit valoir zero
select count(*) as restantes from solenn_chats where messages::text like '%data:image%';

-- si restantes = 0 et que le compte de l'etape 1 te parait juste :
commit;
-- sinon :
-- rollback;
```

Cette requete n'a pas ete executee ni testee sur les donnees reelles. Lancer
d'abord l'etape 1 seule : si le compte ne designe que les comptes de test, la
decision est sans enjeu.


## Corrige le 4 septembre 2026, en ligne

- **Fuite de donnees entre comptes sur un appareil partage.** Les quatre chemins
  de deconnexion effacaient trois choses differentes ; l'historique de
  conversation, les metriques, les tenues et la ville survivaient au changement
  de compte. C'est l'origine du « Solenn m'appelle Camille » : ce n'etait pas un
  artefact de session. Une seule fonction `oublierSession()` les remplace, avec
  une liste blanche des cles qui appartiennent a l'appareil. Commit `9735074`.

- **Withings et Garmin ejectaient l'utilisateur hors de l'app.** Marques
  disponibles en dur sans verifier que le serveur avait leurs cles. Withings
  construisait un `client_id=undefined` et envoyait la personne sur une page
  d'erreur de Withings ; Garmin repondait du JSON affiche en pleine page avec le
  nom de la variable manquante. Le serveur expose desormais `/api/connect/
  disponibles` et la carte porte son badge « Bientot » au lieu d'un bouton qui ne
  mene nulle part. Risque de rejet Play ecarte. Commit `a94d9a4`.

- **La page rouge « Erreur React » est remplacee par un filet.** Un rechargement
  silencieux, une seule fois, garde par soixante secondes ; la deuxieme erreur
  dans la meme minute affiche un ecran aux couleurs de l'app. Teste dans le
  navigateur avec une erreur de rendu simulee, en theme jour et nuit. Commit
  `c5e7332`.

- **Deux cartes de l'accueil qui ne tenaient pas leur promesse.** « Prepare ton
  sommeil » annoncait « respiration, detente » et ouvrait Progres ; elle ouvre
  Calme. « Pense a boire » est retiree : la barre d'hydratation est rendue juste
  au-dessus d'elle depuis hier, et la carte renvoyait vers Progres ou le bloc
  d'hydratation n'existe plus. Commit `14f2871`.

## Le plan produit recu le 4 septembre : ce qu'il faut en garder

Deux de ses affirmations sur l'app ne tiennent pas, verifiees dans le code :
les graphes vides de Progres ont deja un etat vide actionnable depuis le
2026-08-08, et les boutons d'integration ne « ne faisaient rien », ils
ejectaient hors de l'app (pire, et corrige ci-dessus). Traiter ses constats
comme des hypotheses a verifier, pas comme des faits.

Ce qui reste vrai et urgent, avant soumission :

- **La formulation « sans montre » dans la fiche Play Store.** Un telephone seul
  ne mesure ni le sommeil ni la frequence cardiaque. Promettre leur analyse sans
  montre est une allegation trompeuse au sens des regles Play, et la tuile
  Progres dit deja « Connecte ta montre ou saisis-la ». Formulation juste :
  « Sans montre : Solenn utilise les donnees deja dans ton telephone, et te pose
  une question quand il lui en manque une. »

- **Le programme nutrition qui propose encore des seances de sport.** Signale
  deux fois par Jean, toujours ouvert.

Ce qui est du v2, apres les premiers utilisateurs, et surtout pas maintenant :
le renommage des quatre onglets (les captures et la fiche Play seraient a
refaire), le brief du matin en notification (permission, planification, tache
serveur, regles Play sur les notifications), la memoire citee, la correlation
hebdomadaire. Bonnes idees, aucune ne se decide sans donnees d'usage reelles.
S'y ajoute, demande par Jean le 6 septembre depuis son iPhone : **la
frequence cardiaque sans montre ni bracelet**. Apple Sante ne peut pas la
fournir sans capteur ; la seule voie est la mesure par la camera (doigt sur
l'objectif, flash allume, lecture des variations de rougeur pendant une
trentaine de secondes), une fonctionnalite native entiere sur iOS et Android,
avec ses propres questions de precision et de validation par les stores.


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

## POURQUOI RIEN NE S'AFFICHE SUR L'ECRAN VERROUILLE D'UN IPHONE

Question de Jean le 2 septembre. Ce n'est pas un bug, la fonction n'existe
pas encore de ce cote. Trois blocages se superposent, tous verifies :

1. `src/ecranVeille.js` renvoie `false` avant meme de demander quoi que ce
   soit des que la plateforme n'est pas Android :
   `if (!androidNatif()) return false`. C'etait voulu, ce fichier a ete ecrit
   comme une facade Android avec iOS en point d'accroche.

2. L'extension n'est pas dans le projet Xcode. Les sept fichiers Swift sont
   sur le disque, mais `SolennActivite` apparait **zero fois** dans
   `project.pbxproj` et la seule cible declaree est `App`.

3. Le `www` embarque dans le projet iOS date du **21 juillet**. Meme installee
   aujourd'hui, l'app native ne contiendrait aucun travail des deux derniers
   mois. Android a ete resynchronise le 2 septembre.

Et sur meet-solenn.com, ca ne marchera jamais : une page web ne peut pas
dessiner sur l'ecran verrouille d'un iPhone. Il faut l'app native.

**Ce qui est testable des maintenant, sans Mac** : tout le reste de la course,
chrono, GPS, distance, et l'ecran de veille lui-meme, sur un Android.

## POUR DEMAIN, SUR LE MAC

Tout est ecrit, rien n'est compile. Environ une heure, dont la moitie a
attendre Xcode. Tout est detaille dans `ios/LiveActivity/LISEZ-MOI.md`, y
compris le tableau qui dit quel fichier va dans quelle cible.

1. Ouvrir `ios/App/App.xcworkspace`. **Le workspace, pas le xcodeproj**, sinon
   les dependances Capacitor manquent.

2. File, New, Target, **Widget Extension**, nommee exactement `SolennActivite`.
   Decocher « Include Configuration App Intent », **cocher « Include Live
   Activity »**. Supprimer le fichier d'exemple qu'Xcode cree.

3. Glisser depuis `ios/LiveActivity/` :
   - `SolennActiviteWidget.swift` dans la cible **SolennActivite**
   - `SolennActiviteAttributes.swift` dans **les DEUX cibles**, App et
     SolennActivite. C'est le piege le plus frequent de ce montage : si une
     seule des deux compile ce fichier, l'activite ne demarre jamais et rien
     n'explique pourquoi.
   - `EcranDeVeille.swift`, `EcranDeVeille.m`, `PositionCourse.swift` et
     `PositionCourse.m` dans `ios/App/App/`, cible **App uniquement**.

4. Compiler sur un **iPhone reel**. Ni les Live Activities ni le GPS ne
   fonctionnent dans le simulateur.

5. Prevoir deux ou trois corrections de frappe ou de signature a la premiere
   compilation. La logique, elle, est celle du service Android, qui est
   verifiee. Si une erreur resiste, la copier telle quelle.

**A savoir avant de commencer :** ajouter une extension change la composition
du paquet. Le prochain envoi repasse donc par une revue App Store, et il faut
un profil de provisionnement pour l'extension en plus de celui de l'app.

**Le test qui tranche :** lancer une course, verrouiller l'ecran, marcher deux
cents metres, attendre une minute. Le temps doit avoir avance sur l'ecran
verrouille, ET la distance aussi. Si le temps avance mais pas la distance,
c'est l'autorisation de position restee sur « quand j'utilise l'app » au lieu
de « toujours ».

### Play Console : deux formulaires que le chantier rend obligatoires

Le paquet Android a gagne des permissions. Google en examine deux categories,
et un envoi peut etre refuse tant que le formulaire n'est pas rempli.

1. **Services de premier plan.** Depuis Android 14, tout type de service doit
   etre declare et justifie dans la console. Le notre est de type `location`.
   Justification a donner : « mesure de la distance et de la duree d'une
   sortie sportive lancee par l'utilisateur, affichee en permanence dans une
   notification pendant l'activite ». Une courte video de la fonction est
   souvent demandee.

2. **Applications de sante.** Les permissions Health Connect (pas, sommeil,
   rythme cardiaque, poids) demandent le formulaire des applications de sante.
   Il etait deja du, puisque les permissions etaient declarees depuis
   longtemps ; la difference est qu'elles sont maintenant reellement
   utilisees, donc la justification est enfin vraie.

Bonne nouvelle en revanche : `ACCESS_BACKGROUND_LOCATION` n'est PAS demandee.
Le service de premier plan suffit, et c'est cette permission la qui declenche
le gros dossier de Google. Verifie apres compilation.

### Reconstruire les paquets

Le bundle Android depose chez Google date du 30 aout, l'iOS embarque du
21 juillet. Rien de ce chantier n'y est.

### CORRIGE le 4 septembre : le rapport hebdomadaire

Cette note disait « PAS corrige » alors que le correctif etait en place :
`agents/rapport-hebdo.js` importe `scoreJour` depuis `src/score.js` et recalcule
la moyenne a partir des metriques brutes ; plus aucune lecture de la colonne
`score`. Verifie le 4 septembre. Le texte d'origine est conserve ci-dessous
parce qu'il explique le piege, qui lui reste entier : deux notions differentes
portent toujours le meme nom dans la base, et la prochaine personne qui lira
cette colonne refera l'erreur. Renommer demande une migration.

### Le piege d'origine, toujours valable comme mise en garde

Le rapport envoie a Solenn la ligne « Score bien-etre : X/100 ». Ce X vient de
la moyenne de la colonne `score` de `user_metrics`. Or cette colonne ne
contient PAS le score de bien-etre : elle est remplie par `agents/sync-sante.js`
avec le SCORE DE SOMMEIL remonte par Oura ou Withings.

Consequence : pour quelqu'un avec une montre connectee, le rapport
hebdomadaire commente son bien-etre en se basant sur son sommeil. Pour les
autres la colonne est vide, donc le rapport dit « non calcule », ce qui est
honnete mais prive tout le monde de l'information.

Le correctif est simple depuis que le calcul vit dans `src/score.js`, qui n'a
aucune dependance et s'importe cote serveur comme `src/programmes.js` :
calculer la moyenne des scores journaliers a partir des metriques brutes, dans
`agents/rapport-hebdo.js`, au lieu de lire la colonne.

Deux notions differentes portent le meme nom dans la base. Renommer la colonne
serait plus propre, mais demande une migration.

### Deux choses notees en chemin, pas urgentes

**La barre du bas deborde a 130 % de taille de texte.** Mesure faite le
2 septembre : 283px necessaires pour 339 disponibles a taille normale, mais
368 a 130 %, un reglage d'accessibilite tres courant. Le probleme existait
AVANT le passage au pluriel, il n'est pas cause par lui. A traiter en
reduisant le libelle ou en passant l'icone seule sous une certaine largeur.

**Les recettes ne sont pas encore reliees au programme alimentaire.** Le
programme installe des habitudes semaine par semaine, les idees de repas
repondent a « je fais quoi ce soir ». Elles s'ignorent. Les idees pourraient
suivre le theme de la semaine en cours du programme.

### Une lecon du 2 septembre, pour moi

J'ai casse l'accueil en production. En sortant une fonction d'un fichier, ma
decoupe a emporte cinq declarations voisines : le bloc des metriques de
l'anneau et les variables du score. `ReferenceError` a l'ouverture de l'app.

Le point important n'est pas l'erreur, c'est que `vite build` EST PASSE AU
VERT. Il ne verifie pas qu'une variable existe : une reference manquante est
du JavaScript valide jusqu'a l'execution. Une compilation reussie ne prouve
donc rien sur ce point, et je l'avais prise pour une garantie.

Deux consequences pour la suite : regarder ce qu'il y a ENTRE deux ancres
avant de couper, et charger reellement la page apres un remaniement, pas
seulement compiler.

### A verifier sur un vrai telephone, ce qu'aucun test ne remplace

- une course reelle, dehors, pour confronter la distance a un parcours connu
- le verrouillage de l'ecran pendant une course, sur Android
- la connexion Health Connect, et les metriques qui remontent
- les rappels du programme, qui doivent arriver aux heures prevues
- une generation de recettes en declarant un regime, pour voir si le controle
  de securite se declenche a tort ou a raison sur de vraies sorties du modele
- un programme sportif lance en 56 jours et intensite soutenue, pour verifier
  que la duree et l'intensite arrivent bien jusqu'au plan genere

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

---

## Le mode nuit, passe ecran par ecran (2 septembre)

Fait par la mesure, pas a l'oeil : deux balayages de tout `src`, l'un sur les
couleurs de TEXTE ecrites en dur trop sombres sur le navy, l'autre sur les
FONDS restes trop clairs pour l'encre de nuit. Le second cas est le bug en
miroir du premier et ne se voit pas quand on ne cherche que du texte sombre.

28 textes et 23 fonds analyses, 22 corriges, le reste ecarte apres verification
(pastilles a texte blanc, etoiles du ciel, ecrans qui posent leur propre fond
clair). Le mode jour est prouve inchange : les 16 nouveaux jetons valent en
jour exactement le litteral qu'ils remplacent.

**La lecon, et c'est la troisieme fois que ce bug revient** : l'ambiance se
calculait a deux endroits, la racine d'un cote et `homePreset` de l'autre.
Il y a desormais une seule valeur, `ambiance`, dans App.jsx. Tout ce qui
s'assombrit doit la lire, et rien d'autre. Si un ecran ressort clair sur fond
sombre, chercher d'abord un second calcul d'ambiance.

### Reste a verifier sur un vrai telephone

- Les ecrans qui demandent une session : Programmes, Progres, Soins, Forum,
  la seance en cours, le bilan de course. Verifies en jetons, pas a l'oeil.
- Le passage automatique a 21h sans relancer l'app.

### Defauts trouves en chemin, sans rapport avec la nuit

- `App.jsx` l.4083 : le style `bottomNav` n'est reference nulle part.
- La colonne `score` de Supabase porte toujours deux sens differents.

### Deploiement, ce qui a change le 2 septembre

**meet-solenn.com et meet-solenn.fr sont servis par `vitacoach-w3yd`**, pas par
`vitacoach`. Je m'etais trompe en sens inverse au depart : verifier avant de
toucher a un projet.

Deux changements faits avec l'accord de Jean :

1. **`vitacoach` est debranche du depot.** Il ne sert aucun domaine et se
   construisait pourtant a chaque push, ce qui doublait la file d'attente sur
   un forfait Hobby qui n'execute qu'une construction a la fois. Ses reglages
   sont conserves, Vercel le dit explicitement au moment de deconnecter.

2. **Un Deploy Hook existe sur `vitacoach-w3yd`**, nomme `deploiement-manuel`,
   branche `main`. Une requete POST sur son URL construit le dernier commit.
   Deux essais : deploiement en ligne en 40 et 45 secondes, contre plus de
   vingt minutes d'attente auparavant.

   L'URL est un secret, elle n'est pas dans le depot. Elle se retrouve dans
   Vercel, `vitacoach-w3yd` puis `Settings` puis `Git`, section Deploy Hooks.

**Ce qui n'etait PAS le probleme** : il n'existe aucun webhook sur le depot
GitHub. Vercel passe par une GitHub App, installee et fonctionnelle aux cotes
de Railway et Render. Reconnecter le depot n'aurait donc rien recree, et aurait
coupe la chaine de production pour rien.

---

## Le 3 septembre : les exclusions alimentaires

**Ce qui n'allait pas, et pourquoi ca a mis du temps a se voir.** Jean signale
que les recettes ignorent « ce que je ne mange pas ». Trois causes se
superposaient, et seule la troisieme comptait vraiment :

1. La route qui SERT les recettes rendait le cache sans jamais le confronter
   aux exclusions du moment. Le controle ne tournait qu'a la generation.
2. Le champ libre ne tirait pas sa famille de mots : taper « porc » sans
   choisir le regime laissait passer jambon, lardons et chorizo.
3. **Les exclusions ne s'enregistraient pas du tout.** L'ecriture passait par
   un upsert brut dans un `try { } catch {}` muet : l'echec ressemblait a une
   reussite, l'app confirmait, la base ne recevait rien, et le rechargement
   suivant effacait la copie locale.

La troisieme est la vraie. Les deux premieres sont corrigees aussi, mais elles
n'auraient rien change tant qu'il n'y avait rien a quoi s'adapter.

**La lecon, et elle s'est deja repetee.** Le meme bug avait ete diagnostique le
14 aout, « je remplis mon profil et ca s'enleve », et corrige DANS UN SEUL
endroit. Deux ecrans faisaient encore l'ancienne version. La fonction solide
vit desormais dans `src/profilSync.js` et les trois l'utilisent. **Toute
nouvelle sauvegarde de profil doit passer par elle**, jamais par un
`supabase.from('profils').upsert()` direct.

### Repere, pas traite

- **Le panneau des exclusions initialise ses champs une seule fois**, a
  l'ouverture. Si le profil arrive de la base juste apres, le champ reste vide
  alors que les exclusions existent. Le risque n'est pas l'affichage : c'est
  qu'un reenregistrement depuis ce champ vide efface ce qui etait stocke.
- **Neuf endroits jettent le message d'erreur du serveur** pour lever le leur,
  generique. Le serveur repond pourtant quelque chose d'exploitable sur 30 de
  ses routes. Les deux qui comptent : la generation du rapport hebdomadaire,
  meme cas que le programme, et la suppression de compte, ou etre vague est le
  plus dommageable. Corrige pour la creation de programme uniquement.
- **La generation d'un programme se fait en un seul essai**, sans relance. Un
  echec de l'IA renvoie l'utilisateur a un message, la ou une seconde tentative
  suffirait probablement.

---

# POUR DEMAIN, CE QUI NE DEPEND QUE DE JEAN

Etabli le 3 septembre au soir. Tout le reste est fait et en ligne.

## 1. La session Mac, la plus lourde

**L'ecran de veille iPhone pendant une course.** Le code Swift est ecrit, il
n'est PAS dans le projet Xcode : `SolennActivite` apparait zero fois dans
`project.pbxproj`. Sept etapes detaillees dans `ios/LiveActivity/LISEZ-MOI.md`,
compter une heure dont la moitie a attendre Xcode.

Deux pieges qui font perdre une soiree, rappeles ici :
- ouvrir le `.xcworkspace`, **pas** le `.xcodeproj` ;
- mettre `SolennActiviteAttributes.swift` dans **les DEUX** cibles.

Une Live Activity ne s'affiche que sur un **iPhone reel**, jamais dans le
simulateur.

## 2. Reconstruire les paquets

C'est le point qui rend tout le reste invisible.

- **iOS** : le `www` embarque date du **21 juillet**. L'app native ne contient
  AUCUN des deux derniers mois de travail.
- **Android** : le bundle date du **30 aout**.

Tout ce qui a ete fait depuis ne vit que sur le web.

## 3. A tester sur un vrai telephone

- Une course sur un parcours dont tu connais la distance, puis verrouiller
  l'ecran pendant qu'elle tourne.
- Health Connect sur Android.
- Les rappels quotidiens, sur plusieurs jours.
- Une inscription complete, en te declarant femme puis homme.

## 4. Play Console

Deux declarations a faire avant publication : le **service de premier plan**
(type `location`) et les **applications de sante**.

## 5. Verifier la chaine alimentaire de bout en bout

Les corrections sont sur **Render**, et je ne peux pas savoir de l'exterieur
quelle version il execute.

Le test : ressaisir tes exclusions, **recharger la page** pour verifier que le
bouton dit bien « Modifier mes exclusions », puis regenerer ta routine et
regarder tes trois repas du jour. S'ils respectent tes exclusions, la chaine
complete fonctionne, y compris le maillon qui n'avait jamais rien verifie.

## 6. Les trois ecrans que je n'ai jamais pu voir

Ils demandent une action reelle, donc je ne les ai jamais vus rendus : leur
mode nuit et leur rangement n'ont **jamais ete mesures**.

- la seance en cours,
- le bilan d'une course,
- le forum.

Ouvre-les et envoie des captures : c'est le dernier angle mort.

## 7. Deux decisions qui t'appartiennent

- La photo de **« Chaise au mur »** montre un ballon leste, alors que le
  programme annonce « sans materiel ». Le geste est juste, l'accessoire est
  facultatif. La retirer au profit de l'animation, ou la garder ?
- Le catalogue de programmes annonce toujours **« Un programme, construit a
  partir de ton profil »** au singulier cote nutrition, ce qui est exact
  aujourd'hui mais faux des qu'un second programme alimentaire existera.

## 8. Passe du 3 septembre : Sante Naturelle, Cycle, Parametres, Style, Respiration

Corrige et deploye, rien a faire de ton cote sauf verifier a l'oeil :

- Le **bouton retour** des cinq pages outils ne collait plus au haut de
  l'ecran. Son parent porte l'animation `tabFade`, dont la derniere image est
  `transform:translateY(0)` ; avec `fill-mode:both` ce transform reste applique
  pour toujours, et un transform meme nul cree un bloc conteneur, dans lequel
  `position:fixed` se refere au conteneur et non a l'ecran. Le bouton descendait
  avec la page et se posait sur la premiere carte du Cycle. Il vit maintenant
  DANS la barre d'entete, a gauche du logo.
- L'**entete** appliquait son masque de fondu au texte et pas seulement au
  voile : le sous-titre palissait pendant que le contenu defilant dessous
  restait net, d'ou la collision sur tes captures. Le voile est devenu un
  calque a part.
- Les **bandes de categories** de Sante Naturelle avaient un fondu en creme
  code en dur, visible comme une bande claire sur le navy. Remplace par un
  masque sans couleur, pose seulement du cote ou il reste a defiler.
- Les **Parametres** etaient illisibles la nuit : fond creme fige sous des
  textes qui suivaient les jetons, soit **1,03:1**. Corrige a 11,23:1.
- Trois defauts plus anciens, **de jour**, trouves en verifiant : les titres de
  section des Parametres a 2,95:1, le badge « ETUDIE » a 2,49:1, et les icones
  blanches de Sante Naturelle a **1,27:1**, donc invisibles.

### Ce qui reste, mineur

- « **Version du ...** », en bas des Parametres, est a 4,34:1 de jour au lieu
  de 4,5. C'est le jeton des libelles decoratifs, seuil 3,0, et il s'agit d'une
  mention technique. A trancher : le laisser ou l'aligner sur le texte courant.
- Les avantages **barres** de la carte Pro (ce que l'essai n'inclut pas) sont a
  4,25:1. Du texte desactive n'est pas soumis au seuil, mais si tu preferes
  qu'ils se lisent quand meme, dis-le.

### Ce que je n'ai pas pu mesurer

Le navigateur ou je mesure est connecte au profil **Camille**, pas au tien.
La page **Cycle** ne s'ouvre donc pas de ce cote, et son releve n'a pas ete
fait ecran rendu : je n'ai verifie que son code, qui est propre. Envoie une
capture du Cycle apres ce deploiement pour fermer ce point.

## 9. UNE CLE PEXELS, GRATUITE, POUR LES PHOTOS DE TENUES

C'est le point qui compte le plus dans cette liste, et il ne depend que de toi.

**Ce que j'ai constate.** J'ai interroge le serveur de production directement :

    GET /api/image?piece=cream+linen+midi+dress&titre=Quiet+Luxe+Cream
    -> {"url":"https://loremflickr.com/400/560/fashion,editorial,fashion/..."}

Autrement dit : **une photo de mode prise au hasard**, sans aucun rapport avec
la tenue decrite. C'est pour ca que certaines vont et d'autres pas du tout : ce
n'est pas de la selection, c'est du tirage au sort.

**Pourquoi.** Le code interroge Pexels quand `PEXELS_API_KEY` existe. Elle
n'existe pas sur Render. Il retombait alors sur `source.unsplash.com`, qu'Unsplash
a retire (il repond 503 sur tout), puis sur LoremFlickr avec des mots-cles
generiques.

**Ce que j'ai corrige en attendant.** LoremFlickr recoit au moins les vrais
vetements et couleurs de la tenue au lieu de « fashion, editorial ». Ca reste de
la photo Flickr, donc inegale, mais elle parle du bon vetement.

**Ce qu'il faut faire, et que je ne ferai pas a ta place.** Je ne cree pas de
cle d'API sur tes comptes.

1. Va sur `pexels.com/api`, cree une cle. C'est gratuit, sans carte, 200
   requetes par heure, ce qui est tres large ici.
2. Sur Render, service `solenn-api`, onglet Environment, ajoute la variable
   `PEXELS_API_KEY` avec cette cle.
3. Le service redemarre seul. Ouvre Style et regarde.

Le code Pexels est deja ecrit et deja filtre (orientation portrait, 40
resultats, et le filtre des photos deplacees que j'avais pose apres ta remarque
sur la femme allongee). Il ne lui manque que la cle.

## 10. Audit du 3 septembre, fait sans captures

Outil ajoute ce jour-la : le compilateur TypeScript passe sur le code en mode
`checkJs` et signale les noms qui ne designent rien. C'est ce qui a attrape le
`profil` manquant des tenues et, dans la foulee, un second cas.

### Trouve et corrige

- **« Pourquoi celle-ci ? » ne marchait pas sur les plantes.** `HerbItem` lisait
  `cat`, la categorie ouverte, sans l'avoir en prop : le bouton levait une
  ReferenceError et n'ouvrait jamais le chat. Meme classe que les tenues, un
  bloc recopie dont la copie a perdu sa portee.
- **`bottomNav`, du code mort**, avec un blanc casse fige dedans qui serait
  devenu un defaut de nuit le jour ou quelqu'un l'aurait rebranche.
- **`proBadge` et `btnEdit`** de la barre laterale : creme fige sous du texte qui
  suit les jetons.

### Signale, pas corrige, et pourquoi

- **43 `transition:'all'`** repartis sur douze fichiers. Une transition en cours
  fige la valeur calculee : basculer l'ambiance pendant qu'elle tourne laisse la
  couleur d'avant. J'en ai corrige une le 2 septembre, celle d'un bouton. Les
  reprendre toutes est un gros diff pour un defaut qui ne se produit que si on
  change d'ambiance a l'instant precis d'une transition. A trancher.
- **76 `catch` qui avalent l'erreur en silence.** La plupart sont legitimes
  (fermer un contexte audio deja ferme). Les quatre qui comptent, cotes admin et
  B2B, sont deja notes au point 2.
- **La croix du bouton flottant du forum** est en creme fige. Le forum est un des
  ecrans que je n'ai jamais pu rendre : je ne sais pas sur quel fond elle se
  pose, donc je n'y touche pas a l'aveugle.

# ═══ ÉTAT AU 4 SEPTEMBRE 2026, AVANT SOUMISSION ═══

Cette section remplace ce qui précède pour ce qui concerne la sortie. Les
sections 1 à 10 restent comme journal.

## CE QUI BLOQUE LA SOUMISSION, ET QUI NE DÉPEND QUE DE TOI

1. **Reconstruire les paquets.** Le `www` embarqué dans iOS date du **21 juillet**,
   celui d'Android du **2 septembre**. Deux jours de corrections n'y sont pas,
   dont la clé caméra qui évite un plantage. C'est le point le plus important
   de cette liste : tant qu'il n'est pas fait, rien de ce qui suit n'existe
   dans ce que tu soumettras.

2. **Tester la suppression de compte sur un compte jetable.** La purge couvre
   désormais quatorze tables au lieu de six. C'est la seule façon de vérifier
   qu'elle fonctionne, et je ne la lancerai pas sur de vraies données.

3. **Tester la photo de repas dans le paquet natif**, en choisissant « Prendre
   une photo ». C'est exactement le chemin qui terminait l'application avant
   aujourd'hui, faute de `NSCameraUsageDescription`.

4. **Les deux déclarations Play Console.**

5. **Les formulaires de confidentialité**, Data Safety chez Google et App
   Privacy chez Apple. Ils doivent déclarer **position, photos et cycle
   menstruel**, comme la politique le fait maintenant. Une divergence entre le
   formulaire et la politique est ce que les revues détectent en premier.

## EN ATTENTE : LE PLAN RENDER

La lenteur au premier lancement. Cause **non prouvée**. Render coupe le service
après quinze minutes sans trafic et le réveil prend trente secondes à une
minute — c'est plausible, mais je ne l'ai pas mesuré, mes propres tests
maintenant le serveur éveillé.

Ce qui est certain et déjà corrigé : quatre écrans appelaient le réseau sans
aucun cache. Programmes et Ta semaine sont réglés. Il reste Tes progrès et la
progression du programme.

Le protocole qui tranchera, sans rien dépenser : ne pas ouvrir l'app pendant
vingt minutes, puis aller dans Progrès et compter ; fermer, rouvrir, refaire le
même chemin et compter. Premier lent puis second instantané = mise en veille,
et le plan payant est justifié. Les deux lents = autre cause.

Non expliqué à ce jour : la bulle « prépare un petit déj » de l'accueil ne fait
aucun appel réseau et ses métriques sont déjà en cache. Son délai n'a pas de
cause visible dans le code.

## TROIS DÉCISIONS QUI T'APPARTIENNENT

6. **La révocation des jetons** chez Withings, Oura et Garmin à la suppression
   du compte. Effacer les nôtres satisfait l'article 17 ; révoquer chez le
   fournisseur demande de vérifier leurs API, ce que je n'ai pas fait plutôt
   que d'écrire des appels approximatifs.

7. **La photo « Chaise au mur »** montre un ballon lesté alors que le programme
   promet « sans matériel ».

8. **Le forum.** Le code est intact et documenté, retiré du lancement pour la
   conformité UGC. Le garder coûte 37 Ko dans le paquet et rien d'autre.

## CORRIGÉ LE 3 ET LE 4 SEPTEMBRE, ET VÉRIFIÉ

Sécurité et conformité : aucun secret dans le paquet livré, les neuf tables
Supabase protégées ligne par ligne sans compte, la suppression complétée de
huit tables dont les jetons de santé, la politique complétée de trois
collectes, deux autorisations iOS manquantes ajoutées.

Fonctionnel : la course mesure enfin la distance hors paquet natif, le chat
est utilisable clavier ouvert, les écrans se rechargent après un déploiement
au lieu de rester muets, les programmes s'affichent instantanément.

Interface : dix-huit couleurs figées passées aux jetons, seize conditions
inutiles retirées, les photos de tenues ne montrent plus du tissu, Respiration
et Soins renommés Calme et Naturel.
