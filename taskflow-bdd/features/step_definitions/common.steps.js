// features/step_definitions/common.steps.js
// ──────────────────────────────────────────────────────────────
// Steps GENÉRICOS compartidos por todas las features.
// Viven en UN solo lugar para evitar definiciones ambiguas.
// El estado se guarda en el World (this) → compartido entre todos
// los steps de un mismo scenario, sin importar el archivo.
// ──────────────────────────────────────────────────────────────
const { Given, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// ── Background común ──────────────────────────────────────────

Given('el servidor de TaskFlow está disponible', async function () {
  // TODO: health check real → const res = await api.get('/health');
  console.log('  → Verificando disponibilidad del servidor...');
});

Given('la base de datos está limpia', async function () {
  // TODO: limpiar datos de test entre escenarios
  console.log('  → Limpiando base de datos...');
});

// ── Aserciones genéricas sobre la respuesta ───────────────────

Then('la respuesta tiene código de estado {int}', function (expectedStatus) {
  expect(this.response).to.not.be.null;
  expect(this.response.status).to.equal(
    expectedStatus,
    `Se esperaba status ${expectedStatus} pero se recibió ${this.response.status}`
  );
});

Then('el cuerpo contiene el campo {string}', function (field) {
  expect(this.response.data).to.have.property(field);
});

Then('el cuerpo contiene {string} con valor {string}', function (field, value) {
  expect(this.response.data).to.have.property(field);
  expect(String(this.response.data[field])).to.equal(value);
});
