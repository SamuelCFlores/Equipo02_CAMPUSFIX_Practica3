// Enrutamiento por rol (RF-002): cada pantalla revisa que la sesión tenga permiso para verla.
import { useEffect } from 'react';
import { useDatos } from './estado/almacen.jsx';
import { useRuta, ir } from './estado/rutas.js';
import { puede } from './dominio/accesos.js';
import Acceso from './pantallas/Acceso.jsx';
import Listado from './pantallas/Listado.jsx';
import Reportar from './pantallas/Reportar.jsx';
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

function SinPermiso() {
  return (
    <Marco actual="">
      <Aviso tipo="alerta" titulo="Esta sección no está disponible para tu rol">
        Regresa a <a href="#/inicio">tu pantalla de inicio</a>.
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
      return puede(yo, 'reportar') ? <Reportar /> : <SinPermiso />;
    case 'incidencia':
      return <Pendiente nombre="Detalle de incidencia" />;
    case 'indicadores':
      return puede(yo, 'ver_metricas') ? <Pendiente nombre="Indicadores" /> : <SinPermiso />;
    default:
      return yo.rol === 'direccion' ? <Pendiente nombre="Indicadores" /> : <Listado />;
  }
}
