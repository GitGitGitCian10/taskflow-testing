// features/step_definitions/auth.steps.js
const { Given, When } = require('@cucumber/cucumber');
const axios = require('axios');

// ──────────────────────────────────────────────
// CONFIGURACIÓN
// ──────────────────────────────────────────────
const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

// El estado del scenario se guarda en el World (this), compartido
// entre todos los step definitions. Las aserciones genéricas
// (status / cuerpo) viven en common.steps.js

// ──────────────────────────────────────────────
// STEPS: GIVEN
// ──────────────────────────────────────────────

Given('que el email {string} no está registrado', async function (email) {
  // TODO: asegurarse de que el email no exista en la BD
  console.log(`  → Email ${email} no registrado (pendiente implementar)`);
});

Given('que el email {string} ya está registrado', async function (email) {
  // TODO: crear el usuario previamente en la BD
  console.log(`  → Email ${email} ya registrado (pendiente implementar)`);
});

Given('que ningún usuario está registrado', async function () {
  // TODO: limpiar todos los usuarios
  console.log('  → Base de datos sin usuarios (pendiente implementar)');
});

Given('que existe el usuario con email {string} y password {string}', async function (email, password) {
  // TODO: crear usuario con las credenciales dadas
  console.log(`  → Creando usuario ${email} (pendiente implementar)`);
});

// ──────────────────────────────────────────────
// STEPS: WHEN
// ──────────────────────────────────────────────

When('el usuario envía los datos de registro:', async function (dataTable) {
  const data = dataTable.rowsHash(); // tabla → objeto { email, password, name }

  // TODO: descomentar cuando se conecte a la API real
  // this.response = await api.post('/auth/register', { ...data });

  // Placeholder: responde según las reglas de validación esperadas
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    this.response = { status: 400, data: { message: 'Email inválido' } };
  } else if (data.password.length < 8) {
    this.response = { status: 400, data: { message: 'La contraseña debe tener al menos 8 caracteres' } };
  } else if (data.email === 'existente@test.com') {
    this.response = { status: 409, data: { message: 'Email ya registrado' } };
  } else {
    this.response = { status: 201, data: { id: 'test-id', email: data.email } };
  }
  console.log(`  → POST /auth/register con email: ${data.email}`);
});

When('el usuario envía las credenciales:', async function (dataTable) {
  const data = dataTable.rowsHash();

  // TODO: descomentar cuando se conecte a la API real
  // this.response = await api.post('/auth/login', { ...data });

  if (data.password === 'Pass123!') {
    this.response = { status: 200, data: { token: 'fake-jwt-token', email: data.email } };
  } else {
    this.response = { status: 401, data: { message: 'Credenciales inválidas' } };
  }
  console.log(`  → POST /auth/login con email: ${data.email}`);
});
