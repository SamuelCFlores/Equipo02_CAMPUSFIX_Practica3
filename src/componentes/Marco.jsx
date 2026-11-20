// Encabezado, menú lateral por rol y pie: estructura común de las pantallas internas (DAS 9.3).
import { useEffect, useRef, useState } from 'react';
import { useDatos } from '../estado/almacen.jsx';
import { ir } from '../estado/rutas.js';
import { ROLES, iniciales } from '../dominio/accesos.js';
import { fechaLarga, fechaCorta } from '../dominio/reloj.js';
import { Logo, Icono, Aviso } from './ui.jsx';

const MENUS = {
  reportante: [
    ['inicio', 'Mis incidencias'],
    ['reportar', 'Reportar incidencia'],
  ],
  mesa: [
    ['inicio', 'Bandeja de la mesa'],
    ['inicio?vista=todas', 'Todas las incidencias'],
  ],
  tecnico: [['inicio', 'Mi tablero']],
  supervisor: [
    ['inicio', 'Validaciones y cierre'],
    ['inicio?vista=todas', 'Todas las incidencias'],
  ],
  direccion: [['indicadores', 'Indicadores']],
};

function Avisos({ alCerrar }) {
  const { base, yo, marcarLeidos } = useDatos();
  const mios = base.avisos.filter((a) => a.para === yo.id).slice().reverse();
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    const tecla = (e) => e.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [alCerrar]);
  return (
    <div className="panel-avisos" role="dialog" aria-label="Avisos" tabIndex={-1} ref={ref}>
      <div className="fila" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ fontSize: 18 }}>Avisos</h2>
        {mios.some((a) => !a.leido) && (
          <button type="button" className="btn-enlace" onClick={marcarLeidos}>
            Marcar todos como leídos
          </button>
        )}
      </div>
      {mios.length === 0 && <p className="tenue">No tienes avisos.</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mios.map((a) => (
          <li key={a.id} style={{ borderTop: '1px solid var(--linea)', paddingTop: 10 }}>
            <a href={`#/incidencia/${a.folio}`} onClick={alCerrar} style={{ fontWeight: a.leido ? 500 : 700 }}>
              {a.titulo}
            </a>
            <p className="chico">{a.texto}</p>
            <p className="chico tenue">
              <span className="mono">{a.folio}</span> · {fechaCorta(a.fecha)}
              {!a.leido && ' · Sin leer'}
            </p>
          </li>
        ))}
      </ul>
      <p className="chico tenue" style={{ marginTop: 12 }}>
        En el sistema real cada aviso también se envía al correo institucional (RF-020).
      </p>
    </div>
  );
}

export function Encabezado() {
  const { base, yo, ahora, salir } = useDatos();
  const [folio, setFolio] = useState('');
  const [abierto, setAbierto] = useState(false);
  const sinLeer = base.avisos.filter((a) => a.para === yo.id && !a.leido).length;

  const consultar = (e) => {
    e.preventDefault();
    const f = folio.trim().toUpperCase();
    if (f) ir(`incidencia/${f}`);
    setFolio('');
  };

  return (
    <header className="encabezado">
      <a className="marca" href="#/inicio" aria-label="CAMPUSFIX, ir al inicio">
        <Logo />
        <strong>CAMPUSFIX</strong>
        <span>Universidad Metropolitana del Centro</span>
      </a>
      {yo.rol !== 'direccion' && (
        <form className="buscador" role="search" onSubmit={consultar}>
          <span style={{ color: '#C9D4E2', display: 'flex' }}>
            <Icono nombre="buscar" tam={18} />
          </span>
          <label htmlFor="consulta-folio" className="solo-lector">
            Consultar folio
          </label>
          <input
            id="consulta-folio"
            placeholder="Consultar folio, p. ej. CF-20261023-0042"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
          />
          <button type="submit">Consultar</button>
        </form>
      )}
      <div className="sesion">
        <span className="reloj" title="Reloj simulado de la demostración">
          Demo
          <br />
          {fechaLarga(ahora.toISOString())}
        </span>
        <button type="button" className="btn-encabezado" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
          <Icono nombre="campana" tam={18} />
          Avisos {sinLeer > 0 && <span className="contador">{sinLeer}</span>}
        </button>
        <span className="avatar" aria-hidden="true">
          {iniciales(yo.nombre)}
        </span>
        <span className="persona">
          <b>{yo.nombre}</b>
          <span>{ROLES[yo.rol]}</span>
        </span>
        <button
          type="button"
          className="btn-encabezado"
          onClick={() => {
            salir();
            ir('');
          }}
        >
          Salir
        </button>
      </div>
      {abierto && <Avisos alCerrar={() => setAbierto(false)} />}
    </header>
  );
}

export function Marco({ actual, children }) {
  const { yo, reiniciar, flash } = useDatos();
  return (
    <>
      <Encabezado />
      <div className="marco">
        <nav className="menu" aria-label="Menú principal">
          <span className="titulo-menu">{ROLES[yo.rol]}</span>
          {MENUS[yo.rol].map(([ruta, texto]) => (
            <a key={ruta} href={`#/${ruta}`} aria-current={actual === ruta ? 'page' : undefined}>
              {texto}
            </a>
          ))}
          <div className="pie-menu">
            <button
              type="button"
              className="btn btn-secundario btn-chico"
              onClick={() => {
                reiniciar();
                ir('inicio');
              }}
            >
              Reiniciar demo
            </button>
            <span>Campus Centro · UMC</span>
            <span>Datos ficticios. Prototipo sin servidor.</span>
          </div>
        </nav>
        <main className="contenido" id="contenido">
          {flash && <Aviso tipo={flash.tipo} titulo={flash.texto} className="no-imprimir" />}
          {children}
          <footer className="pie">
            <span>CAMPUSFIX · Servicio de infraestructura</span>
            <span>Prototipo de la Práctica 3 · Equipo02</span>
          </footer>
        </main>
      </div>
    </>
  );
}
