// FLU-01 · PAN-05 Reportar incidencia en cuatro pasos, PAN-07 errores de captura y PAN-06
// confirmación con folio (CU-01; RF-003, RF-004, RF-005, RF-020).
import { useState } from 'react';
import { useDatos, useAccion } from '../estado/almacen.jsx';
import { useRuta, ir } from '../estado/rutas.js';
import { Marco } from '../componentes/Marco.jsx';
import { Aviso, Campo, Dato, Icono, Prioridad, aria } from '../componentes/ui.jsx';
import { leerFoto } from '../componentes/foto.js';
import { CATEGORIAS, EDIFICIOS, NIVELES, ESPACIOS, espacioEnCatalogo, sugerirCategoria, ubicacion } from '../dominio/catalogos.js';
import { registrar, validarPaso } from '../dominio/incidencias.js';
import { describirFoto } from '../dominio/evidencias.js';
import { fechaLarga } from '../dominio/reloj.js';

const PASOS = ['Ubicación', 'Detalle', 'Fotografía', 'Revisar y enviar'];
const VACIO = {
  edificio: '',
  nivel: '',
  espacio: '',
  referencia: '',
  titulo: '',
  categoriaSugerida: '',
  descripcion: '',
  impactoObservado: '',
  foto: null,
  confirmado: false,
};
const TITULO_ERROR = { 1: 'Revisa la ubicación para continuar', 2: 'Revisa la descripción para continuar', 4: 'Falta tu confirmación' };

function Lateral({ yo, foto, paso }) {
  return (
    <aside className="lateral" style={{ flex: '1 1 280px' }}>
      {paso === 4 && foto && (
        <div className="tarjeta">
          <h2 style={{ fontSize: 18 }}>Fotografía adjunta</h2>
          <div className="foto con-imagen">
            <img src={foto.miniatura} alt={`Fotografía adjunta: ${foto.nombre}`} />
          </div>
          <div className="archivo">
            <Icono nombre="foto" />
            <span>
              <b>{foto.nombre}</b>
              <br />
              {describirFoto(foto)} · Carga completa
            </span>
          </div>
        </div>
      )}
      <div className="tarjeta">
        <h2 style={{ fontSize: 18 }}>Tu reporte</h2>
        <Dato etiqueta="Reportante">{yo.nombre}</Dato>
        <Dato etiqueta="Correo para avisos">{yo.correo}</Dato>
        <div className="dato">
          <span>Folio</span>
          <span className="tenue">Se asigna al enviar</span>
        </div>
      </div>
      <Aviso tipo="info" titulo="Tu seguridad es primero">
        Si existe un riesgo inmediato, aléjate del área y llama a Seguridad: ext. 1100.
      </Aviso>
    </aside>
  );
}

