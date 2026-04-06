# ADR-001: Prioridad de Fuentes

- Estado: Aprobado
- Fecha: 2026-04-06

## Decisión
Se define prioridad de carga:
1. `usuarios_superiores_organigrama_oficial.xlsx`
2. `usuarios_superiores_organigrama_con_cargos.xlsx`
3. `Listado reporta a.xlsx`
4. PDF solo para revisión manual.

## Motivo
La fuente oficial contiene más metadatos de validación y comparación.

## Consecuencia
La reconciliación respeta prioridad y registra conflictos en vez de sobrescribir ciegamente.
