// Componentes de interfaz reutilizables (guía de estilo del DAS, Tablas 36 a 38).
import { TONO_ESTADO } from '../dominio/estados.js';

export function Logo({ tam = 30, fondo = false }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="1.2" y="1.2" width="37.6" height="37.6" rx="9" fill={fondo ? '#0F2A47' : 'none'} stroke="#FFFFFF" strokeWidth="2.4" />
      <path d="M12 27V15l8-5 8 5v12" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M17 27v-6h6v6" fill="none" stroke="#F2B544" strokeWidth="2.4" />
    </svg>
  );
}

const TRAZOS = {
  info: (
    <>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v5M10 6.2v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  alerta: (
    <>
      <path d="M10 2l8.5 15h-17z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 8v4M10 14.5v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  error: (
    <>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 5.8v5M10 13.8v.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  exito: (
    <>
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 10.2l2.4 2.4 4.6-4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  buscar: (
    <>
      <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  campana: (
    <path d="M5 14h10l-1.2-1.6V9a3.8 3.8 0 0 0-7.6 0v3.4zM8.4 16.4a1.7 1.7 0 0 0 3.2 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  ),
  foto: (
    <>
      <rect x="2.5" y="4" width="15" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7.5" cy="8.5" r="1.5" fill="currentColor" />
      <path d="M3 14l4.5-4 3.5 3 2.5-2 3.5 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </>
  ),
};

export function Icono({ nombre, tam = 20 }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 20 20" aria-hidden="true">
      {TRAZOS[nombre]}
    </svg>
  );
}

/** Mensaje de estado (info, alerta, error o exito). Los errores se anuncian a lectores de pantalla. */
export function Aviso({ tipo = 'info', titulo, children, className = '' }) {
  return (
    <div className={`aviso ${tipo} ${className}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono nombre={tipo} />
      <div className="cuerpo">
        {titulo && <b>{titulo}</b>}
        {children && <span>{children}</span>}
      </div>
    </div>
  );
}

export function Chip({ estado }) {
  const texto = estado === 'En espera de refacción' ? 'En espera' : estado;
  return (
    <span className={`chip ${TONO_ESTADO[estado] || 'nuevo'}`} title={estado}>
      {texto}
    </span>
  );
}

const SIMBOLO = { Alta: '▲', Media: '■', Baja: '▼' };

/** La prioridad usa símbolo y texto, no solo color (Tabla 38, criterio 1.4.1). */
export function Prioridad({ valor }) {
  return (
    <span className={`prioridad ${valor}`}>
      <span aria-hidden="true">{SIMBOLO[valor]}</span> {valor}
    </span>
  );
}

export function Campo({ id, etiqueta, error, ayuda, requerido, children }) {
  return (
    <div className={`campo ${error ? 'con-error' : ''}`}>
      <label htmlFor={id}>
        {etiqueta}
        {requerido && ' *'}
      </label>
      {children}
      {error && (
        <span className="msg-error" id={`${id}-error`}>
          {error}
        </span>
      )}
      {ayuda && <span className="ayuda">{ayuda}</span>}
    </div>
  );
}

/** Propiedades de accesibilidad para un control con posible error. */
export function aria(id, error) {
  return { id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? `${id}-error` : undefined };
}

export function Kpi({ etiqueta, valor, nota }) {
  return (
    <div className="kpi">
      <span className="etiqueta">{etiqueta}</span>
      <span className="valor">{valor}</span>
      {nota && <span className="nota">{nota}</span>}
    </div>
  );
}

export function Dato({ etiqueta, children }) {
  return (
    <div className="dato">
      <span>{etiqueta}</span>
      <b>{children}</b>
    </div>
  );
}
