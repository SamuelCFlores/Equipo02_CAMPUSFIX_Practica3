// PAN-04 · Detalle de incidencia con historial (CU-02, CU-05; RF-011, RF-018, RF-022, RNF-004).
// Cada rol ve un panel de acciones distinto; el Reportante no ve información interna (RN-007).
import { useDatos } from '../estado/almacen.jsx';
import { useRuta } from '../estado/rutas.js';
import { Marco } from '../componentes/Marco.jsx';
import { Aviso, Chip } from '../componentes/ui.jsx';
import { puede } from '../dominio/accesos.js';
import { vistaPara } from '../dominio/incidencias.js';
import { FORMATO_FOLIO } from '../dominio/folio.js';
import { fechaLarga } from '../dominio/reloj.js';
import { Informacion, Vinculados, Cronologia, NotasInternas, BitacoraFolio, nombre } from './detalle/comunes.jsx';
import PanelMesa from './detalle/PanelMesa.jsx';
import PanelTecnico from './detalle/PanelTecnico.jsx';
import PanelSupervisor from './detalle/PanelSupervisor.jsx';
import PanelReportante from './detalle/PanelReportante.jsx';

const MIGA = { reportante: 'Mis incidencias', mesa: 'Bandeja de la mesa', tecnico: 'Mi tablero', supervisor: 'Validaciones y cierre', direccion: 'Indicadores' };

function NoEncontrado({ folio }) {
  const valido = FORMATO_FOLIO.test(folio);
  return (
    <>
      <div className="cabecera">
        <div>
          <span className="miga">Consultar folio</span>
          <h1>Folio no encontrado</h1>
        </div>
      </div>
      <Aviso tipo="error" titulo={`No encontramos ${folio || 'ese folio'}`}>
        {valido
          ? 'Revisa que el folio esté completo y bien escrito.'
          : 'El folio debe tener el formato CF-AAAAMMDD-XXXX, por ejemplo CF-20261023-0042.'}
      </Aviso>
      <div>
        <a className="btn btn-secundario" href="#/inicio">
          Volver al inicio
        </a>
      </div>
    </>
  );
}

function PanelRol({ inc }) {
  const { yo } = useDatos();
  if (yo.rol === 'mesa') return <PanelMesa inc={inc} />;
  if (yo.rol === 'tecnico') return <PanelTecnico inc={inc} />;
  if (yo.rol === 'supervisor') return <PanelSupervisor inc={inc} />;
  if (yo.rol === 'reportante') return <PanelReportante inc={inc} />;
  return (
    <Aviso tipo="info" titulo="Vista de solo consulta">
      La Dirección administrativa consulta el avance sin acciones de asignación.
    </Aviso>
  );
}

export default function Detalle() {
  const { base, yo } = useDatos();
  const { partes } = useRuta();
  const folio = (partes[1] || '').trim().toUpperCase();
  const original = base.incidencias[folio];

  if (!original) {
    return (
      <Marco actual="">
        <NoEncontrado folio={folio} />
      </Marco>
    );
  }

  const inc = vistaPara(yo, original);
  const operativo = puede(yo, 'ver_internos');
  const auditor = ['mesa', 'supervisor'].includes(yo.rol);
  const inicio = yo.rol === 'direccion' ? '#/indicadores' : '#/inicio';

  return (
    <Marco actual="">
      <div className="cabecera">
        <div>
          <span className="miga">
            <a href={inicio}>{MIGA[yo.rol]}</a> / {inc.folio}
          </span>
          <div className="fila">
            <h1 className="folio-titulo">{inc.folio}</h1>
            <Chip estado={inc.estado} />
          </div>
          <p className="subtitulo">
            {inc.titulo} · Reportado el {fechaLarga(inc.fecha)} · Última actualización: {fechaLarga(inc.actualizada)}
          </p>
        </div>
      </div>

      {inc.estado === 'Duplicado' && (
        <Aviso tipo="info" titulo={`Duplicado de ${inc.principal}`}>
          Este reporte conserva su folio, reportante, fecha y evidencias. El trabajo técnico se registra en la incidencia principal y sus
          avisos te llegan también. <a href={`#/incidencia/${inc.principal}`}>Ver incidencia principal</a>
        </Aviso>
      )}
      {inc.estado === 'Cerrado' && inc.validacion && (
        <Aviso tipo="exito" titulo="Estado: Cerrado · Reparación validada">
          {nombre(inc.validacion.autor)} validó la reparación el {fechaLarga(inc.validacion.fecha)}. {inc.validacion.resultado}
        </Aviso>
      )}

      <div className="dos-col">
        <div className="principal">
          <PanelRol inc={inc} />
          <Cronologia inc={inc} />
          {operativo && <NotasInternas inc={inc} />}
          {auditor && <BitacoraFolio folio={inc.folio} />}
        </div>
        <aside className="lateral">
          <Informacion inc={inc} />
          <Vinculados inc={inc} />
        </aside>
      </div>
    </Marco>
  );
}
