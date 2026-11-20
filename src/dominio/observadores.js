// Patrón Observer (DAS, Tabla 33). Incidencias no conoce a Notificaciones ni a Bitácora: les avisa
// por la interfaz ObservadorEstado (IObservadorEstado en el DAS).
import { USUARIOS, usuario, ROLES } from './accesos.js';

export class ObservadorEstado {
  notificar(_base, _evento) {}
}

// COMP-04 · Notificaciones (RF-020). En el sistema real envía correo con reintentos; aquí deja el
// aviso en la bandeja de avisos de la persona.
export class Notificaciones extends ObservadorEstado {
  notificar(base, e) {
    const inc = base.incidencias[e.folio];
    const avisar = (para, titulo, texto) =>
      base.avisos.push({ id: base.avisos.length + 1, para, folio: e.folio, titulo, texto, fecha: e.fecha, leido: false });
    const rol = (r) => USUARIOS.filter((u) => u.rol === r).map((u) => u.id);

    if (e.tipo === 'registro') {
      avisar(inc.reportante, `Recibimos tu reporte ${e.folio}`, 'Conserva el folio para consultar el avance. Te avisaremos cada cambio de estado.');
      return;
    }
    if (e.tipo === 'reapertura_solicitada') {
      for (const id of rol('mesa')) avisar(id, `Solicitud de reapertura · ${e.folio}`, e.detalle);
      return;
    }
    if (e.tipo !== 'estado') return;

    // El reportante de la incidencia y los reportantes de sus duplicados (RN-003).
    avisar(inc.reportante, `Tu incidencia está ${e.hacia}`, e.mensaje);
    for (const f of inc.duplicados || []) {
      const dup = base.incidencias[f];
      if (dup && dup.reportante !== inc.reportante) {
        avisar(dup.reportante, `${e.folio} está ${e.hacia}`, `Seguimiento de tu reporte ${f}, vinculado a esta incidencia. ${e.mensaje}`);
      }
    }
    if (e.hacia === 'Asignado' && inc.tecnico) {
      avisar(inc.tecnico, `Se te asignó ${e.folio}`, `${inc.titulo}. Prioridad ${inc.prioridad}.`);
    }
    if (e.hacia === 'Resuelto') {
      for (const id of rol('supervisor')) avisar(id, `${e.folio} espera tu validación`, 'El técnico registró la resolución con su evidencia.');
    }
    if (e.hacia === 'En progreso' && e.desde === 'Resuelto' && inc.tecnico) {
      avisar(inc.tecnico, `${e.folio} regresó a En progreso`, e.detalle || 'Supervisión pidió completar la reparación.');
    }
  }
}

const ACCIONES = {
  registro: 'Registró la incidencia',
  clasificacion: 'Clasificó y calculó la prioridad',
  vinculo: 'Vinculó un duplicado',
  nota: 'Agregó una nota interna',
  diagnostico: 'Actualizó el diagnóstico',
  recategorizacion: 'Corrigió la categoría (RN-010)',
  reapertura_solicitada: 'Solicitó la reapertura',
};

// COMP-06 · Bitácora de auditoría (RF-022). Solo agrega registros; no hay función para editarlos ni
// borrarlos.
export class Bitacora extends ObservadorEstado {
  notificar(base, e) {
    const u = usuario(e.usuario);
    const quien = u ? `${u.nombre} (${ROLES[u.rol]})` : 'Sistema';
    const accion = e.tipo === 'estado' ? `Cambió el estado: ${e.desde} → ${e.hacia}` : ACCIONES[e.tipo] || e.tipo;
    base.bitacora.push({ n: base.bitacora.length + 1, fecha: e.fecha, quien, folio: e.folio, accion, detalle: e.detalle || '' });
  }
}

export const observadores = [new Notificaciones(), new Bitacora()];
