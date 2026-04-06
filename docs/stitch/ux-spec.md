# Stitch UX Spec

## Pantallas

1. Organigrama
2. Directorio
3. Importación
4. Conflictos

## Estados obligatorios por pantalla

- `loading`
- `empty`
- `error`
- `success`
- `conflict` (solo importación/conflictos)

## Campos/acciones

### Organigrama
- Filtros: área, profundidad
- Acción: seleccionar colaborador
- Acción: reasignar superior
- Visual: nodo con nombre/cargo/área/confidence/source

### Directorio
- Búsqueda por nombre, cargo, email
- Filtro por estado y área
- Acción: abrir ficha

### Importación
- Carga archivo CSV/JSON
- Preview de filas válidas/invalidas
- Ejecutar reconciliación
- Mostrar resumen batch

### Conflictos
- Lista por tipo y estado
- Acción: aceptar fuente A
- Acción: aceptar fuente B
- Acción: descartar
- Mostrar detalle y trazabilidad

## Reglas UX

- No ocultar inconsistencias.
- Mostrar siempre `source` y `confidence`.
- Bloquear cambios de manager que generen ciclo con mensaje claro.
