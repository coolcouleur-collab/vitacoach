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
    backgroundColor:     '#FFF8F4',
    contentInset:        'always',
    allowsLinkPreview:   false,
    scrollEnabled:       true,
    limitsNavigationsToAppBoundDomains: true,
  },

  // ─── Android ──────────────────────────────────────────────────────────────
  android: {
    backgroundColor:     '#FFF8F4',
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

    // Barre de statut iOS/Android
    StatusBar: {
      style:           'DARK',       // texte foncé sur fond crème
      backgroundColor: '#FFF8F4',
      overlaysWebView: false,
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
