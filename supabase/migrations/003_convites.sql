-- =============================================================
-- Bora Vôlei · Etapa 4 · Convites por link/QR Code e perfil do jogador
-- Como usar: Supabase > SQL Editor > New snippet > cole tudo > Run.
-- (Rode depois do 002_grupos.sql. Pode rodar de novo sem problema.)
-- =============================================================

-- 1) Convites: cada um tem um código secreto e vale 7 dias
create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  codigo     text not null unique,
  criado_por uuid not null references public.profiles (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  vence_em   timestamptz not null default now() + interval '7 days',
  cancelado  boolean not null default false,
  usos       int not null default 0
);
create index if not exists invites_group_idx on public.invites (group_id);

alter table public.invites enable row level security;

-- Só dono e admins veem os convites do grupo
drop policy if exists "admins veem convites" on public.invites;
create policy "admins veem convites" on public.invites
  for select to authenticated using (public.eh_admin(group_id));
-- Criar, cancelar e usar convites: só pelas funções abaixo.

-- 2) Criar um convite novo (só dono/admin)
create or replace function public.criar_convite(p_grupo uuid)
returns public.invites language plpgsql security definer set search_path = public as $$
declare
  v_convite invites%rowtype;
begin
  if not eh_admin(p_grupo) then raise exception 'Só o dono ou um admin pode criar convites.'; end if;
  insert into invites (group_id, codigo, criado_por)
  values (p_grupo, substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), auth.uid())
  returning * into v_convite;
  return v_convite;
end;
$$;

-- 3) Cancelar um convite antes de vencer (só dono/admin)
create or replace function public.cancelar_convite(p_convite uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_grupo uuid;
begin
  select group_id into v_grupo from invites where id = p_convite;
  if v_grupo is null or not eh_admin(v_grupo) then
    raise exception 'Só o dono ou um admin pode cancelar convites.';
  end if;
  update invites set cancelado = true where id = p_convite;
end;
$$;

-- 4) Ver um convite pelo código (qualquer um com o link, mesmo sem conta):
--    devolve só os dados públicos do grupo e se o convite ainda vale.
create or replace function public.ver_convite(p_codigo text)
returns table (situacao text, group_id uuid, nome text, descricao text, modalidade text,
               municipio text, uf text, local text, dias text[], nivel_minimo text,
               qtd_membros int, vence_em timestamptz, minha_situacao text)
language sql stable security definer set search_path = public as $$
  select
    case when i.cancelado then 'cancelado'
         when i.vence_em < now() then 'vencido'
         else 'valido' end,
    g.id, g.nome, g.descricao, g.modalidade, g.municipio, g.uf, g.local, g.dias, g.nivel_minimo,
    (select count(*) from group_members x where x.group_id = g.id and x.situacao = 'ativo')::int,
    i.vence_em,
    (select x.situacao from group_members x where x.group_id = g.id and x.user_id = auth.uid())
  from invites i
  join groups g on g.id = i.group_id
  where i.codigo = p_codigo
$$;

-- 5) Usar o convite: entra direto no grupo, sem esperar aprovação
create or replace function public.usar_convite(p_codigo text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_convite invites%rowtype;
begin
  if auth.uid() is null then raise exception 'Entre na sua conta para usar o convite.'; end if;
  select * into v_convite from invites where codigo = p_codigo;
  if not found then raise exception 'Convite não encontrado.'; end if;
  if v_convite.cancelado then raise exception 'Este convite foi cancelado. Peça um novo ao admin.'; end if;
  if v_convite.vence_em < now() then raise exception 'Este convite expirou. Peça um novo ao admin.'; end if;

  insert into group_members (group_id, user_id, cargo, situacao, entrou_em)
  values (v_convite.group_id, auth.uid(), 'membro', 'ativo', now())
  on conflict (group_id, user_id)
    do update set situacao = 'ativo', entrou_em = coalesce(group_members.entrou_em, now());  -- se tinha pedido pendente, já entra

  update invites set usos = usos + 1 where id = v_convite.id;
  return v_convite.group_id;
end;
$$;

-- 6) Perfil: grupos em comum entre mim e outro jogador
create or replace function public.grupos_em_comum(p_usuario uuid)
returns table (id uuid, nome text)
language sql stable security definer set search_path = public as $$
  select g.id, g.nome
  from groups g
  where exists (select 1 from group_members a where a.group_id = g.id and a.user_id = auth.uid() and a.situacao = 'ativo')
    and exists (select 1 from group_members b where b.group_id = g.id and b.user_id = p_usuario and b.situacao = 'ativo')
  order by g.nome
$$;

-- 7) Libera para o app
grant select on public.invites to authenticated;
grant execute on function public.criar_convite(uuid), public.cancelar_convite(uuid),
  public.usar_convite(text), public.grupos_em_comum(uuid) to authenticated;
grant execute on function public.ver_convite(text) to anon, authenticated;
