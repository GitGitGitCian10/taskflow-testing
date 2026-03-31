// tests/unit/task.service.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { TaskService } from '../../src/services/task.service'

const mockDb = {
    task: {
        findUnique: vi.fn(),
        update: vi.fn(),
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
})
