alter table if exists public.employees
  drop constraint if exists employees_legajo_key;

alter table if exists public.employees
  drop constraint if exists employees_email_key;

create index if not exists idx_employees_legajo_non_unique on public.employees(legajo);
create index if not exists idx_employees_email_non_unique on public.employees(email);
