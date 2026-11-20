// Datos ficticios iniciales. Folios, personas, ubicaciones, categorías, prioridades, estados, horas y
// textos salen del prototipo de Figma de la Práctica 2. Donde Figma no mostraba un dato (por ejemplo,
// el título de 0045 o las horas intermedias de los folios ya resueltos) se usó el mínimo necesario.
import { fecha } from '../dominio/reloj.js';
import { categoria } from '../dominio/catalogos.js';
import { reglaActiva } from '../dominio/reglaPrioridad.js';
import { MENSAJES } from '../dominio/incidencias.js';
import { usuario, ROLES } from '../dominio/accesos.js';

const h = (estado, f, mensaje, autor) => ({ estado, fecha: fecha(f), mensaje, autor });

function incidencia(d) {
  const cat = categoria(d.categoria);
  const { prioridad, explicacion } = reglaActiva().calcular({ impacto: d.impacto, urgencia: d.urgencia });
  const ultima = d.historial[d.historial.length - 1];
  return {
    titulo: '',
    descripcion: '',
    impactoObservado: '',
    nivel: '',
    referencia: '',
    ubicacionManual: false,
    categoriaSugerida: d.categoria,
    categoriaConfirmada: d.historial.some((x) => x.estado === 'Asignado'),
    area: cat.area,
    prioridad,
    explicacionPrioridad: explicacion,
    ajustePrioridad: null,
    critica: false,
    tecnico: null,
    equipo: null,
    principal: null,
    duplicados: [],
    fotos: [],
    diagnostico: null,
    notas: [],
    espera: null,
    resolucion: null,
    validacion: null,
    cierre: null,
    solicitudReapertura: null,
    devoluciones: [],
    reasignaciones: [],
    ...d,
    fecha: d.historial[0].fecha,
    actualizada: ultima.fecha,
    estado: ultima.estado,
  };
}

const nuevo = (f) => h('Nuevo', f, MENSAJES.Nuevo, 'sistema');
const revision = (f) => h('En revisión', f, MENSAJES['En revisión'], 'ana');

