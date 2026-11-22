-- =============================================================
-- Bora Vôlei · Etapa 5 · Encontros, presença, convidados e sorteios
-- Como usar: Supabase > SQL Editor > New snippet > cole tudo > Run.
-- (Rode depois do 003_convites.sql. Pode rodar de novo sem problema.)
-- =============================================================

-- 1) Encontros (jogos marcados, sem limite de vagas)
create table if not exists public.meetings (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  data_hora   timestamptz not null,
  local       text,
  modalidade  text not null check (modalidade in ('quadra', 'areia')),
  observacao  text check (char_length(observacao) <= 300),
  situacao    text not null default 'marcado' check (situacao in ('marcado', 'realizado', 'cancelado')),
  criado_por  uuid not null default auth.uid() references public.profiles (id),
  criado_em   timestamptz not null default now()
);
create index if not exists meetings_group_idx on public.meetings (group_id, data_hora);

-- 2) Presença: quem confirmou (e a hora, que dá a prioridade no sorteio) e quem jogou de verdade
create table if not exists public.attendance (
  meeting_id    uuid not null references public.meetings (id) on delete cascade,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  confirmado_em timestamptz not null default now(),
  jogou         boolean,              -- vazio até o admin registrar "quem jogou"
  primary key (meeting_id, user_id)
);

-- 3) Convidados sem conta (só para o sorteio daquele encontro)
create table if not exists public.guests (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings (id) on delete cascade,
  nome        text not null check (char_length(nome) between 2 and 40),
  nivel       text not null check (nivel in ('basico', 'intermediario', 'avancado')),
  criado_por  uuid not null default auth.uid() references public.profiles (id),
  criado_em   timestamptz not null default now()
);

-- 4) Sorteios salvos (o "oficial" de cada rodada) e em qual time cada um caiu
create table if not exists public.draws (
  id                 uuid primary key default gen_random_uuid(),
  meeting_id         uuid not null references public.meetings (id) on delete cascade,
  rodada             int not null default 1,
  jogadores_por_time int not null check (jogadores_por_time between 1 and 12),
  usa_posicao        boolean not null default false,
  modo               text not null default 'rodizio' check (modo in ('rodizio', 'perdedor_sai')),
  criado_por         uuid not null default auth.uid() references public.profiles (id),
  criado_em          timestamptz not null default now()
);

create table if not exists public.draw_players (
  draw_id   uuid not null references public.draws (id) on delete cascade,
  user_id   uuid references public.profiles (id) on delete cascade,
  guest_id  uuid references public.guests (id) on delete cascade,
  time      text not null,          -- 'A', 'B', 'C'... ou 'R' (reserva / Barreira)
  nota      numeric(4,1) not null,  -- nota usada no cálculo
  check ((user_id is null) <> (guest_id is null))   -- ou jogador, ou convidado
);
create index if not exists draw_players_draw_idx on public.draw_players (draw_id);

-- 5) Função de apoio: de qual grupo é este encontro?
create or replace function public.grupo_do_encontro(m uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select group_id from meetings where id = m
$$;

-- 6) Regras de segurança (RLS): tudo do encontro só para integrantes do grupo
alter table public.meetings     enable row level security;
alter table public.attendance   enable row level security;
alter table public.guests       enable row level security;
alter table public.draws        enable row level security;
alter table public.draw_players enable row level security;

drop policy if exists "integrantes veem encontros" on public.meetings;
create policy "integrantes veem encontros" on public.meetings
  for select to authenticated using (public.eh_membro(group_id));
drop policy if exists "admins criam encontros" on public.meetings;
create policy "admins criam encontros" on public.meetings
  for insert to authenticated with check (public.eh_admin(group_id) and criado_por = (select auth.uid()));
drop policy if exists "admins editam encontros" on public.meetings;
create policy "admins editam encontros" on public.meetings
  for update to authenticated using (public.eh_admin(group_id)) with check (public.eh_admin(group_id));

drop policy if exists "integrantes veem presenca" on public.attendance;
create policy "integrantes veem presenca" on public.attendance
  for select to authenticated using (public.eh_membro(public.grupo_do_encontro(meeting_id)));
-- Cada um confirma e desconfirma só a própria presença
drop policy if exists "confirmo minha presenca" on public.attendance;
create policy "confirmo minha presenca" on public.attendance
  for insert to authenticated
  with check (user_id = (select auth.uid()) and jogou is null
              and public.eh_membro(public.grupo_do_encontro(meeting_id)));
