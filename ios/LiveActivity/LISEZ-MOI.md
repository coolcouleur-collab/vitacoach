# La course sur l'écran verrouillé, côté iPhone

## Ce que ce dossier contient, et ce qu'il ne contient pas

Sept fichiers, écrits et relus, **jamais compilés**. Tout le reste du chantier
est passé au compilateur avant d'être livré, le Kotlin comme le JavaScript. Pas
ceux-ci : compiler du Swift demande un Mac et Xcode, et le travail a été fait
sous Windows. C'est la seule partie du projet dont personne ne peut encore dire
qu'elle fonctionne.

Il faut donc s'attendre à corriger deux ou trois choses à la première
compilation. Ce sont des erreurs de frappe et de signature, pas de conception :
la logique est la même que celle du service Android, qui, elle, est vérifiée.

| Fichier | Cible | Rôle |
|---|---|---|
| `SolennActiviteAttributes.swift` | **App ET extension** | le contrat entre les deux |
| `SolennActiviteWidget.swift` | extension | l'écran verrouillé et l'îlot dynamique |
| `EcranDeVeille.swift` + `.m` | App | démarre et met à jour la Live Activity |
| `PositionCourse.swift` + `.m` | App | le GPS qui continue écran verrouillé |

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

5. Copier dans `ios/App/App/`, et ajouter à la cible **App uniquement** :
   `EcranDeVeille.swift`, `EcranDeVeille.m`, `PositionCourse.swift`,
   `PositionCourse.m`.

6. Vérifier dans le `Info.plist` de l'application, où tout a déjà été ajouté :
   `NSSupportsLiveActivities` à `YES`, `location` dans `UIBackgroundModes`, et
   les deux descriptions de localisation.

7. Compiler sur un **iPhone réel**. Les Live Activities ne s'affichent pas dans
   le simulateur, et le GPS non plus.

## Deux choses qui expliquent la forme du code

**Le temps n'est pas envoyé, il est déduit.** Le `ContentState` transporte un
instant de départ, pas un texte. Une application suspendue ne peut pas
rafraîchir sa Live Activity chaque seconde : iOS ne la réveille pas pour ça, et
le compteur se figerait sur l'écran verrouillé, c'est à dire exactement là où
il doit vivre. `Text(timerInterval:)` laisse le système compter tout seul.
Android fait la même chose avec le chronomètre de sa notification, et pour la
même raison.

**Le GPS a besoin de trois réglages, pas d'un.** `@capacitor/geolocation` fait
très bien son travail au premier plan et rien du tout écran verrouillé, parce
qu'un plugin généraliste ne peut pas activer l'arrière plan pour tout le monde.
`PositionCourse.swift` pose les trois : la déclaration d'arrière plan, la mise
en pause automatique désactivée (sinon un arrêt à un feu rouge peut coûter la
fin de la course), et le type d'activité `fitness`, sans lequel le filtrage
d'iOS jette des relevés de coureur. Il en manque un, iOS coupe en silence.

## Ce qui restera ouvert après

**Le rythme cardiaque en direct.** Il ne viendra pas de là. HealthKit ne
diffuse pas les battements depuis l'iPhone : le direct suppose une Apple Watch
exécutant une session d'entraînement, donc une application watchOS compagnon,
qui est un projet à part entière. Sans elle, le cardio est relu après la
séance, ce que l'app fait déjà.

## Pour vérifier que ça marche

Lancer une course, verrouiller l'écran, marcher deux cents mètres, attendre une
minute. Le temps doit avoir avancé sur l'écran verrouillé, **et la distance
aussi**. Si le temps avance mais pas la distance, c'est l'autorisation de
position qui est restée sur « quand j'utilise l'app » au lieu de « toujours ».
