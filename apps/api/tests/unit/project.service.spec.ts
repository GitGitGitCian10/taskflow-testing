// tests/unit/project.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProjectService } from '../../src/services/project.service'
import { ConflictError, ForbiddenError, NotFoundError } from '../../src/services/auth.service'

const mockDb = {
  project: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

const service = new ProjectService(mockDb as any)

describe('ProjectService — US-03 / US-04', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createProject', () => {
    it('crea un proyecto cuando el nombre no existe', async () => {
      mockDb.project.findFirst.mockResolvedValue(null)
      mockDb.project.create.mockResolvedValue({ id: 'proj-1', name: 'Mi Proyecto', ownerId: 'user-1' })

      const result = await service.createProject('user-1', { name: 'Mi Proyecto', description: 'desc' })

      expect(result.id).toBe('proj-1')
      expect(mockDb.project.create).toHaveBeenCalledOnce()
    })

    it('lanza ConflictError si ya existe un proyecto con ese nombre', async () => {
      mockDb.project.findFirst.mockResolvedValue({ id: 'proj-existente', name: 'Mi Proyecto' })

      await expect(
        service.createProject('user-1', { name: 'Mi Proyecto' })
      ).rejects.toThrow(ConflictError)
    })

    it('rechaza nombre menor a 3 caracteres (ZodError)', async () => {
      await expect(
        service.createProject('user-1', { name: 'ab' })
      ).rejects.toThrow()
    })
  })

  describe('listProjects', () => {
    it('devuelve los proyectos del usuario', async () => {
      const projects = [{ id: 'p1' }, { id: 'p2' }]
      mockDb.project.findMany.mockResolvedValue(projects)

      const result = await service.listProjects('user-1')

      expect(result).toHaveLength(2)
      expect(mockDb.project.findMany).toHaveBeenCalledOnce()
    })
  })

  describe('getProject', () => {
    it('devuelve el proyecto si el usuario es miembro', async () => {
      mockDb.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        members: [{ userId: 'user-1' }],
      })

      const result = await service.getProject('proj-1', 'user-1')
      expect(result.id).toBe('proj-1')
    })

    it('lanza NotFoundError si el proyecto no existe', async () => {
      mockDb.project.findUnique.mockResolvedValue(null)
      await expect(service.getProject('proj-x', 'user-1')).rejects.toThrow(NotFoundError)
    })

    it('lanza ForbiddenError si el usuario no es miembro', async () => {
      mockDb.project.findUnique.mockResolvedValue({
        id: 'proj-1',
        members: [{ userId: 'otro-user' }],
      })
      await expect(service.getProject('proj-1', 'user-1')).rejects.toThrow(ForbiddenError)
    })
  })

  describe('archiveProject', () => {
    it('archiva el proyecto si el usuario es el owner', async () => {
      mockDb.project.findUnique.mockResolvedValue({ id: 'proj-1', ownerId: 'user-1' })
      mockDb.project.update.mockResolvedValue({ id: 'proj-1', archived: true })

      const result = await service.archiveProject('proj-1', 'user-1')
      expect(result.archived).toBe(true)
    })

    it('lanza NotFoundError si el proyecto no existe', async () => {
      mockDb.project.findUnique.mockResolvedValue(null)
      await expect(service.archiveProject('proj-x', 'user-1')).rejects.toThrow(NotFoundError)
    })

    it('lanza ForbiddenError si el usuario no es el owner', async () => {
      mockDb.project.findUnique.mockResolvedValue({ id: 'proj-1', ownerId: 'otro-user' })
      await expect(service.archiveProject('proj-1', 'user-1')).rejects.toThrow(ForbiddenError)
    })
  })
})
