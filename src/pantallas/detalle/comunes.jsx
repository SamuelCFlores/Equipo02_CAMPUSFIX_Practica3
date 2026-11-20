// Secciones del detalle compartidas por todos los roles (PAN-04).
import { useState } from 'react';
import { useDatos, useAccion } from '../../estado/almacen.jsx';
import { usuario, ROLES, puede } from '../../dominio/accesos.js';
import { ubicacion, NIVEL_IMPACTO, NIVEL_URGENCIA } from '../../dominio/catalogos.js';
import { agregarNota } from '../../dominio/incidencias.js';
import { describirFoto } from '../../dominio/evidencias.js';
import { fechaCorta, fechaLarga } from '../../dominio/reloj.js';
import { Aviso, Campo, Chip, Dato, Icono, Prioridad, aria } from '../../componentes/ui.jsx';

export function nombre(id) {
  return usuario(id)?.nombre || '';
}

export function FotoVista({ foto }) {
  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {foto.miniatura ? (
        <div className="foto con-imagen">
          <img src={foto.miniatura} alt={`Fotografía: ${foto.nombre}`} />
        </div>
      ) : (
        <div className="foto" style={{ flexDirection: 'column', gap: 8 }}>
          <Icono nombre="foto" tam={26} />
          <span>Vista previa no incluida en los datos de ejemplo</span>
        </div>
      )}
      <figcaption className="chico tenue">
        {foto.nombre} · {describirFoto(foto)} · {fechaCorta(foto.fecha)}
      </figcaption>
    </figure>
  );
}

export function Informacion({ inc }) {
  const { yo } = useDatos();
  const operativo = puede(yo, 'ver_internos');
  const propio = inc.reportante === yo.id;
  const fotosReporte = inc.fotos.filter((f) => f.momento === 'reporte');
  return (
    <section className="tarjeta" aria-labelledby="t-info">
      <h2 id="t-info">{propio ? 'Tu reporte' : 'Información del reporte'}</h2>
      <Dato etiqueta={inc.ubicacionManual ? 'Ubicación manual · por validar' : 'Ubicación'}>{ubicacion(inc)}</Dato>
      {inc.referencia && <Dato etiqueta="Referencia">{inc.referencia}</Dato>}
      <div className="datos-rejilla">
        <Dato etiqueta={inc.categoriaConfirmada ? 'Categoría' : 'Categoría sugerida'}>{inc.categoria}</Dato>
        <Dato etiqueta="Área responsable">{inc.area}</Dato>
        <div className="dato">
          <span>Prioridad</span>
          <Prioridad valor={inc.prioridad} />
        </div>
        <Dato etiqueta="Atiende">{nombre(inc.tecnico) || inc.equipo || 'Sin asignar'}</Dato>
      </div>
      {operativo && (
        <p className="chico tenue">
          {inc.explicacionPrioridad}
          {inc.ajustePrioridad && ` · Ajustada de ${inc.ajustePrioridad.de} a ${inc.ajustePrioridad.a}: ${inc.ajustePrioridad.motivo}`}
          {inc.critica && ' · Falla crítica (afecta un espacio completo)'}
        </p>
      )}
      <Dato etiqueta="Reportante">{operativo || propio ? nombre(inc.reportante) : 'Integrante de la comunidad'}</Dato>
      <Dato etiqueta="Fecha de reporte">{fechaLarga(inc.fecha)}</Dato>
      <div className="dato">
        <span>Descripción</span>
        <p>{inc.descripcion}</p>
      </div>
      {inc.impactoObservado && <Dato etiqueta="Impacto observado">{inc.impactoObservado}</Dato>}
      {fotosReporte.map((f) => (
        <FotoVista key={f.nombre} foto={f} />
      ))}
    </section>
  );
}

