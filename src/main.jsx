import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ProveedorDatos } from './estado/almacen.jsx';
import App from './App.jsx';
import './estilos/app.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProveedorDatos>
      <App />
    </ProveedorDatos>
  </StrictMode>,
);
