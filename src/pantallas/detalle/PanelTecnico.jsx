// FLU-03 · PAN-09 Diagnóstico, espera de refacción y cierre técnico (CU-05, CU-06; RF-011, RF-012,
// RF-015, RN-005). PAN-07: error si se intenta resolver sin foto ni motivo.
import { useState } from 'react';
import { useDatos, useAccion } from '../../estado/almacen.jsx';
import { diagnosticar, ponerEnEspera, reanudar, resolver } from '../../dominio/incidencias.js';
import { describirFoto } from '../../dominio/evidencias.js';
import { fechaCorta } from '../../dominio/reloj.js';
import { leerFoto } from '../../componentes/foto.js';
import { Aviso, Campo, Dato, Icono, aria } from '../../componentes/ui.jsx';
import { nombre, FotoVista } from './comunes.jsx';

function Diagnostico({ inc }) {
  const { correr, errores, error } = useAccion();
  const [d, setD] = useState({
    diagnostico: inc.diagnostico?.diagnostico || '',
    acciones: inc.diagnostico?.acciones || '',
    tiempoEstimado: inc.diagnostico?.tiempoEstimado || '',
  });
  const cambiar = (campo) => (e) => setD((x) => ({ ...x, [campo]: e.target.value }));
  const inicial = inc.estado === 'Asignado';
  return (
    <section className="tarjeta" aria-labelledby="t-diag">
      <h2 id="t-diag">Diagnóstico técnico</h2>
      {inicial && <p className="tenue">Al guardar el diagnóstico la incidencia pasa de Asignado a En progreso y se avisa al reportante.</p>}
      {error && Object.keys(errores).length > 1 && <Aviso tipo="error" titulo={error} />}
      <Campo id="t-dx" etiqueta="Diagnóstico" requerido error={errores.diagnostico}>
        <textarea {...aria('t-dx', errores.diagnostico)} rows={3} value={d.diagnostico} onChange={cambiar('diagnostico')} placeholder="Qué encontraste en el lugar" />
      </Campo>
      <Campo id="t-acc" etiqueta="Acciones realizadas" requerido error={errores.acciones}>
        <textarea {...aria('t-acc', errores.acciones)} rows={3} value={d.acciones} onChange={cambiar('acciones')} placeholder="Por ejemplo: se cerró la llave de paso y se delimitó el área" />
      </Campo>
      <Campo id="t-tiempo" etiqueta="Tiempo estimado de solución" requerido error={errores.tiempoEstimado}>
        <input {...aria('t-tiempo', errores.tiempoEstimado)} value={d.tiempoEstimado} onChange={cambiar('tiempoEstimado')} placeholder="Por ejemplo: 1 día hábil" />
      </Campo>
      {inc.diagnostico && (
        <p className="chico tenue">
          Registrado por {nombre(inc.diagnostico.autor)} · {fechaCorta(inc.diagnostico.fecha)}
        </p>
      )}
      <div className="acciones derecha">
        <button
          type="button"
          className={`btn ${inicial ? 'btn-primario' : 'btn-secundario'}`}
          onClick={() => correr(diagnosticar, [inc.folio, d], inicial ? 'Atención iniciada: la incidencia está En progreso. Se avisó al reportante.' : 'Diagnóstico actualizado.')}
        >
          {inicial ? 'Guardar diagnóstico e iniciar atención' : 'Actualizar diagnóstico'}
        </button>
      </div>
    </section>
  );
}

function Espera({ inc }) {
  const { correr, errores } = useAccion();
  const [texto, setTexto] = useState('');
  return (
    <section className="tarjeta" aria-labelledby="t-esp">
      <h2 id="t-esp">¿Falta una refacción?</h2>
      <Campo id="t-just" etiqueta="Justificación" requerido error={errores.justificacion} ayuda="El reportante solo verá que la reparación espera una refacción.">
        <input {...aria('t-just', errores.justificacion)} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Por ejemplo: se requiere sustituir la junta del sifón" />
      </Campo>
      <div className="acciones derecha">
        <button type="button" className="btn btn-secundario" onClick={() => correr(ponerEnEspera, [inc.folio, texto], 'La incidencia quedó En espera de refacción.')}>
          Poner en espera de refacción
        </button>
      </div>
    </section>
  );
}

