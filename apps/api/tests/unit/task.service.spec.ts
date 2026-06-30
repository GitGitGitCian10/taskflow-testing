// tests/unit/task.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bindAllureApi } from 'allure-vitest'
import { TaskService } from '../../src/services/task.service'

const mockDb = {
    task: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
    },
    statusHistory: { create: vi.fn() },
    projectMember: { findUnique: vi.fn() },
}

const taskService = new TaskService(mockDb as any)

describe('TaskService', () => {
    describe('Validación de título de tarea', () => {
        it('título menos de 3 caracteres', async () => {
            await expect(taskService.validateTitle('ab')).rejects.toThrow('El título debe tener al menos 3 caracteres')
        })

        it('título más de 100 caracteres', async () => {
            await expect(taskService.validateTitle('a'.repeat(101))).rejects.toThrow('El título no puede superar los 100 caracteres')
        })

        it('título con solo espacios', async () => {
            await expect(taskService.validateTitle('   ')).rejects.toThrow('El título no puede estar vacío')
        })

        it('título válido', async () => {
            await expect(taskService.validateTitle('título válido')).resolves.not.toThrow()
        })

        it('título con exactamente 3 caracteres', async () => {
            await expect(taskService.validateTitle('abc')).resolves.not.toThrow()
        })

        it('título con exactamente 100 caracteres', async () => {
            await expect(taskService.validateTitle('a'.repeat(100))).resolves.not.toThrow()
        })
    })

    describe('createTask', () => {
        beforeEach(() => { vi.clearAllMocks() })

        it('crea la tarea si el usuario es miembro del proyecto', async (context) => {
            const allure = bindAllureApi(context.task)
            await allure.feature('Tareas')
            await allure.story('US-05')
            await allure.severity('normal')
            await allure.description('Un miembro del proyecto puede crear una tarea con prioridad válida.')

            mockDb.projectMember.findUnique.mockResolvedValue({ userId: 'user-1', role: 'MEMBER' })
            mockDb.task.create.mockResolvedValue({ id: 'task-1', title: 'Implementar login', status: 'TODO' })

            const result = await taskService.createTask('proj-1', 'user-1', { title: 'Implementar login', priority: 'HIGH' })

            expect(result.id).toBe('task-1')
            expect(mockDb.task.create).toHaveBeenCalledOnce()
        })

        it('lanza ForbiddenError si el usuario no es miembro', async () => {
            mockDb.projectMember.findUnique.mockResolvedValue(null)

            await expect(
                taskService.createTask('proj-1', 'user-x', { title: 'Tarea', priority: 'LOW' })
            ).rejects.toThrow('Not a project member')
        })
    })

    describe('getTasks', () => {
        beforeEach(() => { vi.clearAllMocks() })

        it('devuelve las tareas del proyecto si el usuario es miembro', async () => {
            mockDb.projectMember.findUnique.mockResolvedValue({ userId: 'user-1', role: 'MEMBER' })
            mockDb.task.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }])

            const result = await taskService.getTasks('proj-1', 'user-1', { status: 'TODO' })

            expect(result).toHaveLength(2)
            expect(mockDb.task.findMany).toHaveBeenCalledOnce()
        })

        it('lanza ForbiddenError si el usuario no es miembro', async () => {
            mockDb.projectMember.findUnique.mockResolvedValue(null)

            await expect(
                taskService.getTasks('proj-1', 'user-x', {})
            ).rejects.toThrow('Not a project member')
        })
    })
})
