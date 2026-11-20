// COMP-02 · Incidencias. Registra, genera el folio, clasifica, vincula duplicados, cambia estados,
// cierra y reabre (RF-003, RF-005, RF-006, RF-008 a RF-012, RF-015, RF-017 a RF-019).
import { categoria, espacioEnCatalogo } from './catalogos.js';
import { reglaActiva, URGENCIA_INICIAL, PRIORIDADES } from './reglaPrioridad.js';
import { generarFolio } from './folio.js';
import { EN_SEGUIMIENTO } from './estados.js';
import { puede } from './accesos.js';
import { horasHabilesEntre, sumarHorasHabiles } from './reloj.js';
import { ErrorValidacion, ErrorPermiso, exigir, obtener, sinTexto, revisar, emitir, cambiarEstado } from './nucleo.js';

export const MENSAJES = {
  Nuevo: 'Recibimos tu reporte. Mesa de servicio lo revisará.',
  'En revisión': 'Mesa de servicio está validando la ubicación y la categoría.',
  inicioAtencion: 'El técnico inició la revisión en el lugar.',
  espera: 'La reparación requiere una refacción. Te avisaremos cuando se reanude.',
  reanudar: 'Se reanudó la reparación con la refacción disponible.',
  Resuelto: 'La reparación terminó. Está pendiente la validación de Supervisión.',
  Reabierto: 'Aceptamos tu solicitud de reapertura. Mesa de servicio asignará de nuevo la atención.',
};

export const PLAZO_REAPERTURA_HORAS = 48;

// ---------- Registro (CU-01, FLU-01) ----------

/** Validación por paso del asistente de cuatro pasos (PAN-05 / PAN-07). */
export function validarPaso(paso, d) {
  const e = {};
  if (paso === 1) {
    if (sinTexto(d.edificio)) e.edificio = 'Selecciona el edificio.';
    if (sinTexto(d.nivel)) e.nivel = 'Selecciona el nivel.';
    if (sinTexto(d.espacio)) e.espacio = 'Indica el área o espacio para que el técnico encuentre el lugar.';
  }
  if (paso === 2) {
    if (sinTexto(d.titulo)) e.titulo = 'Escribe un título breve, por ejemplo «Fuga de agua en sanitarios».';
    if (sinTexto(d.categoriaSugerida)) e.categoriaSugerida = 'Selecciona la categoría que mejor describe la falla.';
    if (sinTexto(d.descripcion)) e.descripcion = 'Escribe una descripción de la incidencia.';
    else if (d.descripcion.trim().length < 15) e.descripcion = 'Agrega un poco más de detalle: qué ocurre y desde cuándo.';
  }
  if (paso === 4) {
    if (!d.confirmado) e.confirmado = 'Confirma que la ubicación y la descripción corresponden a lo que observaste.';
  }
  return e;
}

export function registrar(base, u, d, ahora) {
  exigir(u, 'reportar');
  const errores = { ...validarPaso(1, d), ...validarPaso(2, d), ...validarPaso(4, d) };
  revisar(errores);
  const cat = categoria(d.categoriaSugerida);
  if (!cat) throw new ErrorValidacion({ categoriaSugerida: 'La categoría no está en el catálogo.' });
  const impacto = cat.impacto;
  const urgencia = URGENCIA_INICIAL;
  const { prioridad, explicacion } = reglaActiva().calcular({ impacto, urgencia });
  const folio = generarFolio(ahora, Object.keys(base.incidencias));
  base.incidencias[folio] = {
    folio,
    titulo: d.titulo.trim(),
    descripcion: d.descripcion.trim(),
    impactoObservado: (d.impactoObservado || '').trim(),
    edificio: d.edificio,
    nivel: d.nivel,
    espacio: d.espacio.trim(),
    referencia: (d.referencia || '').trim(),
    ubicacionManual: !espacioEnCatalogo(d.edificio, d.espacio),
    categoriaSugerida: cat.nombre,
    categoria: cat.nombre,
    categoriaConfirmada: false,
    area: cat.area,
    impacto,
    urgencia,
    prioridad,
    explicacionPrioridad: explicacion,
    ajustePrioridad: null,
    critica: false,
    estado: 'Nuevo',
    reportante: u.id,
    tecnico: null,
    equipo: null,
    fecha: ahora,
    actualizada: ahora,
    principal: null,
    duplicados: [],
    fotos: d.foto ? [{ ...d.foto, momento: 'reporte', fecha: ahora }] : [],
    diagnostico: null,
    notas: [],
    espera: null,
    resolucion: null,
    validacion: null,
    cierre: null,
    solicitudReapertura: null,
    devoluciones: [],
    reasignaciones: [],
    historial: [{ estado: 'Nuevo', fecha: ahora, mensaje: MENSAJES.Nuevo, autor: 'sistema' }],
  };
  emitir(base, { tipo: 'registro', folio, usuario: u.id, fecha: ahora, detalle: `Prioridad calculada: ${explicacion}` });
  return folio;
}