export function incidenciasIniciales() {
  const lista = [
    incidencia({
      folio: 'CF-20261023-0042',
      titulo: 'Fuga de agua en sanitarios',
      descripcion: 'Sale agua de la conexión debajo del lavabo del fondo. El piso está mojado desde las 09:00 y hay riesgo de resbalón al entrar a los sanitarios.',
      impactoObservado: 'Agua acumulada en el piso; riesgo de resbalón.',
      edificio: 'Edificio B',
      nivel: 'Planta baja',
      espacio: 'Sanitarios',
      referencia: 'Junto al acceso del patio. Lavabo del fondo.',
      ubicacionManual: true,
      categoria: 'Plomería',
      impacto: 3,
      urgencia: 2,
      reportante: 'lucia',
      fotos: [{ nombre: 'fuga_sanitarios.jpg', tipo: 'image/jpeg', tamanoKB: 2458, momento: 'reporte', fecha: fecha('2026-10-23 09:14'), miniatura: null }],
      historial: [nuevo('2026-10-23 09:14')],
    }),
    incidencia({
      folio: 'CF-20261023-0045',
      titulo: 'Falla eléctrica en el Aula 102',
      descripcion: 'Los contactos del aula no tienen corriente desde el inicio de la clase.',
      edificio: 'Edificio C',
      espacio: 'Aula 102',
      categoria: 'Electricidad',
      impacto: 3,
      urgencia: 2,
      reportante: 'diego',
      historial: [nuevo('2026-10-23 09:28')],
    }),
    incidencia({
      folio: 'CF-20261023-0046',
      titulo: 'Losetas sueltas en el acceso',
      descripcion: 'Hay losetas sueltas en el acceso del patio central; alguien puede tropezar.',
      edificio: 'Patio central',
      espacio: 'Acceso',
      categoria: 'Albañilería',
      impacto: 2,
      urgencia: 2,
      reportante: 'diego',
      historial: [nuevo('2026-10-23 09:32')],
    }),
    incidencia({
      folio: 'CF-20261023-0048',
      titulo: 'Agua en el piso de los sanitarios',
      descripcion: 'Hay agua saliendo de un lavabo en los sanitarios de planta baja.',
      edificio: 'Edificio B',
      nivel: 'Planta baja',
      espacio: 'Sanitarios',
      categoria: 'Plomería',
      impacto: 3,
      urgencia: 2,
      reportante: 'diego',
      historial: [nuevo('2026-10-23 09:36')],
    }),
    incidencia({
      folio: 'CF-20261022-0034',
      titulo: 'Fuga en sanitarios del Edificio A',
      descripcion: 'El depósito de un inodoro no deja de llenarse y escurre agua.',
      edificio: 'Edificio A',
      nivel: 'Planta baja',
      espacio: 'Sanitarios',
      categoria: 'Plomería',
      impacto: 3,
      urgencia: 1,
      reportante: 'diego',
      tecnico: 'javier',
      historial: [
        nuevo('2026-10-22 13:40'),
        revision('2026-10-22 13:55'),
        h('Asignado', '2026-10-22 14:05', 'Javier Torres atenderá la incidencia de plomería.', 'ana'),
      ],
    }),
    incidencia({
      folio: 'CF-20261023-0041',
      titulo: 'Goteo en el área de lavado',
      descripcion: 'Una llave del área de lavado de la cafetería gotea de forma continua.',
      edificio: 'Cafetería',
      espacio: 'Área de lavado',
      categoria: 'Plomería',
      impacto: 1,
      urgencia: 2,
      reportante: 'diego',
      tecnico: 'javier',
      historial: [
        nuevo('2026-10-23 08:50'),
        revision('2026-10-23 09:00'),
        h('Asignado', '2026-10-23 09:05', 'Javier Torres atenderá la incidencia de plomería.', 'ana'),
      ],
    }),
    incidencia({
      folio: 'CF-20261022-0036',
      titulo: 'Lámparas apagadas en el piso 1',
      descripcion: 'Una fila de lámparas del piso 1 de la biblioteca no enciende.',
      edificio: 'Biblioteca',
      nivel: 'Piso 1',
      categoria: 'Electricidad',
      impacto: 3,
      urgencia: 1,
      reportante: 'lucia',
      equipo: 'Equipo de Electricidad',
      historial: [
        nuevo('2026-10-22 15:20'),
        revision('2026-10-22 15:40'),
        h('Asignado', '2026-10-22 16:05', 'El equipo de electricidad atenderá tu reporte.', 'ana'),
      ],
    }),
    incidencia({
      folio: 'CF-20261022-0038',
      titulo: 'Aire acondicionado sin enfriar',
      descripcion: 'El equipo de aire acondicionado del laboratorio enciende, pero no enfría.',
      edificio: 'Edificio D',
      espacio: 'Laboratorio 2',
      categoria: 'Climatización',
      impacto: 2,
      urgencia: 2,
      reportante: 'diego',
      equipo: 'Equipo de Climatización',
      resolucion: { trabajo: 'Se limpiaron los filtros y se revisó la carga del equipo.', mensaje: 'El aire acondicionado enfría de nuevo. Supervisión verificará el trabajo.', foto: null, motivoSinFoto: 'Registro del equipo de Climatización sin foto adjunta.', autor: null, fecha: fecha('2026-10-23 09:20') },
      historial: [
        nuevo('2026-10-22 16:10'),
        revision('2026-10-22 16:25'),
        h('Asignado', '2026-10-22 16:40', 'El equipo de climatización atenderá tu reporte.', 'ana'),
        h('En progreso', '2026-10-23 08:00', MENSAJES.inicioAtencion, null),
        h('Resuelto', '2026-10-23 09:20', MENSAJES.Resuelto, null),
      ],
    }),
    incidencia({
      folio: 'CF-20261021-0030',
      titulo: 'La puerta del acceso no cierra',
      descripcion: 'La puerta de herrería del acceso no cierra por completo.',
      edificio: 'Edificio A',
      espacio: 'Acceso',
      categoria: 'Herrería',
      impacto: 1,
      urgencia: 2,
      reportante: 'diego',
      equipo: 'Equipo de Herrería',
      resolucion: { trabajo: 'Se ajustaron las bisagras y el cerrojo de la puerta.', mensaje: 'La puerta cierra de nuevo. Supervisión verificará el trabajo.', foto: null, motivoSinFoto: 'Registro del equipo de Herrería sin foto adjunta.', autor: null, fecha: fecha('2026-10-22 18:00') },
      historial: [
        nuevo('2026-10-21 12:30'),
        revision('2026-10-21 12:45'),
        h('Asignado', '2026-10-21 13:00', 'El equipo de herrería atenderá tu reporte.', 'ana'),
        h('En progreso', '2026-10-22 10:00', MENSAJES.inicioAtencion, null),
        h('Resuelto', '2026-10-22 18:00', MENSAJES.Resuelto, null),
      ],
    }),
    incidencia({
      folio: 'CF-20261021-0029',
      titulo: 'Silla rota en el Aula 204',
      descripcion: 'Una silla del aula tiene el respaldo roto.',
      edificio: 'Edificio A',
      espacio: 'Aula 204',
      categoria: 'Mobiliario',
      impacto: 1,
      urgencia: 1,
      reportante: 'lucia',
      equipo: 'Equipo de Servicios generales',
      resolucion: { trabajo: 'Se cambió el respaldo de la silla.', mensaje: 'La silla quedó reparada y regresó al aula.', foto: null, motivoSinFoto: 'Registro del equipo de Servicios generales sin foto adjunta.', autor: null, fecha: fecha('2026-10-22 12:00') },
      validacion: { resultado: 'Reparación correcta. Se autoriza el cierre.', autor: 'elena', fecha: fecha('2026-10-22 17:30') },
      cierre: fecha('2026-10-22 17:30'),
      historial: [
        nuevo('2026-10-21 11:05'),
        revision('2026-10-21 11:20'),
        h('Asignado', '2026-10-21 11:40', 'El equipo de servicios generales atenderá tu reporte.', 'ana'),
        h('En progreso', '2026-10-22 09:30', MENSAJES.inicioAtencion, null),
        h('Resuelto', '2026-10-22 12:00', MENSAJES.Resuelto, null),
        h('Cerrado', '2026-10-22 17:30', 'Elena Ruiz validó la reparación. La incidencia quedó cerrada.', 'elena'),
      ],
    }),
  ];
  return Object.fromEntries(lista.map((i) => [i.folio, i]));
}

