// Pruebas de las reglas de dominio con el ejecutor nativo de Node (npm test).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { crearBaseInicial } from '../src/datos/semilla.js';
import { usuario, autenticar, puede } from '../src/dominio/accesos.js';
import { generarFolio, FORMATO_FOLIO } from '../src/dominio/folio.js';
import { MatrizImpactoUrgencia, ReglaPrioridad, usarRegla, reglaActiva } from '../src/dominio/reglaPrioridad.js';
import { puedeTransicionar } from '../src/dominio/estados.js';
import { validarFoto } from '../src/dominio/evidencias.js';
import { fecha, horasHabilesEntre, sumarHorasHabiles } from '../src/dominio/reloj.js';
import * as inc from '../src/dominio/incidencias.js';
import * as asig from '../src/dominio/asignacion.js';
import { indicadores, aCSV } from '../src/dominio/metricas.js';
import { ErrorValidacion, ErrorPermiso } from '../src/dominio/nucleo.js';

const U = (id) => usuario(id);
const T = (s) => fecha(s);

const reporte = {
  edificio: 'Edificio C',
  nivel: 'Planta baja',
  espacio: 'Aula 102',
  referencia: '',
  titulo: 'Contacto sin corriente',
  categoriaSugerida: 'Electricidad',
  descripcion: 'El contacto junto al pizarrón no tiene corriente.',
  confirmado: true,
};

test('RN-001: el folio sigue el formato CF-AAAAMMDD-XXXX y continúa el consecutivo', () => {
  const base = crearBaseInicial();
  const folio = generarFolio(T('2026-10-23 10:00'), Object.keys(base.incidencias));
  assert.equal(folio, 'CF-20261023-0049');
  assert.match(folio, FORMATO_FOLIO);
});

test('RF-010: la matriz provisional calcula la prioridad de los folios de Figma', () => {
  const m = new MatrizImpactoUrgencia();
  assert.equal(m.calcular({ impacto: 3, urgencia: 2 }).prioridad, 'Alta');
  assert.equal(m.calcular({ impacto: 2, urgencia: 2 }).prioridad, 'Media');
  assert.equal(m.calcular({ impacto: 1, urgencia: 2 }).prioridad, 'Baja');
  assert.throws(() => m.calcular({ impacto: 4, urgencia: 1 }));
});

test('Strategy: se puede cambiar la regla sin tocar Incidencias', () => {
  const original = reglaActiva();
  class TodoAlta extends ReglaPrioridad {
    calcular() {
      return { prioridad: 'Alta', explicacion: 'prueba' };
    }
  }
  usarRegla(new TodoAlta());
  const base = crearBaseInicial();
  const folio = inc.registrar(base, U('lucia'), { ...reporte, categoriaSugerida: 'Mobiliario' }, T('2026-10-23 10:00'));
  assert.equal(base.incidencias[folio].prioridad, 'Alta');
  usarRegla(original);
});

test('Tabla 30: transiciones y quién las ejecuta', () => {
  assert.ok(puedeTransicionar('Nuevo', 'En revisión', 'mesa'));
  assert.ok(!puedeTransicionar('Nuevo', 'Asignado', 'mesa'));
  assert.ok(puedeTransicionar('Asignado', 'Asignado', 'supervisor'));
  assert.ok(!puedeTransicionar('Asignado', 'Asignado', 'mesa'));
  assert.ok(puedeTransicionar('Resuelto', 'Cerrado', 'supervisor'));
  assert.ok(!puedeTransicionar('Resuelto', 'Cerrado', 'tecnico'));
});

test('RF-001/RF-002: acceso con correo institucional y permisos por rol', () => {
  assert.equal(autenticar('', '').ok, false);
  assert.ok(autenticar('lucia.mendez@umc.edu.mx', 'x').ok);
  assert.ok(autenticar('nadie@umc.edu.mx', 'x').errores.general);
  assert.ok(puede(U('ana'), 'asignar'));
  assert.ok(!puede(U('lucia'), 'asignar'));
});

