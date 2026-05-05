import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../src/services/auth.service'
import { ProjectService } from '../../src/services/project.service'

const mockDb = {
  project: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

const projectService = new ProjectService(mockDb as never)

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createProject persiste proyecto y membresía OWNER', async () => {
    mockDb.project.findFirst.mockResolvedValue(null)
    mockDb.project.create.mockResolvedValue({
      id: 'p1',
      name: 'Mi Proyecto',
      description: 'Desc',
      archived: false,
      ownerId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const out = await projectService.createProject('u1', {
      name: 'Mi Proyecto',
      description: 'Desc',
    })

    expect(out.id).toBe('p1')
    expect(mockDb.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Mi Proyecto',
          ownerId: 'u1',
          members: { create: { userId: 'u1', role: 'OWNER' } },
        }),
      })
    )
  })

  it('createProject lanza ConflictError si el nombre ya existe', async () => {
    mockDb.project.findFirst.mockResolvedValue({ id: 'existing' })

    await expect(
      projectService.createProject('u1', { name: 'Dup', description: 'x' })
    ).rejects.toBeInstanceOf(ConflictError)
  })

  it('listProjects devuelve filas para miembros', async () => {
    mockDb.project.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'A',
        owner: { id: 'u1', email: 'a@test.com', name: null },
        _count: { tasks: 0, members: 1 },
      },
    ])

    const list = await projectService.listProjects('u1')
    expect(list).toHaveLength(1)
    expect(mockDb.project.findMany).toHaveBeenCalled()
  })

  it('getProject lanza NotFoundError si no existe', async () => {
    mockDb.project.findUnique.mockResolvedValue(null)

    await expect(projectService.getProject('pid', 'u1')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('getProject lanza ForbiddenError si no es miembro', async () => {
    mockDb.project.findUnique.mockResolvedValue({
      id: 'p1',
      members: [{ userId: 'other' }],
    })

    await expect(projectService.getProject('p1', 'u1')).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('archiveProject lanza ForbiddenError si no es owner', async () => {
    mockDb.project.findUnique.mockResolvedValue({
      id: 'p1',
      ownerId: 'owner',
    })

    await expect(projectService.archiveProject('p1', 'u1')).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('archiveProject marca archived', async () => {
    mockDb.project.findUnique.mockResolvedValue({
      id: 'p1',
      ownerId: 'u1',
    })
    mockDb.project.update.mockResolvedValue({
      id: 'p1',
      archived: true,
    })

    const p = await projectService.archiveProject('p1', 'u1')
    expect(p.archived).toBe(true)
  })
})
