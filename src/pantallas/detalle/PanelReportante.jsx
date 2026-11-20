// FLU-01 (seguimiento) · PAN-04 vista del Reportante: estado, reparación y reapertura dentro de
// 48 horas hábiles (CU-02; RF-017, RF-018, RN-004, RN-009).
import { useState } from 'react';
import { useDatos, useAccion } from '../../estado/almacen.jsx';
import { plazoReapertura, solicitarReapertura } from '../../dominio/incidencias.js';
import { fechaCorta, fechaLarga } from '../../dominio/reloj.js';
import { Aviso, Campo, Dato, aria } from '../../componentes/ui.jsx';
import { FotoVista } from './comunes.jsx';

function Reapertura({ inc }) {
  const { ahora } = useDatos();
  const { correr, errores, error } = useAccion();
  const [motivo, setMotivo] = useState('');
  const plazo = plazoReapertura(inc, ahora.toISOString());
  if (!plazo.aplica) return null;
  const s = inc.solicitudReapertura;
  if (s?.estado === 'Pendiente') {
    return (
      <Aviso tipo="info" titulo="Solicitud de reapertura enviada">
        La enviaste el {fechaCorta(s.fecha)}. Mesa de servicio la revisará; la incidencia no se reabre de forma automática.
      </Aviso>
    );
  }
  return (
    <section className="tarjeta" aria-labelledby="t-reab">
      <h2 id="t-reab">{plazo.disponible ? 'Reapertura disponible' : 'Reapertura vencida'}</h2>
      <div className="datos-rejilla">
        <Dato etiqueta="Cierre registrado">{fechaLarga(inc.cierre)}</Dato>
        <Dato etiqueta="Plazo institucional">48 horas hábiles · vence {fechaLarga(plazo.vence)}</Dato>
      </div>
      {plazo.disponible ? (
        <>
          <p className="tenue">
            Si la falla persiste puedes pedir la reapertura. Se envía como solicitud a Mesa de servicio; no reabre la incidencia de forma
            automática.
          </p>
          <Campo id="r-mot" etiqueta="¿Qué sigue fallando?" requerido error={errores.motivo || errores.plazo}>
            <textarea {...aria('r-mot', errores.motivo)} rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </Campo>
          {error && !errores.motivo && !errores.plazo && <Aviso tipo="error" titulo={error} />}
          <div className="acciones derecha">
            <button type="button" className="btn btn-primario" onClick={() => correr(solicitarReapertura, [inc.folio, motivo], 'Solicitud de reapertura enviada a Mesa de servicio.')}>
              Solicitar reapertura
            </button>
          </div>
        </>
      ) : (
        <Aviso tipo="alerta" titulo="El plazo de solicitud de reapertura ha terminado">
          Si la falla volvió a presentarse, reporta una nueva incidencia para generar otro folio (RN-004).
        </Aviso>
      )}
    </section>
  );
}

export default function PanelReportante({ inc }) {
  const { base, yo } = useDatos();
  const propio = inc.reportante === yo.id;
  if (!propio) {
    return (
      <Aviso tipo="info" titulo="Consulta por folio">
        Puedes ver el estado y el avance de cualquier folio (RF-018). Solo quien lo reportó recibe los avisos y puede pedir la reapertura.
      </Aviso>
    );
  }
  const ultimo = inc.historial.at(-1);
  const avisos = base.avisos.filter((a) => a.para === yo.id && a.folio === inc.folio);
  const fotosCierre = inc.fotos.filter((f) => f.momento === 'cierre');
  return (
    <>
      {!['Cerrado', 'Duplicado'].includes(inc.estado) && (
        <Aviso tipo="info" titulo={`Estado: ${inc.estado}`}>
          {ultimo.mensaje}
        </Aviso>
      )}
      <Reapertura inc={inc} />
      {inc.resolucion && ['Resuelto', 'Cerrado'].includes(inc.estado) && (
        <section className="tarjeta" aria-labelledby="t-rep">
          <h2 id="t-rep">Reparación completada</h2>
          <p>{inc.resolucion.mensaje}</p>
          {fotosCierre.map((f) => (
            <FotoVista key={f.nombre + f.fecha} foto={f} />
          ))}
          {inc.estado === 'Resuelto' && <p className="chico tenue">Supervisión verificará el trabajo antes de cerrar la incidencia.</p>}
        </section>
      )}
      <section className="tarjeta" aria-labelledby="t-segui">
        <h2 id="t-segui">Notificaciones de seguimiento</h2>
        <p>Los cambios de estado se envían a {yo.correo} y aparecen en tus avisos de CAMPUSFIX.</p>
        {avisos.length > 0 && (
          <Dato etiqueta="Último aviso">
            {fechaLarga(avisos.at(-1).fecha)} · {avisos.at(-1).titulo}
          </Dato>
        )}
      </section>
    </>
  );
}
