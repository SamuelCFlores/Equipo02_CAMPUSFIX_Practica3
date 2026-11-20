# Trazabilidad diseño → implementación

Relación entre los elementos del DAS/SDD v1.0 de CAMPUSFIX y lo que realmente existe en este prototipo. «Simulado» significa que la función se ve y se puede usar en la demostración, pero sin la infraestructura real del DAS.

## Componentes (DAS, Tabla 18)

| Componente del DAS | Implementación en el prototipo | Estado |
|---|---|---|
| COMP-01 Accesos | `src/dominio/accesos.js`, `src/pantallas/Acceso.jsx` | Simulado: cuentas de demostración y permisos por rol; sin directorio institucional ni token. |
| COMP-02 Incidencias | `src/dominio/incidencias.js`, `folio.js`, `estados.js`, `nucleo.js` | Implementado: registro, folio, revisión, clasificación, duplicados, diagnóstico, espera, resolución, reapertura. |
| COMP-03 Asignación y atención | `src/dominio/asignacion.js` | Implementado: técnicos por categoría, carga, tablero, asignación, reasignación y validación de cierre. Sin escalamiento automático. |
| COMP-04 Notificaciones | `src/dominio/observadores.js` (`Notificaciones`), panel de avisos en `src/componentes/Marco.jsx` | Simulado: avisos dentro de la aplicación; sin correo ni reintentos. |
| COMP-05 Reportes y métricas | `src/dominio/metricas.js`, `src/pantallas/Indicadores.jsx` | Implementado: indicadores, recurrencias, fallas críticas y CSV. PDF mediante la impresión del navegador. |
| COMP-06 Bitácora de auditoría | `src/dominio/observadores.js` (`Bitacora`), `src/pantallas/detalle/comunes.jsx` | Implementado en memoria del navegador; solo agrega registros, pero no es inalterable a nivel de almacenamiento. |
| COMP-07 Evidencias | `src/dominio/evidencias.js`, `src/componentes/foto.js` | Simulado: valida formato y 5 MB y guarda una miniatura en el navegador; sin almacenamiento de archivos. |
| COMP-08 Catálogos y configuración | `src/dominio/catalogos.js`, `src/dominio/reglaPrioridad.js` | Parcial: catálogos como constantes; sin pantalla de configuración (RF-025). |
| API REST, base de datos, directorio y servidor de correo (despliegue del DAS) | `src/estado/almacen.jsx` con `localStorage` | Pendiente: sustituidos por estado en el navegador. |

## Patrones (DAS, Tablas 32 y 33)

| Patrón | Dónde está |
|---|---|
| Strategy para la prioridad | `ReglaPrioridad` y `MatrizImpactoUrgencia` en `src/dominio/reglaPrioridad.js`; `usarRegla()` permite cambiar la regla sin tocar `incidencias.js` (prueba «Strategy»). |
| Observer para avisos y bitácora | `ObservadorEstado`, `Notificaciones` y `Bitacora` en `src/dominio/observadores.js`; `emitir()` y `cambiarEstado()` en `src/dominio/nucleo.js`. |

## Pantallas (DAS, Tabla 39)

| Pantalla del DAS | Pantalla del prototipo | Archivo |
|---|---|---|
| PAN-01 Inicio de sesión | 1. Acceso | `src/pantallas/Acceso.jsx` |
| PAN-02 Panel según el rol | 2. Listado por rol | `src/pantallas/Listado.jsx` |
| PAN-03 Bandeja, tablero o mis reportes | 2. Listado por rol | `src/pantallas/Listado.jsx`, `src/componentes/TablaIncidencias.jsx` |
| PAN-05 Reportar en cuatro pasos | 3. Reportar | `src/pantallas/Reportar.jsx` |
| PAN-06 Confirmación con folio | 3. Reportar (confirmación) | `src/pantallas/Reportar.jsx` |
| PAN-07 Errores de captura y de cierre | 3. Reportar y 4. Detalle (técnico) | `Reportar.jsx`, `src/pantallas/detalle/PanelTecnico.jsx` |
| PAN-04 Detalle con historial | 4. Detalle | `src/pantallas/Detalle.jsx`, `detalle/comunes.jsx`, `detalle/PanelReportante.jsx` |
| PAN-08 Clasificar, duplicado y asignar | 4. Detalle (Mesa) | `src/pantallas/detalle/PanelMesa.jsx` |
| PAN-09 Diagnóstico, espera y cierre | 4. Detalle (Técnico) | `src/pantallas/detalle/PanelTecnico.jsx` |
| PAN-10 Validar cierre o reasignar | 4. Detalle (Supervisor) | `src/pantallas/detalle/PanelSupervisor.jsx` |
| PAN-11 Métricas y recurrentes | 5. Indicadores | `src/pantallas/Indicadores.jsx` |

## Recorridos (DAS, Tabla 40)

| Recorrido | Pantallas en el prototipo | Verificación |
|---|---|---|
| FLU-01 Reportar con foto y recibir folio | Acceso → Mis incidencias → Reportar (con error en paso 2) → Confirmación → Detalle | Prueba «FLU-01» y capturas P03 a P05 |
| FLU-02 Validar, vincular duplicado, clasificar y asignar | Acceso → Bandeja → Detalle de 0042 → Bandeja | Prueba «FLU-02» y capturas P02, P06 y P07 |
| FLU-03 Diagnosticar, espera, cerrar con evidencia y validar | Acceso → Tablero → Detalle (con error sin evidencia) → Detalle del Supervisor | Prueba «FLU-03» y capturas P08 a P10 |

## Requisitos funcionales (SRS v1.0)

| RF | Estado | Nota |
|---|---|---|
| RF-001 | Simulado | Sin directorio institucional. |
| RF-002 | Implementado | Permisos por rol y rutas protegidas. |
| RF-003 a RF-013 | Implementados | RF-007 solo tiene técnicos con nombre para Plomería, como en Figma. RF-010 usa una regla provisional. |
| RF-014 | Parcial | Ajuste manual de prioridad con motivo; no hay escalamiento automático por tiempo vencido. |
| RF-015 a RF-019 | Implementados | RF-017 usa un calendario provisional de lunes a viernes. |
| RF-020 | Simulado | Avisos dentro de la aplicación, sin correo. |
| RF-021 a RF-024 | Implementados | RF-022 en memoria del navegador; RF-024 lo marca la Mesa. |
| RF-025 | Pendiente | No hay rol de Administrador ni pantalla de catálogos. |
| RF-026 | Parcial | CSV implementado; el PDF se obtiene con la impresión del navegador. |

## Pendientes declarados

- Servidor, API REST, base de datos, autenticación real y envío de correo.
- Escalamiento automático (RF-014) y configuración de catálogos (RF-025).
- Matriz de prioridad definitiva (PP-01, SUP-06) y calendario laboral institucional.
- Pruebas con usuarios y auditoría formal de accesibilidad.
- Versión móvil revisada solo por anchura (sin pantallas móviles dedicadas como en Figma).
