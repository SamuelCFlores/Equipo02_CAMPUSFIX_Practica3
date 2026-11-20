// COMP-03 · Asignación y atención. Asigna y reasigna técnicos, arma el tablero del técnico y
// registra la validación del cierre (RF-007, RF-013, RF-016, RF-021).
import { USUARIOS, usuario } from './accesos.js';
import { PESO_PRIORIDAD } from './reglaPrioridad.js';
import { ErrorValidacion, ErrorPermiso, exigir, obtener, sinTexto, revisar, cambiarEstado } from './nucleo.js';

export const ACTIVOS_TECNICO = ['Asignado', 'En progreso', 'En espera de refacción'];

/** Técnicos que atienden la categoría. Si no hay, PAN-08 muestra «Sin técnico disponible». */
export function tecnicosPara(nombreCategoria) {
  return USUARIOS.filter((u) => u.rol === 'tecnico' && u.especialidad === nombreCategoria);
}

export function carga(base, idTecnico) {
  const suyas = Object.values(base.incidencias).filter((i) => i.tecnico === idTecnico && ACTIVOS_TECNICO.includes(i.estado));
  return { activas: suyas.length, altas: suyas.filter((i) => i.prioridad === 'Alta').length };
}

/** Mayor prioridad primero; a igual prioridad, la más antigua (RF-021). */
export function ordenarPorPrioridad(lista) {
  return [...lista].sort((a, b) => PESO_PRIORIDAD[b.prioridad] - PESO_PRIORIDAD[a.prioridad] || a.fecha.localeCompare(b.fecha));
}

export function tablero(base, idTecnico) {
  return ordenarPorPrioridad(Object.values(base.incidencias).filter((i) => i.tecnico === idTecnico && ACTIVOS_TECNICO.includes(i.estado)));
}

/** Primera asignación por la Mesa, desde En revisión o Reabierto (RF-007). */
export function asignar(base, u, folio, idTecnico, ahora) {
  exigir(u, 'asignar');
  const inc = obtener(base, folio);
  if (!inc.categoriaConfirmada) throw new ErrorValidacion({ tecnico: 'Confirma la categoría y la prioridad antes de asignar.' });
  const opciones = tecnicosPara(inc.categoria);
  if (!opciones.length) throw new ErrorValidacion({ tecnico: `No hay técnicos disponibles para ${inc.categoria}.` });
  const t = opciones.find((x) => x.id === idTecnico);
  if (!t) throw new ErrorValidacion({ tecnico: `Selecciona un técnico del área que atiende ${inc.categoria}.` });
  inc.tecnico = t.id;
  inc.equipo = null;
  cambiarEstado(base, inc, 'Asignado', u, `${t.nombre} atenderá la incidencia de ${inc.categoria.toLowerCase()}.`, ahora);
}

/** Reasignación solo por Supervisor, con motivo obligatorio (RF-013, RN-008). */
export function reasignar(base, u, folio, idTecnico, motivo, ahora) {
  exigir(u, 'reasignar');
  const inc = obtener(base, folio);
  const e = {};
  const t = tecnicosPara(inc.categoria).find((x) => x.id === idTecnico);
  if (!t) e.tecnico = 'Selecciona el nuevo técnico.';
  else if (t.id === inc.tecnico) e.tecnico = 'Selecciona un técnico distinto al actual.';
  if (sinTexto(motivo)) e.motivo = 'Motivo obligatorio.';
  revisar(e);
  const anterior = inc.tecnico;
  inc.reasignaciones.push({ de: anterior, a: t.id, motivo: motivo.trim(), autor: u.id, fecha: ahora });
  inc.tecnico = t.id;
  cambiarEstado(base, inc, 'Asignado', u, `La incidencia se reasignó a ${t.nombre}.`, ahora, `De ${usuario(anterior)?.nombre || 'sin técnico'} a ${t.nombre}: ${motivo.trim()}`);
}

export const CRITERIOS_CIERRE = [
  'Resumen y diagnóstico revisados',
  'Foto de evidencia o motivo documentado revisado',
  'Funcionamiento y seguridad confirmados',
];

/** Validación del cierre por el Supervisor (RF-016). */
export function validarCierre(base, u, folio, d, ahora) {
  exigir(u, 'validar_cierre');
  const inc = obtener(base, folio);
  const e = {};
  if (!(d.criterios || []).every(Boolean) || (d.criterios || []).length !== CRITERIOS_CIERRE.length) {
    e.criterios = 'Marca los tres criterios antes de cerrar.';
  }
  if (sinTexto(d.resultado)) e.resultado = 'Escribe el resultado de la revisión.';
  revisar(e);
  if (inc.estado !== 'Resuelto') throw new ErrorPermiso('Solo se validan incidencias en estado Resuelto.');
  inc.validacion = { resultado: d.resultado.trim(), autor: u.id, fecha: ahora };
  inc.cierre = ahora;
  cambiarEstado(base, inc, 'Cerrado', u, `${u.nombre} validó la reparación. La incidencia quedó cerrada.`, ahora, d.resultado.trim());
}

/** Rechazo del cierre: regresa a En progreso con motivo (Tabla 30). */
export function devolver(base, u, folio, motivo, ahora) {
  exigir(u, 'devolver');
  const inc = obtener(base, folio);
  if (sinTexto(motivo)) throw new ErrorValidacion({ motivoDevolucion: 'Explica qué falta para aprobar el cierre.' });
  inc.devoluciones.push({ motivo: motivo.trim(), autor: u.id, fecha: ahora });
  cambiarEstado(base, inc, 'En progreso', u, 'Supervisión revisó la reparación y pidió completarla antes de cerrar.', ahora, motivo.trim());
}
