// Estado de la aplicación: datos de la demostración, sesión y reloj simulado.
// Sustituye a la API REST del DAS: cada operación de dominio recibe una copia de los datos, la
// modifica y el resultado se guarda en localStorage del navegador.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { crearBaseInicial } from '../datos/semilla.js';
import { usuario } from '../dominio/accesos.js';
import { ahoraSimulado } from '../dominio/reloj.js';

const CLAVE = 'campusfix.demo.v1';
const Contexto = createContext(null);

function estadoNuevo() {
  return { base: crearBaseInicial(), inicio: Date.now(), sesion: null };
}

function cargar() {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (texto) {
      const guardado = JSON.parse(texto);
      if (guardado?.base?.incidencias) return guardado;
    }
  } catch {
    /* sin almacenamiento disponible: se usa la demo en memoria */
  }
  return estadoNuevo();
}

export function ProveedorDatos({ children }) {
  const [estado, setEstado] = useState(cargar);
  const [, setPulso] = useState(0);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado));
    } catch {
      /* cuota llena o modo privado: la demo sigue en memoria */
    }
  }, [estado]);

  // Refresca la hora mostrada cada 30 s.
  useEffect(() => {
    const id = setInterval(() => setPulso((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const yo = usuario(estado.sesion);
  const ahora = ahoraSimulado(estado.inicio);

  /** Ejecuta una operación de dominio (base, usuario, ...args, ahora). Lanza los errores de validación. */
  const ejecutar = useCallback(
    (operacion, ...args) => {
      const base = structuredClone(estado.base);
      const resultado = operacion(base, usuario(estado.sesion), ...args, ahoraSimulado(estado.inicio).toISOString());
      setEstado((e) => ({ ...e, base }));
      return resultado;
    },
    [estado],
  );

  const valor = useMemo(
    () => ({
      base: estado.base,
      yo,
      ahora,
      ejecutar,
      flash,
      /** Mensaje de éxito; con `conservar` sobrevive al siguiente cambio de pantalla. */
      avisar: (texto, { tipo = 'exito', conservar = false } = {}) => setFlash({ texto, tipo, conservar }),
      limpiarFlash: () => setFlash((f) => (f?.conservar ? { ...f, conservar: false } : null)),
      entrar: (id) => setEstado((e) => ({ ...e, sesion: id })),
      salir: () => setEstado((e) => ({ ...e, sesion: null })),
      reiniciar: () => {
        setFlash(null);
        setEstado({ ...estadoNuevo(), sesion: estado.sesion });
      },
      marcarLeidos: () =>
        setEstado((e) => ({
          ...e,
          base: { ...e.base, avisos: e.base.avisos.map((a) => (a.para === e.sesion ? { ...a, leido: true } : a)) },
        })),
    }),
    [estado, flash, ahora.getMinutes()],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDatos() {
  return useContext(Contexto);
}

/** Ejecuta acciones de dominio y guarda los errores por campo para mostrarlos (PAN-07). */
export function useAccion() {
  const { ejecutar, avisar } = useDatos();
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const correr = (operacion, args, exito) => {
    try {
      const r = ejecutar(operacion, ...args);
      setErrores({});
      setError(null);
      if (exito) avisar(exito);
      return r ?? true;
    } catch (e) {
      setErrores(e.errores || {});
      setError(e.message);
      return false;
    }
  };
  return { errores, error, correr, limpiar: () => (setErrores({}), setError(null)) };
}
