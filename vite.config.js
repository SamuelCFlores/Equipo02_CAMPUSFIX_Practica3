import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: la carpeta dist/ funciona abierta desde cualquier ruta o servidor estático.
export default defineConfig({
  plugins: [react()],
  base: './',
});
