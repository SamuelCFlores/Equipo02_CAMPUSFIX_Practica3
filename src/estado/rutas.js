// Rutas por hash (#/inicio, #/incidencia/CF-…): funcionan al abrir el sitio desde cualquier carpeta
// o servidor estático, sin configuración extra.
import { useEffect, useState } from 'react';

export function leerRuta() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [camino, consulta = ''] = hash.split('?');
  const partes = camino.split('/').filter(Boolean).map(decodeURIComponent);
  return { partes, pantalla: partes[0] || '', params: Object.fromEntries(new URLSearchParams(consulta)) };
}

export function ir(ruta) {
  window.location.hash = ruta.startsWith('#') ? ruta : `#/${ruta.replace(/^\//, '')}`;
}

export function useRuta() {
  const [ruta, setRuta] = useState(leerRuta);
  useEffect(() => {
    const cambio = () => {
      setRuta(leerRuta());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', cambio);
    return () => window.removeEventListener('hashchange', cambio);
  }, []);
  return ruta;
}
