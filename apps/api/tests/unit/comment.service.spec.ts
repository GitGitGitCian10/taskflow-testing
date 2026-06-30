// tests/unit/comment.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommentService } from '../../src/services/comment.service'
import { ForbiddenError, NotFoundError } from '../../src/services/auth.service'

const mockDb = {
  task: { findUnique: vi.fn() },
  comment: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
}

const service = new CommentService(mockDb as any)

const taskWithMember = {
  id: 'task-1',
  project: { members: [{ userId: 'user-1' }] },
}

describe('CommentService — US-08', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addComment', () => {
    it('crea un comentario si el usuario es miembro del proyecto', async () => {
      mockDb.task.findUnique.mockResolvedValue(taskWithMember)
      mockDb.comment.create.mockResolvedValue({ id: 'c1', body: 'Hola' })

      const result = await service.addComment('task-1', 'user-1', { body: 'Hola' })
      expect(result.id).toBe('c1')
      expect(mockDb.comment.create).toHaveBeenCalledOnce()
    })

    it('lanza NotFoundError si la tarea no existe', async () => {
      mockDb.task.findUnique.mockResolvedValue(null)
      await expect(service.addComment('task-x', 'user-1', { body: 'Hola' })).rejects.toThrow(NotFoundError)
    })

    it('lanza ForbiddenError si el usuario no es miembro', async () => {
      mockDb.task.findUnique.mockResolvedValue({ id: 'task-1', project: { members: [{ userId: 'otro' }] } })
      await expect(service.addComment('task-1', 'user-1', { body: 'Hola' })).rejects.toThrow(ForbiddenError)
    })

    it('rechaza body vacío (ZodError)', async () => {
      await expect(service.addComment('task-1', 'user-1', { body: '' })).rejects.toThrow()
    })
  })

  describe('getComments', () => {
    it('devuelve los comentarios si el usuario es miembro', async () => {
      mockDb.task.findUnique.mockResolvedValue(taskWithMember)
      mockDb.comment.findMany.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])

      const result = await service.getComments('task-1', 'user-1')
      expect(result).toHaveLength(2)
    })

    it('lanza NotFoundError si la tarea no existe', async () => {
      mockDb.task.findUnique.mockResolvedValue(null)
      await expect(service.getComments('task-x', 'user-1')).rejects.toThrow(NotFoundError)
    })

    it('lanza ForbiddenError si el usuario no es miembro', async () => {
      mockDb.task.findUnique.mockResolvedValue({ id: 'task-1', project: { members: [{ userId: 'otro' }] } })
      await expect(service.getComments('task-1', 'user-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('deleteComment', () => {
    it('elimina el comentario si el usuario es el autor', async () => {
      mockDb.comment.findUnique.mockResolvedValue({ id: 'c1', authorId: 'user-1' })
      mockDb.comment.delete.mockResolvedValue({})

      await service.deleteComment('c1', 'user-1')
      expect(mockDb.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
    })

    it('lanza NotFoundError si el comentario no existe', async () => {
      mockDb.comment.findUnique.mockResolvedValue(null)
      await expect(service.deleteComment('c-x', 'user-1')).rejects.toThrow(NotFoundError)
    })

    it('lanza ForbiddenError si el usuario no es el autor', async () => {
      mockDb.comment.findUnique.mockResolvedValue({ id: 'c1', authorId: 'otro' })
      await expect(service.deleteComment('c1', 'user-1')).rejects.toThrow(ForbiddenError)
    })
  })
})
