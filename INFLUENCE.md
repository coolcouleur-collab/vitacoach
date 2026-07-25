# Kit micro-influence Solenn — lancement francophone

Préparé le 2026-07-25, basé sur l'étude de marché (CAC soutenable < 0,63 $/install
→ organique et micro-influence d'abord ; TikTok France = 1er marché européen).

---

## 1. La stratégie en bref

- **Cible créateurs** : micro-influenceurs francophones **10k–100k abonnés** —
  meilleur rapport coût/conversion de la catégorie, audiences engagées, tarifs
  accessibles (souvent gratuit contre accès/affiliation à cette taille).
- **Niches** : routine matinale · self-care/slow living · sommeil · sport doux
  (yoga, pilates, marche) · nutrition intuitive/anti-régime · productivité
  bien-être · endométriose/cycle. Mixte hommes-femmes (Solenn n'est pas genrée).
- **Plateformes** : TikTok en priorité, puis Instagram Reels, YouTube Shorts.
- **Volume conseillé au départ** : 20 contacts → ~5 réponses → 2-3 collabs.
  Itérer sur ce qui convertit (dashboard /admin).

## 2. L'offre aux créateurs

| Élément | Détail |
|---|---|
| Accès | 1 an de Solenn Pro offert (code Stripe 100 % à usage unique) |
| Pour leur audience | Code **-30 % sur l'année** (soit ~31 €) valable 30 jours, à leur nom (ex. `LEA30`) |
| Lien tracké | `https://meet-solenn.com/?ref=lea` — les inscriptions issues du lien apparaissent dans /admin |
| Rémunération (si demandée) | Commencer à 50-150 € par vidéo pour 10-50k ; sinon affiliation : 20 % des abonnements générés le 1er mois (à verser manuellement au début) |
| Brief créatif | Liberté totale de ton — on demande juste 1 des 3 angles ci-dessous + le code à l'oral et en description |

### Les 3 angles de contenu qui marchent (à proposer, pas imposer)
1. **« Le matin, elle a déjà travaillé pour moi »** — filmer l'ouverture de
   l'app au réveil : le brief du matin adapté à la nuit réelle (« j'ai dormi
   5 h 40 et regarde ce qu'elle me dit »). C'est LA démo différenciante.
2. **« Je photographie mon assiette »** — la photo de repas analysée en direct,
   sans culpabilisation. Format avant/après réaction très TikTok.
3. **« 21 jours avec Solenn »** — mini-série (3 vidéos : J1, J10, J21) avec
   l'écran « Tes progrès » en preuve finale. Le meilleur format pour convertir.

## 3. Message de premier contact (DM court — TikTok/Instagram)

> Hello [Prénom] ! Je suis Jean, je viens de lancer Solenn — un coach bien-être
> IA français qui s'adapte chaque matin à ta vraie nuit de sommeil (il est
> connecté à Apple Santé/Garmin) et qui analyse tes repas en photo, sans jamais
> culpabiliser. Ton contenu sur [sujet précis de son feed] colle exactement à
> l'esprit de l'app. Je t'offre 1 an d'accès complet pour tester, et si ça te
> plaît, un code -30 % à ton nom pour ta communauté (+ lien tracké). Zéro
> obligation de poster si tu n'accroches pas. Je t'envoie l'accès ?

## 4. Email de suivi (après un oui)

> Objet : Ton accès Solenn + ton code [PSEUDO]
>
> Hello [Prénom],
>
> Trop contente que ça te parle ! Voilà tout ce qu'il te faut :
>
> • **Ton accès Pro 1 an** : code [CODE100] à saisir sur la page de paiement
>   (meet-solenn.com → Passer à Pro → « Ajouter un code promo »)
> • **Ton code audience** : [PSEUDO]30 → -30 % sur l'année (30 jours de validité)
> • **Ton lien** : https://meet-solenn.com/?ref=[pseudo]
>
> Ce qui fait réagir en vidéo : le brief du matin qui s'adapte à ta vraie nuit,
> la photo de repas analysée en direct, et le challenge 21 jours. Mais tu
> connais ton audience mieux que moi — carte blanche sur le ton.
>
> Deux seules contraintes (transparence légale) : mentionner qu'il s'agit d'un
> partenariat, et ne pas présenter Solenn comme un outil médical (c'est un
> coach bien-être).
>
> Belle journée !
> Jean — créatrice de Solenn

## 5. Mise en place technique (une fois par créateur, ~3 min)

1. **Dashboard Stripe** (mode live) → Produits → Coupons :
   - Coupon « -30 % » (une fois, durée 1 an d'abonnement) → Code promo `PSEUDO30`, limite 30 jours
   - Coupon « 100 % » usage unique → Code promo `PSEUDO-VIP` (l'accès du créateur)
2. Le champ « code promo » apparaît automatiquement sur la page de paiement
   (`allow_promotion_codes` activé dans le code le 2026-07-25).
3. Donner le lien `meet-solenn.com/?ref=pseudo` (minuscules, sans espace).

## 6. Suivi des résultats

- **Inscriptions par créateur** : meet-solenn.com/admin → bloc « Inscriptions
  par créateur » (chaque profil créé via un lien ?ref= est compté).
- **Ventes par code** : Dashboard Stripe → Codes promotionnels → nb d'utilisations.
- **Règle de décision** : un créateur qui génère ≥ 10 inscriptions ou ≥ 2
  abonnements → re-collaborer (série 21 jours) ; sinon, remercier et passer.

## 7. Conformité (à respecter dans tous les contenus)

- Mention « partenariat rémunéré » ou « produit offert » (loi influence FR 2023)
- Jamais de promesse santé/médicale (« soigne », « traite », « anti-dépression » interdits)
- Le créateur parle de bien-être, d'habitudes, d'énergie — pas de pathologies
