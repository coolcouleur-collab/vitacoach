# Solenn Code Review Agent

Analyse complète du code du projet Solenn. Détecte les bugs, problèmes de performance, violations du design system et problèmes mobile.

## Ce que tu dois vérifier dans src/*.jsx :

### 🐛 Bugs runtime & mobile
- `async/await` enchaînés avec `setTimeout` → peuvent se bloquer quand le navigateur throttle les timers sur mobile. Remplacer par des `setTimeout` avec offsets fixes.
- `useEffect` avec dépendances manquantes ou incorrectes
- State updates après unmount (memory leaks)
- Hooks appelés conditionnellement
- Event listeners non nettoyés dans les useEffect

### ⚡ Performance
- Composants lourds non lazy-loadés (Three.js, grandes listes)
- `useState` initialisé avec des calculs coûteux sans lazy initializer `() =>`
- Re-renders inutiles (fonctions inline dans JSX, objets créés à chaque render)
- Images non optimisées
- Fetches lancés sans debounce sur des inputs

### 🎨 Design System (violations = bugs visuels)
Palette autorisée : `#FFF8F4`, `#C87B52`, `#E8962A`, `#0A1633`, `#22c55e`, `#ef4444`
- Toute couleur hors palette → signaler
- Border-radius non standard (autorisés : 8, 12, 16, 20, 28) → signaler
- Blur non standard (autorisés : 8, 20, 32) → signaler
- `#1a0a00` utilisé à la place de `#0A1633` → signaler

### 📱 Compatibilité mobile
- `backdropFilter` sans `-webkit-backdrop-filter` → invisible sur Safari iOS
- `position: fixed` sans `env(safe-area-inset-*)` → UI coupée sur iPhone
- Inputs sans `fontSize: 16px` minimum → Safari zoome automatiquement
- `onClick` sur div sans `cursor: pointer` → mauvaise UX mobile
- Animations trop lourdes pour mobile (blur > 32px sur des éléments animés)

### 🔒 Sécurité
- Clés API hardcodées dans le code frontend
- `dangerouslySetInnerHTML` sans sanitisation
- URLs construites avec des inputs utilisateur sans encodage

## Format du rapport

Pour chaque problème trouvé :
```
[FICHIER:LIGNE] TYPE — Description courte
Avant: code problématique
Après: correction suggérée
```

Groupe par catégorie. Note la sévérité : 🔴 Critique | 🟠 Important | 🟡 Mineur

À la fin, donne un score /100 et un résumé en 2 phrases.
