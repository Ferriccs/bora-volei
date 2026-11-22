-- =============================================================
-- Bora Vôlei · Etapa 2 · Perfis dos jogadores
-- Como usar: Supabase > SQL Editor > New query > cole tudo > Run.
-- Pode rodar de novo sem problema (ele não duplica nada).
-- =============================================================

-- 1) Lista de posições por esporte (vôlei agora, outros esportes depois)
create table if not exists public.positions (
  id      text primary key,          -- ex.: 'volei_levantador'
  esporte text not null default 'volei',
  nome    text not null,             -- ex.: 'Levantador'
  ordem   int  not null default 0
);

insert into public.positions (id, esporte, nome, ordem) values
  ('volei_levantador', 'volei', 'Levantador', 1),
  ('volei_ponteiro',   'volei', 'Ponteiro',   2),
  ('volei_central',    'volei', 'Central',    3),
  ('volei_oposto',     'volei', 'Oposto',     4),
  ('volei_libero',     'volei', 'Líbero',     5)
on conflict (id) do nothing;

-- 2) Perfil de cada jogador (uma linha por conta)
create table if not exists public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  nome                 text not null default '',
  foto_url             text,
  nascimento           date,
  nivel                text check (nivel in ('basico', 'intermediario', 'avancado')),
  tempo_jogo           text check (tempo_jogo in ('0-1', '1-3', '3+')),
  posicao_principal    text references public.positions (id),
  posicoes_secundarias text[] not null default '{}',
  municipio            text,
  uf                   char(2),
  bio                  text check (char_length(bio) <= 300),
  criado_em            timestamptz not null default now(),
  atualizado_em        timestamptz not null default now()
);
-- Obs.: o telefone NÃO fica aqui de propósito. Ele só vai para o chat
-- quando a pessoa tocar em "compartilhar contato" (etapa 6).

-- 3) Quando alguém cria conta, já nasce um perfil com o nome informado
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome',
             new.raw_user_meta_data ->> 'full_name',   -- nome que vem do Google
             new.raw_user_meta_data ->> 'name',
             '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil_novo_usuario();

-- Contas que já existiam antes deste SQL também ganham perfil
insert into public.profiles (id, nome)
select u.id, coalesce(u.raw_user_meta_data ->> 'nome', u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
on conflict (id) do nothing;

-- 4) Atualiza a data de "atualizado_em" sozinho
create or replace function public.marcar_atualizacao()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists perfil_atualizado on public.profiles;
create trigger perfil_atualizado
  before update on public.profiles
  for each row execute function public.marcar_atualizacao();

-- 5) Regras de segurança (RLS): tudo começa fechado
alter table public.profiles  enable row level security;
alter table public.positions enable row level security;

-- Qualquer pessoa logada pode ver perfis (para o perfil do jogador e o sorteio)
drop policy if exists "perfis visiveis para logados" on public.profiles;
create policy "perfis visiveis para logados" on public.profiles
  for select to authenticated using (true);

-- Cada um só cria e edita o PRÓPRIO perfil
drop policy if exists "cria o proprio perfil" on public.profiles;
create policy "cria o proprio perfil" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

drop policy if exists "edita o proprio perfil" on public.profiles;
create policy "edita o proprio perfil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Posições: só leitura, para todos
drop policy if exists "posicoes para todos" on public.positions;
create policy "posicoes para todos" on public.positions
  for select to anon, authenticated using (true);

-- 6) Libera as tabelas para o app (projetos novos do Supabase não liberam sozinhos).
--    As regras de RLS acima continuam valendo: isso só "abre a porta", o RLS decide quem entra.
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.positions to anon, authenticated;
