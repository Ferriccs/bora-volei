-- =====================================================================
-- Bora Vôlei - Etapa 6: avaliações anônimas, nota do jogador e chat
-- Rode este arquivo inteiro no SQL Editor do Supabase (depois do 004).
-- =====================================================================

-- 1) Avaliações por estrelas
--    meeting_id vazio = avaliação geral (na tela do grupo ou no perfil)
--    meeting_id preenchido = avaliação pós-encontro
create table if not exists public.ratings (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  meeting_id uuid references public.meetings (id) on delete cascade,
  avaliador  uuid not null references public.profiles (id) on delete cascade,
  avaliado   uuid not null references public.profiles (id) on delete cascade,
  estrelas   int  not null check (estrelas between 1 and 5),
  criado_em  timestamptz not null default now(),
  check (avaliador <> avaliado)                       -- sem autoavaliação
);
-- Um voto por pessoa avaliada em cada encontro, e um voto geral por grupo (votar de novo troca)
create unique index if not exists ratings_um_por_encontro on public.ratings (meeting_id, avaliador, avaliado) where meeting_id is not null;
create unique index if not exists ratings_um_geral        on public.ratings (group_id, avaliador, avaliado) where meeting_id is null;
create index if not exists ratings_avaliado_idx on public.ratings (avaliado);

-- ANONIMATO: a tabela fica trancada. Sem regra de leitura e sem GRANT,
-- ninguém do app lê a tabela direto (nem o dono do grupo).
-- Tudo passa pelas funções abaixo, que só devolvem a nota calculada
-- ou os votos que a própria pessoa deu.
alter table public.ratings enable row level security;
revoke all on public.ratings from anon, authenticated;

-- 2) Avaliação geral: dar (ou trocar) estrelas para alguém do mesmo grupo
create or replace function public.avaliar_geral(p_grupo uuid, p_avaliado uuid, p_estrelas int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_avaliado = auth.uid() then raise exception 'Você não pode se avaliar.'; end if;
  if p_estrelas not between 1 and 5 then raise exception 'Escolha de 1 a 5 estrelas.'; end if;
  if not eh_membro(p_grupo) then raise exception 'Você não participa deste grupo.'; end if;
  if not exists (select 1 from group_members where group_id = p_grupo and user_id = p_avaliado and situacao = 'ativo') then
    raise exception 'Essa pessoa não participa deste grupo.';
  end if;
  insert into ratings (group_id, avaliador, avaliado, estrelas)
  values (p_grupo, auth.uid(), p_avaliado, p_estrelas)
  on conflict (group_id, avaliador, avaliado) where meeting_id is null
  do update set estrelas = excluded.estrelas, criado_em = now();
end;
$$;

-- Os votos gerais que EU dei neste grupo (para mostrar as estrelas já marcadas)
create or replace function public.minhas_avaliacoes_gerais(p_grupo uuid)
returns table (avaliado uuid, estrelas int)
language sql stable security definer set search_path = public as $$
  select avaliado, estrelas from ratings
  where group_id = p_grupo and meeting_id is null and avaliador = auth.uid()
$$;

-- 3) Avaliação pós-encontro
--    Aberta para quem jogou, até 3 dias depois do horário do encontro,
--    e só depois que o admin registrou "quem jogou".
create or replace function public.avaliacao_aberta(p_encontro uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from meetings m
    join attendance a on a.meeting_id = m.id and a.user_id = auth.uid() and a.jogou
    where m.id = p_encontro and m.situacao = 'realizado'
      and now() < m.data_hora + interval '3 days'
  )
$$;

