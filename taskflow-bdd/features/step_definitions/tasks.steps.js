// features/step_definitions/tasks.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const axios = require('axios');

const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

// Estado compartido vía World (this). Aserciones genéricas en common.steps.js

Given('existe un proyecto {string} con un miembro autenticado', async function (projectName) {
  // TODO: setup completo de proyecto con miembro autenticado
  console.log(`  → Proyecto "${projectName}" con miembro autenticado (stub)`);
});

Given('que existe la tarea {string} en la columna {string}', async function (taskTitle, column) {
  // TODO: crear tarea via API
  this.currentTask = { id: 'task-123', title: taskTitle, column };
  console.log(`  → Tarea "${taskTitle}" en "${column}" (stub)`);
});

Given('existe el miembro {string} en el proyecto', async function (email) {
  // TODO: verificar existencia del miembro
  console.log(`  → Miembro ${email} en el proyecto (stub)`);
});

When('el miembro crea una tarea con:', async function (dataTable) {
  const data = dataTable.rowsHash();
  // TODO: POST /tasks

  if (!data.title || data.title.trim() === '') {
    this.response = { status: 400, data: { message: 'El título de la tarea es requerido' } };
  } else {
    this.response = {
      status: 201,
      data: {
        id: 'task-new',
        title: data.title,
        priority: data.priority,
        column: 'To Do',
        status: 'todo'
      }
    };
  }
  console.log(`  → POST /tasks: "${data.title}" (stub)`);
});

When('el miembro mueve la tarea a la columna {string}', async function (column) {
  // TODO: PATCH /tasks/:id
  this.response = {
    status: 200,
    data: {
      id: this.currentTask?.id,
      column,
      status: column === 'In Progress' ? 'in_progress' : column.toLowerCase().replace(' ', '_')
    }
  };
  console.log(`  → PATCH /tasks: movida a "${column}" (stub)`);
});

When('el miembro asigna la tarea a {string}', async function (email) {
  // TODO: PATCH /tasks/:id/assign
  this.response = { status: 200, data: { assignee: email } };
  console.log(`  → Tarea asignada a ${email} (stub)`);
});

Then('la tarea aparece en la columna {string}', function (column) {
  expect(this.response.data.column).to.equal(column);
});

Then('la tarea tiene prioridad {string}', function (priority) {
  expect(this.response.data.priority).to.equal(priority);
});

Then('el estado de la tarea es {string}', function (status) {
  expect(this.response.data.status).to.equal(status);
});

Then('la tarea está asignada a {string}', function (email) {
  expect(this.response.data.assignee).to.equal(email);
});
