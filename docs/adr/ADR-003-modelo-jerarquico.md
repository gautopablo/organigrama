# ADR-003: Modelo Jerárquico

- Estado: Aprobado
- Fecha: 2026-04-06

## Decisión
Representar la jerarquía con lista de adyacencia (`reporting_lines`) y un vínculo activo por empleado.

## Motivo
Simplicidad para MVP, consultas recursivas SQL nativas y trazabilidad histórica por cambios de relación.

## Consecuencia
Se implementa validación anti-ciclos en `update_manager`.