test('FLU-01: el registro valida los pasos y genera folio con prioridad', () => {
  const base = crearBaseInicial();
  assert.throws(() => inc.registrar(base, U('lucia'), { ...reporte, descripcion: '' }, T('2026-10-23 10:00')), ErrorValidacion);
  assert.throws(() => inc.registrar(base, U('ana'), reporte, T('2026-10-23 10:00')), ErrorPermiso);
  const folio = inc.registrar(base, U('lucia'), reporte, T('2026-10-23 10:00'));
  const nueva = base.incidencias[folio];
  assert.equal(nueva.estado, 'Nuevo');
  assert.equal(nueva.prioridad, 'Alta');
  assert.equal(nueva.ubicacionManual, false);
  assert.ok(base.avisos.some((a) => a.para === 'lucia' && a.folio === folio));
});

test('RN-005 / RF-004: la foto debe ser JPEG, PNG o WebP de hasta 5 MB', () => {
  assert.equal(validarFoto({ type: 'image/jpeg', size: 2_400_000 }), null);
  assert.match(validarFoto({ type: 'image/gif', size: 1000 }), /Formato/);
  assert.match(validarFoto({ type: 'image/png', size: 6 * 1024 * 1024 }), /5 MB/);
});

test('FLU-02: la Mesa valida, vincula el duplicado, clasifica y asigna', () => {
  const base = crearBaseInicial();
  const ana = U('ana');
  const t = T('2026-10-23 09:40');
  inc.iniciarRevision(base, ana, 'CF-20261023-0042', t);
  const dup = inc.posiblesDuplicados(base, base.incidencias['CF-20261023-0042']);
  assert.deepEqual(dup.map((d) => d.folio), ['CF-20261023-0048']);

  inc.vincularDuplicado(base, ana, 'CF-20261023-0048', 'CF-20261023-0042', 'Misma ubicación, misma fuga.', t);
  const d = base.incidencias['CF-20261023-0048'];
  assert.equal(d.estado, 'Duplicado');
  assert.equal(d.reportante, 'diego'); // RN-003: conserva su reportante
  assert.deepEqual(base.incidencias['CF-20261023-0042'].duplicados, ['CF-20261023-0048']);

  assert.throws(() => asig.asignar(base, ana, 'CF-20261023-0042', 'javier', t), ErrorValidacion); // sin clasificar
  assert.throws(
    () => inc.clasificar(base, ana, 'CF-20261023-0042', { categoria: 'Plomería', impacto: 3, urgencia: 3, prioridadAjustada: 'Media' }, t),
    ErrorValidacion,
  ); // ajuste sin motivo
  inc.clasificar(base, ana, 'CF-20261023-0042', { categoria: 'Plomería', impacto: 3, urgencia: 3, ubicacionValidada: true }, t);
  assert.equal(base.incidencias['CF-20261023-0042'].prioridad, 'Alta');
  assert.throws(() => asig.asignar(base, ana, 'CF-20261023-0042', 'elena', t), ErrorValidacion);
  asig.asignar(base, ana, 'CF-20261023-0042', 'javier', t);
  assert.equal(base.incidencias['CF-20261023-0042'].estado, 'Asignado');
  // El reportante del duplicado también recibe el aviso.
  assert.ok(base.avisos.some((a) => a.para === 'diego' && a.folio === 'CF-20261023-0042'));
});

test('PAN-08: sin técnicos para la categoría no se puede asignar', () => {
  const base = crearBaseInicial();
  const ana = U('ana');
  const t = T('2026-10-23 09:40');
  assert.equal(asig.tecnicosPara('Electricidad').length, 0);
  inc.iniciarRevision(base, ana, 'CF-20261023-0045', t);
  inc.clasificar(base, ana, 'CF-20261023-0045', { categoria: 'Electricidad', impacto: 3, urgencia: 3 }, t);
  assert.throws(() => asig.asignar(base, ana, 'CF-20261023-0045', 'javier', t), /No hay técnicos/);
});

