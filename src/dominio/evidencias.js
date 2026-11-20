// COMP-07 · Evidencias (RF-004, RF-015, RNF-002; DAT-06). Fotografías JPEG, PNG o WebP de hasta
// 5 MB. Sin servidor, el prototipo guarda una miniatura en el navegador.

export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FOTO_BYTES = 5 * 1024 * 1024;

export function validarFoto(archivo) {
  if (!archivo) return 'Selecciona una fotografía.';
  if (!TIPOS_FOTO.includes(archivo.type)) return 'Formato no admitido. Usa una foto JPEG, PNG o WebP.';
  if (archivo.size > MAX_FOTO_BYTES) {
    const mb = (archivo.size / 1024 / 1024).toFixed(1);
    return `La foto pesa ${mb} MB. El límite es de 5 MB; reduce su tamaño o toma otra.`;
  }
  return null;
}

export function describirFoto(foto) {
  const formato = { 'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/webp': 'WebP' }[foto.tipo] || 'Imagen';
  const tam = foto.tamanoKB >= 1024 ? `${(foto.tamanoKB / 1024).toFixed(1)} MB` : `${foto.tamanoKB} KB`;
  return `${formato} · ${tam}`;
}
