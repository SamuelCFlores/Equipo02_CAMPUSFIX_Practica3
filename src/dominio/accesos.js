// COMP-01 · Accesos (RF-001, RF-002). En el sistema real autentica contra el directorio
// institucional; en el prototipo solo reconoce las cuentas ficticias de la demostración y no guarda
// ninguna contraseña.

export const ROLES = {
  reportante: 'Reportante',
  mesa: 'Mesa de servicio',
  tecnico: 'Técnico',
  supervisor: 'Supervisor',
  direccion: 'Dirección administrativa',
};

// Personas del prototipo de Figma (Práctica 2). Los correos siguen el formato nombre.apellido.
export const USUARIOS = [
  { id: 'lucia', nombre: 'Lucía Méndez', correo: 'lucia.mendez@umc.edu.mx', rol: 'reportante' },
  { id: 'diego', nombre: 'Diego Ramírez', correo: 'diego.ramirez@umc.edu.mx', rol: 'reportante' },
  { id: 'ana', nombre: 'Ana Salas', correo: 'ana.salas@umc.edu.mx', rol: 'mesa' },
  { id: 'javier', nombre: 'Javier Torres', correo: 'javier.torres@umc.edu.mx', rol: 'tecnico', especialidad: 'Plomería', disponibilidad: 'Disponible hoy' },
  { id: 'maria', nombre: 'María López', correo: 'maria.lopez@umc.edu.mx', rol: 'tecnico', especialidad: 'Plomería', disponibilidad: 'En atención' },
  { id: 'elena', nombre: 'Elena Ruiz', correo: 'elena.ruiz@umc.edu.mx', rol: 'supervisor' },
  { id: 'daniel', nombre: 'Daniel Ortega', correo: 'daniel.ortega@umc.edu.mx', rol: 'direccion' },
];

export function usuario(id) {
  return USUARIOS.find((u) => u.id === id) || null;
}

export function iniciales(nombre) {
  return nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

// RF-002: funciones disponibles por rol.
const PERMISOS = {
  reportante: ['reportar', 'ver_propias', 'solicitar_reapertura'],
  mesa: ['ver_todas', 'validar', 'clasificar', 'vincular_duplicado', 'asignar', 'aceptar_reapertura', 'nota_interna', 'ver_internos'],
  tecnico: ['ver_asignadas', 'diagnosticar', 'recategorizar', 'poner_en_espera', 'reanudar', 'resolver', 'nota_interna', 'ver_internos'],
  supervisor: ['ver_todas', 'validar_cierre', 'devolver', 'reasignar', 'nota_interna', 'ver_internos'],
  direccion: ['ver_metricas', 'exportar'],
};

export function puede(u, accion) {
  return Boolean(u && (PERMISOS[u.rol] || []).includes(accion));
}

/** Simula el inicio de sesión institucional (PAN-01). */
export function autenticar(correo, contrasena) {
  const errores = {};
  const c = String(correo || '').trim().toLowerCase();
  if (!c) errores.correo = 'Escribe tu correo institucional.';
  else if (!c.endsWith('@umc.edu.mx')) errores.correo = 'Usa tu correo institucional (@umc.edu.mx).';
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña para continuar.';
  if (Object.keys(errores).length) return { ok: false, errores };
  const u = USUARIOS.find((x) => x.correo === c);
  if (!u) return { ok: false, errores: { general: 'No encontramos esa cuenta en el directorio institucional. Revisa el correo.' } };
  return { ok: true, usuario: u };
}