drop policy if exists "desconfirmo minha presenca" on public.attendance;
create policy "desconfirmo minha presenca" on public.attendance
  for delete to authenticated using (user_id = (select auth.uid()) and jogou is null);

drop policy if exists "integrantes veem convidados" on public.guests;
create policy "integrantes veem convidados" on public.guests
  for select to authenticated using (public.eh_membro(public.grupo_do_encontro(meeting_id)));
drop policy if exists "admins adicionam convidados" on public.guests;
create policy "admins adicionam convidados" on public.guests
  for insert to authenticated
  with check (public.eh_admin(public.grupo_do_encontro(meeting_id)) and criado_por = (select auth.uid()));
drop policy if exists "admins removem convidados" on public.guests;
create policy "admins removem convidados" on public.guests
  for delete to authenticated using (public.eh_admin(public.grupo_do_encontro(meeting_id)));

drop policy if exists "integrantes veem sorteios" on public.draws;
create policy "integrantes veem sorteios" on public.draws
  for select to authenticated using (public.eh_membro(public.grupo_do_encontro(meeting_id)));
drop policy if exists "integrantes veem times" on public.draw_players;
create policy "integrantes veem times" on public.draw_players
  for select to authenticated using (
    exists (select 1 from draws d where d.id = draw_id and public.eh_membro(public.grupo_do_encontro(d.meeting_id)))
  );
-- Salvar sorteio e registrar quem jogou: só pelas funções abaixo (dono/admin).

-- 7) Salvar o sorteio oficial de uma rodada (só dono/admin)
--    p_jogadores: lista JSON [{ "user_id": "...", "time": "A", "nota": 6.0 }, { "guest_id": "...", ... }]
create or replace function public.salvar_sorteio(p_encontro uuid, p_rodada int, p_por_time int,
                                                 p_usa_posicao boolean, p_modo text, p_jogadores jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_sorteio uuid;
begin
  if not eh_admin(grupo_do_encontro(p_encontro)) then
    raise exception 'Só o dono ou um admin pode salvar o sorteio oficial.';
  end if;
  -- Se já havia um sorteio salvo nesta rodada, troca pelo novo
  delete from draws where meeting_id = p_encontro and rodada = p_rodada;
  insert into draws (meeting_id, rodada, jogadores_por_time, usa_posicao, modo)
  values (p_encontro, p_rodada, p_por_time, p_usa_posicao, p_modo)
  returning id into v_sorteio;
  insert into draw_players (draw_id, user_id, guest_id, time, nota)
  select v_sorteio, (j ->> 'user_id')::uuid, (j ->> 'guest_id')::uuid, j ->> 'time', (j ->> 'nota')::numeric
  from jsonb_array_elements(p_jogadores) j;
  return v_sorteio;
end;
$$;

-- 8) Registrar quem jogou de verdade (só dono/admin). Marca o encontro como realizado.
create or replace function public.registrar_quem_jogou(p_encontro uuid, p_jogadores uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare
  v_grupo uuid := grupo_do_encontro(p_encontro);
begin
  if not eh_admin(v_grupo) then raise exception 'Só o dono ou um admin pode registrar quem jogou.'; end if;
  -- Quem apareceu sem confirmar também entra (desde que seja integrante ativo)
  insert into attendance (meeting_id, user_id, jogou)
  select p_encontro, u, true
  from unnest(p_jogadores) u
  where exists (select 1 from group_members m where m.group_id = v_grupo and m.user_id = u and m.situacao = 'ativo')
  on conflict (meeting_id, user_id) do update set jogou = true;
  update attendance set jogou = false
  where meeting_id = p_encontro and not (user_id = any (p_jogadores));
  update meetings set situacao = 'realizado' where id = p_encontro;
end;
$$;

-- 9) Libera para o app
grant select, insert, update on public.meetings to authenticated;
grant select, insert, delete on public.attendance to authenticated;
grant select, insert, delete on public.guests to authenticated;
grant select on public.draws, public.draw_players to authenticated;
grant execute on function public.grupo_do_encontro(uuid),
  public.salvar_sorteio(uuid, int, int, boolean, text, jsonb),
  public.registrar_quem_jogou(uuid, uuid[]) to authenticated;
