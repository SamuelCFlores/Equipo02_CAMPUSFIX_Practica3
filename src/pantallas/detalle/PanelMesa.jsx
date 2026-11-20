// FLU-02 · PAN-08 Clasificar, vincular duplicado y asignar (CU-03, CU-04; RF-006 a RF-010).
// Estados de la pantalla: normal, duplicado detectado y sin técnico disponible.
import { useState } from 'react';
import { useDatos, useAccion } from '../../estado/almacen.jsx';
import { ir } from '../../estado/rutas.js';
import { CATEGORIAS, NIVEL_IMPACTO, NIVEL_URGENCIA, categoria as buscarCategoria, ubicacion } from '../../dominio/catalogos.js';
import { reglaActiva, PRIORIDADES } from '../../dominio/reglaPrioridad.js';
import { iniciarRevision, clasificar, posiblesDuplicados, vincularDuplicado, aceptarReapertura } from '../../dominio/incidencias.js';
import { tecnicosPara, carga, asignar } from '../../dominio/asignacion.js';
import { fechaCorta } from '../../dominio/reloj.js';
import { Aviso, Campo, Prioridad, aria } from '../../componentes/ui.jsx';
import { nombre } from './comunes.jsx';

function MensajeError({ texto }) {
  return texto ? <Aviso tipo="error" titulo={texto} /> : null;
}

function IniciarRevision({ inc }) {
  const { base } = useDatos();
  const { correr, error } = useAccion();
  const dups = posiblesDuplicados(base, inc);
  return (
    <section className="tarjeta" aria-labelledby="t-val">
      <h2 id="t-val">Validación del reporte</h2>
      <p>
        El reporte está en estado <b>Nuevo</b>. Al iniciar la revisión pasa a <b>En revisión</b>: valida la ubicación, confirma la
        categoría, revisa posibles duplicados y después asigna.
      </p>
      {inc.ubicacionManual && <Aviso tipo="alerta">La ubicación se capturó a mano y debe validarse.</Aviso>}
      {dups.length > 0 && (
        <Aviso tipo="alerta" titulo="Posible duplicado detectado">
          {dups.map((d) => d.folio).join(', ')} comparte ubicación y categoría con este folio.
        </Aviso>
      )}
      <MensajeError texto={error} />
      <div className="acciones derecha">
        <button type="button" className="btn btn-primario" onClick={() => correr(iniciarRevision, [inc.folio], 'Revisión iniciada. El reportante recibió un aviso.')}>
          Iniciar revisión
        </button>
      </div>
    </section>
  );
}

