# ADR-002: Reconciliación Staging -> Golden

- Estado: Aprobado
- Fecha: 2026-04-06

## Decisión
Todo ingreso de datos pasa por `orgchart_staging`. Solo registros de alta confianza pasan directo a `employees` + `reporting_lines`.

## Motivo
Permitir operación del MVP sin bloquear por inconsistencias de origen.

## Consecuencia
Se requiere cola de conflictos y resolución manual para cerrar calidad.
