import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return <main style={{ fontFamily: 'Public Sans, sans-serif', padding: 32 }}>CAMPUSFIX · prototipo en construcción</main>;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
