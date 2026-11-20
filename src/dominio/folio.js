// COMP-02 · Generación de folio único (RF-005, RN-001). Formato CF-AAAAMMDD-XXXX.
// En los datos del prototipo el consecutivo XXXX no se reinicia por día (0029 y 0030 el 21 oct,
// 0034 a 0038 el 22 oct, 0041 a 0048 el 23 oct), así que se toma el mayor existente + 1.

export const FORMATO_FOLIO = /^CF-\d{8}-\d{4}$/;

export function generarFolio(fechaIso, foliosExistentes) {
  const d = new Date(fechaIso);
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const mayor = foliosExistentes
    .filter((f) => FORMATO_FOLIO.test(f))
    .map((f) => Number(f.slice(-4)))
    .reduce((a, b) => Math.max(a, b), 0);
  const folio = `CF-${ymd}-${String(mayor + 1).padStart(4, '0')}`;
  if (foliosExistentes.includes(folio)) throw new Error('Folio repetido');
  return folio;
}
