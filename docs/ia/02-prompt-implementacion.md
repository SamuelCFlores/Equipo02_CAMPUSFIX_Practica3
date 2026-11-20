# Prompt 2. Implementación de funcionalidades con Claude Code

- **Herramienta:** Claude Code (modelo Claude Opus 5.5), en la terminal del equipo del integrante.
- **Fecha:** 19 de noviembre de 2026.
- **Antecedente:** el prompt 1 (Claude Design) definió la identidad visual y las cinco pantallas base. Este prompt convierte esas pantallas en un prototipo navegable con funciones reales.

## Instrucción original del integrante

> «ClaudeCode pero antes documenta el prompt para crear la estética en design que sea una propia, después de funcionalidades donde emplees todos los workflows, procurar utilizar lo que se tiene y no inventar para obtener mejores resultados.»

## Prompt estructurado que se ejecutó

```text
Contexto: CAMPUSFIX es un sistema de reporte y atención de incidencias de infraestructura
para la Universidad Metropolitana del Centro (institución ficticia, Campus Centro). Ya existen
el SRS v1.0 (RF-001 a RF-026, RN-001 a RN-010, CU-01 a CU-08) y el DAS v1.0 (COMP-01 a COMP-08,
PAN-01 a PAN-11, FLU-01 a FLU-03, Tabla 30 de estados, Tablas 36 a 38 de estilo y accesibilidad).

Objetivo: construye un prototipo frontend navegable en React + Vite, sin backend, con datos
simulados en memoria y localStorage, que reproduzca la estética definida en Claude Design
(Public Sans, IBM Plex Mono para folios, azul marino #0F2A47, fondo #F3F4F1, chips de estado).

Pantallas (máximo cinco):
1. Acceso institucional (PAN-01) con selección de usuario de demostración por rol.
2. Listado por rol (PAN-02/PAN-03): Mis incidencias, Bandeja de la mesa, Tablero del técnico,
   Validaciones del supervisor; con búsqueda por folio o ubicación y filtros.
3. Reportar incidencia en cuatro pasos (PAN-05) con errores de captura (PAN-07) y
   confirmación con folio (PAN-06).
4. Detalle con historial (PAN-04) y las acciones del rol: clasificar, vincular duplicado y
   asignar (PAN-08); diagnóstico, espera de refacción y resolución (PAN-09); validar cierre o
   reasignar (PAN-10).
5. Indicadores de la Dirección administrativa (PAN-11).

Recorridos que deben funcionar completos:
- FLU-01: Reportante → reportar con foto → error si falta un dato → folio → seguimiento.
- FLU-02: Mesa de servicio → bandeja → detalle → validar, vincular duplicado, clasificar,
  calcular prioridad y asignar técnico → bandeja.
- FLU-03: Técnico → tablero → diagnóstico → En espera de refacción → resolución con evidencia
  (error si no hay foto ni motivo) → Supervisor valida o devuelve.

Reglas: respeta la Tabla 30 (estados, transiciones y quién las ejecuta), el formato de folio
CF-AAAAMMDD-XXXX (RN-001), la privacidad de notas internas (RN-007), duplicados que conservan
reportante y evidencias (RN-003), cierre con evidencia o motivo (RN-005), reasignación solo por
Supervisor (RN-008) y reapertura dentro de 48 horas hábiles (RN-004, RN-009). Aplica los patrones
del DAS: Strategy para la regla de prioridad (ReglaPrioridad / MatrizImpactoUrgencia) y Observer
para avisos y bitácora. Como la matriz definitiva no está aprobada (PP-01, SUP-06), usa una
regla provisional y márcala como tal en pantalla y en el código.

Datos: usa solo las personas, folios, ubicaciones, textos y horas que ya están en el prototipo
de Figma de la Práctica 2 (Lucía Méndez, Diego Ramírez, Ana Salas, Javier Torres, María López,
Elena Ruiz, Daniel Ortega; folios CF-20261023-0042, 0045, 0046, 0048, etc.). Si falta un dato,
usa el mínimo necesario y márcalo como dato de ejemplo. No inventes funciones fuera del SRS.

Entrega: repositorio Equipo02_CAMPUSFIX_Practica3 con README, estructura de carpetas coherente,
commits progresivos por funcionalidad, pruebas de las reglas de dominio y la trazabilidad
COMP/PAN → archivo implementado.
```

## Decisiones que se tomaron al ejecutar el prompt

| Tema | Decisión | Motivo |
|---|---|---|
| Reloj de la demo | La demo arranca el 23 oct 2026 a las 09:38 y avanza con el tiempo real. | Es la hora de la bandeja de la Mesa en Figma; permite recorrer FLU-02 y FLU-03 con 0042 en estado Nuevo. |
| Regla de prioridad | Impacto + urgencia (Bajo = 1, Medio = 2, Alto = 3): 5 o más Alta, 4 Media, 3 o menos Baja. | Provisional: la matriz definitiva está pendiente (PP-01, SUP-06). Se aísla con el patrón Strategy. |
| Técnicos | Solo hay técnicos con nombre para Plomería (Javier Torres y María López), como en Figma. | Las demás categorías muestran el estado «Sin técnico disponible» de PAN-08; los folios históricos de otras áreas se atienden por «equipo». |
| Fotografías | Se guardan como miniatura en el navegador; se valida tipo (JPEG, PNG, WebP) y tamaño (5 MB). | No hay servidor (COMP-07 simulado). |
| Datos faltantes | Títulos y descripciones de 0045, 0046, 0034, 0041, 0038 y 0030 se redactaron de forma mínima a partir de su ubicación y categoría. | Figma solo mostraba folio, ubicación, categoría, prioridad y estado. |
