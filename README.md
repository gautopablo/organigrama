# Organigrama MVP

MVP para visualizar, gestionar y depurar el organigrama empresarial usando:

- Frontend: React + Vite (`apps/web`)
- Backend/Data: Supabase (PostgreSQL, RLS, RPC, Edge Functions)
- Gobernanza: GitHub PR flow + ADRs

## Estructura

- `apps/web`: interfaz de usuario (organigrama, directorio, importación, conflictos)
- `supabase/migrations`: esquema, políticas y funciones RPC
- `supabase/functions/upload-source`: endpoint de carga/reconciliación
- `scripts`: utilidades de normalización y carga
- `docs/adr`: decisiones de arquitectura
- `tests`: unit/integration/e2e base

## Quick Start

1. Instalar dependencias:
   - `npm install`
2. Configurar variables:
   - copiar `.env.example` a `.env`
   - completar keys reales de Supabase
   - validar: `npm run doctor:supabase`
3. Aplicar migraciones en Supabase:
   - SQL Editor con `supabase/migrations/20260406_001_init_orgchart.sql`
   - detalle en [docs/supabase-bootstrap.md](docs/supabase-bootstrap.md)
4. Ejecutar frontend:
   - `npm run dev:web`
5. Ejecutar tests:
   - `npm test`

## Flujo de datos (resumen)

1. Se sube fuente (CSV/XLSX transformada a JSON).
2. Se guarda en `orgchart_staging`.
3. Se normaliza + matchea (legajo > email > nombre).
4. Si confianza alta: promueve a `employees` + `reporting_lines`.
5. Si hay contradicción: crea `orgchart_conflicts`.
6. Usuario editor resuelve en cola de conflictos.

## Estado

Implementación inicial del MVP completa con:
- tablas, índices, RLS y RPC principales
- frontend funcional para los 4 flujos
- base de reconciliación y trazabilidad