// ---------- Mesa de servicio (CU-03, FLU-02) ----------

export function iniciarRevision(base, u, folio, ahora) {
  exigir(u, 'validar');
  const inc = obtener(base, folio);
  cambiarEstado(base, inc, 'En revisión', u, MENSAJES['En revisión'], ahora);
}

/**
 * Confirma categoría, impacto y urgencia; calcula la prioridad con la regla activa (Strategy) y
 * permite ajustarla con motivo obligatorio (RF-006, RF-010, RF-014, RN-002).
 */
export function clasificar(base, u, folio, d, ahora) {
  exigir(u, 'clasificar');
  const inc = obtener(base, folio);
  if (!['En revisión', 'Reabierto'].includes(inc.estado)) {
    throw new ErrorPermiso('Primero inicia la revisión del reporte.');
  }
  const cat = categoria(d.categoria);
  const e = {};
  if (!cat) e.categoria = 'Selecciona una categoría del catálogo.';
  const impacto = Number(d.impacto);
  const urgencia = Number(d.urgencia);
  if (![1, 2, 3].includes(impacto)) e.impacto = 'Selecciona el impacto.';
  if (![1, 2, 3].includes(urgencia)) e.urgencia = 'Selecciona la urgencia.';
  revisar(e);
  const calculo = reglaActiva().calcular({ impacto, urgencia });
  let prioridad = calculo.prioridad;
  let ajuste = null;
  if (d.prioridadAjustada && d.prioridadAjustada !== calculo.prioridad) {
    if (!PRIORIDADES.includes(d.prioridadAjustada)) throw new ErrorValidacion({ prioridadAjustada: 'Prioridad no válida.' });
    if (sinTexto(d.motivoAjuste)) throw new ErrorValidacion({ motivoAjuste: 'Escribe el motivo del ajuste de prioridad.' });
    prioridad = d.prioridadAjustada;
    ajuste = { de: calculo.prioridad, a: prioridad, motivo: d.motivoAjuste.trim(), autor: u.id, fecha: ahora };
  }
  Object.assign(inc, {
    categoria: cat.nombre,
    categoriaConfirmada: true,
    area: cat.area,
    impacto,
    urgencia,
    prioridad,
    explicacionPrioridad: calculo.explicacion,
    ajustePrioridad: ajuste,
    critica: Boolean(d.critica),
    ubicacionManual: d.ubicacionValidada ? false : inc.ubicacionManual,
    actualizada: ahora,
  });
  const detalle = `${cat.nombre} · ${calculo.explicacion}${ajuste ? ` · ajustada a ${prioridad}: ${ajuste.motivo}` : ''}${inc.critica ? ' · falla crítica' : ''}`;
  emitir(base, { tipo: 'clasificacion', folio, usuario: u.id, fecha: ahora, detalle });
}

