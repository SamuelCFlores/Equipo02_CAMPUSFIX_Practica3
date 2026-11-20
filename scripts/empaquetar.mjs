// Junta la compilación de Vite (dist/) en un solo archivo HTML que se abre con doble clic, sin
// servidor ni instalación: Chrome y Edge no cargan módulos JavaScript separados desde el disco
// (file://), pero sí el código incluido dentro de la página.
//   npm run descarga   ->   Descarga/CAMPUSFIX/CAMPUSFIX.html
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'));
const DIST = path.join(RAIZ, 'dist');
const SALIDA = path.join(RAIZ, 'Descarga', 'CAMPUSFIX');

let html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');

// JavaScript del módulo, incrustado (se escapa «</script» para no cerrar la etiqueta antes de tiempo).
html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/, (_, archivo) => {
  const js = fs.readFileSync(path.join(DIST, archivo), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">\n${js}\n</script>`;
});

// Hoja de estilos incrustada.
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/, (_, archivo) =>
  `<style>\n${fs.readFileSync(path.join(DIST, archivo), 'utf8')}\n</style>`);

// Ícono como data URI.
const svg = fs.readFileSync(path.join(DIST, 'logo.svg'));
html = html.replace('href="./logo.svg"', () => `href="data:image/svg+xml;base64,${svg.toString('base64')}"`);

if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('Quedó una referencia a dist/assets sin incrustar');

fs.mkdirSync(SALIDA, { recursive: true });
const destino = path.join(SALIDA, 'CAMPUSFIX.html');
fs.writeFileSync(destino, html);
console.log(`listo: ${path.relative(RAIZ, destino)} (${Math.round(fs.statSync(destino).size / 1024)} KB)`);
