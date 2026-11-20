// PAN-01 · Inicio de sesión institucional (RF-001, RF-002). Estados: normal y error de credenciales.
import { useState } from 'react';
import { useDatos } from '../estado/almacen.jsx';
import { ir } from '../estado/rutas.js';
import { USUARIOS, ROLES, autenticar, iniciales } from '../dominio/accesos.js';
import { Logo, Aviso, Campo, aria } from '../componentes/ui.jsx';

export default function Acceso() {
  const { entrar } = useDatos();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState({});

  const iniciar = (u) => {
    entrar(u.id);
    ir(u.rol === 'direccion' ? 'indicadores' : 'inicio');
  };

  const enviar = (e) => {
    e.preventDefault();
    const r = autenticar(correo, contrasena);
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    setContrasena('');
    iniciar(r.usuario);
  };

  return (
    <div className="acceso">
      <section className="presentacion">
        <div className="fila" style={{ gap: 14 }}>
          <Logo tam={40} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: 22, letterSpacing: '0.04em' }}>CAMPUSFIX</strong>
            <span style={{ fontSize: 14, color: '#C9D4E2' }}>Universidad Metropolitana del Centro</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h1>Reporta una falla y sigue su atención con tu folio.</h1>
          <p>
            Aulas, laboratorios, sanitarios, red y mobiliario de Campus Centro. Cada reporte recibe un folio y una prioridad, y te
            avisamos en cada cambio de estado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="fila" style={{ gap: 12, flexWrap: 'nowrap' }}>
              <span className="paso-num">01</span>Reporta con ubicación, descripción y foto
            </span>
            <span className="fila" style={{ gap: 12, flexWrap: 'nowrap' }}>
              <span className="paso-num">02</span>Mesa de servicio valida y asigna un técnico
            </span>
            <span className="fila" style={{ gap: 12, flexWrap: 'nowrap' }}>
              <span className="paso-num">03</span>El técnico cierra con evidencia y Supervisión valida
            </span>
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#C9D4E2' }}>Si existe un riesgo inmediato, aléjate del área y llama a Seguridad: ext. 1100.</p>
      </section>

      <section className="formulario">
        <form onSubmit={enviar} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 style={{ fontSize: 26 }}>Inicia sesión</h2>
            <p className="tenue">Usa tu cuenta institucional del directorio de la UMC.</p>
          </div>
          {errores.general && <Aviso tipo="error" titulo="No pudimos iniciar sesión">{errores.general}</Aviso>}
          <Campo id="correo" etiqueta="Correo institucional" error={errores.correo}>
            <input
              {...aria('correo', errores.correo)}
              type="email"
              autoComplete="username"
              placeholder="nombre.apellido@umc.edu.mx"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </Campo>
          <Campo id="contrasena" etiqueta="Contraseña" error={errores.contrasena}>
            <input
              {...aria('contrasena', errores.contrasena)}
              type="password"
              autoComplete="current-password"
              placeholder="Contraseña del directorio"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </Campo>
          <button type="submit" className="btn btn-primario">
            Entrar
          </button>
          <Aviso tipo="info">
            Prototipo sin conexión al directorio: las cuentas de demostración aceptan cualquier contraseña no vacía y no se guarda
            ninguna.
          </Aviso>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="etiqueta" style={{ fontSize: 15, fontWeight: 600 }}>
              Acceso rápido de demostración
            </span>
            <div className="cuentas">
              {USUARIOS.map((u) => (
                <button key={u.id} type="button" className="cuenta" onClick={() => iniciar(u)}>
                  <span className="avatar" aria-hidden="true">
                    {iniciales(u.nombre)}
                  </span>
                  <span>
                    {u.nombre}
                    <small>{ROLES[u.rol]}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