/** Reportes en seguimiento con la misma ubicación y categoría (RF-008). */
export function posiblesDuplicados(base, inc) {
  const norm = (s) => String(s || '').trim().toLowerCase();
  return Object.values(base.incidencias)
    .filter(
      (o) =>
        o.folio !== inc.folio &&
        o.estado !== 'Duplicado' &&
        EN_SEGUIMIENTO.includes(o.estado) &&
        !inc.duplicados.includes(o.folio) &&
        inc.principal !== o.folio &&
        norm(o.edificio) === norm(inc.edificio) &&
        norm(o.nivel) === norm(inc.nivel) &&
        norm(o.espacio) === norm(inc.espacio) &&
        o.categoria === inc.categoria,
    )
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/**
 * Vincula `folioDuplicado` a `folioPrincipal`. El duplicado conserva folio, reportante, fecha y
 * evidencias, y recibe los avisos de la principal (RF-008, RF-009, RN-003).
 */
export function vincularDuplicado(base, u, folioDuplicado, folioPrincipal, motivo, ahora) {
  exigir(u, 'vincular_duplicado');
  const dup = obtener(base, folioDuplicado);
  const principal = obtener(base, folioPrincipal);
  if (dup.folio === principal.folio) throw new ErrorValidacion({ principal: 'Un reporte no puede ser duplicado de sí mismo.' });
  if (!['Nuevo', 'En revisión'].includes(dup.estado)) throw new ErrorPermiso('Solo se vinculan reportes que siguen en validación.');
  if (!EN_SEGUIMIENTO.includes(principal.estado) || principal.estado === 'Duplicado') {
    throw new ErrorPermiso('La incidencia principal ya no está en seguimiento.');
  }
  if (sinTexto(motivo)) throw new ErrorValidacion({ motivo: 'Escribe el motivo de la vinculación.' });
  if (dup.estado === 'Nuevo') cambiarEstado(base, dup, 'En revisión', u, MENSAJES['En revisión'], ahora);
  dup.principal = principal.folio;
  principal.duplicados.push(dup.folio);
  cambiarEstado(
    base,
    dup,
    'Duplicado',
    u,
    `Tu reporte se vinculó a ${principal.folio}, que atiende la misma falla. Recibirás sus avisos.`,
    ahora,
    motivo.trim(),
  );
  emitir(base, { tipo: 'vinculo', folio: principal.folio, usuario: u.id, fecha: ahora, detalle: `${dup.folio} → ${principal.folio}: ${motivo.trim()}` });
}

export function aceptarReapertura(base, u, folio, ahora) {
  exigir(u, 'aceptar_reapertura');
  const inc = obtener(base, folio);
  if (inc.solicitudReapertura?.estado !== 'Pendiente') throw new ErrorPermiso('No hay una solicitud de reapertura pendiente.');
  inc.solicitudReapertura.estado = 'Aceptada';
  inc.tecnicoAnterior = inc.tecnico;
  cambiarEstado(base, inc, 'Reabierto', u, MENSAJES.Reabierto, ahora, inc.solicitudReapertura.motivo);
}

// ---------- Técnico (CU-05, CU-06, FLU-03) ----------

function exigirAsignado(u, inc) {
  if (inc.tecnico !== u.id) throw new ErrorPermiso('Solo el técnico asignado puede atender esta incidencia.');
}

/** Registra diagnóstico y tiempo estimado (RF-011). Si estaba Asignado, pasa a En progreso. */
export function diagnosticar(base, u, folio, d, ahora) {
  exigir(u, 'diagnosticar');
  const inc = obtener(base, folio);
  exigirAsignado(u, inc);
  const e = {};
  if (sinTexto(d.diagnostico)) e.diagnostico = 'Escribe el diagnóstico.';
  if (sinTexto(d.acciones)) e.acciones = 'Describe las acciones realizadas.';
  if (sinTexto(d.tiempoEstimado)) e.tiempoEstimado = 'Indica el tiempo estimado de solución.';
  revisar(e);
  inc.diagnostico = { diagnostico: d.diagnostico.trim(), acciones: d.acciones.trim(), tiempoEstimado: d.tiempoEstimado.trim(), autor: u.id, fecha: ahora };
  if (inc.estado === 'Asignado') {
    cambiarEstado(base, inc, 'En progreso', u, MENSAJES.inicioAtencion, ahora);
  } else if (['En progreso', 'En espera de refacción'].includes(inc.estado)) {
    inc.actualizada = ahora;
    emitir(base, { tipo: 'diagnostico', folio, usuario: u.id, fecha: ahora, detalle: inc.diagnostico.diagnostico });
  } else {
    throw new ErrorPermiso(`No se registra diagnóstico en estado ${inc.estado}.`);
  }
}

/**
 * RN-010: después del diagnóstico, el técnico asignado puede corregir la categoría si el origen de la
 * falla es distinto al reportado. La prioridad confirmada por la Mesa no cambia.
 */
export function corregirCategoria(base, u, folio, nombreCategoria, motivo, ahora) {
  exigir(u, 'recategorizar');
  const inc = obtener(base, folio);
  exigirAsignado(u, inc);
  if (!inc.diagnostico || !['En progreso', 'En espera de refacción'].includes(inc.estado)) {
    throw new ErrorPermiso('La categoría se corrige después de registrar el diagnóstico.');
  }
  const cat = categoria(nombreCategoria);
  const e = {};
  if (!cat) e.categoriaNueva = 'Selecciona una categoría del catálogo.';
  else if (cat.nombre === inc.categoria) e.categoriaNueva = 'Selecciona una categoría distinta a la actual.';
  if (sinTexto(motivo)) e.motivoCategoria = 'Explica qué reveló el diagnóstico.';
  revisar(e);
  const anterior = inc.categoria;
  Object.assign(inc, { categoria: cat.nombre, area: cat.area, actualizada: ahora });
  emitir(base, { tipo: 'recategorizacion', folio, usuario: u.id, fecha: ahora, detalle: `${anterior} → ${cat.nombre}: ${motivo.trim()}` });
}

/** Pausa por falta de refacción con justificación obligatoria (RF-012). */
export function ponerEnEspera(base, u, folio, justificacion, ahora) {
  exigir(u, 'poner_en_espera');
  const inc = obtener(base, folio);
  exigirAsignado(u, inc);
  if (sinTexto(justificacion)) throw new ErrorValidacion({ justificacion: 'Escribe qué refacción falta y por qué se detiene la atención.' });
  inc.espera = { justificacion: justificacion.trim(), autor: u.id, fecha: ahora };
  cambiarEstado(base, inc, 'En espera de refacción', u, MENSAJES.espera, ahora, justificacion.trim());
}

export function reanudar(base, u, folio, ahora) {
  exigir(u, 'reanudar');
  const inc = obtener(base, folio);
  exigirAsignado(u, inc);
  cambiarEstado(base, inc, 'En progreso', u, MENSAJES.reanudar, ahora);
}

/** Resolución con evidencia: foto o motivo obligatorio (RF-015, RN-005). */
export function resolver(base, u, folio, d, ahora) {
  exigir(u, 'resolver');
  const inc = obtener(base, folio);
  exigirAsignado(u, inc);
  const e = {};
  if (sinTexto(d.trabajo)) e.trabajo = 'Describe el trabajo realizado.';
  if (sinTexto(d.mensaje)) e.mensaje = 'Escribe el mensaje para el reportante.';
  if (!d.foto && sinTexto(d.motivoSinFoto)) e.evidencia = 'Adjunta una foto de evidencia o escribe el motivo por el que no puedes adjuntarla.';
  revisar(e);
  if (d.foto) inc.fotos.push({ ...d.foto, momento: 'cierre', fecha: ahora });
  inc.resolucion = {
    trabajo: d.trabajo.trim(),
    mensaje: d.mensaje.trim(),
    foto: d.foto ? d.foto.nombre : null,
    motivoSinFoto: d.foto ? '' : d.motivoSinFoto.trim(),
    autor: u.id,
    fecha: ahora,
  };
  cambiarEstado(base, inc, 'Resuelto', u, MENSAJES.Resuelto, ahora);
}

// ---------- Notas internas (RN-007) ----------

export function agregarNota(base, u, folio, texto, ahora) {
  exigir(u, 'nota_interna');
  const inc = obtener(base, folio);
  if (sinTexto(texto)) throw new ErrorValidacion({ nota: 'Escribe la nota antes de guardarla.' });
  inc.notas.push({ texto: texto.trim(), autor: u.id, fecha: ahora });
  emitir(base, { tipo: 'nota', folio, usuario: u.id, fecha: ahora, detalle: '' });
}

// ---------- Reportante: reapertura (RF-017, RN-004, RN-009) ----------

export function plazoReapertura(inc, ahora) {
  if (inc.estado !== 'Cerrado' || !inc.cierre) return { aplica: false };
  const usadas = horasHabilesEntre(inc.cierre, ahora);
  return {
    aplica: true,
    disponible: usadas < PLAZO_REAPERTURA_HORAS,
    vence: sumarHorasHabiles(inc.cierre, PLAZO_REAPERTURA_HORAS).toISOString(),
    horasRestantes: Math.max(0, PLAZO_REAPERTURA_HORAS - usadas),
  };
}

export function solicitarReapertura(base, u, folio, motivo, ahora) {
  exigir(u, 'solicitar_reapertura');
  const inc = obtener(base, folio);
  if (inc.reportante !== u.id) throw new ErrorPermiso('Solo quien reportó la incidencia puede pedir su reapertura.');
  const plazo = plazoReapertura(inc, ahora);
  if (!plazo.aplica) throw new ErrorPermiso('Solo se puede pedir la reapertura de una incidencia cerrada.');
  if (!plazo.disponible) {
    throw new ErrorValidacion({ plazo: 'El plazo de 48 horas hábiles terminó. Reporta la falla de nuevo para generar otro folio.' });
  }
  if (inc.solicitudReapertura?.estado === 'Pendiente') throw new ErrorPermiso('Ya hay una solicitud pendiente.');
  if (sinTexto(motivo)) throw new ErrorValidacion({ motivo: 'Describe por qué la falla persiste.' });
  inc.solicitudReapertura = { motivo: motivo.trim(), fecha: ahora, autor: u.id, estado: 'Pendiente' };
  emitir(base, { tipo: 'reapertura_solicitada', folio, usuario: u.id, fecha: ahora, detalle: motivo.trim() });
}

// ---------- Consulta (RF-018, RF-019, RN-007) ----------

/** Copia de la incidencia sin información interna para quien no es personal operativo (RN-007). */
export function vistaPara(u, inc) {
  if (puede(u, 'ver_internos')) return inc;
  return {
    ...inc,
    notas: [],
    diagnostico: null,
    espera: inc.espera ? { fecha: inc.espera.fecha } : null,
    devoluciones: [],
    reasignaciones: [],
    ajustePrioridad: null,
  };
}

export function propias(base, u) {
  return Object.values(base.incidencias).filter((i) => i.reportante === u.id);
}
