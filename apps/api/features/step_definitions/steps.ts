import assert from 'node:assert'
import { AfterAll, Before, Given, Then, When, World, setWorldConstructor } from '@cucumber/cucumber'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'

import { createApp } from '../../src/app'

const prisma = new PrismaClient()
const app = createApp()

type HttpResponse = {
  status: number
  body: unknown
}

export class TaskflowWorld extends World {
  lastResponse?: HttpResponse
  actorToken?: string
  actorEmail?: string
  otherActorToken?: string
  lastProjectId?: string
}

setWorldConstructor(TaskflowWorld)

async function cleanupDatabase() {
  await prisma.comment.deleteMany()
  await prisma.statusHistory.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()
}

Before({ timeout: 60_000 }, async () => {
  await cleanupDatabase()
})

AfterAll(async () => {
  await prisma.$disconnect()
})

Given('una base limpia y la API iniciada', () => undefined)

Given(
  /^existe un usuario "([^"]+)" con contraseña "([^"]+)"$/,
  async function (this: TaskflowWorld, email: string, password: string) {
    const res = await request(app).post('/auth/register').send({ email, password })
    assert.strictEqual(res.status, 201, JSON.stringify(res.body))
  }
)

Given(
  /^existe un usuario autenticado "([^"]+)" con contraseña "([^"]+)"$/,
  async function (this: TaskflowWorld, email: string, password: string) {
    const res = await request(app).post('/auth/register').send({ email, password })
    assert.strictEqual(res.status, 201, JSON.stringify(res.body))
    const token = String(res.body.token)
    if (!this.actorToken) {
      this.actorToken = token
      this.actorEmail = email
    } else {
      this.otherActorToken = token
    }
  }
)

Given(/^ese usuario tiene proyecto "([^"]+)" ya creado$/, async function (this: TaskflowWorld, name: string) {
  assert.ok(this.actorToken, 'Sin token')
  const res = await request(app)
    .post('/projects')
    .set('Authorization', `Bearer ${this.actorToken}`)
    .send({ name, description: 'bdd' })
  assert.strictEqual(res.status, 201)
  this.lastProjectId = String(res.body.id)
})

When(
  /^envío POST "([^"]+)" con email "([^"]+)" y contraseña "([^"]+)"$/,
  async function (this: TaskflowWorld, path: string, email: string, password: string) {
    const res = await request(app).post(path).send({ email, password })
    this.lastResponse = { status: res.status, body: res.body }
  }
)

When(
  /^ese usuario POST "([^"]+)" con JSON:$/,
  async function (this: TaskflowWorld, path: string, payload: string) {
    assert.ok(this.actorToken)
    const res = await request(app)
      .post(path)
      .set('Authorization', `Bearer ${this.actorToken}`)
      .send(JSON.parse(payload.trim()))
    this.lastResponse = { status: res.status, body: res.body }
  }
)

When(/^ese usuario POST último proyecto tasks con JSON:$/, async function (this: TaskflowWorld, payload: string) {
  assert.ok(this.actorToken && this.lastProjectId)
  const res = await request(app)
    .post(`/projects/${this.lastProjectId}/tasks`)
    .set('Authorization', `Bearer ${this.actorToken}`)
    .send(JSON.parse(payload.trim()))
    this.lastResponse = { status: res.status, body: res.body }
})

When(/^envío GET "([^"]+)" sin token$/, async function (this: TaskflowWorld, path: string) {
  const res = await request(app).get(path)
  this.lastResponse = { status: res.status, body: res.body }
})

When(/^ese otro usuario envía GET "([^"]+)"$/, async function (this: TaskflowWorld, path: string) {
  assert.ok(this.otherActorToken)
  const res = await request(app).get(path).set('Authorization', `Bearer ${this.otherActorToken}`)
  this.lastResponse = { status: res.status, body: res.body }
})

Then(/^el código HTTP es (\d+)$/, function (this: TaskflowWorld, code: string) {
  assert.ok(this.lastResponse, 'Sin última respuesta')
  assert.strictEqual(this.lastResponse.status, Number(code))
})

Then(/^el cuerpo contiene el texto "([^"]+)"$/, function (this: TaskflowWorld, fragment: string) {
  assert.ok(this.lastResponse)
  const raw = typeof this.lastResponse.body === 'string' ? this.lastResponse.body : JSON.stringify(this.lastResponse.body)
  assert.ok(raw.includes(fragment))
})

Then(/^el cuerpo contiene campo "([^"]+)"$/, function (this: TaskflowWorld, field: string) {
  assert.ok(this.lastResponse && this.lastResponse.body && typeof this.lastResponse.body === 'object')
  assert.ok(field in (this.lastResponse.body as Record<string, unknown>), `Falta ${field}`)
})

Then(/^el cuerpo contiene texto "([^"]+)" en campo "([^"]+)"$/, function (
  this: TaskflowWorld,
  value: string,
  field: string
) {
  assert.ok(this.lastResponse?.body && typeof this.lastResponse.body === 'object')
  const v = (this.lastResponse!.body as Record<string, unknown>)[field]
  assert.strictEqual(String(v), value)
})

Then(/^la lista proyectos tiene longitud exacta (\d+)$/, function (this: TaskflowWorld, expected: string) {
  assert.ok(this.lastResponse)
  const body = this.lastResponse.body
  assert.ok(Array.isArray(body))
  assert.strictEqual(body.length, Number(expected))
})
