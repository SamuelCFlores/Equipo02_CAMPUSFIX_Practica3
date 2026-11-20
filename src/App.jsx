// Enrutamiento por rol (RF-002): cada pantalla revisa que la sesión tenga permiso para verla.
import { useEffect } from 'react';
import { useDatos } from './estado/almacen.jsx';
import { useRuta, ir } from './estado/rutas.js';
import Acceso from './pantallas/Acceso.jsx';
import { Marco } from './componentes/Marco.jsx';
import { Aviso } from './componentes/ui.jsx';

function Pendiente({ nombre }) {
  return (
    <Marco actual="inicio">
      <Aviso tipo="info" titulo={nombre}>
        Pantalla en construcción.
      </Aviso>
    </Marco>
  );
}

export default function App() {
  const { yo, limpiarFlash } = useDatos();
  const ruta = useRuta();

  useEffect(() => {
    limpiarFlash();
  }, [ruta.pantalla, ruta.partes[1]]);

  useEffect(() => {
    if (yo && (ruta.pantalla === '' || ruta.pantalla === 'acceso')) ir(yo.rol === 'direccion' ? 'indicadores' : 'inicio');
  }, [yo, ruta.pantalla]);

  if (!yo) return <Acceso />;

  switch (ruta.pantalla) {
    case 'reportar':
      return <Pendiente nombre="Reportar incidencia" />;
    case 'incidencia':
      return <Pendiente nombre="Detalle de incidencia" />;
    case 'indicadores':
      return <Pendiente nombre="Indicadores" />;
    default:
      return <Pendiente nombre="Listado" />;
  }
}
