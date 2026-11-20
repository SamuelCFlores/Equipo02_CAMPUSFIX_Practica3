// Reloj simulado de la demostración y utilidades de fecha.
// La demo arranca el 23 oct 2026 a las 09:38 (hora de la bandeja de la Mesa en el prototipo
// de Figma de la Práctica 2) y avanza al ritmo del tiempo real desde que se inicia.

export const INICIO_DEMO = new Date(2026, 9, 23, 9, 38, 0);

export function ahoraSimulado(inicioReal, ahoraReal = Date.now()) {
  return new Date(INICIO_DEMO.getTime() + Math.max(0, ahoraReal - inicioReal));
}

/** Convierte "2026-10-23 09:14" (hora local) a ISO. */
export function fecha(texto) {
  const [d, h = '00:00'] = texto.split(' ');
  const [a, m, dia] = d.split('-').map(Number);
  const [hh, mm] = h.split(':').map(Number);
  return new Date(a, m - 1, dia, hh, mm, 0).toISOString();
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dos = (n) => String(n).padStart(2, '0');

export function hora(iso) {
  const d = new Date(iso);
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** "23 oct · 09:14" */
export function fechaCorta(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} · ${hora(iso)}`;
}

/** "23 oct 2026 · 09:14" */
export function fechaLarga(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()} · ${hora(iso)}`;
}

/**
 * Horas hábiles entre dos fechas. Calendario laboral provisional: lunes a viernes, todo el día
 * (el calendario institucional definitivo vive en Catálogos y configuración, COMP-08).
 */
export function horasHabilesEntre(desde, hasta) {
  const fin = new Date(hasta);
  let cursor = new Date(desde);
  if (fin <= cursor) return 0;
  let ms = 0;
  while (cursor < fin) {
    const manana = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    const tramo = manana < fin ? manana : fin;
    const dia = cursor.getDay();
    if (dia !== 0 && dia !== 6) ms += tramo - cursor;
    cursor = tramo;
  }
  return ms / 3600000;
}

/** Fecha en la que se cumplen `horas` hábiles a partir de `desde`. */
export function sumarHorasHabiles(desde, horas) {
  let restante = horas * 3600000;
  let cursor = new Date(desde);
  while (restante > 0) {
    const manana = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    const dia = cursor.getDay();
    if (dia !== 0 && dia !== 6) {
      const disponible = manana - cursor;
      if (disponible >= restante) return new Date(cursor.getTime() + restante);
      restante -= disponible;
    }
    cursor = manana;
  }
  return cursor;
}
