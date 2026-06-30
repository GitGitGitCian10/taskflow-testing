// tests/unit/auth.service.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { bindAllureApi } from 'allure-vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthService, ConflictError, UnauthorizedError } from '../../src/services/auth.service'

// ── Mock PrismaClient ────────────────────────────────────────────
const mockDb = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

const authService = new AuthService(mockDb as any)

// ── Helpers ──────────────────────────────────────────────────────
const validRegisterInput = {
  email: 'ana@test.com',
  password: 'Password1',
  name: 'Ana',
}

const mockUser = {
  id: 'user-1',
  email: 'ana@test.com',
  passwordHash: '$2a$12$hashedpassword',
  name: 'Ana',
  failedLogins: 0,
  lockedUntil: null,
  createdAt: new Date(),
}

// ════════════════════════════════════════════════════════════════
// US-01: Registro de usuario
// ════════════════════════════════════════════════════════════════
describe('AuthService.register — US-01', () => {

  describe('Criterio 1: email con formato válido', () => {
    it('rechaza email sin @', async () => {
      await expect(
        authService.register({ ...validRegisterInput, email: 'notanemail' })
      ).rejects.toThrow()
    })

    it('rechaza email sin dominio', async () => {
      await expect(
        authService.register({ ...validRegisterInput, email: 'user@' })
      ).rejects.toThrow()
    })

    it('acepta email válido', async (context) => {
      const allure = bindAllureApi(context.task)
      await allure.feature('Autenticación')
      await allure.story('US-01')
      await allure.severity('blocker')
      await allure.description('Registro exitoso con email de formato válido devuelve usuario y token.')

      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({ id: 'user-1', email: 'ana@test.com', name: 'Ana', createdAt: new Date() })

      const result = await authService.register(validRegisterInput)
      expect(result.user.email).toBe('ana@test.com')
    })
  })

  describe('Criterio 2: contraseña con requisitos de seguridad', () => {
    it('rechaza contraseña menor a 8 caracteres', async () => {
      await expect(
        authService.register({ ...validRegisterInput, password: 'Abc1' })
      ).rejects.toThrow('at least 8 characters')
    })

    it('rechaza contraseña sin mayúscula', async () => {
      await expect(
        authService.register({ ...validRegisterInput, password: 'password1' })
      ).rejects.toThrow('uppercase')
    })

    it('rechaza contraseña sin número', async () => {
      await expect(
        authService.register({ ...validRegisterInput, password: 'Password' })
      ).rejects.toThrow('number')
    })

    it('acepta contraseña válida con mayúscula y número', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({ id: 'user-1', email: 'ana@test.com', name: 'Ana', createdAt: new Date() })

      await expect(
        authService.register({ ...validRegisterInput, password: 'SecurePass1' })
      ).resolves.toBeDefined()
    })
  })

  describe('Criterio 3: email único', () => {
    it('lanza ConflictError si el email ya existe', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)

      await expect(
        authService.register(validRegisterInput)
      ).rejects.toThrow(ConflictError)

      await expect(
        authService.register(validRegisterInput)
      ).rejects.toThrow('Email already registered')
    })

    it('llama a findUnique con el email correcto', async () => {
      mockDb.user.findUnique.mockResolvedValue(mockUser)

      try { await authService.register(validRegisterInput) } catch { /* expected error */ }

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'ana@test.com' },
      })
    })
  })

  describe('Criterio 4: retorna JWT al registrarse', () => {
    it('incluye token en la respuesta exitosa', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockDb.user.create.mockResolvedValue({ id: 'user-1', email: 'ana@test.com', name: 'Ana', createdAt: new Date() })

      const result = await authService.register(validRegisterInput)
      expect(result.token).toBeDefined()
      expect(typeof result.token).toBe('string')
      expect(result.token.split('.')).toHaveLength(3) // JWT format
    })
  })
})

