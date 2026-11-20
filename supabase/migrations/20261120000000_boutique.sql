-- =====================================================================
-- Boutique Charms Précieux des Îles : pièces, commandes, livraison
-- =====================================================================

-- ---------- Administratrices (accès à la page Gestion) ----------
create table public.admins (
  email text primary key
);
alter table public.admins enable row level security;
-- personne ne lit cette table depuis le site ; seule la fonction ci-dessous s'en sert

create or replace function public.est_admin()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.est_admin() from public;
grant execute on function public.est_admin() to anon, authenticated;

-- ---------- Pièces ----------
create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(nom) between 1 and 120),
  collection text not null default 'elixir' check (collection in ('elixir', 'essence')),
  categorie text not null default 'collier' check (categorie in ('collier', 'bracelet', 'boucle')),
  prix_centimes integer not null check (prix_centimes between 100 and 1000000),
  description text not null default '' check (char_length(description) <= 4000),
  -- [{"full": "url de la photo", "mini": "url de la vignette"}], la 1re est la principale
  photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array'),
  statut text not null default 'en_vente' check (statut in ('en_vente', 'vendue', 'masquee')),
  reservee_jusqua timestamptz,          -- bloquée pendant un paiement en cours
  ordre integer not null default 0,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);
create index pieces_ordre_idx on public.pieces (collection, ordre, cree_le);

create or replace function public.maj_modifie_le()
returns trigger language plpgsql set search_path = '' as $$
begin new.modifie_le = now(); return new; end; $$;
create trigger pieces_modifie_le before update on public.pieces
  for each row execute function public.maj_modifie_le();

alter table public.pieces enable row level security;
create policy "le public voit les pièces publiées" on public.pieces
  for select to anon, authenticated using (statut <> 'masquee' or (select public.est_admin()));
create policy "l'admin crée des pièces" on public.pieces
  for insert to authenticated with check ((select public.est_admin()));
create policy "l'admin modifie des pièces" on public.pieces
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));
create policy "l'admin supprime des pièces" on public.pieces
  for delete to authenticated using ((select public.est_admin()));

-- ---------- Zones de livraison ----------
create table public.zones_livraison (
  code text primary key,
  libelle text not null,
  prix_centimes integer not null default 0 check (prix_centimes >= 0),
  delai text not null default '',
  pays text[] not null,                 -- codes pays acceptés par Stripe pour l'adresse
  actif boolean not null default true,
  ordre integer not null default 0
);
alter table public.zones_livraison enable row level security;
create policy "le public voit les zones actives" on public.zones_livraison
  for select to anon, authenticated using (actif or (select public.est_admin()));
create policy "l'admin modifie les zones" on public.zones_livraison
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));

insert into public.zones_livraison (code, libelle, prix_centimes, delai, pays, actif, ordre) values
  ('metropole', 'France métropolitaine', 0, '2 à 4 jours ouvrés', array['FR', 'MC'], false, 1),
  ('outre-mer', 'Outre-mer (Martinique, Guadeloupe, Guyane, La Réunion, Mayotte…)', 0, '5 à 10 jours ouvrés',
   array['MQ', 'GP', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF'], false, 2);
-- zones désactivées tant que les frais de port ne sont pas renseignés dans Gestion > Réglages

-- ---------- Commandes (écrites uniquement par le webhook Stripe) ----------
create table public.commandes (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null unique,
  cree_le timestamptz not null default now(),
  articles jsonb not null default '[]'::jsonb,     -- [{"id","nom","prix_centimes"}]
  zone text,
  total_centimes integer not null default 0,
  port_centimes integer not null default 0,
  client_nom text,
  client_email text,
  client_tel text,
  adresse jsonb,                                    -- {line1, line2, postal_code, city, country}
  statut text not null default 'a_expedier' check (statut in ('a_expedier', 'expediee', 'remboursee')),
  suivi text,
  expediee_le timestamptz
);
create index commandes_date_idx on public.commandes (cree_le desc);
alter table public.commandes enable row level security;
create policy "l'admin voit les commandes" on public.commandes
  for select to authenticated using ((select public.est_admin()));
create policy "l'admin met à jour les commandes" on public.commandes
  for update to authenticated using ((select public.est_admin())) with check ((select public.est_admin()));

-- ---------- Réservation atomique pendant le paiement ----------
-- Bloque toutes les pièces demandées, ou aucune (exception => annulation de la transaction).
create or replace function public.reserver_pieces(ids uuid[], minutes integer default 35)
returns setof public.pieces
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  return query
    update public.pieces
       set reservee_jusqua = now() + make_interval(mins => minutes)
     where id = any(ids)
       and statut = 'en_vente'
       and (reservee_jusqua is null or reservee_jusqua < now())
    returning *;
  get diagnostics n = row_count;
  if n <> coalesce(array_length(ids, 1), 0) then
    raise exception 'PIECE_INDISPONIBLE' using errcode = 'P0001';
  end if;
end; $$;

create or replace function public.liberer_pieces(ids uuid[])
returns void
language sql security definer set search_path = '' as $$
  update public.pieces set reservee_jusqua = null
   where id = any(ids) and statut = 'en_vente';
$$;

create or replace function public.vendre_pieces(ids uuid[])
returns void
language sql security definer set search_path = '' as $$
  update public.pieces set statut = 'vendue', reservee_jusqua = null where id = any(ids);
$$;

-- uniquement pour les fonctions serveur (clé service_role), jamais depuis le site
revoke all on function public.reserver_pieces(uuid[], integer) from public, anon, authenticated;
revoke all on function public.liberer_pieces(uuid[]) from public, anon, authenticated;
revoke all on function public.vendre_pieces(uuid[]) from public, anon, authenticated;
grant execute on function public.reserver_pieces(uuid[], integer) to service_role;
grant execute on function public.liberer_pieces(uuid[]) to service_role;
grant execute on function public.vendre_pieces(uuid[]) to service_role;

-- ---------- Photos (stockage public en lecture, écriture admin) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/webp', 'image/png'])
on conflict (id) do nothing;

create policy "l'admin ajoute des photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos' and (select public.est_admin()));
create policy "l'admin modifie des photos" on storage.objects
  for update to authenticated using (bucket_id = 'photos' and (select public.est_admin()));
create policy "l'admin supprime des photos" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and (select public.est_admin()));
