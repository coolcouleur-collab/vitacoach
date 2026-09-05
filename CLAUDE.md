# Solenn

Coach de bien-etre par IA. React 19 + Vite (rolldown), Supabase, Capacitor 8,
deploiement Vercel (front) et Render (serveur Node). Jean en est l'autrice et la
seule decisionnaire produit.

**Etat au 4 septembre 2026 : finalisation avant soumission.** Google Play
d'abord, App Store ensuite. Le code est en gel de fonctionnalites : on corrige,
on ne construit plus. Toute idee produit part en v2, apres les premiers
utilisateurs reels.

## Ou vit le suivi

- **Si tu demarres sur le Mac de Jean** : le bloc « REPRISE SUR LE MAC » est en
  tete d'`EN_ATTENTE.md`. Il porte la version exacte de Xcode a installer, qui
  n'est pas celle de l'App Store, et les trois gestes a faire avant de compiler.
- `EN_ATTENTE.md` : l'etat du travail, les decisions en attente, les pieges.
  **Le lire avant de proposer quoi que ce soit.** Les blocs les plus recents
  sont en haut.
- `STORES.md` : tout ce qui touche aux fiches et aux formulaires des stores,
  avec les preuves de chaque affirmation.

Une note de suivi peut etre perimee. Le 4 septembre, `EN_ATTENTE.md` affirmait
qu'un defaut du rapport hebdomadaire n'etait pas corrige alors qu'il l'etait
depuis des jours. Verifier dans le code avant de faire confiance a une note.

## Les regles de Jean

- **Pas de tirets cadratins** dans ce qui lui est ecrit.
- **L'identite visuelle** : creme, terracotta, halo dore. Son terracotta vaut
  200, 123, 82. On peut l'assombrir, jamais deriver vers le brun ni le cuivre.
- **Le verre glace** : texte blanc ou creme sur fonds translucides. Ne jamais
  « corriger » l'esthetique sans son accord explicite. Elle a refuse les ombres
  portees : la separation des cartes se fait par un contour creme dore.
- **Solenn s'adresse aux hommes comme aux femmes.** Aucun accord feminin dans
  l'interface, aucune recherche genree par defaut.
- **Ne jamais proposer de vider ou supprimer** sans avoir verifie ou vivent
  reellement les donnees.
- **Ne pas sonder les deploiements en boucle.** Render a un limiteur de debit,
  et l'avoir declenche a casse l'ecran Style pour elle en pleine session.

## Les deux defauts qui reviennent sans cesse

**1. La logique dupliquee dont une seule copie est mise a jour.** C'est la cause
racine de presque tous les bugs de ce depot : quatre chemins de deconnexion qui
effacaient trois choses differentes, la photo retiree du cache local mais pas de
l'envoi serveur, un composant repare et son jumeau oublie. Avant de corriger
quoi que ce soit, chercher les autres endroits qui font la meme chose.

**2. L'opacite concatenee a un jeton de couleur.** `` `${ICONE}28` `` ou
`ICONE = 'var(--icone)'` produit `var(--icone)28`, qui n'est pas une couleur :
le navigateur **ignore la declaration entiere**. 36 declarations mortes ont ete
trouvees ainsi le 4 septembre. La forme correcte est
`rgba(var(--rgb-icone), 0.157)`, avec un triplet RGB defini dans `theme.css`.
`color-mix()` est exclu : l'app cible iOS 15, il demande Safari 16.2.

Detecter les deux :

```bash
grep -rEo '\$\{[^}]+\}[0-9a-fA-F]{2}' src/*.jsx     # concatenations suspectes
npx tsc --noEmit --allowJs --checkJs --jsx preserve --target esnext \
  --moduleResolution bundler --skipLibCheck src/*.jsx | grep -E 'TS2304|TS2552'
```

Le second attrape les identifiants utilises sans etre definis ou importes, que
`vite build` laisse passer sans broncher. Il a trouve deux boutons reellement
casses. `__BUILD__` est un faux positif, c'est un `define` de Vite.

## Verifier plutot que supposer

Ce depot punit les suppositions. Les couleurs se mesurent en contraste, les sons
se mesurent en platitude spectrale, la validite d'un CSS se constate dans un
navigateur, une photo se regarde a son recadrage reel avant d'affirmer qu'elle
est fausse. Ne jamais accepter le constat d'un tiers sans le verifier : le
4 septembre, deux affirmations d'une relecture externe se sont revelees fausses,
dont une dans le sens du pire.

## Commandes

```bash
npm run dev          # serveur de dev
npm run build        # verification minimale avant tout commit
npm run cap:ios      # build + copie + ouverture de Xcode
npm run cap:android  # idem pour Android Studio
npx cap sync         # apres tout changement de code, sinon les paquets natifs mentent
```

Les paquets natifs ne se mettent pas a jour tout seuls : sans `cap sync`, un
build Xcode ou Gradle embarque l'ancien code sans le dire.
