-- =============================================================
-- Bora Vôlei · Etapa 3 · Grupos, integrantes, cargos e pedidos
-- Como usar: Supabase > SQL Editor > New snippet > cole tudo > Run.
-- (Rode depois do 001_perfis.sql. Pode rodar de novo sem problema.)
-- =============================================================

-- 1) Nível em número, para comparar (básico < intermediário < avançado)
create or replace function public.nivel_num(n text)
returns int language sql immutable as $$
  select case n when 'basico' then 1 when 'intermediario' then 2 when 'avancado' then 3 else 0 end
$$;

-- 2) Grupos
create table if not exists public.groups (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null check (char_length(nome) between 3 and 60),
  descricao      text check (char_length(descricao) <= 400),
  esporte        text not null default 'volei',
  modalidade     text not null check (modalidade in ('quadra', 'areia', 'ambos')),
  municipio      text not null,
  uf             char(2) not null,
  local          text,
  dias           text[] not null default '{}',     -- ex.: {'ter','qui'}
  nivel_minimo   text not null default 'basico' check (nivel_minimo in ('basico', 'intermediario', 'avancado')),
  aceita_novatos boolean not null default true,     -- se false, quem tem nível menor que o mínimo não pode pedir
  dono           uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  criado_em      timestamptz not null default now()
);
create index if not exists groups_local_idx on public.groups (uf, municipio);

-- 3) Integrantes de cada grupo
create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  cargo     text not null default 'membro' check (cargo in ('dono', 'admin', 'membro')),
  situacao  text not null default 'pendente' check (situacao in ('ativo', 'pendente')),
  pediu_em  timestamptz not null default now(),
  entrou_em timestamptz,
  primary key (group_id, user_id)
);
create index if not exists group_members_user_idx on public.group_members (user_id);

-- 4) Funções de apoio: "sou integrante?" e "sou dono/admin?"
--    (security definer evita que as regras fiquem consultando a si mesmas sem fim)
create or replace function public.eh_membro(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members
                 where group_id = g and user_id = auth.uid() and situacao = 'ativo')
$$;

create or replace function public.eh_admin(g uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members
                 where group_id = g and user_id = auth.uid() and situacao = 'ativo'
                   and cargo in ('dono', 'admin'))
$$;

-- 5) Quem cria o grupo vira o dono automaticamente
create or replace function public.adicionar_dono()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into group_members (group_id, user_id, cargo, situacao, entrou_em)
  values (new.id, new.dono, 'dono', 'ativo', now())
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists ao_criar_grupo on public.groups;
create trigger ao_criar_grupo after insert on public.groups
  for each row execute function public.adicionar_dono();

-- Ninguém troca o dono editando o grupo
create or replace function public.manter_dono()
returns trigger language plpgsql as $$
begin
  new.dono := old.dono;
  new.criado_em := old.criado_em;
  return new;
end;
$$;
drop trigger if exists ao_editar_grupo on public.groups;
create trigger ao_editar_grupo before update on public.groups
  for each row execute function public.manter_dono();

-- 6) Regras de segurança (RLS)
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- Grupos aparecem na busca para todos os logados (só dados públicos: nome, cidade, nível...)
drop policy if exists "grupos visiveis" on public.groups;
create policy "grupos visiveis" on public.groups
  for select to authenticated using (true);

drop policy if exists "criar grupo" on public.groups;
create policy "criar grupo" on public.groups
  for insert to authenticated with check (dono = (select auth.uid()));

drop policy if exists "dono e admin editam" on public.groups;
create policy "dono e admin editam" on public.groups
  for update to authenticated using (public.eh_admin(id)) with check (public.eh_admin(id));

drop policy if exists "so o dono apaga" on public.groups;
create policy "so o dono apaga" on public.groups
  for delete to authenticated using (dono = (select auth.uid()));

-- Integrantes: vejo meus próprios vínculos, os integrantes ativos dos meus grupos,
-- e (se sou dono/admin) os pedidos pendentes.
drop policy if exists "ver integrantes" on public.group_members;
create policy "ver integrantes" on public.group_members
  for select to authenticated using (
    user_id = (select auth.uid())
    or (situacao = 'ativo' and public.eh_membro(group_id))
    or public.eh_admin(group_id)
  );
-- Não há regra de insert/update/delete direto: tudo passa pelas funções abaixo,
-- que conferem cargo e nível antes de mudar qualquer coisa.

-- 7) Funções que o app chama
-- 7.1 Meus grupos (com cargo, situação e quantidade de integrantes)
create or replace function public.meus_grupos()
returns table (id uuid, nome text, modalidade text, municipio text, uf text, local text,
               dias text[], nivel_minimo text, cargo text, situacao text, qtd_membros int)
language sql stable security definer set search_path = public as $$
  select g.id, g.nome, g.modalidade, g.municipio, g.uf, g.local, g.dias, g.nivel_minimo,
         m.cargo, m.situacao,
         (select count(*) from group_members x where x.group_id = g.id and x.situacao = 'ativo')::int
  from group_members m
  join groups g on g.id = m.group_id
  where m.user_id = auth.uid()
  order by (m.situacao = 'ativo') desc, g.nome
$$;

-- 7.2 Buscar grupos por município (e modalidade / nome, opcionais)
create or replace function public.buscar_grupos(p_uf text, p_municipio text,
                                                p_modalidade text default null, p_texto text default null)
