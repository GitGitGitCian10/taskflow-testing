import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'

test.describe('US-01 y US-02: Autenticación', () => {
    test('registro exitoso y posterior inicio de sesión', async ({ page }) => {
        const loginPage = new LoginPage(page)
        const email = `test_user_${Date.now()}@test.com`
        const password = 'Password123'

        await loginPage.register(email, password, 'User Name')
        await loginPage.expectRedirectToLogin()

        await loginPage.login(email, password)
        await loginPage.expectRedirectToProjects()
    })

    test('falla inicio de sesión con credenciales incorrectas', async ({ page }) => {
        const loginPage = new LoginPage(page)

        await loginPage.login(`no_existe_${Date.now()}@test.com`, 'wrong_password')

        await loginPage.expectRedirectToLogin()
    })
})
