## Implementación MVP Organigrama (Stitch + Supabase + GitHub)

### Resumen
- Objetivo: dejar operativo un MVP que permita **visualizar**, **editar relaciones jerárquicas** e **importar/depurar** datos contradictorios.
- Estrategia: construir `golden base` desde múltiples fuentes, con conflictos trazables y resolución iterativa.
- Entregables: UX en Stitch, backend/data en Supabase, repo GitHub con flujo PR protegido.

### Cambios de Implementación
1. Base técnica inicial
- Crear repositorio con estructura:
  - `apps/web` (frontend)
  - `supabase/migrations` (SQL)
  - `supabase/functions` (edge functions opcionales)
  - `docs/adr` (decisiones de arquitectura)
- Configurar GitHub:
  - `main` protegida
  - PR obligatorio + checks
  - plantilla de PR + Conventional Commits.

2. Diseño UX en Stitch (primero)
- Generar 4 pantallas:
  - `Organigrama`
  - `Directorio`
  - `Importación`
  - `Conflictos`
- Definir estados: loading, vacío, error, éxito, conflicto.
- Exportar especificación funcional (campos, acciones, validaciones) para implementación web.

3. Modelo de datos Supabase
- Crear tablas:
  - `employees` (id, legajo, nombre, email, cargo, area, estado)
  - `reporting_lines` (employee_id, manager_id, source, confidence, active)
  - `orgchart_staging` (batch_id, source_file, raw_payload, normalized_fields)
  - `orgchart_conflicts` (employee_key, conflict_type, source_a, source_b, status)
  - `orgchart_decisions` (conflict_id, action, resolved_by, notes)
  - `import_batches` (source_file, imported_at, summary)
- Índices: `legajo`, `email`, `employee_id`, `manager_id`, `status`.
- RLS inicial por roles:
  - `viewer` lectura
  - `editor` escritura en staging/conflicts/decisions y actualización jerarquía.

4. Pipeline de importación y reconciliación
- Implementar flujo:
  - Ingesta a `orgchart_staging`.
  - Normalización (nombres, emails, áreas, cargos).
  - Matching por prioridad: legajo > email > nombre normalizado.
  - Scoring de confianza (`AUTO_OK` / `REVIEW_REQUIRED`).
  - Promoción a `employees` + `reporting_lines` si supera umbral.
  - Registrar contradicciones en `orgchart_conflicts`.
- Prioridad de fuentes:
  1. `usuarios_superiores_organigrama_oficial.xlsx`
  2. `usuarios_superiores_organigrama_con_cargos.xlsx`
  3. `Listado reporta a.xlsx`
  4. `Organigrama UT.pdf` solo contraste manual.

5. API/servicios para frontend
- Exponer endpoints (REST/RPC):
  - `get_orgchart(root, depth, area)`
  - `search_employees(q, area, status)`
  - `update_manager(employee_id, manager_id)`
  - `upload_source(file)`
  - `list_conflicts(status, type)`
  - `resolve_conflict(conflict_id, action, payload)`
- Validación crítica:
  - prevenir ciclos
  - prevenir auto-reporte
  - mantener historial de cambios.

6. Frontend funcional
- Implementar vistas conectadas:
  - árbol jerárquico (zoom, expandir/colapsar, foco)
  - búsqueda y filtro
  - edición de “reporta a”
  - importador con preview
  - cola de conflictos con resolución.
- Mostrar `confidence` y `source` por relación para transparencia de datos.

7. Gobernanza y trazabilidad
- ADRs:
  - prioridad de fuentes
  - estrategia de reconciliación
  - modelo jerárquico
  - política de resolución manual.
- Changelog de importaciones por batch.

### Plan de Pruebas
- Unit tests:
  - normalización y matching
  - scoring de confianza
  - detección de duplicados y contradicciones
  - validación anti-ciclos.
- Integration tests:
  - importación completa por archivo
  - promoción staging -> golden
  - resolución de conflictos.
- E2E:
  - cargar archivo, visualizar árbol, corregir conflicto, verificar reflejo inmediato.
- Criterios de aceptación:
  - organigrama inicial usable generado desde fuentes mixtas
  - conflictos visibles y resolubles
  - cambios auditables por usuario/fecha.

### Supuestos y Defaults
- Se prioriza “operativo y corregible” sobre “perfecto desde día 1”.
- SSO corporativo queda fuera del MVP (auth simple por roles).
- El PDF no se parsea automáticamente en esta fase.
- La depuración continua se hace sobre `orgchart_conflicts` sin bloquear operación diaria.
