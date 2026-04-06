# Changelog

## 0.1.0 - 2026-04-06

### Added
- Estructura del proyecto (`apps/web`, `supabase`, `docs/adr`, `scripts`, `tests`).
- Migración inicial Supabase con:
  - tablas `employees`, `reporting_lines`, `orgchart_staging`, `orgchart_conflicts`, `orgchart_decisions`, `import_batches`, `reporting_line_audit`
  - índices y RLS por rol
  - RPC `get_orgchart`, `search_employees`, `update_manager`, `list_conflicts`, `resolve_conflict`
- Edge function `upload-source` para ingesta y reconciliación inicial.
- Frontend React con 4 vistas: Organigrama, Directorio, Importación, Conflictos.
- Utilidades de reconciliación y script de carga desde `info`.
- ADRs de arquitectura y priorización de fuentes.
- CI base y template de PR.
