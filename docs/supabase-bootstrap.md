# Supabase Bootstrap

## 1) Completar `.env`

- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_ANON_KEY` (igual a `SUPABASE_ANON_KEY`)

## 2) Validar entorno

```bash
npm run doctor:supabase
```

## 3) Aplicar migración

Opción recomendada (rápida):
- Abrir Supabase Studio -> SQL Editor
- Ejecutar:
  - `supabase/migrations/20260406_001_init_orgchart.sql`

## 4) Deploy función Edge

```bash
npx supabase functions deploy upload-source --project-ref cqtlsukzvxkxxawualeu
```

## 5) Importar datos iniciales

```bash
npm run import:info
```

## 6) Verificar app

```bash
npm run dev:web
```

Pantallas:
- `/organigrama`
- `/directorio`
- `/importacion`
- `/conflictos`