-- p_notas: [{"avaliado": "<id>", "estrelas": 4}, ...]
create or replace function public.avaliar_encontro(p_encontro uuid, p_notas jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_grupo uuid := grupo_do_encontro(p_encontro);
  v_n     int;
begin
  if not avaliacao_aberta(p_encontro) then
    raise exception 'A avaliação deste encontro não está aberta para você (só para quem jogou, até 3 dias depois).';
  end if;
  if exists (select 1 from jsonb_array_elements(p_notas) x
             where (x ->> 'estrelas')::int not between 1 and 5) then
    raise exception 'Escolha de 1 a 5 estrelas.';
  end if;

  insert into ratings (group_id, meeting_id, avaliador, avaliado, estrelas)
  select v_grupo, p_encontro, auth.uid(), (x ->> 'avaliado')::uuid, (x ->> 'estrelas')::int
  from jsonb_array_elements(p_notas) x
  -- só avalia quem também jogou, e nunca a si mesmo
  where (x ->> 'avaliado')::uuid <> auth.uid()
    and exists (select 1 from attendance a where a.meeting_id = p_encontro
                and a.user_id = (x ->> 'avaliado')::uuid and a.jogou)
  on conflict (meeting_id, avaliador, avaliado) where meeting_id is not null
  do update set estrelas = excluded.estrelas, criado_em = now();
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- Os votos que EU dei neste encontro
create or replace function public.minhas_avaliacoes_encontro(p_encontro uuid)
returns table (avaliado uuid, estrelas int)
language sql stable security definer set search_path = public as $$
  select avaliado, estrelas from ratings
  where meeting_id = p_encontro and avaliador = auth.uid()
$$;

-- Encontros em que joguei e ainda falta avaliar alguém (para o aviso "Como foi o jogo?")
create or replace function public.encontros_para_avaliar()
returns table (meeting_id uuid, group_id uuid, grupo_nome text, data_hora timestamptz, faltam int)
language sql stable security definer set search_path = public as $$
  select m.id, m.group_id, g.nome, m.data_hora,
         (select count(*)::int from attendance o
           where o.meeting_id = m.id and o.jogou and o.user_id <> auth.uid()
             and not exists (select 1 from ratings r where r.meeting_id = m.id
                             and r.avaliador = auth.uid() and r.avaliado = o.user_id))
  from meetings m
  join groups g on g.id = m.group_id
  join attendance a on a.meeting_id = m.id and a.user_id = auth.uid() and a.jogou
  where m.situacao = 'realizado' and now() < m.data_hora + interval '3 days'
    and exists (select 1 from attendance o
                where o.meeting_id = m.id and o.jogou and o.user_id <> auth.uid()
                  and not exists (select 1 from ratings r where r.meeting_id = m.id
                                  and r.avaliador = auth.uid() and r.avaliado = o.user_id))
  order by m.data_hora desc
$$;

-- 4) NOTA DO JOGADOR (0 a 10), sem "dia de sorte":
--    - começa com a nota do nível (básico 4, intermediário 6, avançado 8), que vale 5 votos;
--    - cada encontro vale UM voto: a média das estrelas daquele dia × 2;
--    - encontros recentes pesam mais (cada encontro mais antigo vale 5% menos);
--    - a avaliação geral (média de todos os votos gerais × 2) entra com o peso de um encontro.
create or replace function public.nota_jogadores(p_ids uuid[])
returns table (user_id uuid, nota numeric, votos int, encontros int)
language sql stable security definer set search_path = public as $$
  with base as (
    select p.id,
           case p.nivel when 'basico' then 4 when 'intermediario' then 6 when 'avancado' then 8 else 5 end::numeric as inicial
    from profiles p where p.id = any (p_ids)
  ),
  por_encontro as (            -- média de cada encontro, numerada do mais novo para o mais antigo
    select r.avaliado, avg(r.estrelas) * 2 as media,
           row_number() over (partition by r.avaliado order by max(m.data_hora) desc) - 1 as idade
    from ratings r join meetings m on m.id = r.meeting_id
    where r.avaliado = any (p_ids)
    group by r.avaliado, r.meeting_id
  ),
  enc as (
    select avaliado, sum(power(0.95, idade) * media) as soma, sum(power(0.95, idade)) as peso, count(*) as qtd
    from por_encontro group by avaliado
  ),
  geral as (
    select avaliado, avg(estrelas) * 2 as media
    from ratings where meeting_id is null and avaliado = any (p_ids)
    group by avaliado
  ),
  votos as (
    select avaliado, count(*) as qtd from ratings where avaliado = any (p_ids) group by avaliado
  )
  select b.id,
         round((5 * b.inicial + coalesce(e.soma, 0) + coalesce(g.media, 0))
               / (5 + coalesce(e.peso, 0) + case when g.media is null then 0 else 1 end), 1),
         coalesce(v.qtd, 0)::int,
         coalesce(e.qtd, 0)::int
  from base b
  left join enc e   on e.avaliado = b.id
  left join geral g on g.avaliado = b.id
  left join votos v on v.avaliado = b.id
$$;

-- 5) "Jogou com você X vezes": encontros em que os dois foram marcados como "jogou"
create or replace function public.jogou_comigo(p_usuario uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from attendance a
  join attendance b on b.meeting_id = a.meeting_id and b.user_id = p_usuario and b.jogou
  where a.user_id = auth.uid() and a.jogou and p_usuario <> auth.uid()
$$;

-- 6) Chat do grupo
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  autor      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  tipo       text not null default 'texto' check (tipo in ('texto', 'contato', 'encontro')),
  conteudo   text not null check (char_length(conteudo) between 1 and 1000),
  meeting_id uuid references public.meetings (id) on delete set null,
  criado_em  timestamptz not null default now()
);
create index if not exists messages_grupo_idx on public.messages (group_id, criado_em);

alter table public.messages enable row level security;

drop policy if exists "integrantes leem o chat" on public.messages;
create policy "integrantes leem o chat" on public.messages
  for select using (eh_membro(group_id));

-- Só integrantes escrevem, sempre em nome próprio (texto ou contato)
drop policy if exists "integrantes escrevem no chat" on public.messages;
create policy "integrantes escrevem no chat" on public.messages
  for insert with check (autor = auth.uid() and eh_membro(group_id) and tipo in ('texto', 'contato'));

-- Cada um pode apagar a própria mensagem
drop policy if exists "autor apaga a mensagem" on public.messages;
create policy "autor apaga a mensagem" on public.messages
  for delete using (autor = auth.uid());

-- Encontro novo vira um aviso no chat
create or replace function public.avisar_encontro_no_chat()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into messages (group_id, autor, tipo, conteudo, meeting_id)
  values (new.group_id, new.criado_por, 'encontro', 'marcou um novo encontro', new.id);
  return new;
end;
$$;
drop trigger if exists ao_criar_encontro on public.meetings;
create trigger ao_criar_encontro after insert on public.meetings
  for each row execute function public.avisar_encontro_no_chat();

-- Chat em tempo real: avisa o app quando chega mensagem nova
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
                     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- 7) Libera para o app (este projeto não libera tabelas novas sozinho)
grant select, insert, delete on public.messages to authenticated;
grant execute on function
  public.avaliar_geral(uuid, uuid, int),
  public.minhas_avaliacoes_gerais(uuid),
  public.avaliacao_aberta(uuid),
  public.avaliar_encontro(uuid, jsonb),
  public.minhas_avaliacoes_encontro(uuid),
  public.encontros_para_avaliar(),
  public.nota_jogadores(uuid[]),
  public.jogou_comigo(uuid)
to authenticated;