function Clasificar({ inc }) {
  const { correr, errores, error } = useAccion();
  const [d, setD] = useState({
    categoria: inc.categoria,
    impacto: inc.impacto,
    urgencia: inc.urgencia,
    prioridadAjustada: inc.ajustePrioridad?.a || '',
    motivoAjuste: inc.ajustePrioridad?.motivo || '',
    critica: inc.critica,
    ubicacionValidada: !inc.ubicacionManual,
  });
  const cambiar = (campo, numero = false) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : numero ? Number(e.target.value) : e.target.value;
    setD((x) => ({ ...x, [campo]: v, ...(campo === 'categoria' ? { impacto: buscarCategoria(v)?.impacto || x.impacto } : {}) }));
  };
  const calculo = reglaActiva().calcular({ impacto: d.impacto, urgencia: d.urgencia });
  const ajustada = d.prioridadAjustada && d.prioridadAjustada !== calculo.prioridad;

  return (
    <section className="tarjeta" aria-labelledby="t-clas">
      <div className="fila" style={{ justifyContent: 'space-between' }}>
        <h2 id="t-clas">Clasificación y prioridad</h2>
        {inc.categoriaConfirmada && <span className="chip resuelto">Guardada</span>}
      </div>
      <div className="rejilla-campos">
        <Campo id="m-cat" etiqueta="Categoría confirmada" requerido error={errores.categoria}>
          <select {...aria('m-cat', errores.categoria)} value={d.categoria} onChange={cambiar('categoria')}>
            {CATEGORIAS.map((c) => (
              <option key={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </Campo>
        <div className="campo">
          <span className="etiqueta">Área responsable</span>
          <span style={{ minHeight: 46, display: 'flex', alignItems: 'center', padding: '0 14px', background: 'var(--superficie-2)', border: '1px solid var(--borde)', borderRadius: 8 }}>
            {buscarCategoria(d.categoria)?.area}
          </span>
        </div>
        <Campo id="m-imp" etiqueta="Impacto" requerido error={errores.impacto} ayuda="Sugerido por la categoría; ajústalo según lo observado.">
          <select {...aria('m-imp', errores.impacto)} value={d.impacto} onChange={cambiar('impacto', true)}>
            {[3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {NIVEL_IMPACTO[n]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="m-urg" etiqueta="Urgencia" requerido error={errores.urgencia}>
          <select {...aria('m-urg', errores.urgencia)} value={d.urgencia} onChange={cambiar('urgencia', true)}>
            {[3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {NIVEL_URGENCIA[n]}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <div style={{ border: '1px solid #C9D4E2', background: '#F7FAFD', borderRadius: 10, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="dato">
          <span>Prioridad calculada</span>
          <span style={{ fontSize: 20 }}>
            <Prioridad valor={calculo.prioridad} />
          </span>
        </div>
        <span className="chico tenue" style={{ maxWidth: 420 }}>
          {calculo.explicacion}. {reglaActiva().nombre}: pendiente de aprobación por la Dirección (PP-01).
        </span>
      </div>
      <div className="rejilla-campos">
        <Campo id="m-aj" etiqueta="Ajustar prioridad (opcional)">
          <select id="m-aj" value={d.prioridadAjustada} onChange={cambiar('prioridadAjustada')}>
            <option value="">Usar la calculada</option>
            {PRIORIDADES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Campo>
        {ajustada && (
          <Campo id="m-mot" etiqueta="Motivo del ajuste" requerido error={errores.motivoAjuste}>
            <input {...aria('m-mot', errores.motivoAjuste)} value={d.motivoAjuste} onChange={cambiar('motivoAjuste')} placeholder="Por ejemplo: riesgo de resbalón en área de paso" />
          </Campo>
        )}
      </div>
      <label className="casilla">
        <input type="checkbox" checked={d.critica} onChange={cambiar('critica')} />
        Falla crítica: afecta un espacio completo (indicador especial, RF-024).
      </label>
      {inc.ubicacionManual && (
        <label className="casilla">
          <input type="checkbox" checked={d.ubicacionValidada} onChange={cambiar('ubicacionValidada')} />
          Validé la ubicación capturada a mano: {ubicacion(inc)}.
        </label>
      )}
      <MensajeError texto={error} />
      <div className="acciones derecha">
        <button type="button" className="btn btn-secundario" onClick={() => correr(clasificar, [inc.folio, d], `Clasificación guardada: prioridad ${ajustada ? d.prioridadAjustada : calculo.prioridad}.`)}>
          Guardar clasificación
        </button>
      </div>
    </section>
  );
}

function Duplicados({ inc }) {
  const { base } = useDatos();
  const { correr, errores, error } = useAccion();
  const [motivo, setMotivo] = useState('');
  const lista = posiblesDuplicados(base, inc);
  if (!lista.length) return null;
  return (
    <section className="tarjeta" aria-labelledby="t-dup">
      <h2 id="t-dup">Revisar posible duplicado</h2>
      <Aviso tipo="alerta">
        Mismo lugar ({ubicacion(inc)}) y misma categoría. El duplicado conserva su folio, reportante, fecha y evidencias, queda en estado
        Duplicado y recibe los avisos de la principal.
      </Aviso>
      {lista.map((o) => {
        const esteEsDuplicado = o.fecha < inc.fecha;
        const [dup, principal] = esteEsDuplicado ? [inc, o] : [o, inc];
        return (
          <div key={o.folio} className="opcion" style={{ cursor: 'default', alignItems: 'flex-start', flexDirection: 'column', gap: 8 }}>
            <span>
              <a className="mono" href={`#/incidencia/${o.folio}`}>
                {o.folio}
              </a>{' '}
              · {nombre(o.reportante)} · {fechaCorta(o.fecha)} · <i>{o.estado}</i>
            </span>
            <span className="chico">«{o.descripcion}»</span>
            <span className="chico tenue">
              Propuesta: <span className="mono">{dup.folio}</span> como duplicado de <span className="mono">{principal.folio}</span> (el reporte más
              antiguo queda como principal).
            </span>
          </div>
        );
      })}
      <Campo id="m-motdup" etiqueta="Motivo de vinculación" requerido error={errores.motivo}>
        <input {...aria('m-motdup', errores.motivo)} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Misma ubicación, misma fuga y evidencia coincidente" />
      </Campo>
      <MensajeError texto={error && !errores.motivo ? error : null} />
      <div className="acciones derecha">
        {lista.map((o) => {
          const esteEsDuplicado = o.fecha < inc.fecha;
          const [dup, principal] = esteEsDuplicado ? [inc.folio, o.folio] : [o.folio, inc.folio];
          return (
            <button
              key={o.folio}
              type="button"
              className="btn btn-secundario"
              onClick={() => {
                if (correr(vincularDuplicado, [dup, principal, motivo], `${dup} quedó vinculado como duplicado de ${principal}. Se avisó a ambos reportantes.`) && esteEsDuplicado) {
                  ir(`incidencia/${principal}`);
                }
              }}
            >
              Vincular {dup.slice(-4)} como duplicado de {principal.slice(-4)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Asignar({ inc }) {
  const { base, avisar } = useDatos();
  const { correr, errores, error } = useAccion();
  const opciones = tecnicosPara(inc.categoria);
  const [elegido, setElegido] = useState('');
  const seleccion = elegido || opciones[0]?.id || '';

  if (!opciones.length) {
    return (
      <section className="tarjeta" aria-labelledby="t-asig">
        <h2 id="t-asig">Selecciona un técnico</h2>
        <Aviso tipo="alerta" titulo="Sin técnico disponible">
          No hay técnicos de {inc.categoria} registrados en la demostración. La incidencia permanece En revisión; avisa a Supervisión para
          conseguir personal del área {inc.area}.
        </Aviso>
      </section>
    );
  }

  const asignarYVolver = () => {
    const t = opciones.find((x) => x.id === seleccion);
    const reportantes = [inc.reportante, ...inc.duplicados.map((f) => base.incidencias[f]?.reportante)].filter(Boolean);
    if (correr(asignar, [inc.folio, seleccion])) {
      avisar(`${inc.folio} se asignó a ${t.nombre}. Se avisó a ${[...new Set(reportantes)].map(nombre).join(' y ')}.`, { conservar: true });
      ir('inicio');
    }
  };

  return (
    <section className="tarjeta" aria-labelledby="t-asig">
      <h2 id="t-asig">Selecciona un técnico</h2>
      <p className="tenue">Solo se muestran técnicos del área que atiende {inc.categoria}.</p>
      <div role="radiogroup" aria-labelledby="t-asig" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opciones.map((t) => {
          const c = carga(base, t.id);
          return (
            <label key={t.id} className={`opcion ${seleccion === t.id ? 'elegida' : ''}`}>
              <input type="radio" name="tecnico" value={t.id} checked={seleccion === t.id} onChange={() => setElegido(t.id)} />
              <span className="texto">
                <b>{t.nombre}</b>
                <span className="chico tenue">
                  {t.especialidad} · {t.disponibilidad}
                </span>
              </span>
              <span className="chico tenue">
                {c.activas} activas · {c.altas} altas
              </span>
            </label>
          );
        })}
      </div>
      {!inc.categoriaConfirmada && <Aviso tipo="info">Guarda la clasificación antes de asignar.</Aviso>}
      <MensajeError texto={error && !errores.tecnico ? error : errores.tecnico} />
      <p className="chico tenue">Al asignar, el estado cambia a Asignado y se avisa al reportante y al técnico.</p>
      <div className="acciones derecha">
        <button type="button" className="btn btn-primario" disabled={!inc.categoriaConfirmada} onClick={asignarYVolver}>
          Asignar incidencia
        </button>
      </div>
    </section>
  );
}

function AceptarReapertura({ inc }) {
  const { correr, error } = useAccion();
  const s = inc.solicitudReapertura;
  return (
    <section className="tarjeta" aria-labelledby="t-reap">
      <h2 id="t-reap">Solicitud de reapertura</h2>
      <p>
        {nombre(s.autor)} pidió reabrir el folio el {fechaCorta(s.fecha)}: «{s.motivo}»
      </p>
      <p className="chico tenue">Al aceptarla, la incidencia pasa a Reabierto y se asigna de nuevo desde esta pantalla.</p>
      <MensajeError texto={error} />
      <div className="acciones derecha">
        <button type="button" className="btn btn-primario" onClick={() => correr(aceptarReapertura, [inc.folio], 'Reapertura aceptada. Clasifica y asigna de nuevo.')}>
          Aceptar reapertura
        </button>
      </div>
    </section>
  );
}

export default function PanelMesa({ inc }) {
  if (inc.estado === 'Nuevo') return <IniciarRevision inc={inc} />;
  if (['En revisión', 'Reabierto'].includes(inc.estado)) {
    return (
      <>
        <Clasificar key={`${inc.folio}-${inc.estado}`} inc={inc} />
        {inc.estado === 'En revisión' && <Duplicados inc={inc} />}
        <Asignar inc={inc} />
      </>
    );
  }
  if (inc.estado === 'Cerrado' && inc.solicitudReapertura?.estado === 'Pendiente') return <AceptarReapertura inc={inc} />;
  return (
    <Aviso tipo="info" titulo="Sin acciones pendientes de la Mesa de servicio">
      {inc.estado === 'Asignado' ? 'La reasignación de técnico solo la hace Supervisión (RN-008).' : `Estado actual: ${inc.estado}.`}
    </Aviso>
  );
}