export function Vinculados({ inc }) {
  const { base, yo } = useDatos();
  if (!inc.duplicados.length) return null;
  const operativo = puede(yo, 'ver_internos');
  return (
    <section className="tarjeta" aria-labelledby="t-vinc">
      <h2 id="t-vinc">Reportes vinculados</h2>
      {operativo ? (
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {inc.duplicados.map((f) => (
            <li key={f}>
              <a className="mono" href={`#/incidencia/${f}`}>
                {f}
              </a>{' '}
              · {nombre(base.incidencias[f]?.reportante)} · {fechaCorta(base.incidencias[f]?.fecha)}
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {inc.duplicados.length === 1 ? 'Otra persona reportó' : `${inc.duplicados.length} personas reportaron`} la misma falla.
        </p>
      )}
      <p className="chico tenue">Un solo trabajo técnico; los avisos llegan a todos los reportantes (RN-003).</p>
    </section>
  );
}

export function Cronologia({ inc }) {
  const { yo } = useDatos();
  const operativo = puede(yo, 'ver_internos');
  return (
    <section className="tarjeta" aria-labelledby="t-crono">
      <h2 id="t-crono">Cronología</h2>
      <ol className="cronologia">
        {[...inc.historial].reverse().map((h, k) => (
          <li key={k}>
            <div className="cabeza">
              <Chip estado={h.estado} />
              <span className="cuando">{fechaCorta(h.fecha)}</span>
            </div>
            <span>{h.mensaje}</span>
            {operativo && usuario(h.autor) && <span className="chico tenue">Registró: {nombre(h.autor)}</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Notas internas: solo Mesa, Técnico y Supervisor (RN-007). */
export function NotasInternas({ inc }) {
  const { yo } = useDatos();
  const { correr, errores } = useAccion();
  const [texto, setTexto] = useState('');
  const guardar = () => {
    if (correr(agregarNota, [inc.folio, texto], 'Nota interna guardada.')) setTexto('');
  };
  return (
    <section className="tarjeta" aria-labelledby="t-notas">
      <h2 id="t-notas">Notas internas · Solo personal autorizado</h2>
      <Aviso tipo="info">Visibles para Mesa de servicio, Técnico y Supervisor. No se incluyen en los avisos al reportante.</Aviso>
      {inc.notas.length === 0 && <p className="tenue">Sin notas internas.</p>}
      {inc.notas.map((n, k) => (
        <div key={k} className="dato" style={{ borderTop: '1px solid var(--linea)', paddingTop: 10 }}>
          <span>
            {nombre(n.autor)} · {ROLES[usuario(n.autor)?.rol]} · {fechaCorta(n.fecha)}
          </span>
          <p>{n.texto}</p>
        </div>
      ))}
      {puede(yo, 'nota_interna') && inc.estado !== 'Duplicado' && (
        <>
          <Campo id="nota" etiqueta="Nueva nota interna" error={errores.nota}>
            <textarea {...aria('nota', errores.nota)} rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Por ejemplo: el área está acordonada desde las 09:30" />
          </Campo>
          <div>
            <button type="button" className="btn btn-secundario" onClick={guardar}>
              Guardar nota
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/** Bitácora de auditoría del folio (RF-022), para Mesa y Supervisor. */
export function BitacoraFolio({ folio }) {
  const { base } = useDatos();
  const filas = base.bitacora.filter((b) => b.folio === folio).slice().reverse();
  return (
    <details className="tarjeta">
      <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--marino)', fontSize: 18 }}>Bitácora de auditoría ({filas.length})</summary>
      <div style={{ overflowX: 'auto' }}>
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Quién</th>
              <th scope="col">Acción</th>
              <th scope="col">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((b) => (
              <tr key={b.n}>
                <td style={{ whiteSpace: 'nowrap' }}>{fechaCorta(b.fecha)}</td>
                <td>{b.quien}</td>
                <td>{b.accion}</td>
                <td className="chico">{b.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chico tenue">Registro de solo agregado: no se puede editar ni borrar.</p>
    </details>
  );
}

export function textoImpacto(n) {
  return NIVEL_IMPACTO[n];
}
export function textoUrgencia(n) {
  return NIVEL_URGENCIA[n];
}
