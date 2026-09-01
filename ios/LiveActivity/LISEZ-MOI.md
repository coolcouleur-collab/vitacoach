# La course sur l'écran verrouillé, côté iPhone

## Ce que ce dossier contient, et ce qu'il ne contient pas

Quatre fichiers Swift, écrits et relus, **jamais compilés**. Tout le reste du
chantier a été passé au compilateur avant d'être livré, le Kotlin comme le
JavaScript. Pas celui-ci : compiler du Swift demande un Mac et Xcode, et le
travail a été fait sous Windows. C'est la seule partie du projet dont personne
ne peut encore dire qu'elle fonctionne.

Il faut donc s'attendre à corriger deux ou trois choses à la première
compilation. Ce sont des erreurs de frappe et de signature, pas de conception :
la logique est la même que celle du service Android, qui, elle, est vérifiée.

## Pourquoi une extension séparée

Une Live Activity ne peut pas vivre dans l'application. iOS exige qu'elle soit
dessinée par une **extension de widget**, un petit programme à part qui tourne
même quand l'application est fermée. C'est ce qui lui permet de rester affichée
sur l'écran verrouillé, et c'est aussi pour ça qu'on ne peut pas se contenter
d'ajouter un fichier au projet existant.

Conséquence à connaître avant de commencer : ajouter une extension change la
composition du paquet, donc **le prochain envoi repasse par une revue App
Store**, et il faut un profil de provisionnement pour l'extension en plus de
celui de l'application.

## Les étapes, dans Xcode

1. Ouvrir `ios/App/App.xcworkspace`. **Pas** le `.xcodeproj` : le workspace,
   sinon les dépendances CocoaPods de Capacitor manquent.

2. Menu **File, New, Target**. Choisir **Widget Extension**. La nommer
   exactement `SolennActivite`. Décocher « Include Configuration App Intent »,
   **cocher « Include Live Activity »**.

3. Xcode crée un dossier avec un fichier d'exemple. Le supprimer, puis glisser
   dans la cible `SolennActivite` :
   - `SolennActiviteAttributes.swift`
   - `SolennActiviteWidget.swift`

4. Glisser `SolennActiviteAttributes.swift` **aussi** dans la cible `App`, en
   cochant les deux cases d'appartenance. Ce fichier est le contrat entre
   l'application et l'extension : si une seule des deux le compile, elles ne
   parlent pas de la même chose et l'activité ne démarre jamais. C'est l'erreur
   la plus fréquente sur ce montage.

5. Copier `EcranDeVeille.swift` et `EcranDeVeille.m` dans `ios/App/App/`, et
   les ajouter à la cible `App` uniquement.

6. Vérifier que `NSSupportsLiveActivities` vaut `YES` dans le `Info.plist` de
   l'application. Il y a déjà été ajouté, il s'agit juste de le confirmer.

7. Compiler sur un **iPhone réel**. Les Live Activities ne s'affichent pas dans
   le simulateur.

## Ce qui reste à faire après, et qui n'est pas fait

**Le GPS en arrière plan.** Le mode `location` est déclaré dans le
`Info.plist`, mais le plugin `@capacitor/geolocation` ne demande pas
`allowsBackgroundLocationUpdates` à CoreLocation. Sans cette ligne, iOS coupe
les relevés dès que l'écran se verrouille : le chronomètre continuera, la
distance se figera. Il faudra soit un petit pont CoreLocation écrit comme
celui de Health Connect, soit remplacer le plugin.

**Le rythme cardiaque en direct.** Il ne viendra pas de là. HealthKit ne
diffuse pas les battements depuis l'iPhone : le direct suppose une Apple Watch
exécutant une session d'entraînement, donc une application watchOS compagnon,
qui est un projet à part entière. Sans elle, le cardio est relu après la
séance, ce que l'app fait déjà.

## Pour vérifier que ça marche

Lancer une course, verrouiller l'écran, attendre trente secondes. Le temps doit
continuer d'avancer sur l'écran verrouillé. La distance, elle, restera figée
tant que le point ci-dessus n'est pas traité, et c'est normal.
