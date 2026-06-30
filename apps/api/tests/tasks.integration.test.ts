// apps/api/tests/tasks.integration.test.ts
// Integration tests REALES contra PostgreSQL (taskflow_test) — US-05.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = createApp()

describe('Tareas API — US-05', () => {
  let token: string
  let projectId: string

  beforeAll(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'tester-tasks@test.com', password: 'Test1234!', name: 'Tester Tasks' })
    token = res.body.token
  })

  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto para tareas' })
    projectId = res.body.id
  })

  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // ── Happy path: crear tarea con prioridad válida (@US-05) ────
  it('crea una tarea con prioridad válida (@US-05)', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Implementar login', priority: 'HIGH', status: 'TODO' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.priority).toBe('HIGH')
    expect(res.body.status).toBe('TODO')
  })

  // ── Error: prioridad inválida → 400 (@US-05) ─────────────────
  it('rechaza prioridad inválida con 400 (@US-05)', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea mala', priority: 'ULTRA', status: 'TODO' })

    expect(res.status).toBe(400)
  })

  // ── Error: sin token → 401 (@US-05) ──────────────────────────
  it('rechaza crear tarea sin token con 401 (@US-05)', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .send({ title: 'Tarea sin auth', priority: 'LOW' })

    expect(res.status).toBe(401)
  })
})
