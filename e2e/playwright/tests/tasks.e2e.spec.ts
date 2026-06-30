import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { ProjectListPage } from '../pages/ProjectListPage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { TaskDetailPage } from '../pages/TaskDetailPage'

test.describe('Gestión de tareas y comentarios — E2E (US-04 a US-08)', () => {
    let email: string
    let password = 'Password123'
    let projectName = ''

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page)
        const projectListPage = new ProjectListPage(page)

        email = `tester_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@test.com`
        projectName = `Project_${Date.now()}`

        // Registro e inicio de sesión
        await loginPage.register(email, password, 'Tester User')
        await loginPage.expectRedirectToLogin()
        await loginPage.login(email, password)
        await loginPage.expectRedirectToProjects()

        // Crear proyecto base
        await projectListPage.goto()
        await projectListPage.createProject(projectName)
        await projectListPage.expectProjectVisible(projectName)
    })

    test('US-04: listar proyectos creados', async ({ page }) => {
        const projectListPage = new ProjectListPage(page)
        await projectListPage.goto()
        await projectListPage.expectProjectVisible(projectName)
    })

    test('US-05: crear tarea en un proyecto', async ({ page }) => {
        const projectListPage = new ProjectListPage(page)
        const projectDetailPage = new ProjectDetailPage(page)

        await projectListPage.goto()
        await projectListPage.openProject(projectName)

        await projectDetailPage.createTask('Implementar login', 'HIGH')
        await projectDetailPage.expectTaskVisible('Implementar login')
    })

    test('US-06: cambiar estado de una tarea (de TODO a IN_PROGRESS)', async ({ page }) => {
        const projectListPage = new ProjectListPage(page)
        const projectDetailPage = new ProjectDetailPage(page)
        const taskDetailPage = new TaskDetailPage(page)

        await projectListPage.goto()
        await projectListPage.openProject(projectName)

        await projectDetailPage.createTask('Tarea de estados', 'MEDIUM')
        await projectDetailPage.expectTaskVisible('Tarea de estados')

        // Abrir detalle de tarea
        await projectDetailPage.openTaskDetail('Tarea de estados')
        await taskDetailPage.expectTaskTitle('Tarea de estados')

        // Mover a IN_PROGRESS
        await taskDetailPage.transitionToStatus('IN_PROGRESS')

        // Volver al proyecto usando el botón de volver del navegador y verificar estado
        await page.goBack()
        await projectDetailPage.expectTaskVisible('Tarea de estados')
    })

    test('US-07: filtrar y buscar tareas', async ({ page }) => {
        const projectListPage = new ProjectListPage(page)
        const projectDetailPage = new ProjectDetailPage(page)

        await projectListPage.goto()
        await projectListPage.openProject(projectName)

        // Crear dos tareas
        await projectDetailPage.createTask('Tarea Alfa', 'HIGH')
        await projectDetailPage.createTask('Tarea Beta', 'LOW')

        await projectDetailPage.expectTaskVisible('Tarea Alfa')
        await projectDetailPage.expectTaskVisible('Tarea Beta')

        // Buscar por texto
        await projectDetailPage.searchTasks('Alfa')
        await projectDetailPage.expectTaskVisible('Tarea Alfa')
        await projectDetailPage.expectTaskNotVisible('Tarea Beta')

        // Limpiar búsqueda
        await projectDetailPage.searchTasks('')
        await projectDetailPage.expectTaskVisible('Tarea Alfa')
        await projectDetailPage.expectTaskVisible('Tarea Beta')
    })

    test('US-08: agregar comentarios a una tarea', async ({ page }) => {
        const projectListPage = new ProjectListPage(page)
        const projectDetailPage = new ProjectDetailPage(page)
        const taskDetailPage = new TaskDetailPage(page)

        await projectListPage.goto()
        await projectListPage.openProject(projectName)

        await projectDetailPage.createTask('Tarea con comentarios', 'CRITICAL')
        await projectDetailPage.openTaskDetail('Tarea con comentarios')

        // Agregar comentario
        await taskDetailPage.addComment('Este es un comentario E2E de prueba.')
        await taskDetailPage.expectCommentVisible('Este es un comentario E2E de prueba.')
    })
})
