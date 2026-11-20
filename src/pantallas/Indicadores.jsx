// PAN-11 · Métricas e incidencias recurrentes para la Dirección administrativa (CU-08; RF-023,
// RF-024, RF-026). Vista de solo consulta: se calcula con los datos actuales de la demostración.
import { useDatos } from '../estado/almacen.jsx';
import { Marco } from '../componentes/Marco.jsx';
import { Aviso, Chip, Kpi } from '../componentes/ui.jsx';
import { indicadores, aCSV, MINIMO_RECURRENTE } from '../dominio/metricas.js';
import { fechaLarga, fechaCorta } from '../dominio/reloj.js';

const COLOR_ESTADO = {
  Nuevo: '#5B6470',
  'En revisión': '#4A6B8F',
  Asignado: '#1D5FA8',
  'En progreso': '#A44A00',
  'En espera de refacción': '#6B3FA0',
  Resuelto: '#3E8E5A',
  Cerrado: '#1E6B3A',
  Reabierto: '#B42318',
};
const COLOR_PRIORIDAD = { Alta: '#0F2A47', Media: '#1D5FA8', Baja: '#A9C1DD' };
const SIMBOLO = { Alta: '▲', Media: '■', Baja: '▼' };

function descargarCSV(base, ahora) {
  const csv = aCSV(Object.values(base.incidencias));
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date(ahora);
  a.href = url;
  a.download = `campusfix_tiempos_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Indicadores() {
  const { base, ahora } = useDatos();
  const m = indicadores(Object.values(base.incidencias));
  const maxEstado = Math.max(1, ...m.porEstado.map((e) => e.total));

  return (
    <Marco actual="indicadores">
      <div className="cabecera">
        <div>
          <span className="miga">Dirección administrativa / Panorama de infraestructura</span>
          <h1>Panorama de infraestructura</h1>
          <p className="subtitulo">Campus Centro · Datos agregados de la demostración · Actualizado el {fechaLarga(ahora.toISOString())}</p>
        </div>
        <div className="fila no-imprimir">
          <span className="tenue">Exportar</span>
          <button type="button" className="btn btn-secundario btn-chico" onClick={() => descargarCSV(base, ahora)}>
            CSV de tiempos
          </button>
          <button type="button" className="btn btn-primario btn-chico" onClick={() => window.print()}>
            Imprimir o guardar PDF
          </button>
        </div>
      </div>
      <p className="tenue chico">Vista de solo consulta · Sin acciones de asignación.</p>

      {m.total === 0 ? (
        <Aviso tipo="info" titulo="Sin datos en el periodo">
          Cuando se registren incidencias aparecerán aquí sus indicadores.
        </Aviso>
      ) : (
        <>
          <div className="kpis">
            <Kpi etiqueta="Incidencias reportadas" valor={m.total} nota="Sin contar duplicados" />
            <Kpi etiqueta="En seguimiento" valor={m.seguimiento} nota={`Incluye ${m.resueltasPorValidar} resueltas por validar`} />
            <Kpi etiqueta="Cerradas" valor={m.cerradas} nota={`${m.pctCerradas} % del total reportado`} />
            <Kpi
              etiqueta="Mediana de resolución"
              valor={m.medianaDias === null ? '—' : `${m.medianaDias.toFixed(1)} días`}
              nota={`De asignación a resolución · ${m.conTiempo} folios`}
            />
          </div>

          <div className="dos-col" style={{ alignItems: 'stretch' }}>
            <section className="tarjeta principal" aria-labelledby="t-estado" style={{ flex: '1 1 420px' }}>
              <div>
                <h2 id="t-estado">Por estado</h2>
                <span className="chico tenue">{m.total} incidencias · todos los estados</span>
              </div>
              <div className="barras">
                {m.porEstado.map((e) => (
                  <div key={e.estado} style={{ display: 'contents' }}>
                    <Chip estado={e.estado} />
                    <span className="barra" role="img" aria-label={`${e.estado}: ${e.total}`}>
                      <span style={{ width: `${(e.total / maxEstado) * 100}%`, background: COLOR_ESTADO[e.estado] }} />
                    </span>
                    <b style={{ textAlign: 'right' }}>{e.total}</b>
                  </div>
                ))}
              </div>
            </section>
            <section className="tarjeta lateral" aria-labelledby="t-prio" style={{ flex: '1 1 360px' }}>
              <div>
                <h2 id="t-prio">Por prioridad</h2>
                <span className="chico tenue">Prioridad confirmada por la mesa de servicio</span>
              </div>
              <div className="apilada" role="img" aria-label={m.porPrioridad.map((p) => `${p.prioridad} ${p.total}`).join(', ')}>
                {m.porPrioridad
                  .filter((p) => p.total)
                  .map((p) => (
                    <span key={p.prioridad} style={{ flex: p.total, background: COLOR_PRIORIDAD[p.prioridad] }} />
                  ))}
              </div>
              <div>
                {m.porPrioridad.map((p) => (
                  <div key={p.prioridad} className="fila" style={{ justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--linea)' }}>
                    <span className="fila" style={{ gap: 10 }}>
                      <span className="leyenda" style={{ background: COLOR_PRIORIDAD[p.prioridad] }} />
                      {SIMBOLO[p.prioridad]} {p.prioridad}
                    </span>
                    <b>
                      {p.total} · {p.pct} %
                    </b>
                  </div>
                ))}
              </div>
              <span className="chico tenue">Los porcentajes pueden variar por redondeo.</span>
            </section>
          </div>

          <div className="dos-col" style={{ alignItems: 'stretch' }}>
            <section className="tarjeta principal" aria-labelledby="t-ubic" style={{ flex: '1 1 420px' }}>
              <h2 id="t-ubic">Por ubicación</h2>
              <div style={{ overflowX: 'auto' }}>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th scope="col">Ubicación</th>
                      <th scope="col" className="num">
                        Total
                      </th>
                      <th scope="col" className="num">
                        En seguimiento
                      </th>
                      <th scope="col" className="num">
                        Cerradas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.porUbicacion.map((u) => (
                      <tr key={u.edificio}>
                        <td>{u.edificio}</td>
                        <td className="num">
                          <b>{u.total}</b>
                        </td>
                        <td className="num">{u.seguimiento}</td>
                        <td className="num">{u.cerradas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="tarjeta lateral" aria-labelledby="t-recu" style={{ flex: '1 1 360px' }}>
              <h2 id="t-recu">Recurrentes y fallas críticas</h2>
              <span className="chico tenue">
                Recurrente: {MINIMO_RECURRENTE} o más reportes del mismo edificio y categoría en el periodo (RF-023).
              </span>
              {m.recurrentes.length === 0 ? (
                <div className="vacio" style={{ padding: '18px 8px' }}>
                  <b>Sin incidencias recurrentes</b>
                  <span>Ningún edificio acumula {MINIMO_RECURRENTE} reportes de la misma categoría.</span>
                </div>
              ) : (
                <table className="tabla">
                  <thead>
                    <tr>
                      <th scope="col">Edificio</th>
                      <th scope="col">Categoría</th>
                      <th scope="col" className="num">
                        Reportes
                      </th>
                      <th scope="col" className="num">
                        Último
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.recurrentes.map((r) => (
                      <tr key={r.edificio + r.categoria}>
                        <td>{r.edificio}</td>
                        <td>{r.categoria}</td>
                        <td className="num">
                          <b>{r.total}</b>
                        </td>
                        <td className="num">{fechaCorta(r.ultimo).split(' · ')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="fila" style={{ gap: 14, border: '1px solid var(--error-borde)', background: 'var(--error-fondo)', borderRadius: 10, padding: '14px 16px', flexWrap: 'nowrap' }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--error)' }}>{m.criticas.total}</span>
                <span className="chico" style={{ color: '#4E1A14' }}>
                  Fallas críticas ({m.criticas.pct} % del total)
                  {m.criticas.porEdificio.length ? `: ${m.criticas.porEdificio.map((c) => `${c.total} en ${c.edificio}`).join(', ')}` : ''}. Las marca la
                  mesa cuando la falla afecta un espacio completo (RF-024); es distinto de la prioridad Alta y no se suma al total.
                </span>
              </div>
            </section>
          </div>
        </>
      )}

      <Aviso tipo="info" titulo="Criterio de lectura">
        Los reportes vinculados como duplicados se excluyen para evitar doble conteo ({m.duplicadosExcluidos} en este momento). Esta vista no
        muestra comentarios internos ni datos personales.
      </Aviso>
    </Marco>
  );
}