// ════════════════════════════════════════════════════════════════
// US-02: Login de usuario
// ════════════════════════════════════════════════════════════════
describe('AuthService.login — US-02', () => {

  describe('Criterio 1: login exitoso retorna JWT', () => {
    it('retorna token para credenciales válidas', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash })
      mockDb.user.update.mockResolvedValue({ ...mockUser })

      const result = await authService.login({ email: 'ana@test.com', password: 'Password1' })

      expect(result.token).toBeDefined()
      expect(result.user.email).toBe('ana@test.com')
    })

    // 🐛 Este test debería fallar con el BUG-07 activo
    // El token generado en login() no incluye expiración
    it('el token generado incluye campo de expiración (exp) — BUG-07', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash })
      mockDb.user.update.mockResolvedValue({ ...mockUser })

      const result = await authService.login({ email: 'ana@test.com', password: 'Password1' })

      const decoded = jwt.decode(result.token) as any

      // Este expect FALLA con el bug activo → BUG-07 encontrado
      expect(decoded.exp).toBeDefined()
    })
  })

  describe('Criterio 2: credenciales incorrectas', () => {
    it('lanza UnauthorizedError con password incorrecto', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      mockDb.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hash })
      mockDb.user.update.mockResolvedValue({})

      await expect(
        authService.login({ email: 'ana@test.com', password: 'WrongPass1' })
      ).rejects.toThrow(UnauthorizedError)
    })

    it('lanza UnauthorizedError si el usuario no existe', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)

      await expect(
        authService.login({ email: 'noexiste@test.com', password: 'Password1' })
      ).rejects.toThrow(UnauthorizedError)
    })
  })

  describe('Criterio 3: bloqueo por intentos fallidos', () => {
    it('bloquea la cuenta en el 5º intento fallido — BUG-05', async (context) => {
      const allure = bindAllureApi(context.task)
      await allure.feature('Autenticación')
      await allure.story('US-02')
      await allure.severity('critical')
      await allure.link('issue', 'https://github.com/GitGitGitCian10/taskflow-testing/blob/main/BUG-05.md', 'BUG-05')
      await allure.description('Verifica que la cuenta se bloquea exactamente al 5º intento (off-by-one corregido: > 5 → >= 5).')

      const hash = await bcrypt.hash('Password1', 12)
      // Estado inicial: 4 intentos fallidos. El próximo (incorrecto) es el 5º.
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
        failedLogins: 4,
        lockedUntil: null,
      })
      mockDb.user.update.mockResolvedValue({})

      // 5º intento con password incorrecto → debe bloquear la cuenta.
      await expect(
        authService.login({ email: 'ana@test.com', password: 'WrongPass1' })
      ).rejects.toThrow(UnauthorizedError)

      const updateCall = mockDb.user.update.mock.calls[0][0]
      // failedLogins debe llegar a 5...
      expect(updateCall.data.failedLogins).toBe(5)
      // ...y la cuenta debe quedar bloqueada en ese mismo intento.
      // Con el BUG-05 activo (newFailedCount > 5) esto FALLA, porque 5 > 5 es false.
      // Con el fix (newFailedCount >= 5) lockedUntil queda definido y el test PASA.
      expect(updateCall.data.lockedUntil).toBeDefined()
      expect(updateCall.data.lockedUntil).not.toBeNull()
    })

    it('NO bloquea la cuenta en el 4º intento fallido', async () => {
      const hash = await bcrypt.hash('Password1', 12)
      // Estado inicial: 3 intentos. El próximo (incorrecto) es el 4º → aún sin bloqueo.
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hash,
        failedLogins: 3,
        lockedUntil: null,
      })
      mockDb.user.update.mockResolvedValue({})

      await expect(
        authService.login({ email: 'ana@test.com', password: 'WrongPass1' })
      ).rejects.toThrow(UnauthorizedError)

      const updateCall = mockDb.user.update.mock.calls[0][0]
      expect(updateCall.data.failedLogins).toBe(4)
      expect(updateCall.data.lockedUntil).toBeNull()
    })

    it('respeta el bloqueo si lockedUntil está en el futuro', async () => {
      mockDb.user.findUnique.mockResolvedValue({
        ...mockUser,
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 min en el futuro
      })

      await expect(
        authService.login({ email: 'ana@test.com', password: 'Password1' })
      ).rejects.toThrow('locked')
    })
  })
})