function Resolucion({ inc }) {
  const { correr, errores, error } = useAccion();
  const [d, setD] = useState({ trabajo: '', mensaje: '', motivoSinFoto: '', foto: null });
  const [errorFoto, setErrorFoto] = useState('');
  const cambiar = (campo) => (e) => setD((x) => ({ ...x, [campo]: e.target.value }));
  const elegir = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    const r = await leerFoto(archivo);
    setErrorFoto(r.error || '');
    if (r.foto) setD((x) => ({ ...x, foto: r.foto }));
  };
  return (
    <section className="tarjeta" aria-labelledby="t-res">
      <h2 id="t-res">Registrar resolución</h2>
      {errores.evidencia && (
        <Aviso tipo="error" titulo="Error de validación · No se puede registrar">
          Debes adjuntar una foto de evidencia o escribir el motivo por el que no puedes adjuntarla. La incidencia permanece En progreso.
        </Aviso>
      )}
      {error && !errores.evidencia && Object.keys(errores).length > 1 && <Aviso tipo="error" titulo={error} />}
      <Campo id="t-trab" etiqueta="Trabajo realizado" requerido error={errores.trabajo}>
        <textarea {...aria('t-trab', errores.trabajo)} rows={3} value={d.trabajo} onChange={cambiar('trabajo')} placeholder="Qué se reparó y qué pruebas se hicieron" />
      </Campo>
      <Campo id="t-msg" etiqueta="Mensaje para el reportante" requerido error={errores.mensaje}>
        <input {...aria('t-msg', errores.mensaje)} value={d.mensaje} onChange={cambiar('mensaje')} placeholder="Por ejemplo: la fuga fue reparada y el piso está seco" />
      </Campo>
      <div className="campo">
        <span className="etiqueta">Fotografía de evidencia o motivo *</span>
        {errorFoto && <span className="msg-error">{errorFoto}</span>}
        {d.foto ? (
          <div className="archivo">
            <Icono nombre="foto" />
            <span style={{ flex: 1 }}>
              <b>{d.foto.nombre}</b>
              <br />
              {describirFoto(d.foto)}
            </span>
            <button type="button" className="btn btn-secundario btn-chico" onClick={() => setD((x) => ({ ...x, foto: null }))}>
              Quitar
            </button>
          </div>
        ) : (
          <div>
            <label className="btn btn-secundario" htmlFor="t-foto" style={{ display: 'inline-flex' }}>
              Adjuntar fotografía
            </label>
            <input id="t-foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegir} className="solo-lector" />
          </div>
        )}
      </div>
      {!d.foto && (
        <Campo id="t-motivo" etiqueta="Motivo de ausencia de fotografía" error={errores.evidencia ? 'Adjunta una foto de evidencia o escribe el motivo por el que no puedes adjuntarla.' : null}>
          <input {...aria('t-motivo', errores.evidencia)} value={d.motivoSinFoto} onChange={cambiar('motivoSinFoto')} placeholder="Escribe el motivo por el que no puedes adjuntar una foto" />
        </Campo>
      )}
      <div className="acciones derecha">
        <button type="button" className="btn btn-primario" onClick={() => correr(resolver, [inc.folio, d], 'Resolución registrada. Supervisión recibió el aviso para validarla; la incidencia todavía no está Cerrada.')}>
          Registrar resolución
        </button>
      </div>
    </section>
  );
}

export function ResumenResolucion({ inc }) {
  const r = inc.resolucion;
  if (!r) return null;
  const fotos = inc.fotos.filter((f) => f.momento === 'cierre');
  return (
    <>
      <Dato etiqueta="Trabajo realizado">{r.trabajo}</Dato>
      <Dato etiqueta="Mensaje al reportante">{r.mensaje}</Dato>
      {fotos.length ? fotos.map((f) => <FotoVista key={f.nombre + f.fecha} foto={f} />) : <Dato etiqueta="Motivo de ausencia de foto">{r.motivoSinFoto}</Dato>}
      <span className="chico tenue">
        {nombre(r.autor) || inc.equipo || 'Equipo técnico'} · {fechaCorta(r.fecha)}
      </span>
    </>
  );
}

export default function PanelTecnico({ inc }) {
  const { yo } = useDatos();
  const { correr, error } = useAccion();
  if (inc.tecnico !== yo.id) {
    return <Aviso tipo="info" titulo="Consulta">Esta incidencia no está asignada a ti; solo puedes consultarla.</Aviso>;
  }
  const devuelta = inc.estado === 'En progreso' ? inc.devoluciones.at(-1) : null;

  if (inc.estado === 'Asignado') return <Diagnostico inc={inc} />;
  if (inc.estado === 'En progreso') {
    return (
      <>
        {devuelta && (
          <Aviso tipo="alerta" titulo="Supervisión devolvió la incidencia a En progreso">
            {nombre(devuelta.autor)} · {fechaCorta(devuelta.fecha)}: «{devuelta.motivo}»
          </Aviso>
        )}
        <Resolucion inc={inc} />
        <Espera inc={inc} />
        <Diagnostico inc={inc} />
      </>
    );
  }
  if (inc.estado === 'En espera de refacción') {
    return (
      <section className="tarjeta" aria-labelledby="t-pausa">
        <h2 id="t-pausa">En espera de refacción</h2>
        <p>
          «{inc.espera?.justificacion}» · {fechaCorta(inc.espera?.fecha)}
        </p>
        {error && <Aviso tipo="error" titulo={error} />}
        <div className="acciones derecha">
          <button type="button" className="btn btn-primario" onClick={() => correr(reanudar, [inc.folio], 'Atención reanudada: la incidencia está En progreso.')}>
            Reanudar atención
          </button>
        </div>
      </section>
    );
  }
  if (inc.estado === 'Resuelto') {
    return (
      <section className="tarjeta" aria-labelledby="t-resu">
        <Aviso tipo="exito" titulo="Resuelto · Pendiente de validación del Supervisor">
          Supervisión revisará el resumen y la evidencia. Puede validar el cierre o devolver la incidencia para una corrección.
        </Aviso>
        <h2 id="t-resu">Resumen de la reparación</h2>
        <ResumenResolucion inc={inc} />
      </section>
    );
  }
  return <Aviso tipo="info" titulo={`Estado: ${inc.estado}`} />;
}
