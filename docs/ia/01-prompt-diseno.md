# Prompt 1 · Estética propia en Claude Design

- **Herramienta:** Claude Design (lienzo de diseño de claude.ai), modelo Claude Opus 5.5.
- **Fecha:** 19 de noviembre de 2026.
- **Objetivo:** definir una identidad visual propia para CAMPUSFIX y las cinco pantallas que después se programarán, antes de escribir código.
- **Insumos que se le dieron:** guía de estilo 9.4, estados 9.5, pantallas 9.7 y recorridos 10.3 del DAS/SDD v1.0; requisitos del SRS v1.0; datos ficticios tomados del prototipo de Figma de la Práctica 2.

## Texto del prompt

> Diseña la identidad visual y cinco pantallas de escritorio (1440 × 900) de **CAMPUSFIX**, el sistema web de la Universidad Metropolitana del Centro (UMC, institución ficticia) para reportar fallas de infraestructura y darles seguimiento. Quiero una estética **propia y sobria**, que no parezca una plantilla genérica de panel de control, pero que respete sin excepciones la guía de estilo de nuestro DAS:
>
> - Azul marino para el encabezado y los botones principales; fondo gris claro.
> - Colores fijos por estado, siempre acompañados de su nombre: gris **Nuevo**, azul **Asignado**, naranja **En progreso**, morado **En espera de refacción**, verde **Resuelto** y **Cerrado**, rojo solo para errores.
> - Una sola familia sans serif: 16 px el texto normal, de 20 a 28 px los títulos, nunca menos de 14 px.
> - Un botón principal relleno por pantalla y los secundarios con borde; verbos claros («Enviar reporte», «Asignar», «Cerrar incidencia»).
> - Etiqueta visible arriba de cada campo, ejemplo dentro del campo y mensaje de error debajo, en rojo y con texto.
> - Tablas con columnas fijas: folio, ubicación, categoría, prioridad, estado y fecha; filtros arriba; orden por prioridad.
> - Mensajes de éxito (verde), error (rojo) y aviso (amarillo) con icono y texto; al registrar, el folio se muestra en grande.
> - Terminología del glosario del SRS: incidencia, folio, reportante, técnico, prioridad, en espera de refacción. Nunca «ticket» ni «caso».
> - Contraste de al menos 4.5:1 y objetivos táctiles de 44 px (WCAG 2.1 AA).
>
> Estructura común (DAS 9.3): encabezado con CAMPUSFIX, buscador por folio, nombre y rol del usuario y botón para salir; menú lateral con las opciones del rol; contenido con título y ruta de navegación; zona fija de mensajes.
>
> Pantallas:
> 1. **Acceso institucional** (PAN-01): inicio de sesión con la cuenta del directorio de la universidad.
> 2. **Listado según el rol** (PAN-02 y PAN-03): «Mis incidencias» del reportante, bandeja de la mesa de servicio, tablero del técnico ordenado por prioridad y cola de validaciones del supervisor, con indicadores arriba y filtros por estado y prioridad.
> 3. **Reportar incidencia en cuatro pasos** (PAN-05, PAN-07 y PAN-06): ubicación, detalle, fotografía y revisar y enviar, con la barra de avance, los errores de captura y la confirmación con el folio en grande.
> 4. **Detalle de la incidencia** (PAN-04, PAN-08, PAN-09 y PAN-10): datos, cronología y las acciones del rol: clasificar, vincular duplicado y asignar (mesa); diagnóstico, espera de refacción y resolución con evidencia (técnico); validar el cierre o devolverlo a En progreso (supervisor).
> 5. **Panorama de infraestructura** (PAN-11): indicadores de la dirección administrativa por estado, prioridad y ubicación, incidencias recurrentes y fallas críticas.
>
> Usa solo estos datos ficticios (del prototipo de Figma): reportante Lucía Méndez (lucia.mendez@umc.edu.mx), mesa de servicio Ana Salas, técnicos Javier Torres y María López (plomería), supervisora Elena Ruiz, dirección Daniel Ortega; folios CF-20261023-0042 (Edificio B · Planta baja · Sanitarios, Plomería, Alta, «Fuga de agua en sanitarios»), CF-20261023-0045 (Edificio C · Aula 102, Electricidad, Alta), CF-20261023-0046 (Patio central · Acceso, Albañilería, Media), CF-20261023-0048 (posible duplicado de la 0042), CF-20261022-0034 (Edificio A · Sanitarios, Plomería, Media), CF-20261023-0041 (Cafetería · Área de lavado, Plomería, Baja), CF-20261022-0038 (Edificio D · Laboratorio 2, Climatización, Media) y CF-20261021-0030 (Edificio A · Acceso, Herrería, Baja). No inventes funciones fuera de lo solicitado.
