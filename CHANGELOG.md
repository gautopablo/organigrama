# Changelog

## 0.3.0 - 2026-04-08

### Added & Fixed

- Mejoras en formato de exportación e importación CSV: eliminación de ID interno, inclusión de Legajo y mapeo de División.
- Corrección de opciones predeterminadas del organigrama (ocultar 'sueltos') e interacciones de expandir/colapsar (eliminando bugs de arrastre).
- Nueva función de expandir/colapsar nodos en organigrama, reducción de distancia horizontal de tarjetas y cambio a panel lateral (sidebar) para edición.

## 0.2.0 - 2026-04-07

### Added & Fixed

- Nuevo campo `división`, soporte para edición en línea ("in-app editing") desde el directorio y corrección del anclaje superior de navegación (sticky header layout).
- Organigrama interactivo introduciendo `React Flow`, adición de la página de "Ayuda" y la vista lateral para edición directa.

## 0.1.0 - 2026-04-06

### Added & Fixed

- Implementación de procesamiento inicial de datos y fix de jerarquías para importar correctamente desde información cruda.
- Bootstrap de la aplicación Organigrama MVP (Tablas iniciales en Supabase, vistas principales, funciones Edge de importación, RLS).
