import { describe, it, expect, vi, beforeAll, type MockedObject } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
vi.mock('../../src/services/task.service', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/services/task.service')>
        ()
    return {
        ...actual,
        TaskService: vi.fn().mockImplementation(() => ({
            createTask: vi.fn(),
            getTasks: vi.fn(),
        })),
    }
})
vi.mock('../../src/services/auth.service', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../src/services/auth.service')>
        ()
    return {
        ...actual,
        AuthService: vi.fn().mockImplementation(() => ({
            verifyToken: vi.fn().mockReturnValue({ id: 'user-1', email: 'ana@test.com' }),
        })),
    }
})
import { TaskService } from '../../src/services/task.service'
import type { TaskService as TaskServiceType } from '../../src/services/task.service'
const app = createApp()
const VALID_TOKEN = 'Bearer valid.jwt.token'
let taskServiceMock: MockedObject<TaskServiceType>
beforeAll(() => {
    taskServiceMock = (TaskService as ReturnType<typeof vi.fn>).mock.results[0].value
})

describe('POST /projects/:projectId/tasks', () => {
    it('201 — crea tarea y devuelve el objeto creado', async () => {
        taskServiceMock.createTask.mockResolvedValue({
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
        const titleError = new Error('Title is required');
        titleError.name = 'titleError';
        taskServiceMock.createTask.mockRejectedValueOnce(titleError);

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

describe('GET /projects/:projectId/tasks', () => {
    it('200 — retorna array de tareas del proyecto', async () => {
        taskServiceMock.getTasks.mockResolvedValue([
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
            }
        ])

        const res = await request(app)
            .get('/projects/proj-1/tasks')
            .set('Authorization', VALID_TOKEN)

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(2)
        expect(res.body[0].title).toBe('Tarea 1')
        expect(res.body[1].title).toBe('Tarea 2')
    })

    it('401 — sin token, devuelve 401', async () => {
        const res = await request(app)
            .get('/projects/proj-1/tasks')

        expect(res.status).toBe(401)
    })
})