// Piezas compartidas por los componentes de dominio: errores, cambio de estado y eventos.
import { puedeTransicionar } from './estados.js';
import { puede, ROLES } from './accesos.js';
import { observadores } from './observadores.js';

/** Error de captura: `errores` asocia cada campo con su mensaje (PAN-07). */
export class ErrorValidacion extends Error {
  constructor(errores, mensaje) {
    const valores = Object.values(errores);
    super(mensaje || (valores.length === 1 ? valores[0] : 'Revisa los datos marcados para continuar.'));
    this.name = 'ErrorValidacion';
    this.errores = errores;
  }
}

/** El rol no tiene permiso para la acción o la transición (RF-002). */
export class ErrorPermiso extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorPermiso';
  }
}

export function exigir(usuario, accion) {
  if (!puede(usuario, accion)) throw new ErrorPermiso(`El rol ${ROLES[usuario?.rol] || 'actual'} no puede realizar esta acción.`);
}

export function obtener(base, folio) {
  const inc = base.incidencias[folio];
  if (!inc) throw new Error(`No existe el folio ${folio}.`);
  return inc;
}

export function sinTexto(valor) {
  return !String(valor ?? '').trim();
}

/** Lanza ErrorValidacion si hay errores. */
export function revisar(errores) {
  if (Object.keys(errores).length) throw new ErrorValidacion(errores);
}

export function emitir(base, evento) {
  for (const o of observadores) o.notificar(base, evento);
}

/** Aplica una transición de la Tabla 30, la agrega al historial y avisa a los observadores. */
export function cambiarEstado(base, inc, hacia, usuario, mensaje, ahora, detalle = '') {
  const desde = inc.estado;
  if (!puedeTransicionar(desde, hacia, usuario.rol)) {
    throw new ErrorPermiso(`${ROLES[usuario.rol]} no puede pasar una incidencia de ${desde} a ${hacia}.`);
  }
  inc.estado = hacia;
  inc.actualizada = ahora;
  inc.historial.push({ estado: hacia, fecha: ahora, mensaje, autor: usuario.id });
  emitir(base, { tipo: 'estado', folio: inc.folio, desde, hacia, usuario: usuario.id, fecha: ahora, mensaje, detalle });
}
