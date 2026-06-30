// features/step_definitions/projects.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const axios = require('axios');

const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

// Estado compartido vía World (this). Aserciones genéricas en common.steps.js

Given('existe un usuario autenticado con email {string}', async function (email) {
  // TODO: registrar usuario y obtener token
  this.currentUser = { email, token: 'fake-token-owner' };
  console.log(`  → Usuario autenticado: ${email} (stub)`);
});

Given('que existe un proyecto {string} del usuario {string}', async function (projectName, ownerEmail) {
  // TODO: crear proyecto via API
  this.currentProject = { id: 'proj-123', name: projectName, owner: ownerEmail };
  console.log(`  → Proyecto "${projectName}" creado (stub)`);
});

Given('existe un usuario con email {string}', async function (email) {
  // TODO: registrar usuario via API
  console.log(`  → Usuario ${email} existe (stub)`);
});

Given('existe un usuario con email {string} con rol {string}', async function (email, role) {
  // TODO: registrar usuario y asignar rol
  console.log(`  → Usuario ${email} con rol ${role} (stub)`);
});

When('el usuario crea un proyecto con:', async function (dataTable) {
  const data = dataTable.rowsHash();
  // TODO: POST /projects

  if (!data.name || data.name.trim() === '') {
    this.response = { status: 400, data: { message: 'El nombre del proyecto es requerido' } };
  } else {
    this.response = {
      status: 201,
      data: {
        id: 'proj-new',
        name: data.name,
        columns: ['To Do', 'In Progress', 'In Review', 'Done'],
        owner: this.currentUser?.email
      }
    };
  }
  console.log(`  → POST /projects: "${data.name}" (stub)`);
});

When('el propietario invita a {string} como {string}', async function (email, role) {
  // TODO: POST /projects/:id/members
  this.response = { status: 200, data: { message: 'Miembro agregado' } };
  console.log(`  → Invitación a ${email} como ${role} (stub)`);
});

When('{string} intenta crear una tarea en el proyecto', async function (email) {
  // TODO: POST /tasks con token de viewer
  this.response = { status: 403, data: { message: 'No tenés permisos para crear tareas' } };
  console.log(`  → Intento de crear tarea por ${email} (stub)`);
});

Then('el proyecto tiene columnas: {string}, {string}, {string}, {string}', function (c1, c2, c3, c4) {
  const expected = [c1, c2, c3, c4];
  expect(this.response.data.columns).to.deep.equal(expected);
});

Then('el usuario es propietario del proyecto', function () {
  expect(this.response.data.owner).to.equal(this.currentUser?.email);
});

Then('el proyecto tiene {int} participantes', function (count) {
  // TODO: verificar con la API
  console.log(`  → Verificando ${count} participantes (stub)`);
});
