-- ═══════════════════════════════════════════════════════════════════════════
-- SOLENN : le statut Pro ne s'ecrit plus depuis l'app (8 octobre 2026)
-- A EXECUTER PAR JEAN dans Supabase : SQL Editor, New query, coller, Run.
--
-- LE DEFAUT
-- La regle RLS « profils_update_own » (db/rls-policies.sql) laisse l'app
-- reecrire TOUT le JSON `profil` de son propre compte, champs d'abonnement
-- compris. Avec la cle publique embarquee dans l'app, n'importe qui pouvait
-- donc, depuis la console de son navigateur :
--   supabase.from('profils').update({ profil: { ...p, isPro: true } })
-- et obtenir les messages illimites sans payer : le quota (api/_quota.js) et
-- /api/verify-pro lisent ce champ.
--
-- LA CORRECTION
-- Un declencheur remet, a chaque ecriture venue de l'app, les champs
-- d'abonnement a leur valeur en base. Le serveur (cle service_role : webhook
-- Stripe, check-subscription) et l'editeur SQL de Supabase ne sont pas
-- concernes et continuent de les ecrire.
-- Rien ne change pour l'app : elle ne pose jamais ces champs elle-meme,
-- profilSync.js les recopie deja depuis la base avant d'ecrire.
-- Aucune donnee n'est modifiee par ce script : il ne fait que poser la regle.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.proteger_champs_abonnement()
returns trigger
language plpgsql
-- PAS de « security definer » : la fonction prendrait l'identite de son
-- proprietaire (postgres), current_user vaudrait toujours 'postgres' et le
-- declencheur laisserait tout passer. Verifie sur PostgreSQL 16.
set search_path = public
as $$
declare
  k text;
  champs text[] := array['isPro', 'proSince', 'proPlan', 'proEnd', 'proManuel',
                         'stripeSessionId', 'stripeCustomerId', 'stripeSubscriptionId'];
begin
  -- Le serveur et l'editeur SQL gardent la main.
  if coalesce(auth.role(), '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  foreach k in array champs loop
    if tg_op = 'UPDATE' and old.profil ? k then
      new.profil := jsonb_set(coalesce(new.profil, '{}'::jsonb), array[k], old.profil -> k);
    else
      -- Insertion depuis l'app, ou champ absent en base : l'app ne le cree pas.
      new.profil := coalesce(new.profil, '{}'::jsonb) - k;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists proteger_champs_abonnement on public.profils;
create trigger proteger_champs_abonnement
  before insert or update on public.profils
  for each row execute function public.proteger_champs_abonnement();

-- Verification, sans rien modifier : doit renvoyer une ligne.
select tgname from pg_trigger where tgname = 'proteger_champs_abonnement';
