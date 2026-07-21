# Sécurisation Solenn — Guide d'activation

Le code de sécurité est déployé mais fonctionne en **mode observation** (rien ne bloque)
tant que tu n'as pas fait les étapes ci-dessous. Elles prennent ~15 minutes.
**Respecte l'ordre** : la clé service_role AVANT le script SQL.

---

## Étape 1 — Récupérer la clé service_role (2 min)

1. Va sur **supabase.com** → ton projet Solenn
2. Menu latéral : **Project Settings** (roue dentée) → **API Keys**
3. Copie la clé **`service_role`** (« secret », commence par `eyJ...`)

⚠️ Cette clé donne un accès total à la base. Ne la mets JAMAIS dans le code,
jamais dans le frontend, jamais dans un commit — uniquement dans les variables
d'environnement ci-dessous.

## Étape 2 — Ajouter les variables d'environnement (5 min)

### Sur Render (l'API principale)
1. **dashboard.render.com** → service `solenn-api` → **Environment**
2. Ajoute :
   - `SUPABASE_SERVICE_ROLE_KEY` = la clé copiée à l'étape 1
   - `AGENTS_TRIGGER_KEY` = une phrase secrète de ton choix (ex. générée sur
     un gestionnaire de mots de passe) — protège les endpoints d'administration
3. Clique **Save, rebuild, and deploy** et attends que le service soit « Live »

### Sur Vercel (les fonctions IA)
1. **vercel.com** → projet → **Settings** → **Environment Variables**
2. Ajoute (environnement Production) :
   - `SUPABASE_URL` = la même URL Supabase que sur Render (si pas déjà là)
   - `SUPABASE_ANON_KEY` = la clé anon/publishable (si pas déjà là)
   - `SUPABASE_SERVICE_ROLE_KEY` = la clé de l'étape 1
3. **Redeploy** (Deployments → ⋯ sur le dernier → Redeploy)

## Étape 3 — Activer les règles de sécurité de la base (3 min)

1. Supabase → **SQL Editor** → **New query**
2. Ouvre le fichier [`db/rls-policies.sql`](db/rls-policies.sql) du projet,
   copie tout son contenu, colle-le, clique **Run**
3. Résultat attendu : « Success. No rows returned »

Dès cet instant, la clé publique embarquée dans l'app ne peut plus lire que :
le forum (public), et les données de l'utilisateur connecté. Les tokens
Oura/Garmin/Withings et les conversations des autres deviennent inaccessibles.

## Étape 4 — Vérifier que tout marche (3 min)

Sur meet-solenn.com (recharge avec Ctrl+Shift+R) :
- [ ] Connexion / déconnexion OK
- [ ] Le chat répond
- [ ] Le forum s'affiche et on peut poster
- [ ] L'historique de chat s'ouvre (panneau Historique)
- [ ] L'onglet Santé et le rapport hebdo se chargent

Si un de ces points casse → dis-le moi, on diagnostique. En cas d'urgence tu
peux désactiver les règles table par table dans Supabase (Table Editor →
la table → ⋯ → « Disable RLS »).

## Étape 5 — Passer en mode strict (quand tu veux, plus tard)

Aujourd'hui le serveur **observe** : il loggue les requêtes sans token mais les
laisse passer, pour ne pas casser les apps iOS/Android qui embarquent l'ancien
frontend. Quand la version web aura tourné quelques jours sans warnings
`[AUTH][observation]` dans les logs Render :

1. Render → Environment → ajoute `REQUIRE_AUTH` = `1` → redeploy
2. Vercel → Environment Variables → `REQUIRE_AUTH` = `1` → redeploy

⚠️ Avant d'activer le strict, préviens-moi : les boutons « Connecter » de
Withings et Garmin passent par une redirection navigateur qui ne porte pas de
token — il faudra que j'adapte ces deux flux d'abord, sinon la connexion de
ces montres cassera (Oura n'est pas concerné).

À partir de là, impossible de lire les données d'un autre utilisateur via
l'API, et les endpoints IA exigent un compte connecté.

---

## Ce que ça corrige (résumé)

| Faille | Avant | Après (étapes 1-5 faites) |
|---|---|---|
| Lire les chats/données santé d'autrui via l'API | ✅ possible | ❌ bloqué (401/403) |
| Lire toute la base avec la clé publique de l'app | ✅ possible | ❌ bloqué (RLS) |
| Tokens Oura/Garmin/Withings exposés | ✅ lisibles | ❌ serveur uniquement |
| Consommer ton budget IA sans compte | ✅ possible | ❌ connexion exigée |
| Déclencher les agents / notifications en masse | ✅ possible | ❌ clé admin exigée |
