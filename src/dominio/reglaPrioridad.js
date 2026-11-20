// COMP-08 · Patrón Strategy para la prioridad (DAS, Tabla 32; RF-010, RN-002, CA-005).
// Incidencias depende de la interfaz ReglaPrioridad; la regla activa se elige en Catálogos (ADR-04).
import { NIVEL_IMPACTO, NIVEL_URGENCIA } from './catalogos.js';

export const PRIORIDADES = ['Alta', 'Media', 'Baja'];
export const PESO_PRIORIDAD = { Alta: 3, Media: 2, Baja: 1 };

export class ReglaPrioridad {
  get nombre() {
    return 'Regla sin nombre';
  }
  /** @returns {{prioridad: string, explicacion: string}} */
  calcular(_incidencia) {
    throw new Error('Cada regla debe implementar calcular()');
  }
}

/**
 * Primera implementación. PROVISIONAL: la matriz definitiva está pendiente de aprobación por la
 * Dirección (PP-01, SUP-06). Puntaje = impacto + urgencia (1 a 3 cada uno):
 * 5 o 6 → Alta, 4 → Media, 2 o 3 → Baja.
 */
export class MatrizImpactoUrgencia extends ReglaPrioridad {
  get nombre() {
    return 'Matriz impacto × urgencia (provisional)';
  }
  calcular({ impacto, urgencia }) {
    if (!NIVEL_IMPACTO[impacto] || !NIVEL_URGENCIA[urgencia]) {
      throw new Error('Impacto y urgencia deben estar entre 1 y 3');
    }
    const puntaje = impacto + urgencia;
    const prioridad = puntaje >= 5 ? 'Alta' : puntaje === 4 ? 'Media' : 'Baja';
    return {
      prioridad,
      puntaje,
      explicacion: `Impacto ${NIVEL_IMPACTO[impacto]} + urgencia ${NIVEL_URGENCIA[urgencia]} = ${puntaje} → ${prioridad}`,
    };
  }
}

let regla = new MatrizImpactoUrgencia();

export function reglaActiva() {
  return regla;
}

/** Permite cambiar la regla sin tocar Incidencias (lo haría Catálogos y configuración). */
export function usarRegla(nueva) {
  if (!(nueva instanceof ReglaPrioridad)) throw new Error('La regla debe extender ReglaPrioridad');
  regla = nueva;
}

export const URGENCIA_INICIAL = 2; // Media hasta que la Mesa la confirme al validar.
