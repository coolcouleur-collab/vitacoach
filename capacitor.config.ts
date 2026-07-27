import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // ─── Identité de l'app ─────────────────────────────────────────────────────
  appId:   'com.solenn.app',
  appName: 'Solenn',
  webDir:  'dist',

  // ─── Serveur (dev uniquement — retiré pour le build prod) ─────────────────
  // server: {
  //   url: 'http://192.168.x.x:5173',
  //   cleartext: true,
  // },

  // ─── iOS ──────────────────────────────────────────────────────────────────
  ios: {
    scheme:              'Solenn',
    // Fond natif = couleur de base de l'app (l'ancien #FFF8F4 blanc cassé
    // faisait une « barre blanche » en bas sur toutes les pages)
    backgroundColor:     '#EDD8CC',
    // 'never' : la page web remplit TOUT l'écran (elle gère elle-même les
    // safe areas via env()) — 'always' l'encadrait dans les zones sûres et
    // laissait le fond natif visible en bas (bug barre blanche, 2026-07-25)
    contentInset:        'never',
    allowsLinkPreview:   false,
    scrollEnabled:       true,
    limitsNavigationsToAppBoundDomains: true,
  },

  // ─── Android ──────────────────────────────────────────────────────────────
  android: {
    backgroundColor:     '#EDD8CC',
    allowMixedContent:   false,
    captureInput:        true,
    webContentsDebuggingEnabled: false, // true en dev
  },

  // ─── Plugins ──────────────────────────────────────────────────────────────
  plugins: {
    // Écran de démarrage
    SplashScreen: {
      launchShowDuration:      800,
      launchAutoHide:          true,
      backgroundColor:         '#FFF8F4',
      androidSplashResourceName: 'splash',
      androidScaleType:        'CENTER_CROP',
      showSpinner:             false,
      splashFullScreen:        true,
      splashImmersive:         true,
    },

    // Barre de statut iOS/Android — en overlay : la page passe dessous
    // (elle gère le safe-area-inset-top), plus de bande native en haut
    StatusBar: {
      style:           'DARK',       // texte foncé sur fond clair
      backgroundColor: '#EDD8CC',
      overlaysWebView: true,
    },

    // Push Notifications natives (remplace web-push dans l'app)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // HealthKit (iOS) — permissions déclarées ici + dans Info.plist
    CapacitorHealthkit: {
      // Les types de données qu'on lit depuis Apple Health
      // Doivent correspondre aux NSHealthShareUsageDescription dans Info.plist
    },
  },
}

export default config
