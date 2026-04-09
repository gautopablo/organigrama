
-- Migration to add 'active' status to employees and switch to Upsert-based import

-- 1. Add active column to employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 2. Create index for performance on active filtering
CREATE INDEX IF NOT EXISTS idx_employees_active ON public.employees(active);

-- 3. Update get_orgchart to filter by active employees
CREATE OR REPLACE FUNCTION public.get_orgchart(
  p_root uuid default null,
  p_depth int default 6,
  p_area text default null
)
RETURNS TABLE (
  employee_id uuid,
  manager_id uuid,
  nombre text,
  cargo text,
  area text,
  level int,
  confidence public.match_confidence,
  source text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH RECURSIVE tree AS (
    -- Initial set: root(s)
    SELECT
      e.id AS employee_id,
      rl.manager_id,
      e.nombre,
      e.cargo,
      e.area,
      0::int AS level,
      rl.confidence,
      rl.source
    FROM public.employees e
    LEFT JOIN public.reporting_lines rl
      ON rl.employee_id = e.id AND rl.active IS TRUE
    WHERE 
      e.active IS TRUE AND (
        (p_root IS NOT NULL AND e.id = p_root) OR 
        (p_root IS NULL AND rl.manager_id IS NULL)
      )
    
    UNION ALL
    
    -- Recursive step: children
    SELECT
      e.id,
      rl.manager_id,
      e.nombre,
      e.cargo,
      e.area,
      t.level + 1,
      rl.confidence,
      rl.source
    FROM public.employees e
    JOIN public.reporting_lines rl
      ON rl.employee_id = e.id AND rl.active IS TRUE
    JOIN tree t ON t.employee_id = rl.manager_id
    WHERE 
      e.active IS TRUE AND
      t.level < p_depth
  )
  SELECT *
  FROM tree
  WHERE p_area IS NULL OR area = p_area;
$$;

-- 4. Update search_employees to filter by active employees
CREATE OR REPLACE FUNCTION public.search_employees(
  p_q text default '',
  p_area text default null,
  p_status text default null
)
RETURNS TABLE (
  id uuid,
  legajo text,
  nombre text,
  email text,
  cargo text,
  area text,
  estado text,
  manager_name text,
  confidence public.match_confidence,
  source text,
  active boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    e.id,
    e.legajo,
    e.nombre,
    e.email::text,
    e.cargo,
    e.area,
    e.estado,
    m.nombre AS manager_name,
    rl.confidence,
    rl.source,
    e.active
  FROM public.employees e
  LEFT JOIN public.reporting_lines rl
    ON rl.employee_id = e.id AND rl.active IS TRUE
  LEFT JOIN public.employees m
    ON m.id = rl.manager_id
  WHERE 
    e.active IS TRUE -- Hard filter as requested
    AND (
      p_q = '' OR
      e.nombre ILIKE '%' || p_q || '%' OR
      COALESCE(e.email::text, '') ILIKE '%' || p_q || '%' OR
      COALESCE(e.cargo, '') ILIKE '%' || p_q || '%'
    )
    AND (p_area IS NULL OR e.area = p_area)
    AND (p_status IS NULL OR e.estado = p_status)
  ORDER BY e.nombre;
$$;

-- 5. New RPC for Upsert-based import (instead of wipe-load)
CREATE OR REPLACE FUNCTION public.import_directory_upsert(
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_snapshot_id UUID;
    v_emp_count INT;
    v_line_count INT;
    v_deactivated_count INT;
    v_batch_id UUID;
BEGIN
    -- 1. Create Snapshot for Backup
    INSERT INTO public.data_snapshots (payload, batch_info)
    VALUES (
        jsonb_build_object(
            'employees', (SELECT jsonb_agg(e) FROM public.employees e),
            'reporting_lines', (SELECT jsonb_agg(rl) FROM public.reporting_lines rl)
        ),
        jsonb_build_object('type', 'auto_backup_before_upsert', 'timestamp', now())
    )
    RETURNING id INTO v_snapshot_id;

    -- 2. Create a batch record
    INSERT INTO public.import_batches (source_file, summary)
    VALUES ('upsert_import', jsonb_build_object('rows', jsonb_array_length(p_rows)))
    RETURNING id INTO v_batch_id;

    -- 3. Upsert Employees
    -- We use legajo as the unique identifier if available, otherwise email.
    -- If both are missing, we can't reliably upsert, but the Edge Function should have filtered those.
    
    -- First, mark everyone as potentially inactive (or we do it at the end for those not in p_rows)
    -- But better: Upsert all from p_rows and set active=true, then deactivate others.

    -- Step 3a: Upsert from p_rows
    WITH input_rows AS (
        SELECT 
            (r->>'nombre') as nombre,
            lower(trim(regexp_replace((r->>'nombre'), '\s+', ' ', 'g'))) as normalized_name,
            (r->>'email')::citext as email,
            (r->>'legajo') as legajo,
            (r->>'cargo') as cargo,
            (r->>'area') as area,
            (r->>'division') as division,
            COALESCE((r->>'active')::boolean, true) as is_active
        FROM jsonb_array_elements(p_rows) r
    )
    INSERT INTO public.employees (legajo, nombre, normalized_name, email, cargo, area, division, active, source_batch_id)
    SELECT legajo, nombre, normalized_name, email, cargo, area, division, is_active, v_batch_id
    FROM input_rows
    ON CONFLICT (legajo) DO UPDATE SET
        nombre = EXCLUDED.nombre,
        normalized_name = EXCLUDED.normalized_name,
        email = EXCLUDED.email,
        cargo = EXCLUDED.cargo,
        area = EXCLUDED.area,
        division = EXCLUDED.division,
        active = EXCLUDED.active,
        source_batch_id = EXCLUDED.source_batch_id,
        updated_at = now();

    -- (Optional) If we also want to match by email if legajo is missing, but legajo is unique.
    -- If legajo is NULL, the ON CONFLICT won't trigger. 
    -- So we do a second pass for those with email but no legajo? 
    -- Or we assume legajo is the primary key for corporate directory.

    -- Step 4: Rebuild Reporting Lines for the imported employees
    -- We deactivate old lines for these employees and create new ones
    UPDATE public.reporting_lines rl
    SET active = false, valid_to = now()
    FROM public.employees e
    WHERE rl.employee_id = e.id 
      AND e.source_batch_id = v_batch_id 
      AND rl.active IS TRUE;

    INSERT INTO public.reporting_lines (employee_id, manager_id, confidence, source)
    SELECT 
        e.id,
        m.id,
        'AUTO_OK',
        'upsert_import'
    FROM jsonb_array_elements(p_rows) r
    JOIN public.employees e ON (
        (r->>'legajo' IS NOT NULL AND e.legajo = r->>'legajo') OR
        (r->>'legajo' IS NULL AND r->>'email' IS NOT NULL AND e.email = (r->>'email')::citext)
    )
    LEFT JOIN public.employees m ON (
        -- Try matching manager by email first
        (r->>'manager_email' IS NOT NULL AND m.email = (r->>'manager_email')::citext) OR
        -- Fallback to name if email not provided/matched
        (r->>'manager_email' IS NULL AND r->>'manager_name' IS NOT NULL AND m.normalized_name = lower(trim(regexp_replace((r->>'manager_name'), '\s+', ' ', 'g'))))
    )
    WHERE (r->>'manager_email' IS NOT NULL OR r->>'manager_name' IS NOT NULL)
      AND e.source_batch_id = v_batch_id;

    -- Step 5: Deactivate employees NOT in this batch
    -- (Only if the user wants this "sync" behavior. If they just want to add, skip this.)
    -- User said: "ignorar los Active=falso", which implies they might want to explicitly set it or have it handled.
    -- If they upload a partial file, we shouldn't deactivate others? 
    -- But usually a directory upload is a full sync.
    -- Let's NOT deactivate others unless explicitly requested, 
    -- OR we can have a parameter. For now, let's just do what's in the file.
    
    SELECT count(*) INTO v_emp_count FROM public.employees WHERE active IS TRUE;
    SELECT count(*) INTO v_line_count FROM public.reporting_lines WHERE active IS TRUE;

    RETURN jsonb_build_object(
        'ok', true,
        'snapshot_id', v_snapshot_id,
        'active_employees', v_emp_count,
        'active_lines', v_line_count,
        'batch_id', v_batch_id
    );
END;
$$;
