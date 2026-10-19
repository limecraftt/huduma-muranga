-- =========================================================
-- Huduma Murang'a: database schema for Supabase
-- Run once in: Supabase Dashboard > SQL Editor > New query
-- =========================================================

create type public.request_status as enum ('pending', 'in_progress', 'resolved');
create type public.user_role as enum ('citizen', 'admin');

-- ---------- Profiles (one row per auth user) ----------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  ward       text not null default '',
  role       public.user_role not null default 'citizen',
  created_at timestamptz not null default now()
);

-- Creates the profile automatically when someone signs up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, ward, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'ward', ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper used by the security rules below
create function public.is_admin() returns boolean
language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Service requests ----------
create sequence public.request_ref_seq start 1;

create table public.requests (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null unique
              default ('HM-' || extract(year from now())::int || '-' || lpad(nextval('public.request_ref_seq')::text, 4, '0')),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  category    text not null,
  sub_county  text not null,
  location    text not null check (char_length(location) between 3 and 200),
  description text not null check (char_length(description) between 15 and 2000),
  image_path  text,
  status      public.request_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.request_history (
  id         bigint generated always as identity primary key,
  request_id uuid not null references public.requests (id) on delete cascade,
  status     public.request_status not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);

-- First history row is written automatically when a request is created
create function public.log_new_request() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.request_history (request_id, status, note)
  values (new.id, 'pending', 'Request received');
  return new;
end $$;

create trigger on_request_created
  after insert on public.requests
  for each row execute function public.log_new_request();

-- Admin-only status change (updates the request and writes history together)
create function public.update_request_status(p_id uuid, p_status public.request_status, p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can update requests';
  end if;
  update public.requests set status = p_status, updated_at = now() where id = p_id;
  if not found then raise exception 'Request not found'; end if;
  insert into public.request_history (request_id, status, note)
  values (p_id, p_status, coalesce(nullif(trim(p_note), ''), 'Status updated by administrator'));
end $$;

-- ---------- Anonymous crime tips (NO user column on purpose) ----------
create table public.tips (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  crime_type  text not null,
  sub_county  text not null,
  location    text not null check (char_length(location) between 3 and 200),
  description text not null check (char_length(description) between 20 and 3000),
  image_path  text,
  status      public.request_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.tip_history (
  id         bigint generated always as identity primary key,
  tip_id     uuid not null references public.tips (id) on delete cascade,
  status     public.request_status not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);

-- Random, hard-to-guess code such as TIP-K7QM-4XZA (no 0/O/1/I)
create function public.generate_tip_code() returns text
language plpgsql set search_path = '' as $$
declare
  chars  constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes  bytea := extensions.gen_random_bytes(8);
  result text := '';
begin
  for i in 0..7 loop
    result := result || substr(chars, (get_byte(bytes, i) % 32) + 1, 1);
  end loop;
  return 'TIP-' || substr(result, 1, 4) || '-' || substr(result, 5, 4);
end $$;

-- Anyone (even logged out) can submit. They only get the code back.
create function public.submit_tip(
  p_crime_type text, p_sub_county text, p_location text, p_description text, p_image_path text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_code text := public.generate_tip_code();
  v_id   uuid;
begin
  insert into public.tips (code, crime_type, sub_county, location, description, image_path)
  values (v_code, p_crime_type, p_sub_county, trim(p_location), trim(p_description), p_image_path)
  returning id into v_id;
  insert into public.tip_history (tip_id, status, note) values (v_id, 'pending', 'Tip received');
  return v_code;
end $$;

-- Public status check by code. Returns status and notes only, never the details.
create function public.track_tip(p_code text) returns jsonb
language plpgsql security definer stable set search_path = '' as $$
declare
  v_tip public.tips;
begin
  select * into v_tip from public.tips where code = upper(trim(p_code));
  if not found then return null; end if;
  return jsonb_build_object(
    'code', v_tip.code,
    'status', v_tip.status,
    'created_at', v_tip.created_at,
    'updated_at', v_tip.updated_at,
    'history', coalesce((
      select jsonb_agg(jsonb_build_object('status', h.status, 'note', h.note, 'at', h.created_at) order by h.created_at)
      from public.tip_history h where h.tip_id = v_tip.id
    ), '[]'::jsonb)
  );
end $$;

create function public.update_tip_status(p_id uuid, p_status public.request_status, p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can update tips';
  end if;
  update public.tips set status = p_status, updated_at = now() where id = p_id;
  if not found then raise exception 'Tip not found'; end if;
  insert into public.tip_history (tip_id, status, note)
  values (p_id, p_status, coalesce(nullif(trim(p_note), ''), 'Status updated by administrator'));
end $$;

-- ---------- Row Level Security ----------
alter table public.profiles        enable row level security;
alter table public.requests        enable row level security;
alter table public.request_history enable row level security;
alter table public.tips            enable row level security;
alter table public.tip_history     enable row level security;

-- profiles: see your own (admins see all); you may edit only ward and name, never role
create policy "profiles read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant  update (ward, full_name) on public.profiles to authenticated;

-- requests: citizens create and read their own; admins read all (admins change status via the function)
create policy "requests read own or admin" on public.requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "requests insert own" on public.requests
  for insert to authenticated with check (user_id = auth.uid());

create policy "history read own or admin" on public.request_history
  for select to authenticated using (
    public.is_admin() or exists (select 1 from public.requests r where r.id = request_id and r.user_id = auth.uid())
  );

-- tips: ONLY admins can read directly; everyone else goes through submit_tip / track_tip
create policy "tips admin read" on public.tips
  for select to authenticated using (public.is_admin());
create policy "tip history admin read" on public.tip_history
  for select to authenticated using (public.is_admin());

-- Function permissions: tips are callable while logged out, admin functions are not
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin()            to authenticated;
grant execute on function public.update_request_status(uuid, public.request_status, text) to authenticated;
grant execute on function public.update_tip_status(uuid, public.request_status, text)     to authenticated;
grant execute on function public.submit_tip(text, text, text, text, text) to anon, authenticated;
grant execute on function public.track_tip(text)       to anon, authenticated;

-- ---------- Storage buckets (private) ----------
insert into storage.buckets (id, name, public) values
  ('request-images', 'request-images', false),
  ('tip-images',     'tip-images',     false)
on conflict (id) do nothing;

-- Citizens upload into a folder named after their user id; they and admins can read it
create policy "request images upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'request-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "request images read own or admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'request-images' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- Anyone can drop a tip photo in; only admins can view it
create policy "tip images anonymous upload" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'tip-images');
create policy "tip images admin read" on storage.objects
  for select to authenticated using (bucket_id = 'tip-images' and public.is_admin());
