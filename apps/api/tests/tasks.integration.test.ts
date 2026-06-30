// apps/api/tests/tasks.integration.test.ts
// Integration tests REALES contra PostgreSQL (taskflow_test) — US-05, US-06, US-07.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = createApp()

describe('Tareas API — US-05, US-06, US-07', () => {
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

  // ── US-06: Cambiar estado de una tarea ──────────────────────
  describe('Cambiar estado de una tarea — US-06', () => {
    let taskId: string

    beforeEach(async () => {
      // Crear una tarea en estado TODO
      const res = await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Tarea para mover', priority: 'MEDIUM' })
      taskId = res.body.id
    })

    it('permite transición válida TODO -> IN_PROGRESS (@US-06)', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('IN_PROGRESS')
    })

    it('rechaza transición inválida TODO -> DONE con 422 (@US-06)', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'DONE' })

      expect(res.status).toBe(422)
    })

    it('rechaza actualización sin token con 401 (@US-06)', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}`)
        .send({ status: 'IN_PROGRESS' })

      expect(res.status).toBe(401)
    })

    it('rechaza si el usuario no es miembro con 403 (@US-06)', async () => {
      const res2 = await request(app)
        .post('/auth/register')
        .send({ email: 'ajeno-tasks@test.com', password: 'Test1234!', name: 'Ajeno Tasks' })
      const token2 = res2.body.token

      const res = await request(app)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ status: 'IN_PROGRESS' })

      expect(res.status).toBe(403)
    })
  })

  // ── US-07: Filtrar y buscar tareas ──────────────────────────
  describe('Filtrar y buscar tareas — US-07', () => {
    beforeEach(async () => {
      // Crear tareas de prueba
      await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Implementar login', priority: 'HIGH', description: 'Usar jwt' })
      
      await request(app)
        .post(`/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Revisar diseño', priority: 'LOW', description: 'Revisar figma' })
    })

    it('filtra tareas por prioridad (@US-07)', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}/tasks?priority=HIGH`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.some((t: any) => t.title === 'Implementar login')).toBe(true)
      expect(res.body.every((t: any) => t.priority === 'HIGH')).toBe(true)
    })

    it('busca tareas por texto en título o descripción (@US-07)', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}/tasks?search=figma`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].title).toBe('Revisar diseño')
    })

    it('rechaza obtener tareas sin token con 401 (@US-07)', async () => {
      const res = await request(app)
        .get(`/projects/${projectId}/tasks?priority=HIGH`)

      expect(res.status).toBe(401)
    })

    it('rechaza si el usuario no es miembro con 403 (@US-07)', async () => {
      const res2 = await request(app)
        .post('/auth/register')
        .send({ email: 'ajeno-filter@test.com', password: 'Test1234!', name: 'Ajeno Filter' })
      const token2 = res2.body.token

      const res = await request(app)
        .get(`/projects/${projectId}/tasks?priority=HIGH`)
        .set('Authorization', `Bearer ${token2}`)

      expect(res.status).toBe(403)
    })
  })
})
