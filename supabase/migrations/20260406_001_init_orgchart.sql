create extension if not exists "pgcrypto";
create extension if not exists "citext";

create type public.conflict_status as enum ('OPEN', 'RESOLVED', 'DISCARDED');
create type public.match_confidence as enum ('AUTO_OK', 'REVIEW_REQUIRED');

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,
  source_priority int not null default 100,
  imported_at timestamptz not null default now(),
  imported_by uuid default auth.uid(),
  summary jsonb not null default '{}'::jsonb
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  legajo text unique,
  nombre text not null,
  normalized_name text not null,
  email citext unique,
  cargo text,
  area text,
  estado text not null default 'ACTIVE',
  source_batch_id uuid references public.import_batches(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reporting_lines (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  manager_id uuid references public.employees(id) on delete set null,
  source text not null default 'manual',
  confidence public.match_confidence not null default 'REVIEW_REQUIRED',
  active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_reporting_lines_active_employee
on public.reporting_lines(employee_id) where active is true;

create table if not exists public.orgchart_staging (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  source_file text not null,
  source_priority int not null default 100,
  raw_payload jsonb not null,
  normalized_fields jsonb not null default '{}'::jsonb,
  employee_key text not null,
  manager_key text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.orgchart_conflicts (
  id uuid primary key default gen_random_uuid(),
  employee_key text not null,
  conflict_type text not null,
  source_a text not null,
  source_b text not null,
  status public.conflict_status not null default 'OPEN',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_orgchart_conflicts_status on public.orgchart_conflicts(status);

create table if not exists public.orgchart_decisions (
  id uuid primary key default gen_random_uuid(),
  conflict_id uuid not null references public.orgchart_conflicts(id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  notes text,
  resolved_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.reporting_line_audit (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  old_manager_id uuid,
  new_manager_id uuid,
  reason text,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);

create index if not exists idx_employees_legajo on public.employees(legajo);
create index if not exists idx_employees_email on public.employees(email);
create index if not exists idx_reporting_employee on public.reporting_lines(employee_id);
create index if not exists idx_reporting_manager on public.reporting_lines(manager_id);

create or replace function public.normalize_text(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(value, ''))), '\s+', ' ', 'g');
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->>'app_role', '') in ('editor', 'admin');
$$;

create or replace function public.would_create_cycle(p_employee_id uuid, p_manager_id uuid)
returns boolean
language plpgsql
stable
as $$
declare
  current_manager uuid;
begin
  if p_manager_id is null then
    return false;
  end if;

  if p_employee_id = p_manager_id then
    return true;
  end if;

  current_manager := p_manager_id;
  while current_manager is not null loop
    if current_manager = p_employee_id then
      return true;
    end if;

    select rl.manager_id
      into current_manager
    from public.reporting_lines rl
    where rl.employee_id = current_manager and rl.active is true;
  end loop;

  return false;
end;
$$;

create or replace function public.get_orgchart(
  p_root uuid default null,
  p_depth int default 6,
  p_area text default null
)
returns table (
  employee_id uuid,
  manager_id uuid,
  nombre text,
  cargo text,
  area text,
  level int,
  confidence public.match_confidence,
  source text
)
language sql
security definer
as $$
  with recursive tree as (
    select
      e.id as employee_id,
      rl.manager_id,
      e.nombre,
      e.cargo,
      e.area,
      0::int as level,
      rl.confidence,
      rl.source
    from public.employees e
    left join public.reporting_lines rl
      on rl.employee_id = e.id and rl.active is true
    where (
      p_root is not null and e.id = p_root
    ) or (
      p_root is null and rl.manager_id is null
    )
    union all
    select
      e.id,
      rl.manager_id,
      e.nombre,
      e.cargo,
      e.area,
      t.level + 1,
      rl.confidence,
      rl.source
    from public.employees e
    join public.reporting_lines rl
      on rl.employee_id = e.id and rl.active is true
    join tree t on t.employee_id = rl.manager_id
    where t.level < p_depth
  )
  select *
  from tree
  where p_area is null or area = p_area;
$$;

create or replace function public.search_employees(
  p_q text default '',
  p_area text default null,
  p_status text default null
)
returns table (
  id uuid,
  legajo text,
  nombre text,
  email text,
  cargo text,
  area text,
  estado text,
  manager_name text,
  confidence public.match_confidence,
  source text
)
language sql
security definer
as $$
  select
    e.id,
    e.legajo,
    e.nombre,
    e.email::text,
    e.cargo,
    e.area,
    e.estado,
    m.nombre as manager_name,
    rl.confidence,
    rl.source
  from public.employees e
  left join public.reporting_lines rl
    on rl.employee_id = e.id and rl.active is true
  left join public.employees m
    on m.id = rl.manager_id
  where (
      p_q = '' or
      e.nombre ilike '%' || p_q || '%' or
      coalesce(e.email::text, '') ilike '%' || p_q || '%' or
      coalesce(e.cargo, '') ilike '%' || p_q || '%'
    )
    and (p_area is null or e.area = p_area)
    and (p_status is null or e.estado = p_status)
  order by e.nombre;
$$;

create or replace function public.update_manager(
  p_employee_id uuid,
  p_manager_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  old_manager uuid;
begin
  if not public.is_editor() then
    raise exception 'forbidden';
  end if;

  if public.would_create_cycle(p_employee_id, p_manager_id) then
    raise exception 'Cycle detected for employee % manager %', p_employee_id, p_manager_id;
  end if;

  select manager_id
    into old_manager
  from public.reporting_lines
  where employee_id = p_employee_id and active is true;

  update public.reporting_lines
  set active = false,
      valid_to = now()
  where employee_id = p_employee_id and active is true;

  insert into public.reporting_lines(employee_id, manager_id, source, confidence, active)
  values (p_employee_id, p_manager_id, 'manual', 'REVIEW_REQUIRED', true);

  insert into public.reporting_line_audit(employee_id, old_manager_id, new_manager_id, reason)
  values (p_employee_id, old_manager, p_manager_id, p_reason);

  return jsonb_build_object(
    'ok', true,
    'employee_id', p_employee_id,
    'old_manager_id', old_manager,
    'new_manager_id', p_manager_id
  );
end;
$$;

create or replace function public.list_conflicts(
  p_status text default 'OPEN',
  p_type text default null
)
returns setof public.orgchart_conflicts
language sql
security definer
as $$
  select *
  from public.orgchart_conflicts c
  where (p_status is null or c.status::text = p_status)
    and (p_type is null or c.conflict_type = p_type)
  order by c.created_at desc;
$$;

create or replace function public.resolve_conflict(
  p_conflict_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  c public.orgchart_conflicts%rowtype;
begin
  if not public.is_editor() then
    raise exception 'forbidden';
  end if;

  select * into c
  from public.orgchart_conflicts
  where id = p_conflict_id;

  if not found then
    raise exception 'Conflict not found';
  end if;

  insert into public.orgchart_decisions(conflict_id, action, payload)
  values (p_conflict_id, p_action, p_payload);

  update public.orgchart_conflicts
  set status = case when p_action = 'DISCARD' then 'DISCARDED' else 'RESOLVED' end,
      resolved_at = now()
  where id = p_conflict_id;

  return jsonb_build_object('ok', true, 'conflict_id', p_conflict_id, 'action', p_action);
end;
$$;

alter table public.import_batches enable row level security;
alter table public.employees enable row level security;
alter table public.reporting_lines enable row level security;
alter table public.orgchart_staging enable row level security;
alter table public.orgchart_conflicts enable row level security;
alter table public.orgchart_decisions enable row level security;
alter table public.reporting_line_audit enable row level security;

drop policy if exists "viewer read import_batches" on public.import_batches;
create policy "viewer read import_batches" on public.import_batches
for select using (auth.role() = 'authenticated');

drop policy if exists "viewer read employees" on public.employees;
create policy "viewer read employees" on public.employees
for select using (auth.role() = 'authenticated');

drop policy if exists "viewer read reporting_lines" on public.reporting_lines;
create policy "viewer read reporting_lines" on public.reporting_lines
for select using (auth.role() = 'authenticated');

drop policy if exists "editor write employees" on public.employees;
create policy "editor write employees" on public.employees
for all using (public.is_editor()) with check (public.is_editor());

drop policy if exists "editor write reporting_lines" on public.reporting_lines;
create policy "editor write reporting_lines" on public.reporting_lines
for all using (public.is_editor()) with check (public.is_editor());

drop policy if exists "editor write staging" on public.orgchart_staging;
create policy "editor write staging" on public.orgchart_staging
for all using (public.is_editor()) with check (public.is_editor());

drop policy if exists "editor write conflicts" on public.orgchart_conflicts;
create policy "editor write conflicts" on public.orgchart_conflicts
for all using (public.is_editor()) with check (public.is_editor());

drop policy if exists "editor write decisions" on public.orgchart_decisions;
create policy "editor write decisions" on public.orgchart_decisions
for all using (public.is_editor()) with check (public.is_editor());

drop policy if exists "editor read audit" on public.reporting_line_audit;
create policy "editor read audit" on public.reporting_line_audit
for select using (public.is_editor());