function Confirmacion({ folio }) {
  const { base } = useDatos();
  const inc = base.incidencias[folio];
  if (!inc) return <Aviso tipo="error" titulo="No encontramos ese folio" />;
  return (
    <>
      <div className="cabecera">
        <div>
          <span className="miga">Reportante / Reportar una incidencia</span>
          <h1>Incidencia enviada</h1>
          <p className="subtitulo">{fechaLarga(inc.fecha)}</p>
        </div>
      </div>
      <Aviso tipo="exito" titulo="Recibimos tu reporte">
        Conserva el folio para consultar el avance. Te avisaremos cada cambio de estado en tu correo institucional.
      </Aviso>
      <div className="dos-col">
        <section className="principal tarjeta" aria-labelledby="t-folio">
          <span className="tenue" id="t-folio">
            Tu folio
          </span>
          <span className="folio-titulo" style={{ fontSize: 34, color: 'var(--marino)' }}>
            {inc.folio}
          </span>
          <div className="datos-rejilla">
            <Dato etiqueta="Ubicación">{ubicacion(inc)}</Dato>
            <Dato etiqueta="Categoría sugerida">{inc.categoriaSugerida}</Dato>
            <div className="dato">
              <span>Prioridad calculada</span>
              <Prioridad valor={inc.prioridad} />
            </div>
            <Dato etiqueta="Estado">Nuevo · Mesa de servicio lo revisará</Dato>
          </div>
          {inc.ubicacionManual && (
            <Aviso tipo="alerta">La ubicación se registró a mano: Mesa de servicio la validará antes de asignar.</Aviso>
          )}
          <div className="acciones">
            <a className="btn btn-secundario" href="#/inicio">
              Volver a mis incidencias
            </a>
            <a className="btn btn-primario" href={`#/incidencia/${inc.folio}`}>
              Ver seguimiento
            </a>
          </div>
        </section>
        <aside className="lateral">
          <div className="tarjeta">
            <h2 style={{ fontSize: 18 }}>¿Qué sigue?</h2>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>Mesa de servicio valida la ubicación, la categoría y posibles duplicados.</li>
              <li>Se asigna un técnico del área responsable.</li>
              <li>El técnico registra la reparación y Supervisión la valida.</li>
            </ol>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function Reportar() {
  const { yo } = useDatos();
  const { partes } = useRuta();
  const { correr, errores: erroresEnvio, error: errorEnvio } = useAccion();
  const [paso, setPaso] = useState(1);
  const [d, setD] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [errorFoto, setErrorFoto] = useState('');
  const [categoriaTocada, setCategoriaTocada] = useState(false);

  if (partes[1] === 'enviado' && partes[2]) {
    return (
      <Marco actual="reportar">
        <Confirmacion folio={partes[2]} />
      </Marco>
    );
  }

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setD((x) => {
      const nuevo = { ...x, [campo]: valor };
      if (campo === 'titulo' && !categoriaTocada) nuevo.categoriaSugerida = sugerirCategoria(valor) || x.categoriaSugerida;
      return nuevo;
    });
    if (campo === 'categoriaSugerida') setCategoriaTocada(true);
    if (errores[campo]) setErrores((x) => ({ ...x, [campo]: undefined }));
  };

  const continuar = () => {
    const e = validarPaso(paso, d);
    setErrores(e);
    if (Object.keys(e).length === 0) setPaso(paso + 1);
  };

  const enviar = () => {
    const e = validarPaso(4, d);
    setErrores(e);
    if (Object.keys(e).length) return;
    const folio = correr(registrar, [d]);
    if (folio) ir(`reportar/enviado/${folio}`);
  };

  const elegirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    const r = await leerFoto(archivo);
    if (r.error) {
      setErrorFoto(r.error);
      return;
    }
    setErrorFoto('');
    setD((x) => ({ ...x, foto: r.foto }));
  };

  const hayErrores = Object.values(errores).some(Boolean);
  const manual = d.edificio && d.espacio.trim() && !espacioEnCatalogo(d.edificio, d.espacio);

  return (
    <Marco actual="reportar">
      <div className="cabecera">
        <div>
          <span className="miga">Reportante / Reportar una incidencia</span>
          <h1>Reportar una incidencia</h1>
          <p className="subtitulo">Cuéntanos qué ocurre. El reporte se completa en cuatro pasos y recibe un folio al enviarlo.</p>
        </div>
      </div>
      <ol className="pasos" aria-label={`Paso ${paso} de 4`}>
        {PASOS.map((p, k) => (
          <li key={p} className={k + 1 < paso ? 'hecho' : k + 1 === paso ? 'actual' : ''} aria-current={k + 1 === paso ? 'step' : undefined}>
            {k + 1} · {p}
          </li>
        ))}
      </ol>

      <div className="dos-col">
        <div className="principal">
          {hayErrores && (
            <Aviso tipo="error" titulo={TITULO_ERROR[paso]}>
              Corrige los campos marcados en rojo. No se perdió lo que ya escribiste.
            </Aviso>
          )}
          {errorEnvio && !hayErrores && (
            <Aviso tipo="error" titulo="No se pudo enviar">
              {errorEnvio} {Object.values(erroresEnvio).join(' ')}
            </Aviso>
          )}

          <form className="tarjeta" onSubmit={(e) => e.preventDefault()} noValidate>
            {paso === 1 && (
              <>
                <div>
                  <h2>¿Dónde ocurre la incidencia?</h2>
                  <p className="tenue chico">Los campos con * son obligatorios.</p>
                </div>
                <div className="rejilla-campos">
                  <Campo id="edificio" etiqueta="Edificio" requerido error={errores.edificio}>
                    <select {...aria('edificio', errores.edificio)} value={d.edificio} onChange={cambiar('edificio')}>
                      <option value="">Selecciona…</option>
                      {EDIFICIOS.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </Campo>
                  <Campo id="nivel" etiqueta="Nivel" requerido error={errores.nivel}>
                    <select {...aria('nivel', errores.nivel)} value={d.nivel} onChange={cambiar('nivel')}>
                      <option value="">Selecciona…</option>
                      {NIVELES.map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </Campo>
                </div>
                <Campo id="espacio" etiqueta="Área o espacio" requerido error={errores.espacio} ayuda="Elige de la lista o escríbelo si no aparece.">
                  <input {...aria('espacio', errores.espacio)} list="espacios" placeholder="Por ejemplo: Sanitarios, Aula 102" value={d.espacio} onChange={cambiar('espacio')} />
                  <datalist id="espacios">
                    {(ESPACIOS[d.edificio] || []).map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </Campo>
                <Campo id="referencia" etiqueta="Referencia para encontrar el lugar" ayuda="No incluyas datos personales.">
                  <input id="referencia" placeholder="Por ejemplo: junto al acceso del patio, lavabo del fondo" value={d.referencia} onChange={cambiar('referencia')} />
                </Campo>
                {manual && (
                  <Aviso tipo="alerta">
                    «{d.espacio.trim()}» no está en el catálogo de espacios de {d.edificio}: se guardará como ubicación manual y Mesa de
                    servicio la validará antes de asignar.
                  </Aviso>
                )}
              </>
            )}

            {paso === 2 && (
              <>
                <h2>¿Qué está pasando?</h2>
                <Campo id="titulo" etiqueta="Título de la incidencia" requerido error={errores.titulo}>
                  <input {...aria('titulo', errores.titulo)} placeholder="Por ejemplo: Fuga de agua en sanitarios" value={d.titulo} onChange={cambiar('titulo')} />
                </Campo>
                <Campo
                  id="categoria"
                  etiqueta="Categoría sugerida"
                  requerido
                  error={errores.categoriaSugerida}
                  ayuda="Se sugiere a partir del título. Puedes cambiarla; Mesa de servicio la confirmará."
                >
                  <select {...aria('categoria', errores.categoriaSugerida)} value={d.categoriaSugerida} onChange={cambiar('categoriaSugerida')}>
                    <option value="">Selecciona…</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                </Campo>
                <Campo id="descripcion" etiqueta="Descripción" requerido error={errores.descripcion} ayuda="Describe qué ocurre. No intentes reparar la instalación.">
                  <textarea {...aria('descripcion', errores.descripcion)} rows={4} value={d.descripcion} onChange={cambiar('descripcion')} />
                </Campo>
                <Campo id="impacto" etiqueta="Impacto observado" ayuda="La prioridad se confirma durante la validación del reporte.">
                  <input id="impacto" placeholder="Por ejemplo: agua acumulada en el piso; riesgo de resbalón" value={d.impactoObservado} onChange={cambiar('impactoObservado')} />
                </Campo>
              </>
            )}

            {paso === 3 && (
              <>
                <div>
                  <h2>Agrega una fotografía</h2>
                  <p className="tenue chico">Opcional, pero ayuda al técnico. JPEG, PNG o WebP de hasta 5 MB.</p>
                </div>
                {errorFoto && (
                  <Aviso tipo="error" titulo="No se pudo cargar la foto">
                    {errorFoto}
                  </Aviso>
                )}
                {d.foto ? (
                  <>
                    <div className="foto con-imagen">
                      <img src={d.foto.miniatura} alt={`Fotografía adjunta: ${d.foto.nombre}`} />
                    </div>
                    <div className="archivo">
                      <Icono nombre="foto" />
                      <span style={{ flex: 1 }}>
                        <b>{d.foto.nombre}</b>
                        <br />
                        {describirFoto(d.foto)} · Carga completa
                      </span>
                      <button type="button" className="btn btn-secundario btn-chico" onClick={() => setD((x) => ({ ...x, foto: null }))}>
                        Quitar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="foto" style={{ minHeight: 180, flexDirection: 'column', gap: 10 }}>
                    <Icono nombre="foto" tam={28} />
                    <span>Aún no hay foto adjunta.</span>
                  </div>
                )}
                <div>
                  <label className="btn btn-secundario" htmlFor="archivo-foto" style={{ display: 'inline-flex' }}>
                    {d.foto ? 'Cambiar fotografía' : 'Adjuntar fotografía'}
                  </label>
                  <input id="archivo-foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirFoto} className="solo-lector" />
                </div>
              </>
            )}

            {paso === 4 && (
              <>
                <h2>Revisa tu reporte</h2>
                <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Dato etiqueta={manual ? 'Ubicación manual · Pendiente de validación por Mesa de servicio' : 'Ubicación'}>
                    Campus Centro · {ubicacion(d)}
                  </Dato>
                  <button type="button" className="btn-enlace" onClick={() => setPaso(1)}>
                    Editar
                  </button>
                </div>
                {d.referencia && <Dato etiqueta="Referencia">{d.referencia}</Dato>}
                <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Dato etiqueta="Título">{d.titulo}</Dato>
                  <button type="button" className="btn-enlace" onClick={() => setPaso(2)}>
                    Editar
                  </button>
                </div>
                <Dato etiqueta="Categoría sugerida">{d.categoriaSugerida}</Dato>
                <Dato etiqueta="Descripción">{d.descripcion}</Dato>
                {d.impactoObservado && <Dato etiqueta="Impacto observado">{d.impactoObservado}</Dato>}
                <div className="fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Dato etiqueta="Fotografía">{d.foto ? `${d.foto.nombre} · ${describirFoto(d.foto)}` : 'Sin foto'}</Dato>
                  <button type="button" className="btn-enlace" onClick={() => setPaso(3)}>
                    Editar
                  </button>
                </div>
                <Dato etiqueta="Reportante">
                  {yo.nombre} · {yo.correo}
                </Dato>
                <label className={`casilla ${errores.confirmado ? 'con-error' : ''}`}>
                  <input type="checkbox" checked={d.confirmado} onChange={cambiar('confirmado')} aria-invalid={errores.confirmado ? 'true' : undefined} />
                  Confirmo que la ubicación y la descripción corresponden a lo que observé.
                </label>
                {errores.confirmado && <span className="msg-error">{errores.confirmado}</span>}
              </>
            )}

            <div className="acciones" style={{ paddingTop: 4 }}>
              {paso === 1 ? (
                <a className="btn btn-secundario" href="#/inicio">
                  Cancelar reporte
                </a>
              ) : (
                <button type="button" className="btn btn-secundario" onClick={() => (setErrores({}), setPaso(paso - 1))}>
                  ← Volver
                </button>
              )}
              {paso < 4 ? (
                <button type="button" className="btn btn-primario" onClick={continuar}>
                  Continuar →
                </button>
              ) : (
                <button type="button" className="btn btn-primario" onClick={enviar}>
                  Enviar incidencia
                </button>
              )}
            </div>
          </form>
        </div>
        <Lateral yo={yo} foto={d.foto} paso={paso} />
      </div>
    </Marco>
  );
}
