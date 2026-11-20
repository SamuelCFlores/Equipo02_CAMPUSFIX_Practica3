// Lectura de fotografías en el navegador (COMP-07 simulado): valida el archivo y genera una
// miniatura JPEG para poder guardarla en localStorage.
import { validarFoto } from '../dominio/evidencias.js';

const LADO_MAXIMO = 640;

export async function leerFoto(archivo) {
  const error = validarFoto(archivo);
  if (error) return { error };
  try {
    const imagen = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    return {
      foto: {
        nombre: archivo.name,
        tipo: archivo.type,
        tamanoKB: Math.round(archivo.size / 1024),
        miniatura: lienzo.toDataURL('image/jpeg', 0.72),
      },
    };
  } catch {
    return { error: 'No se pudo leer la imagen. Intenta con otra foto.' };
  }
}
