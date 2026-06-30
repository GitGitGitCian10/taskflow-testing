// apps/api/tests/comments.integration.test.ts
// Integration tests REALES contra PostgreSQL (taskflow_test) — US-08.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = createApp()

describe('Comentarios API — US-08', () => {
  let token: string
  let projectId: string
  let taskId: string

  beforeAll(async () => {
    await prisma.comment.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'tester-comments@test.com', password: 'Test1234!', name: 'Tester Comments' })
    token = res.body.token
  })

  beforeEach(async () => {
    await prisma.comment.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()

    // Crear proyecto
    const projRes = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto para comentarios' })
    projectId = projRes.body.id

    // Crear tarea
    const taskRes = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea de comentarios', priority: 'MEDIUM' })
    taskId = taskRes.body.id
  })

  afterAll(async () => {
    await prisma.comment.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  // ── Happy path: agregar comentario (CA-08a, CA-08b) ───────────
  it('agrega un comentario y devuelve 201 (@US-08)', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Comentario de prueba' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.body).toBe('Comentario de prueba')
    expect(res.body.author).toBeDefined()
  })

  // ── Happy path: obtener comentarios ordenados (CA-08c) ─────────
  it('obtiene los comentarios ordenados por fecha ascendente (@US-08)', async () => {
    await request(app)
      .post(`/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Primer comentario' })

    await request(app)
      .post(`/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Segundo comentario' })

    const res = await request(app)
      .get(`/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].body).toBe('Primer comentario')
    expect(res.body[1].body).toBe('Segundo comentario')
  })

  // ── Error: comentario vacío o demasiado largo (CA-08a) ─────────
  it('rechaza cuerpo vacío con 400 (@US-08)', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: '' })

    expect(res.status).toBe(400)
  })

  // ── Error: usuario no miembro (CA-08d) ───────────
  it('rechaza comentarios de no miembros con 403 (@US-08)', async () => {
    const res2 = await request(app)
      .post('/auth/register')
      .send({ email: 'ajeno@test.com', password: 'Test1234!', name: 'Ajeno' })
    const token2 = res2.body.token

    const res = await request(app)
      .post(`/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ body: 'Intento de comentar' })

    expect(res.status).toBe(403)
  })
})
