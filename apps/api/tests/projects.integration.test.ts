import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = createApp()

describe('Proyectos API — US-03 y US-04', () => {
  let token: string
  let userId: string

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'tester@test.com', password: 'Test1234!' })
    expect(res.status).toBe(201)
    token = res.body.token
    userId = res.body.user.id
  })

  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.project.deleteMany()
  })

  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.projectMember.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany({
      where: { email: { in: ['tester@test.com', 'otro@test.com'] } },
    })
    await prisma.$disconnect()
  })

  it('crea un proyecto y devuelve 201 con id (@US-03)', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'TaskFlow MVP', description: 'Primer sprint' })

    expect(res.status).toBe(201)

    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('TaskFlow MVP')

    expect(res.body.ownerId).toBe(userId)
  })

  it('rechaza nombre vacío con 400 (@US-03)', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', description: 'Sin nombre' })

    expect(res.status).toBe(400)
    expect(String(res.body.error)).toMatch(/validation/i)
  })

  it('rechaza petición sin token con 401 (@US-03)', async () => {
    const res = await request(app).post('/projects').send({ name: 'Proyecto sin auth' })

    expect(res.status).toBe(401)
  })

  it('rechaza nombre demasiado corto con 400 (@US-03)', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'AB', description: 'Dos chars' })

    expect(res.status).toBe(400)
    expect(String(res.body.error)).toMatch(/validation/i)
  })

  it('solo devuelve los proyectos del usuario autenticado (@US-04)', async () => {
    await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto de tester1' })

    const res2 = await request(app)
      .post('/auth/register')
      .send({ email: 'otro@test.com', password: 'Test1234!' })
    expect(res2.status).toBe(201)
    const token2 = res2.body.token

    const list = await request(app).get('/projects').set('Authorization', `Bearer ${token2}`)

    expect(list.status).toBe(200)
    expect(Array.isArray(list.body)).toBe(true)
    expect(list.body).toHaveLength(0)

    await prisma.user.deleteMany({ where: { email: 'otro@test.com' } })
  })
})
