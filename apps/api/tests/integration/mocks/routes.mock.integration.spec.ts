/**
 * Rutas Express con AuthService/TaskService stub (sin PostgreSQL).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../../src/app'
import { ConflictError, UnauthorizedError } from '../../../src/services/auth.service'

const { mockedAuthSvc, mockedTaskSvc } = vi.hoisted(() => {
  const mockedAuthSvc = {
    register: vi.fn(),
    login: vi.fn(),
    verifyToken: vi.fn().mockReturnValue({ userId: 'user-1', email: 'ana@test.com' }),
  }
  const mockedTaskSvc = {
    createTask: vi.fn(),
    getTasks: vi.fn(),
  }
  return { mockedAuthSvc, mockedTaskSvc }
})

vi.mock('../../../src/services/task.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/task.service')>()
  return {
    ...actual,
    TaskService: vi.fn().mockImplementation(() => mockedTaskSvc),
  }
})

vi.mock('../../../src/services/auth.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/services/auth.service')>()
  return {
    ...actual,
    AuthService: vi.fn().mockImplementation(() => mockedAuthSvc),
  }
})

const app = createApp()
const VALID_TOKEN = 'Bearer valid.jwt.token'

describe('POST /auth/register — mocks', () => {
  it('201 — registro exitoso devuelve user y token', async () => {
    mockedAuthSvc.register.mockResolvedValue({
      user: { id: 'user-1', email: 'ana@test.com', name: 'Ana' },
      token: 'jwt.token.here',
    })

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'ana@test.com', password: 'Password1', name: 'Ana' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('ana@test.com')
  })

  it('409 — email ya registrado', async () => {
    mockedAuthSvc.register.mockRejectedValue(new ConflictError('Email already registered'))

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'ana@test.com', password: 'Password1' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already registered/i)
  })

  it('400 — password débil', async () => {
    mockedAuthSvc.register.mockRejectedValue(
      Object.assign(new Error('Validation error'), { statusCode: 400 })
    )

    const res = await request(app).post('/auth/register').send({ email: 'ana@test.com', password: 'weak' })

    expect(res.status).toBe(400)
  })

  it('400 — email con formato inválido', async () => {
    mockedAuthSvc.register.mockRejectedValue(
      Object.assign(new Error('Invalid email format'), { statusCode: 400 })
    )

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'notanemail', password: 'Password1' })

    expect(res.status).toBe(400)
  })
})

describe('POST /auth/login — mocks', () => {
  it('200 — login exitoso devuelve token', async () => {
    mockedAuthSvc.login.mockResolvedValue({
      user: { id: 'user-1', email: 'ana@test.com', name: 'Ana' },
      token: 'jwt.token.here',
    })

    const res = await request(app).post('/auth/login').send({ email: 'ana@test.com', password: 'Password1' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('401 — credenciales incorrectas', async () => {
    mockedAuthSvc.login.mockRejectedValue(new UnauthorizedError('Invalid credentials'))

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@test.com', password: 'Wrong1234' })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid credentials/i)
  })

  it('401 — cuenta bloqueada', async () => {
    mockedAuthSvc.login.mockRejectedValue(
      new UnauthorizedError('Account locked. Try again in 14 minutes')
    )

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ana@test.com', password: 'Password1' })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/locked/i)
  })

  it('401 — endpoint de proyectos sin token devuelve 401', async () => {
    const res = await request(app).get('/projects')
    expect(res.status).toBe(401)
  })
})

describe('POST /projects/:projectId/tasks — mocks', () => {
  beforeEach(() => {
    mockedTaskSvc.createTask.mockReset()
    mockedTaskSvc.getTasks.mockReset()
  })

  it('201 — crea tarea y devuelve el objeto creado', async () => {
    mockedTaskSvc.createTask.mockResolvedValue({
      id: 'task-1',
      title: 'Implementar Login',
      status: 'TODO',
      priority: 'HIGH',
      projectId: 'proj-1',
      assignedTo: null,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      assignee: null,
    })
    const res = await request(app)
      .post('/projects/proj-1/tasks')
      .set('Authorization', VALID_TOKEN)
      .send({ title: 'Implementar Login', priority: 'HIGH' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.title).toBe('Implementar Login')
  })

  it('400 — título vacío', async () => {
    const err = Object.assign(new Error('Title is required'), { statusCode: 400 })
    mockedTaskSvc.createTask.mockRejectedValueOnce(err)

    const res = await request(app)
      .post('/projects/proj-1/tasks')
      .set('Authorization', VALID_TOKEN)
      .send({ title: '', priority: 'HIGH' })

    expect(res.status).toBe(400)
  })

  it('401 — sin token', async () => {
    const res = await request(app)
      .post('/projects/proj-1/tasks')
      .send({ title: 'Implementar Login', priority: 'HIGH' })

    expect(res.status).toBe(401)
  })
})

describe('GET /projects/:projectId/tasks — mocks', () => {
  beforeEach(() => {
    mockedTaskSvc.getTasks.mockReset()
  })

  it('200 — retorna array de tareas del proyecto', async () => {
    mockedTaskSvc.getTasks.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Tarea 1',
        status: 'TODO',
        priority: 'HIGH',
        projectId: 'proj-1',
        assignedTo: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
      },
      {
        id: 'task-2',
        title: 'Tarea 2',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: 'proj-1',
        assignedTo: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
      },
    ])

    const res = await request(app).get('/projects/proj-1/tasks').set('Authorization', VALID_TOKEN)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    expect(res.body[0].title).toBe('Tarea 1')
    expect(res.body[1].title).toBe('Tarea 2')
  })

  it('401 — sin token, devuelve 401', async () => {
    const res = await request(app).get('/projects/proj-1/tasks')

    expect(res.status).toBe(401)
  })
})
