// PAN-02 / PAN-03 · Panel principal y listado según el rol (RF-018, RF-019, RF-021).
import { useDatos } from '../estado/almacen.jsx';
import { useRuta } from '../estado/rutas.js';
import { Marco } from '../componentes/Marco.jsx';
import TablaIncidencias from '../componentes/TablaIncidencias.jsx';
import { Aviso, Kpi } from '../componentes/ui.jsx';
import { EN_SEGUIMIENTO } from '../dominio/estados.js';
import { propias, posiblesDuplicados } from '../dominio/incidencias.js';
import { tablero, tecnicosPara, ordenarPorPrioridad, ACTIVOS_TECNICO } from '../dominio/asignacion.js';
import { fechaLarga, fechaCorta } from '../dominio/reloj.js';

function Cabecera({ miga, titulo, subtitulo, accion }) {
  return (
    <div className="cabecera">
      <div>
        <span className="miga">{miga}</span>
        <h1>{titulo}</h1>
        {subtitulo && <p className="subtitulo">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
}

// ---------- Reportante: Mis incidencias (PAN-02, RF-019) ----------
function MisIncidencias() {
  const { base, yo, ahora, marcarLeidos } = useDatos();
  const mias = propias(base, yo).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const avisos = base.avisos.filter((a) => a.para === yo.id).slice().reverse();
  const sinLeer = avisos.filter((a) => !a.leido).length;
  return (
    <Marco actual="inicio">
      <Cabecera
        miga="Reportante / Mis incidencias"
        titulo="Mis incidencias"
        subtitulo={`Hola, ${yo.nombre.split(' ')[0]}. Actualizado el ${fechaLarga(ahora.toISOString())}.`}
        accion={
          <a className="btn btn-primario" href="#/reportar">
            + Reportar incidencia
          </a>
        }
      />
      <div className="kpis">
        <Kpi etiqueta="Abiertas" valor={mias.filter((i) => EN_SEGUIMIENTO.includes(i.estado) && i.estado !== 'En espera de refacción').length} nota="En seguimiento por el equipo" />
        <Kpi etiqueta="En espera" valor={mias.filter((i) => i.estado === 'En espera de refacción').length} nota="Detenidas por una refacción" />
        <Kpi etiqueta="Cerradas" valor={mias.filter((i) => i.estado === 'Cerrado').length} nota="Reparaciones validadas" />
      </div>
      <TablaIncidencias
        lista={mias}
        titulo="Tus reportes"
        vacio={{ titulo: 'Aún no has reportado incidencias', texto: 'Cuando reportes una falla aparecerá aquí con su folio.' }}
      />
      <section className="tarjeta" aria-labelledby="t-notif">
        <div className="fila" style={{ justifyContent: 'space-between' }}>
          <h2 id="t-notif">Notificaciones{sinLeer ? ` · ${sinLeer} sin leer` : ''}</h2>
          {sinLeer > 0 && (
            <button type="button" className="btn-enlace" onClick={marcarLeidos}>
              Marcar como leídas
            </button>
          )}
        </div>
        {avisos.length === 0 ? (
          <p className="tenue">Sin notificaciones por ahora.</p>
        ) : (
          <ul className="cronologia">
            {avisos.slice(0, 6).map((a) => (
              <li key={a.id}>
                <div className="cabeza">
                  <a href={`#/incidencia/${a.folio}`} style={{ fontWeight: a.leido ? 500 : 700 }}>
                    {a.titulo}
                  </a>
                  <span className="cuando">{fechaCorta(a.fecha)}</span>
                </div>
                <span>
                  <span className="mono">{a.folio}</span> · {a.texto}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Marco>
  );
}

// ---------- Mesa de servicio: bandeja (PAN-02/03, FLU-02) ----------
function BandejaMesa({ vista }) {
  const { base, ahora } = useDatos();
  const todas = Object.values(base.incidencias);
  const pendientes = todas.filter((i) => ['Nuevo', 'En revisión', 'Reabierto'].includes(i.estado) || i.solicitudReapertura?.estado === 'Pendiente');
  const pares = [];
  for (const i of pendientes.filter((x) => ['Nuevo', 'En revisión'].includes(x.estado))) {
    const otra = posiblesDuplicados(base, i).find((o) => o.fecha < i.fecha);
    if (otra) pares.push([i, otra]);
  }
  const sinTecnico = pendientes.filter((i) => ['Nuevo', 'En revisión', 'Reabierto'].includes(i.estado) && tecnicosPara(i.categoria).length === 0);
  const reaperturas = todas.filter((i) => i.solicitudReapertura?.estado === 'Pendiente');
  const lista = vista === 'todas' ? todas.sort((a, b) => b.fecha.localeCompare(a.fecha)) : ordenarPorPrioridad(pendientes);

  return (
    <Marco actual={vista === 'todas' ? 'inicio?vista=todas' : 'inicio'}>
      <Cabecera
        miga={`Mesa de servicio / ${vista === 'todas' ? 'Todas las incidencias' : 'Bandeja'}`}
        titulo={vista === 'todas' ? 'Todas las incidencias' : 'Bandeja de la mesa de servicio'}
        subtitulo={`${fechaLarga(ahora.toISOString())} · Valida la información antes de asignar atención.`}
      />
      {vista !== 'todas' && (
        <>
          <div className="kpis">
            <Kpi etiqueta="Por validar" valor={pendientes.filter((i) => i.estado === 'Nuevo').length} nota="Reportes en estado Nuevo" />
            <Kpi etiqueta="Posibles duplicados" valor={pares.length} nota="Misma ubicación y categoría" />
            <Kpi etiqueta="Sin técnico disponible" valor={sinTecnico.length} nota="Categorías sin personal en la demo" />
            <Kpi etiqueta="Prioridad alta" valor={pendientes.filter((i) => i.prioridad === 'Alta').length} nota="Pendientes de asignar" />
          </div>
          {pares.map(([dup, principal]) => (
            <Aviso key={dup.folio} tipo="alerta" titulo="Posible duplicado detectado">
              <a className="mono" href={`#/incidencia/${dup.folio}`}>
                {dup.folio}
              </a>{' '}
              comparte ubicación y categoría con{' '}
              <a className="mono" href={`#/incidencia/${principal.folio}`}>
                {principal.folio}
              </a>
              . Revisa ambos reportes antes de vincularlos.
            </Aviso>
          ))}
          {reaperturas.map((i) => (
            <Aviso key={i.folio} tipo="info" titulo="Solicitud de reapertura">
              <a className="mono" href={`#/incidencia/${i.folio}`}>
                {i.folio}
              </a>{' '}
              · {i.solicitudReapertura.motivo}
            </Aviso>
          ))}
        </>
      )}
      <TablaIncidencias
        lista={lista}
        titulo={vista === 'todas' ? 'Incidencias registradas' : 'Por atender'}
        mostrarAtiende={vista === 'todas'}
        ordenTexto={vista === 'todas' ? 'Más recientes primero' : 'Orden: prioridad y antigüedad'}
        vacio={{ titulo: 'No hay reportes por validar', texto: 'Los reportes nuevos aparecerán aquí.' }}
      />
    </Marco>
  );
}

// ---------- Técnico: tablero por prioridad (PAN-03, RF-021, FLU-03) ----------
function TableroTecnico() {
  const { base, yo, ahora } = useDatos();
  const mias = tablero(base, yo.id);
  const resueltas = Object.values(base.incidencias).filter((i) => i.tecnico === yo.id && i.estado === 'Resuelto');
  const siguiente = mias[0];
  return (
    <Marco actual="inicio">
      <Cabecera
        miga="Técnico / Mi tablero"
        titulo="Mi tablero"
        subtitulo={`${yo.nombre} · ${fechaLarga(ahora.toISOString())} · Atiende primero las incidencias de mayor prioridad.`}
        accion={
          siguiente && (
            <a className="btn btn-primario" href={`#/incidencia/${siguiente.folio}`}>
              Atender {siguiente.folio}
            </a>
          )
        }
      />
      <div className="kpis">
        <Kpi etiqueta="Asignaciones activas" valor={mias.length} nota="Solo tus incidencias" />
        <Kpi etiqueta="Prioridad alta" valor={mias.filter((i) => i.prioridad === 'Alta').length} nota="Atiéndelas primero" />
        <Kpi etiqueta="Por iniciar" valor={mias.filter((i) => i.estado === 'Asignado').length} nota="Asignadas a tu nombre" />
        <Kpi etiqueta="Resueltas por validar" valor={resueltas.length} nota="Enviadas a Supervisión" />
      </div>
      <TablaIncidencias
        lista={mias}
        titulo="Asignaciones activas"
        ordenTexto="Prioridad de mayor a menor; a igual prioridad, la más antigua"
        vacio={{ titulo: 'No tienes asignaciones activas', texto: `Estados considerados: ${ACTIVOS_TECNICO.join(', ')}.` }}
      />
    </Marco>
  );
}

// ---------- Supervisor: validaciones y cierre (PAN-03, RF-016) ----------
function ValidacionesSupervisor({ vista }) {
  const { base, yo, ahora } = useDatos();
  const todas = Object.values(base.incidencias);
  const porValidar = ordenarPorPrioridad(todas.filter((i) => i.estado === 'Resuelto'));
  const lista = vista === 'todas' ? todas.sort((a, b) => b.fecha.localeCompare(a.fecha)) : porValidar;
  return (
    <Marco actual={vista === 'todas' ? 'inicio?vista=todas' : 'inicio'}>
      <Cabecera
        miga={`Supervisor / ${vista === 'todas' ? 'Todas las incidencias' : 'Validaciones y cierre'}`}
        titulo={vista === 'todas' ? 'Todas las incidencias' : 'Validaciones y cierre'}
        subtitulo={`${yo.nombre} · ${fechaLarga(ahora.toISOString())} · Revisa la evidencia antes de autorizar el cierre.`}
      />
      {vista !== 'todas' && (
        <>
          <div className="kpis">
            <Kpi etiqueta="Por validar" valor={porValidar.length} nota="Incidencias en estado Resuelto" />
            <Kpi etiqueta="Asignadas" valor={todas.filter((i) => i.estado === 'Asignado').length} nota="Se pueden reasignar" />
            <Kpi etiqueta="En espera de refacción" valor={todas.filter((i) => i.estado === 'En espera de refacción').length} nota="Detenidas" />
            <Kpi etiqueta="Cerradas" valor={todas.filter((i) => i.estado === 'Cerrado').length} nota="Validadas" />
          </div>
          <Aviso tipo="info" titulo="Resuelto no significa Cerrado">
            Las incidencias resueltas siguen abiertas hasta que valides la reparación; si no cumple, regrésala a En progreso.
          </Aviso>
        </>
      )}
      <TablaIncidencias
        lista={lista}
        titulo={vista === 'todas' ? 'Incidencias registradas' : 'Cola de validaciones'}
        mostrarAtiende
        ordenTexto={vista === 'todas' ? 'Más recientes primero' : 'Ordenadas por prioridad'}
        vacio={{ titulo: 'No hay cierres por validar', texto: 'Cuando un técnico registre una resolución aparecerá aquí.' }}
      />
    </Marco>
  );
}

export default function Listado() {
  const { yo } = useDatos();
  const { params } = useRuta();
  if (yo.rol === 'reportante') return <MisIncidencias />;
  if (yo.rol === 'mesa') return <BandejaMesa vista={params.vista} />;
  if (yo.rol === 'tecnico') return <TableroTecnico />;
  if (yo.rol === 'supervisor') return <ValidacionesSupervisor vista={params.vista} />;
  return null;
}
