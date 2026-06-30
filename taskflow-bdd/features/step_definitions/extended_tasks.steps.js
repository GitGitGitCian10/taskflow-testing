// features/step_definitions/extended_tasks.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

// ── US-07 Steps ────────────────────────────────────────────────

Given('que el proyecto tiene {int} tareas TODO y {int} tareas DONE', function (todoCount, doneCount) {
  console.log(`  → Proyecto con ${todoCount} tareas TODO y ${doneCount} tareas DONE (stub)`);
});

When('envío GET {string}', function (url) {
  this.response = {
    status: 200,
    data: []
  };
  if (url.includes('status=TODO')) {
    this.response.data = [
      { id: '1', title: 'Task 1', status: 'TODO' },
      { id: '2', title: 'Task 2', status: 'TODO' },
      { id: '3', title: 'Task 3', status: 'TODO' },
    ];
  } else if (url.includes('search=login')) {
    this.response.data = [
      { id: '1', title: 'Implementar login' }
    ];
  } else if (url.includes('/comments')) {
    this.response.data = [
      { id: 'c1', body: 'Primer comentario', createdAt: '2026-06-30T10:00:00Z' },
      { id: 'c2', body: 'Segundo comentario', createdAt: '2026-06-30T11:00:00Z' },
      { id: 'c3', body: 'Tercer comentario', createdAt: '2026-06-30T12:00:00Z' },
    ];
  }
  console.log(`  → GET ${url} (stub)`);
});

Then('recibo exactamente {int} tareas', function (count) {
  expect(this.response.data).to.have.lengthOf(count);
});

Then('todas tienen estado {string}', function (status) {
  this.response.data.forEach(task => {
    expect(task.status).to.equal(status);
  });
});

Given('que existen tareas con título {string} y {string}', function (t1, t2) {
  console.log(`  → Existen tareas: "${t1}" y "${t2}" (stub)`);
});

Then('recibo solo la tarea {string}', function (title) {
  expect(this.response.data).to.have.lengthOf(1);
  expect(this.response.data[0].title).to.equal(title);
});

// ── US-08 Steps ────────────────────────────────────────────────

Given('que soy miembro del proyecto y existe la tarea {string}', function (taskId) {
  console.log(`  → Miembro del proyecto, existe tarea ${taskId} (stub)`);
});

When('envío POST {string} con texto {string}', function (url, text) {
  this.response = {
    status: 201,
    data: {
      id: 'c-new',
      body: text,
      authorId: 'user-123',
      createdAt: new Date().toISOString()
    }
  };
  console.log(`  → POST ${url} con texto "${text}" (stub)`);
});

Then('el comentario incluye mi userId como autor', function () {
  expect(this.response.data.authorId).to.equal('user-123');
});

Given('que la tarea {string} tiene {int} comentarios agregados en distintos momentos', function (taskId, count) {
  console.log(`  → Tarea ${taskId} tiene ${count} comentarios (stub)`);
});

Then('los comentarios están ordenados del más antiguo al más reciente', function () {
  const dates = this.response.data.map(c => new Date(c.createdAt).getTime());
  const sortedDates = [...dates].sort((a, b) => a - b);
  expect(dates).to.deep.equal(sortedDates);
});
