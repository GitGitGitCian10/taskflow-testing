// tests/unit/task.state-machine.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskService } from '../../src/services/task.service'
import { Status } from '@prisma/client'

const mockMember = { userId: 'user-1', role: 'MEMBER' }

function makeTask(status: string, assignedTo = 'user-1') {
  return {
    id: 'task-1',
    title: 'Test task',
    status,
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assignedTo,
    project: { members: [mockMember] },
  }
}

const mockDb = {
  task: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  statusHistory: { create: vi.fn() },
  projectMember: { findUnique: vi.fn() },
}

const taskService = new TaskService(mockDb as any)

// ════════════════════════════════════════════════════════════════
// US-06: Máquina de estados
// ════════════════════════════════════════════════════════════════
describe('TaskService — máquina de estados (US-06)', () => {

  beforeEach(() => {
    mockDb.statusHistory.create.mockResolvedValue({})
    mockDb.task.update.mockResolvedValue({ id: 'task-1' })
  })

  describe('Validación de transición de estado', () => {
    it('transición válida TODO -> IN_PROGRESS', async () => {
      await expect(taskService.validateStatusTransition(Status.TODO, Status.IN_PROGRESS)).resolves.not.toThrow()
    })

    it('transición válida IN_PROGRESS -> DONE', async () => {
      await expect(taskService.validateStatusTransition(Status.IN_PROGRESS, Status.DONE)).resolves.not.toThrow()
    })
  })

  describe('Transiciones INVÁLIDAS', () => {
    it('transición inválida TODO -> DONE', async () => {
      await expect(taskService.validateStatusTransition(Status.TODO, Status.DONE)).rejects.toThrow('Transición de estado inválida: TODO -> DONE')
    })

    it('transición inválida IN_PROGRESS -> TODO', async () => {
      await expect(taskService.validateStatusTransition(Status.IN_PROGRESS, Status.TODO)).rejects.toThrow('Transición de estado inválida: IN_PROGRESS -> TODO')
    })

    it('transición inválida DONE -> TODO', async () => {
      await expect(taskService.validateStatusTransition(Status.DONE, Status.TODO)).rejects.toThrow('Transición de estado inválida: DONE -> TODO')
    })

    it('transición inválida TODO -> TODO', async () => {
      await expect(taskService.validateStatusTransition(Status.TODO, Status.TODO)).rejects.toThrow('Transición de estado inválida: TODO -> TODO')
    })
  })

  describe('Registro de historial', () => {
    it('registra la transición en statusHistory', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('TODO'))

      await taskService.updateTask('task-1', 'user-1', { status: 'IN_PROGRESS' })

      expect(mockDb.statusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          from: 'TODO',
          to: 'IN_PROGRESS',
          changedBy: 'user-1',
        }),
      })
    })

    it('no registra historial si el estado no cambia', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask('TODO'))

      await taskService.updateTask('task-1', 'user-1', { title: 'Nuevo título' })

      expect(mockDb.statusHistory.create).not.toHaveBeenCalled()
    })
  })
})