function asignada() {
  const base = crearBaseInicial();
  const ana = U('ana');
  const t = T('2026-10-23 09:40');
  inc.iniciarRevision(base, ana, 'CF-20261023-0042', t);
  inc.clasificar(base, ana, 'CF-20261023-0042', { categoria: 'Plomería', impacto: 3, urgencia: 3 }, t);
  asig.asignar(base, ana, 'CF-20261023-0042', 'javier', t);
  return base;
}

test('FLU-03: diagnóstico, espera, resolución con evidencia y validación', () => {
  const base = asignada();
  const javier = U('javier');
  const f = 'CF-20261023-0042';
  assert.throws(() => inc.diagnosticar(base, U('maria'), f, { diagnostico: 'x', acciones: 'x', tiempoEstimado: 'x' }, T('2026-10-23 10:05')), ErrorPermiso);
  inc.diagnosticar(base, javier, f, { diagnostico: 'Junta del sifón deteriorada.', acciones: 'Se cerró la llave de paso.', tiempoEstimado: '1 día' }, T('2026-10-23 10:05'));
  assert.equal(base.incidencias[f].estado, 'En progreso');
  assert.throws(() => inc.ponerEnEspera(base, javier, f, '', T('2026-10-23 10:35')), ErrorValidacion);
  inc.ponerEnEspera(base, javier, f, 'Falta la junta del sifón.', T('2026-10-23 10:35'));
  inc.reanudar(base, javier, f, T('2026-10-26 09:10'));
  // RN-005: sin foto ni motivo no se registra la resolución.
  assert.throws(() => inc.resolver(base, javier, f, { trabajo: 'Se cambió la junta.', mensaje: 'Listo.' }, T('2026-10-26 11:17')), (e) => Boolean(e.errores?.evidencia));
  inc.resolver(base, javier, f, { trabajo: 'Se cambió la junta.', mensaje: 'Listo.', foto: { nombre: 'reparacion_sifon.jpg', tipo: 'image/jpeg', tamanoKB: 1843 } }, T('2026-10-26 11:20'));
  assert.equal(base.incidencias[f].estado, 'Resuelto');

  const elena = U('elena');
  assert.throws(() => asig.validarCierre(base, elena, f, { criterios: [true, true, false], resultado: 'ok' }, T('2026-10-26 12:00')), ErrorValidacion);
  asig.devolver(base, elena, f, 'Falta probar el lavabo vecino.', T('2026-10-26 11:40'));
  assert.equal(base.incidencias[f].estado, 'En progreso');
  inc.resolver(base, javier, f, { trabajo: 'Se probaron ambos lavabos.', mensaje: 'Listo.', motivoSinFoto: 'La cámara no funciona.' }, T('2026-10-26 11:50'));
  asig.validarCierre(base, elena, f, { criterios: [true, true, true], resultado: 'Reparación correcta.' }, T('2026-10-26 12:00'));
  assert.equal(base.incidencias[f].estado, 'Cerrado');
  assert.ok(base.bitacora.length > 10);
});

test('RN-008: solo el Supervisor reasigna, con motivo', () => {
  const base = asignada();
  const f = 'CF-20261023-0042';
  assert.throws(() => asig.reasignar(base, U('ana'), f, 'maria', 'Ausencia', T('2026-10-23 09:50')), ErrorPermiso);
  assert.throws(() => asig.reasignar(base, U('elena'), f, 'maria', '', T('2026-10-23 09:50')), ErrorValidacion);
  asig.reasignar(base, U('elena'), f, 'maria', 'Javier está en otra urgencia.', T('2026-10-23 09:50'));
  assert.equal(base.incidencias[f].tecnico, 'maria');
});

