// COMP-08 · Catálogos y configuración (RF-010, RF-025, RNF-013).
// Categorías, áreas, espacios y niveles de impacto/urgencia. En el sistema real se configuran sin
// recompilar; aquí son constantes de la demostración.

export const NIVEL_IMPACTO = { 1: 'Bajo', 2: 'Medio', 3: 'Alto' };
export const NIVEL_URGENCIA = { 1: 'Baja', 2: 'Media', 3: 'Alta' };

// DAT-05: cada categoría tiene un área y un impacto sugerido (entero). Los valores de impacto son
// provisionales mientras la Dirección aprueba la matriz (PP-01, SUP-06).
export const CATEGORIAS = [
  { nombre: 'Plomería', area: 'Mantenimiento', impacto: 3 },
  { nombre: 'Electricidad', area: 'Mantenimiento', impacto: 3 },
  { nombre: 'Climatización', area: 'Mantenimiento', impacto: 2 },
  { nombre: 'Albañilería', area: 'Mantenimiento', impacto: 2 },
  { nombre: 'Herrería', area: 'Mantenimiento', impacto: 1 },
  { nombre: 'Mobiliario', area: 'Servicios generales', impacto: 1 },
  { nombre: 'Red y cómputo', area: 'TI', impacto: 2 },
];

export function categoria(nombre) {
  return CATEGORIAS.find((c) => c.nombre === nombre) || null;
}

export const EDIFICIOS = ['Edificio A', 'Edificio B', 'Edificio C', 'Edificio D', 'Biblioteca', 'Cafetería', 'Patio central'];
export const NIVELES = ['Planta baja', 'Piso 1', 'Piso 2', 'Exterior'];

// Catálogo de espacios conocido (los que aparecen en los datos del prototipo). Si el espacio no está
// aquí, la ubicación se guarda como manual y la Mesa de servicio la valida (DAT-04, DEP-03).
export const ESPACIOS = {
  'Edificio A': ['Sanitarios', 'Aula 204', 'Acceso'],
  'Edificio B': ['Sanitarios'],
  'Edificio C': ['Aula 102'],
  'Edificio D': ['Laboratorio 2'],
  Biblioteca: [],
  'Cafetería': ['Área de lavado'],
  'Patio central': ['Acceso'],
};

export function espacioEnCatalogo(edificio, espacio) {
  const lista = ESPACIOS[edificio] || [];
  return lista.some((e) => e.toLowerCase() === String(espacio || '').trim().toLowerCase());
}

// Palabras clave para sugerir la categoría a partir del título (PAN-05: «Sugerida por la ubicación y
// el título. Puedes cambiarla; Mesa de servicio la confirmará»).
const PALABRAS = [
  ['Plomería', ['fuga', 'agua', 'lavabo', 'inodoro', 'llave', 'tubería', 'goteo', 'drenaje', 'sanitario']],
  ['Electricidad', ['luz', 'lámpara', 'lampara', 'contacto', 'eléctric', 'electric', 'corriente', 'apagón']],
  ['Climatización', ['aire', 'clima', 'calefacción', 'ventilación', 'enfría']],
  ['Red y cómputo', ['red', 'internet', 'wifi', 'computadora', 'proyector', 'impresora']],
  ['Mobiliario', ['silla', 'mesa', 'banca', 'pupitre', 'escritorio', 'pizarrón']],
  ['Herrería', ['puerta', 'reja', 'ventana', 'cerradura', 'barandal']],
  ['Albañilería', ['piso', 'loseta', 'pared', 'grieta', 'muro', 'techo', 'banqueta']],
];

export function sugerirCategoria(texto) {
  const t = String(texto || '').toLowerCase();
  if (!t.trim()) return '';
  const hallada = PALABRAS.find(([, claves]) => claves.some((c) => t.includes(c)));
  return hallada ? hallada[0] : '';
}

const ABREVIA = { 'Planta baja': 'PB' };

/** "Edificio B · Planta baja · Sanitarios" (omite partes vacías). */
export function ubicacion(inc, corta = false) {
  const nivel = corta ? ABREVIA[inc.nivel] || inc.nivel : inc.nivel;
  return [inc.edificio, nivel, inc.espacio].filter(Boolean).join(' · ');
}