returns table (id uuid, nome text, descricao text, modalidade text, municipio text, uf text,
               local text, dias text[], nivel_minimo text, aceita_novatos boolean,
               qtd_membros int, minha_situacao text)
language sql stable security definer set search_path = public as $$
  select g.id, g.nome, g.descricao, g.modalidade, g.municipio, g.uf, g.local, g.dias,
         g.nivel_minimo, g.aceita_novatos,
         (select count(*) from group_members x where x.group_id = g.id and x.situacao = 'ativo')::int,
         (select x.situacao from group_members x where x.group_id = g.id and x.user_id = auth.uid())
  from groups g
  where g.uf = upper(p_uf)
    and (coalesce(p_municipio, '') = '' or lower(g.municipio) = lower(p_municipio))
    and (p_modalidade is null or g.modalidade = p_modalidade or g.modalidade = 'ambos')
    and (coalesce(p_texto, '') = '' or g.nome ilike '%' || p_texto || '%')
  order by g.criado_em desc
  limit 50
$$;

-- 7.3 Pedir para entrar (confere o nível mínimo)
create or replace function public.pedir_entrada(p_grupo uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_grupo groups%rowtype;
  v_nivel text;
begin
  select * into v_grupo from groups where id = p_grupo;
  if not found then raise exception 'Grupo não encontrado.'; end if;

  if exists (select 1 from group_members where group_id = p_grupo and user_id = auth.uid()) then
    raise exception 'Você já participa ou já pediu para entrar neste grupo.';
  end if;

  select nivel into v_nivel from profiles where id = auth.uid();
  if nivel_num(v_nivel) < nivel_num(v_grupo.nivel_minimo) and not v_grupo.aceita_novatos then
    raise exception 'Seu nível é menor que o mínimo deste grupo, e ele não aceita novatos.';
  end if;

  insert into group_members (group_id, user_id, cargo, situacao)
  values (p_grupo, auth.uid(), 'membro', 'pendente');
  return 'pendente';
end;
$$;

-- 7.4 Cancelar o meu pedido
create or replace function public.cancelar_pedido(p_grupo uuid)
returns void language sql security definer set search_path = public as $$
  delete from group_members where group_id = p_grupo and user_id = auth.uid() and situacao = 'pendente'
$$;

-- 7.5 Dono/admin aceita ou recusa um pedido
create or replace function public.responder_pedido(p_grupo uuid, p_usuario uuid, p_aceitar boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not eh_admin(p_grupo) then raise exception 'Só o dono ou um admin pode responder pedidos.'; end if;
  if p_aceitar then
    update group_members set situacao = 'ativo', entrou_em = now()
    where group_id = p_grupo and user_id = p_usuario and situacao = 'pendente';
  else
    delete from group_members where group_id = p_grupo and user_id = p_usuario and situacao = 'pendente';
  end if;
end;
$$;

-- 7.6 Só o dono nomeia ou tira admins
create or replace function public.mudar_cargo(p_grupo uuid, p_usuario uuid, p_cargo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from groups where id = p_grupo and dono = auth.uid()) then
    raise exception 'Só o dono pode mudar cargos.';
  end if;
  if p_cargo not in ('admin', 'membro') then raise exception 'Cargo inválido.'; end if;
  update group_members set cargo = p_cargo
  where group_id = p_grupo and user_id = p_usuario and situacao = 'ativo' and cargo <> 'dono';
end;
$$;

-- 7.7 Remover alguém do grupo (admin remove membro; dono remove admin ou membro)
create or replace function public.remover_membro(p_grupo uuid, p_usuario uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_cargo_alvo text;
  v_sou_dono boolean;
begin
  select cargo into v_cargo_alvo from group_members where group_id = p_grupo and user_id = p_usuario;
  v_sou_dono := exists (select 1 from groups where id = p_grupo and dono = auth.uid());
  if v_cargo_alvo = 'dono' then raise exception 'O dono não pode ser removido.'; end if;
  if v_cargo_alvo = 'admin' and not v_sou_dono then raise exception 'Só o dono pode remover um admin.'; end if;
  if not eh_admin(p_grupo) then raise exception 'Só o dono ou um admin pode remover integrantes.'; end if;
  delete from group_members where group_id = p_grupo and user_id = p_usuario;
end;
$$;

-- 7.8 Sair do grupo
create or replace function public.sair_do_grupo(p_grupo uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from groups where id = p_grupo and dono = auth.uid()) then
    raise exception 'O dono não pode sair do grupo. Se quiser, apague o grupo.';
  end if;
  delete from group_members where group_id = p_grupo and user_id = auth.uid();
end;
$$;

-- 8) Libera as tabelas e funções para o app (o RLS acima continua decidindo quem vê o quê)
grant select, insert, update, delete on public.groups to authenticated;
grant select on public.group_members to authenticated;
grant execute on function
  public.nivel_num(text), public.eh_membro(uuid), public.eh_admin(uuid),
  public.meus_grupos(), public.buscar_grupos(text, text, text, text),
  public.pedir_entrada(uuid), public.cancelar_pedido(uuid),
  public.responder_pedido(uuid, uuid, boolean), public.mudar_cargo(uuid, uuid, text),
  public.remover_membro(uuid, uuid), public.sair_do_grupo(uuid)
to authenticated;
