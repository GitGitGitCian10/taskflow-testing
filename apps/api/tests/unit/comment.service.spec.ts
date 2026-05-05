import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommentService } from '../../src/services/comment.service'
import { ForbiddenError, NotFoundError } from '../../src/services/auth.service'

const mockDb = {
  task: { findUnique: vi.fn() },
  comment: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
}

const commentService = new CommentService(mockDb as never)

const taskWithMember = {
  id: 't1',
  project: {
    members: [{ userId: 'u1' }],
  },
}

describe('CommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('addComment crea comentario para miembro', async () => {
    mockDb.task.findUnique.mockResolvedValue(taskWithMember)
    mockDb.comment.create.mockResolvedValue({
      id: 'c1',
      body: 'Hola',
      taskId: 't1',
      authorId: 'u1',
      author: { id: 'u1', email: 'a@test.com', name: null },
    })

    const c = await commentService.addComment('t1', 'u1', { body: 'Hola' })
    expect(c.id).toBe('c1')
  })

  it('addComment NotFoundError si no hay tarea', async () => {
    mockDb.task.findUnique.mockResolvedValue(null)
    await expect(commentService.addComment('t1', 'u1', { body: 'x' })).rejects.toBeInstanceOf(
      NotFoundError
    )
  })

  it('addComment ForbiddenError si no es miembro', async () => {
    mockDb.task.findUnique.mockResolvedValue({
      id: 't1',
      project: { members: [{ userId: 'other' }] },
    })
    await expect(commentService.addComment('t1', 'u1', { body: 'x' })).rejects.toBeInstanceOf(
      ForbiddenError
    )
  })

  it('getComments lista para miembro', async () => {
    mockDb.task.findUnique.mockResolvedValue(taskWithMember)
    mockDb.comment.findMany.mockResolvedValue([])

    const list = await commentService.getComments('t1', 'u1')
    expect(list).toEqual([])
  })

  it('deleteComment elimina autor', async () => {
    mockDb.comment.findUnique.mockResolvedValue({
      id: 'c1',
      authorId: 'u1',
    })
    mockDb.comment.delete.mockResolvedValue(undefined)

    await expect(commentService.deleteComment('c1', 'u1')).resolves.toBeUndefined()
  })

  it('deleteComment ForbiddenError si no es autor', async () => {
    mockDb.comment.findUnique.mockResolvedValue({
      id: 'c1',
      authorId: 'other',
    })
    await expect(commentService.deleteComment('c1', 'u1')).rejects.toBeInstanceOf(ForbiddenError)
  })
})
