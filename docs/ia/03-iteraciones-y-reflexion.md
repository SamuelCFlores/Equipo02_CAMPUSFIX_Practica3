# Iteraciones, correcciones y reflexión crítica

Registro de lo que se generó con IA, lo que se revisó y lo que se corrigió. Cada iteración remite a su commit en el repositorio `Equipo02_CAMPUSFIX_Practica3`.

## Ficha 1. Estética y pantallas base (Claude Design)

| Campo | Registro |
|---|---|
| Herramienta | Claude Design (lienzo de diseño de Claude), modelo Claude Opus 5.5, 19 nov 2026 |
| Prompt | [`01-prompt-diseno.md`](01-prompt-diseno.md) |
| Iteración | 1 (única) |
| Resultado | Lienzo con cinco tableros de 1440 px: acceso, bandeja de la Mesa, reportar (paso 1), detalle con acciones de la Mesa e indicadores. Capturas D1 a D5. |
| Revisión | Se comparó cada tablero con las Tablas 36 a 39 del DAS y con las pantallas de Figma (P2): mismos folios, personas, horas y textos. No se encontraron funciones fuera del SRS. |
| Corrección | El tablero de indicadores necesitó más alto (1080 → 1360 px) para que cupieran las cuatro secciones. |

## Ficha 2. Prototipo funcional (Claude Code)

| Campo | Registro |
|---|---|
| Herramienta | Claude Code (terminal), modelo Claude Opus 5.5, 19 nov 2026 |
| Prompt | [`02-prompt-implementacion.md`](02-prompt-implementacion.md) |
| Iteración | 1: construcción por funcionalidad (commits 1 a 9) |
| Resultado | Aplicación React + Vite con 5 pantallas, rutas por rol, FLU-01 a FLU-03 completos, 15 pruebas de dominio. Capturas P01 a P12. |

### Iteración 1. Lo que corrigieron las pruebas automáticas (commit «Reglas de dominio…»)

| Hallazgo | Corrección |
|---|---|
| El script `npm test` apuntaba a la carpeta `pruebas/` y Node no la aceptaba como módulo. | Se cambió a `node --test "pruebas/*.test.js"`. |
| Cuando una validación tenía un solo campo con error, el mensaje general era genérico («Revisa los datos marcados»), así que la prueba de «Sin técnico disponible» no veía el motivo. | `ErrorValidacion` usa el mensaje del campo cuando solo hay uno. |
| La bitácora inicial mostraba identificadores internos (`ana`) en lugar del nombre de la persona. | Se resuelve el nombre y el rol al construir la bitácora. |

### Iteración 2. Revisión contra el SRS (commit «Revisión contra el SRS: corrección de categoría por el técnico (RN-010)»)

Se recorrió la lista RF-001 a RF-026 y RN-001 a RN-010 contra el código. RN-010 no estaba cubierta: solo la Mesa podía cambiar la categoría, y la regla dice que también el Técnico después del diagnóstico. Se agregó `corregirCategoria` con motivo obligatorio, su registro en bitácora y una prueba. Los requisitos que siguen sin implementarse se declaran en `docs/trazabilidad.md` (por ejemplo, RF-014 por tiempo vencido y RF-025).

### Iteración 3. Comparación con el prototipo de Figma (commit «Ajustes tras comparar con el prototipo de Figma»)

| Antes | Después |
|---|---|
| [`i1-antes`](../capturas/i1-antes-paso-4-sin-foto-en-la-revision.png): el paso 4 solo mostraba el nombre del archivo. | [`i1-despues`](../capturas/i1-despues-paso-4-con-foto-adjunta.png): tarjeta «Fotografía adjunta» con miniatura, como la pantalla 06 de Figma. |
| El botón «Reiniciar demostración» ocupaba dos líneas en el menú. | Se acortó a «Reiniciar demo». |

## Decisiones tomadas con criterio propio y no por la IA

| Tema | Decisión |
|---|---|
| Columna «Quién la ejecuta» de la Tabla 30 | Es ambigua (en unas filas dice quién lleva al estado y en otras quién sale de él). Se interpretó y se dejó escrito en `src/dominio/estados.js`. |
| Consecutivo del folio | En Figma no se reinicia por día (0029 el 21 oct, 0034 el 22 oct, 0042 el 23 oct), así que se toma el mayor existente más uno. |
| Regla de prioridad | Provisional (impacto + urgencia) porque la matriz no está aprobada (PP-01, SUP-06); se muestra como provisional en pantalla. |
| Hora de 0036 | En Figma su asignación aparece a las 09:50 del 23 oct, después de la hora de inicio de la demo (09:38); se movió al 22 oct a las 16:05 para que la historia sea coherente. |
| Datos faltantes | Títulos y descripciones de 0045, 0046, 0034, 0041, 0038, 0030, 0036 y 0029 se redactaron mínimos a partir de su ubicación y categoría. |

## Reflexión crítica

La IA aceleró sobre todo lo repetitivo: maquetar cinco pantallas con la misma guía de estilo, escribir formularios con sus mensajes de error y armar las pruebas de cada regla. Lo que no resolvió sola fue lo que depende del caso: las ambigüedades de la Tabla 30, la diferencia de nombres entre Figma («En espera») y el DAS («En espera de refacción»), la falta de una matriz de prioridad aprobada y los datos que Figma no mostraba. En esos puntos el resultado plausible de la IA no basta; hubo que decidir, dejar la decisión escrita y marcar lo provisional.

También quedó claro que el prototipo puede parecer más terminado de lo que está. No hay servidor, autenticación real, envío de correo ni base de datos; las fotos se guardan como miniatura en el navegador y el reloj es simulado. Por eso el prototipo se presenta como un piloto parcial de la fase de Elaboración, no como el sistema.

Las pruebas automáticas cubren las reglas de dominio, no la interfaz. La interfaz se revisó recorriendo los tres flujos con un script en Chrome sin ventana y con revisión visual de las capturas; no se hicieron pruebas con usuarios ni una auditoría formal de accesibilidad. Se revisaron foco visible, etiquetas, mensajes de error asociados a cada campo y que la prioridad no dependa solo del color.

No se cargaron datos personales reales: todas las personas, correos y folios son ficticios y vienen del prototipo de la Práctica 2.
