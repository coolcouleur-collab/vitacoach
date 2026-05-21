# Assets App Mobile Solenn

## Icône App

### iOS (App Store)
Fichier requis : 1024×1024px PNG (pas de transparence, pas d'arrondi — iOS l'ajoute)
- Xcode : Assets.xcassets → AppIcon → glisser icon-master.png

### Android
Fichiers requis dans android/app/src/main/res/ :
- mipmap-mdpi/ic_launcher.png : 48×48
- mipmap-hdpi/ic_launcher.png : 72×72
- mipmap-xhdpi/ic_launcher.png : 96×96
- mipmap-xxhdpi/ic_launcher.png : 144×144
- mipmap-xxxhdpi/ic_launcher.png : 192×192
- ic_launcher-playstore.png : 512×512 (Google Play)

### Outil de conversion gratuit
1. Va sur https://www.appicon.co/
2. Upload icon-master.svg (ou PNG 1024×1024)
3. Télécharge le ZIP avec toutes les tailles
4. Copie les fichiers dans les bons dossiers

## Splash Screen

### Couleurs
- Background : #FFF8F4 (crème Solenn)
- Logo centré

### iOS (capacitor.config.ts)
Déjà configuré :
- backgroundColor: "#FFF8F4"
- duration: 800

### Android
android/app/src/main/res/drawable/splash.xml déjà créé par Capacitor.
Personnaliser avec la couleur #FFF8F4.

## App Store Screenshots
Tailles requises :
- iPhone 6.7" : 1290×2796px
- iPhone 6.5" : 1284×2778px  
- iPad 12.9"  : 2048×2732px

Tips :
- Utilise le preview en mode sunrise (?preset=sunrise) pour des screenshots chauds
- Capture les 5 onglets principaux
- Ajoute des textes marketing par dessus avec Figma ou Canva
