// FLU-03 · PAN-10 Validar cierre o reasignar (CU-06, CU-07; RF-013, RF-016, RN-008).
import { useState } from 'react';
import { useAccion, useDatos } from '../../estado/almacen.jsx';
import { ir } from '../../estado/rutas.js';
import { tecnicosPara, validarCierre, devolver, reasignar, CRITERIOS_CIERRE } from '../../dominio/asignacion.js';
import { fechaCorta } from '../../dominio/reloj.js';
import { Aviso, Campo, Dato, aria } from '../../componentes/ui.jsx';
import { nombre } from './comunes.jsx';
import { ResumenResolucion } from './PanelTecnico.jsx';

function Validar({ inc }) {
  const { avisar } = useDatos();
  const { correr, errores, error } = useAccion();
  const dev = useAccion();
  const [criterios, setCriterios] = useState(CRITERIOS_CIERRE.map(() => false));
  const [resultado, setResultado] = useState('');
  const [motivo, setMotivo] = useState('');

  const cerrar = () => {
    if (correr(validarCierre, [inc.folio, { criterios, resultado }])) {
      avisar(`${inc.folio} quedó Cerrado. Se avisó al reportante${inc.duplicados.length ? ' y a los reportantes de sus duplicados' : ''}.`, { conservar: true });
      ir('inicio');
    }
  };

  return (
    <>
      <section className="tarjeta" aria-labelledby="t-sup">
        <h2 id="t-sup">Validación del Supervisor</h2>
        <Aviso tipo="info" titulo="Resuelto no significa Cerrado">
          Solo cambiará a Cerrado cuando confirmes que la reparación cumple los criterios.
        </Aviso>
        <ResumenResolucion inc={inc} />
        {inc.diagnostico && <Dato etiqueta="Diagnóstico del técnico">{inc.diagnostico.diagnostico}</Dato>}
        <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <legend style={{ fontWeight: 600, marginBottom: 8 }}>Criterios de cierre *</legend>
          {CRITERIOS_CIERRE.map((c, k) => (
            <label key={c} className="casilla">
              <input
                type="checkbox"
                checked={criterios[k]}
                onChange={(e) => setCriterios((x) => x.map((v, j) => (j === k ? e.target.checked : v)))}
              />
              {c}
            </label>
          ))}
          {errores.criterios && <span className="msg-error">{errores.criterios}</span>}
        </fieldset>
        <Campo id="s-res" etiqueta="Resultado de la revisión" requerido error={errores.resultado}>
          <textarea {...aria('s-res', errores.resultado)} rows={3} value={resultado} onChange={(e) => setResultado(e.target.value)} placeholder="Por ejemplo: reparación correcta, sin fuga y con área segura para uso" />
        </Campo>
        {error && Object.keys(errores).length === 0 && <Aviso tipo="error" titulo={error} />}
        <p className="chico tenue">Al validar se registran tu nombre y la fecha de cierre, y se avisa al reportante.</p>
        <div className="acciones derecha">
          <button type="button" className="btn btn-primario" onClick={cerrar}>
            Validar y cerrar incidencia
          </button>
        </div>
      </section>
      <section className="tarjeta" aria-labelledby="t-dev">
        <h2 id="t-dev">¿No cumple? Devolver a En progreso</h2>
        <Campo id="s-dev" etiqueta="Qué falta para aprobar el cierre" requerido error={dev.errores.motivoDevolucion}>
          <input {...aria('s-dev', dev.errores.motivoDevolucion)} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por ejemplo: falta la prueba de funcionamiento" />
        </Campo>
        <div className="acciones derecha">
          <button type="button" className="btn btn-peligro" onClick={() => dev.correr(devolver, [inc.folio, motivo], 'La incidencia regresó a En progreso y se avisó al técnico.')}>
            Devolver a En progreso
          </button>
        </div>
      </section>
    </>
  );
}

function Reasignar({ inc }) {
  const { correr, errores } = useAccion();
  const opciones = tecnicosPara(inc.categoria).filter((t) => t.id !== inc.tecnico);
  const [tecnico, setTecnico] = useState(opciones[0]?.id || '');
  const [motivo, setMotivo] = useState('');
  return (
    <section className="tarjeta" aria-labelledby="t-reas">
      <h2 id="t-reas">Reasignar técnico</h2>
      <p className="tenue">
        Solo Supervisión puede reasignar (RN-008). Técnico actual: <b>{nombre(inc.tecnico) || inc.equipo || 'sin asignar'}</b>.
      </p>
      {opciones.length === 0 ? (
        <Aviso tipo="alerta" titulo="Sin otro técnico disponible">
          No hay otro técnico de {inc.categoria} registrado en la demostración.
        </Aviso>
      ) : (
        <>
          <Campo id="s-tec" etiqueta="Nuevo técnico" requerido error={errores.tecnico}>
            <select {...aria('s-tec', errores.tecnico)} value={tecnico} onChange={(e) => setTecnico(e.target.value)}>
              {opciones.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} · {t.disponibilidad}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="s-mot" etiqueta="Motivo de reasignación" requerido error={errores.motivo}>
            <textarea {...aria('s-mot', errores.motivo)} rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describe el motivo de la reasignación" />
          </Campo>
          <p className="chico tenue">Al confirmar se registran responsable, fecha, técnico anterior, nuevo técnico y motivo.</p>
          <div className="acciones derecha">
            <button type="button" className="btn btn-secundario" onClick={() => correr(reasignar, [inc.folio, tecnico, motivo], 'Técnico reasignado. Se avisó al reportante y al nuevo técnico.')}>
              Reasignar técnico
            </button>
          </div>
        </>
      )}
      {inc.reasignaciones.map((r, k) => (
        <p key={k} className="chico tenue">
          {fechaCorta(r.fecha)} · {nombre(r.autor)} reasignó de {nombre(r.de) || 'sin técnico'} a {nombre(r.a)}: {r.motivo}
        </p>
      ))}
    </section>
  );
}

export default function PanelSupervisor({ inc }) {
  if (inc.estado === 'Resuelto') return <Validar inc={inc} />;
  if (inc.estado === 'Asignado') return <Reasignar inc={inc} />;
  return (
    <Aviso tipo="info" titulo="Sin acciones de Supervisión en este estado">
      Validas cierres cuando la incidencia está Resuelta y reasignas cuando está Asignada (Tabla 30).
    </Aviso>
  );
}