test('RN-007: el reportante no ve notas internas ni diagnóstico', () => {
  const base = asignada();
  const f = 'CF-20261023-0042';
  inc.agregarNota(base, U('ana'), f, 'Revisar primero la llave de paso.', T('2026-10-23 09:41'));
  assert.equal(inc.vistaPara(U('lucia'), base.incidencias[f]).notas.length, 0);
  assert.equal(inc.vistaPara(U('javier'), base.incidencias[f]).notas.length, 1);
});

test('RN-004 / RN-009: reapertura dentro de 48 horas hábiles', () => {
  // Cierre jueves 22 oct 17:30; el viernes cuenta, sábado y domingo no: vence lunes 26 oct 17:30.
  assert.equal(new Date(sumarHorasHabiles(T('2026-10-22 17:30'), 48)).toISOString(), T('2026-10-26 17:30'));
  assert.equal(horasHabilesEntre(T('2026-10-23 17:30'), T('2026-10-26 17:30')), 24);
  const base = crearBaseInicial();
  const f = 'CF-20261021-0029';
  assert.throws(() => inc.solicitarReapertura(base, U('diego'), f, 'Sigue rota', T('2026-10-23 10:00')), ErrorPermiso);
  assert.throws(() => inc.solicitarReapertura(base, U('lucia'), f, 'Sigue rota', T('2026-10-27 10:00')), (e) => Boolean(e.errores?.plazo));
  inc.solicitarReapertura(base, U('lucia'), f, 'El respaldo volvió a soltarse.', T('2026-10-23 10:00'));
  inc.aceptarReapertura(base, U('ana'), f, T('2026-10-23 10:10'));
  assert.equal(base.incidencias[f].estado, 'Reabierto');
});

test('CU-08: indicadores sin duplicados y exportación CSV', () => {
  const base = crearBaseInicial();
  inc.vincularDuplicado(base, U('ana'), 'CF-20261023-0048', 'CF-20261023-0042', 'Misma fuga.', T('2026-10-23 09:45'));
  const m = indicadores(Object.values(base.incidencias));
  assert.equal(m.total, 9);
  assert.equal(m.duplicadosExcluidos, 1);
  assert.equal(m.cerradas, 1);
  assert.equal(m.resueltasPorValidar, 2);
  assert.ok(m.medianaDias > 0);
  const csv = aCSV(Object.values(base.incidencias));
  assert.ok(csv.startsWith('folio,fecha_reporte'));
  assert.ok(!csv.includes('CF-20261023-0048'));
  assert.ok(!csv.includes('lucia'));
});

test('RN-010: el técnico corrige la categoría después del diagnóstico', () => {
  const base = asignada();
  const f = 'CF-20261023-0042';
  const javier = U('javier');
  assert.throws(() => inc.corregirCategoria(base, javier, f, 'Albañilería', 'Fisura en el muro', T('2026-10-23 10:00')), ErrorPermiso);
  inc.diagnosticar(base, javier, f, { diagnostico: 'Fisura en el muro detrás del lavabo.', acciones: 'Se cerró la llave.', tiempoEstimado: '2 días' }, T('2026-10-23 10:05'));
  assert.throws(() => inc.corregirCategoria(base, javier, f, 'Albañilería', '', T('2026-10-23 10:10')), ErrorValidacion);
  assert.throws(() => inc.corregirCategoria(base, U('ana'), f, 'Albañilería', 'x', T('2026-10-23 10:10')), ErrorPermiso);
  inc.corregirCategoria(base, javier, f, 'Albañilería', 'La fuga viene de una fisura en el muro.', T('2026-10-23 10:10'));
  assert.equal(base.incidencias[f].categoria, 'Albañilería');
  assert.equal(base.incidencias[f].prioridad, 'Alta');
  assert.ok(base.bitacora.at(-1).accion.includes('RN-010'));
});
