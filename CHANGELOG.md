# Changelog

## 0.3.3 - 2026-04-09

### Fixed

- Corregido error 500 en la función de carga por rutas de importación incorrectas en el despliegue.
- Añadido logging detallado en backend para diagnóstico de importaciones.
- Forzada conversión a String de Legajos para evitar discrepancias de tipos JSON.

## 0.3.2 - 2026-04-08

### Added & Fixed

- **Modelo "Wipe & Load"**: Implementación de sistema determinista de limpieza y carga masiva via RPC.
- **Robustez CSV**: Integración de `PapaParse` para manejar correctamente nombres con comas y comillas.
- **Mapeo Inteligente**: Soporte expandido para cabeceras de exportación (`Reporta a`, `Área`, `División`, `Legajo`).
- **Backup Automático**: Creación de snapshots en base de datos antes de cada importación destructiva.

## 0.3.1 - 2026-04-08

### CORS & UI Fixed

- Corrección de error de conexión en la Edge Function mediante la implementación de soporte para CORS.
- Actualización de versión en la interfaz de usuario.

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
