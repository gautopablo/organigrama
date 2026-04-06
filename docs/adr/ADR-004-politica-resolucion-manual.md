# ADR-004: Política de Resolución Manual

- Estado: Aprobado
- Fecha: 2026-04-06

## Decisión
Toda contradicción crítica entre fuentes crea `orgchart_conflicts` y exige decisión explícita (`ACCEPT_A`, `ACCEPT_B`, `DISCARD`).

## Motivo
Evitar pérdida silenciosa de información y dejar rastro auditado de decisiones.

## Consecuencia
Incrementa trabajo de depuración, pero mantiene gobernanza y trazabilidad.
