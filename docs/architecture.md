# Arquitectura MVP

## Contexto

Las fuentes del organigrama presentan duplicados y contradicciones. El sistema prioriza continuidad operativa con depuración incremental.

## Componentes

- `apps/web`: UI para visualización, edición, importación y resolución de conflictos.
- Supabase Postgres:
  - `employees` y `reporting_lines` como golden base operativa.
  - `orgchart_staging` para ingesta cruda y normalizada.
  - `orgchart_conflicts` y `orgchart_decisions` para trazabilidad de depuración.
- Supabase Edge Function `upload-source`:
  - parsea CSV,
  - crea batch,
  - carga staging,
  - promueve registros con confianza alta,
  - crea conflictos cuando aplica.

## Priorización de fuentes

1. `usuarios_superiores_organigrama_oficial.xlsx`
2. `usuarios_superiores_organigrama_con_cargos.xlsx`
3. `Listado reporta a.xlsx`
4. `Organigrama UT.pdf` (contraste manual)

## Seguridad

- RLS por rol (`viewer`, `editor`, `admin`) vía `app_role` en JWT.
- `viewer`: lectura.
- `editor/admin`: escritura en staging/conflicts/decisions y actualización de jerarquía.

## Decisiones clave

- Modelo jerárquico: lista de adyacencia (`reporting_lines`) con validación anti-ciclos.
- Resolución de conflictos explícita, sin pisar datos contradictorios automáticamente.