/** Avisos que ya existían al iniciar la demo (pantalla «Mis incidencias» de Figma). */
function avisosIniciales() {
  return [
    {
      id: 1,
      para: 'lucia',
      folio: 'CF-20261022-0036',
      titulo: 'Se asignó un técnico a tu incidencia',
      texto: 'El equipo de electricidad atenderá tu reporte.',
      fecha: fecha('2026-10-22 16:05'),
      leido: false,
    },
  ];
}

/** Bitácora inicial reconstruida a partir del historial de los datos de ejemplo. */
function bitacoraInicial(incidencias) {
  const filas = [];
  for (const inc of Object.values(incidencias)) {
    inc.historial.forEach((x, k) => {
      filas.push({
        fecha: x.fecha,
        quien: usuario(x.autor) ? `${usuario(x.autor).nombre} (${ROLES[usuario(x.autor).rol]})` : x.autor ? x.autor : 'Sistema',
        folio: inc.folio,
        accion: k === 0 ? 'Registró la incidencia' : `Cambió el estado: ${inc.historial[k - 1].estado} → ${x.estado}`,
        detalle: 'Dato inicial de la demostración',
      });
    });
  }
  return filas.sort((a, b) => a.fecha.localeCompare(b.fecha)).map((f, k) => ({ n: k + 1, ...f }));
}

export function crearBaseInicial() {
  const incidencias = incidenciasIniciales();
  return { incidencias, avisos: avisosIniciales(), bitacora: bitacoraInicial(incidencias) };
}
