// Listado reutilizable (PAN-03): búsqueda por folio o ubicación y filtros por estado y prioridad.
// Estados de la Tabla 37: normal, vacío y filtrado sin resultados.
import { useMemo, useState } from 'react';
import { ESTADOS } from '../dominio/estados.js';
import { PRIORIDADES } from '../dominio/reglaPrioridad.js';
import { ubicacion } from '../dominio/catalogos.js';
import { usuario } from '../dominio/accesos.js';
import { fechaLarga } from '../dominio/reloj.js';
import { Chip, Prioridad } from './ui.jsx';

export default function TablaIncidencias({ lista, titulo, vacio, mostrarAtiende = false, ordenTexto }) {
  const [texto, setTexto] = useState('');
  const [estado, setEstado] = useState('');
  const [prioridad, setPrioridad] = useState('');

  const filtrada = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return lista.filter(
      (i) =>
        (!t || i.folio.toLowerCase().includes(t) || ubicacion(i).toLowerCase().includes(t) || i.titulo.toLowerCase().includes(t)) &&
        (!estado || i.estado === estado) &&
        (!prioridad || i.prioridad === prioridad),
    );
  }, [lista, texto, estado, prioridad]);

  const hayFiltro = texto || estado || prioridad;
  const estadosPresentes = ESTADOS.filter((e) => lista.some((i) => i.estado === e));

  return (
    <section className="tarjeta" aria-label={titulo} style={{ padding: 0, gap: 0 }}>
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="fila" style={{ justifyContent: 'space-between' }}>
          <h2>{titulo}</h2>
          {ordenTexto && <span className="chico tenue">{ordenTexto}</span>}
        </div>
        <div className="filtros">
          <div className="campo ancho">
            <label htmlFor="f-texto">Buscar</label>
            <input id="f-texto" placeholder="Folio, ubicación o título" value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="f-estado">Estado</label>
            <select id="f-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos</option>
              {estadosPresentes.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="f-prioridad">Prioridad</label>
            <select id="f-prioridad" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
              <option value="">Todas</option>
              {PRIORIDADES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          {hayFiltro && (
            <button
              type="button"
              className="btn btn-secundario btn-chico"
              onClick={() => {
                setTexto('');
                setEstado('');
                setPrioridad('');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
      {filtrada.length === 0 ? (
        <div className="vacio" style={{ borderTop: '1px solid var(--linea)' }}>
          <b>{hayFiltro ? 'Ninguna incidencia coincide con los filtros' : vacio.titulo}</b>
          <span>{hayFiltro ? 'Cambia la búsqueda o limpia los filtros.' : vacio.texto}</span>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderTop: '1px solid var(--borde)' }}>
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col">Folio</th>
                <th scope="col">Ubicación</th>
                <th scope="col">Categoría</th>
                <th scope="col">Prioridad</th>
                <th scope="col">Estado</th>
                {mostrarAtiende && <th scope="col">Atiende</th>}
                <th scope="col">Fecha de reporte</th>
              </tr>
            </thead>
            <tbody>
              {filtrada.map((i) => (
                <tr key={i.folio}>
                  <td>
                    <a className="mono" href={`#/incidencia/${i.folio}`}>
                      {i.folio}
                    </a>
                  </td>
                  <td>{ubicacion(i, true)}</td>
                  <td>{i.categoria}</td>
                  <td>
                    <Prioridad valor={i.prioridad} />
                  </td>
                  <td>
                    <Chip estado={i.estado} />
                  </td>
                  {mostrarAtiende && <td>{usuario(i.tecnico)?.nombre || i.equipo || <span className="tenue">Sin asignar</span>}</td>}
                  <td style={{ whiteSpace: 'nowrap' }}>{fechaLarga(i.fecha)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="tabla-pie">
        <span>
          {filtrada.length} de {lista.length} incidencias
        </span>
      </div>
    </section>
  );
}
