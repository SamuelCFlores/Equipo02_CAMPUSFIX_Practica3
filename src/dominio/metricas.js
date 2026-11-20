// COMP-05 · Reportes y métricas. Calcula indicadores, recurrencias y fallas críticas y exporta a CSV
// (RF-023, RF-024, RF-026; CU-08). Los duplicados se excluyen para no contar dos veces la misma falla.
import { ESTADOS, EN_SEGUIMIENTO } from './estados.js';
import { PRIORIDADES } from './reglaPrioridad.js';
import { usuario } from './accesos.js';
import { ubicacion } from './catalogos.js';

export const MINIMO_RECURRENTE = 3;

function primera(inc, estado) {
  return inc.historial.find((h) => h.estado === estado)?.fecha || null;
}
function ultima(inc, estado) {
  return [...inc.historial].reverse().find((h) => h.estado === estado)?.fecha || null;
}

/** Días entre la primera asignación y la última resolución, o null si no aplica. */
export function diasResolucion(inc) {
  const a = primera(inc, 'Asignado');
  const r = ultima(inc, 'Resuelto');
  if (!a || !r) return null;
  return (new Date(r) - new Date(a)) / 86400000;
}

export function mediana(valores) {
  if (!valores.length) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

export function indicadores(incidencias) {
  const lista = incidencias.filter((i) => i.estado !== 'Duplicado');
  const total = lista.length;
  const seguimiento = lista.filter((i) => EN_SEGUIMIENTO.includes(i.estado));
  const cerradas = lista.filter((i) => i.estado === 'Cerrado');
  const tiempos = lista.map(diasResolucion).filter((d) => d !== null);

  const porEstado = ESTADOS.filter((e) => e !== 'Duplicado').map((estado) => ({ estado, total: lista.filter((i) => i.estado === estado).length }));
  const porPrioridad = PRIORIDADES.map((p) => {
    const n = lista.filter((i) => i.prioridad === p).length;
    return { prioridad: p, total: n, pct: pct(n, total) };
  });

  const edificios = new Map();
  for (const i of lista) {
    const fila = edificios.get(i.edificio) || { edificio: i.edificio, total: 0, seguimiento: 0, cerradas: 0 };
    fila.total += 1;
    if (i.estado === 'Cerrado') fila.cerradas += 1;
    else fila.seguimiento += 1;
    edificios.set(i.edificio, fila);
  }

  const grupos = new Map();
  for (const i of lista) {
    const clave = `${i.edificio}|${i.categoria}`;
    const g = grupos.get(clave) || { edificio: i.edificio, categoria: i.categoria, total: 0, ultimo: i.fecha };
    g.total += 1;
    if (i.fecha > g.ultimo) g.ultimo = i.fecha;
    grupos.set(clave, g);
  }
  const recurrentes = [...grupos.values()].filter((g) => g.total >= MINIMO_RECURRENTE).sort((a, b) => b.total - a.total);

  const criticas = lista.filter((i) => i.critica);
  const criticasPorEdificio = new Map();
  for (const i of criticas) criticasPorEdificio.set(i.edificio, (criticasPorEdificio.get(i.edificio) || 0) + 1);

  return {
    total,
    seguimiento: seguimiento.length,
    resueltasPorValidar: lista.filter((i) => i.estado === 'Resuelto').length,
    cerradas: cerradas.length,
    pctCerradas: pct(cerradas.length, total),
    medianaDias: mediana(tiempos),
    conTiempo: tiempos.length,
    porEstado,
    porPrioridad,
    porUbicacion: [...edificios.values()].sort((a, b) => b.total - a.total || a.edificio.localeCompare(b.edificio)),
    recurrentes,
    criticas: { total: criticas.length, pct: pct(criticas.length, total), porEdificio: [...criticasPorEdificio].map(([edificio, n]) => ({ edificio, total: n })) },
    duplicadosExcluidos: incidencias.length - total,
  };
}

const celda = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Tiempos de atención por incidencia en CSV (RF-026). Sin datos personales del reportante. */
export function aCSV(incidencias) {
  const encabezado = ['folio', 'fecha_reporte', 'ubicacion', 'categoria', 'area', 'prioridad', 'estado', 'atiende', 'fecha_asignacion', 'fecha_resolucion', 'dias_resolucion'];
  const filas = incidencias
    .filter((i) => i.estado !== 'Duplicado')
    .sort((a, b) => a.folio.localeCompare(b.folio))
    .map((i) => {
      const d = diasResolucion(i);
      return [
        i.folio,
        i.fecha,
        ubicacion(i),
        i.categoria,
        i.area,
        i.prioridad,
        i.estado,
        usuario(i.tecnico)?.nombre || i.equipo || '',
        primera(i, 'Asignado') || '',
        ultima(i, 'Resuelto') || '',
        d === null ? '' : d.toFixed(2),
      ];
    });
  return [encabezado, ...filas].map((f) => f.map(celda).join(',')).join('\n') + '\n';
}
