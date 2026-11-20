// COMP-02 · Catálogo de estados y transiciones (DAS, Tabla 30).
// Interpretación: la Mesa abre la revisión de un reporte Nuevo; desde En revisión asigna o lo marca
// Duplicado; el Técnico mueve Asignado → En progreso ↔ En espera de refacción → Resuelto; el
// Supervisor cierra o devuelve y es el único que reasigna (RN-008); la reapertura la solicita el
// Reportante y la acepta la Mesa (RN-004, RN-009).

export const ESTADOS = [
  'Nuevo',
  'En revisión',
  'Asignado',
  'En progreso',
  'En espera de refacción',
  'Resuelto',
  'Cerrado',
  'Reabierto',
  'Duplicado',
];

export const TRANSICIONES = {
  Nuevo: { 'En revisión': ['mesa'] },
  'En revisión': { Asignado: ['mesa'], Duplicado: ['mesa'] },
  Asignado: { 'En progreso': ['tecnico'], Asignado: ['supervisor'] },
  'En progreso': { 'En espera de refacción': ['tecnico'], Resuelto: ['tecnico'] },
  'En espera de refacción': { 'En progreso': ['tecnico'] },
  Resuelto: { Cerrado: ['supervisor'], 'En progreso': ['supervisor'] },
  Cerrado: { Reabierto: ['mesa'] },
  Reabierto: { Asignado: ['mesa'] },
  Duplicado: {},
};

export function puedeTransicionar(desde, hacia, rol) {
  return (TRANSICIONES[desde]?.[hacia] || []).includes(rol);
}

/** Estados en los que la incidencia sigue en seguimiento (no cerrada ni duplicada). */
export const EN_SEGUIMIENTO = ['Nuevo', 'En revisión', 'Asignado', 'En progreso', 'En espera de refacción', 'Resuelto', 'Reabierto'];

/** Clase CSS del chip de cada estado. */
export const TONO_ESTADO = {
  Nuevo: 'nuevo',
  'En revisión': 'revision',
  Asignado: 'asignado',
  'En progreso': 'progreso',
  'En espera de refacción': 'espera',
  Resuelto: 'resuelto',
  Cerrado: 'cerrado',
  Reabierto: 'reabierto',
  Duplicado: 'duplicado',
};
