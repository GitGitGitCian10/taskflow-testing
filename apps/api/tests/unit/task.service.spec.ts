// tests/unit/task.service.spec.ts
import { describe, it, expect, vi } from 'vitest'
import * as allure from 'allure-js-commons'
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
            allure.label('feature', 'Validación Tareas');
            allure.label('story', 'TSK-01');
            allure.severity('normal');
            allure.link('https://github.com/GitGitGitCian10/taskflow-testing/issues/1', 'ISSUE-01');
            allure.description('Verifica que un título con menos de 3 caracteres lanza error.');
            
            await allure.step('Validar título corto', async () => {
                await expect(taskService.validateTitle('ab')).rejects.toThrow('El título debe tener al menos 3 caracteres');
            });
        })

        it('título más de 100 caracteres', async () => {
            allure.label('feature', 'Validación Tareas');
            allure.label('story', 'TSK-01');
            allure.severity('normal');
            allure.link('https://github.com/GitGitGitCian10/taskflow-testing/issues/2', 'ISSUE-02');
            allure.description('Verifica que un título con más de 100 caracteres lanza error.');

            await allure.step('Validar título largo', async () => {
                await expect(taskService.validateTitle('a'.repeat(101))).rejects.toThrow('El título no puede superar los 100 caracteres');
            });
        })

        it('título con solo espacios', async () => {
            allure.label('feature', 'Validación Tareas');
            allure.label('story', 'TSK-01');
            allure.severity('minor');
            allure.link('https://github.com/GitGitGitCian10/taskflow-testing/issues/3', 'ISSUE-03');
            allure.description('Verifica que un título solo con espacios es inválido.');

            await allure.step('Validar título vacío con espacios', async () => {
                await expect(taskService.validateTitle('   ')).rejects.toThrow('El título no puede estar vacío');
            });
        })

        it('título válido', async () => {
            allure.label('feature', 'Validación Tareas');
            allure.label('story', 'TSK-01');
            allure.severity('critical');
            allure.link('https://github.com/GitGitGitCian10/taskflow-testing/issues/4', 'ISSUE-04');
            allure.description('Verifica que un título con longitud correcta no lanza error.');

            await allure.step('Validar título correcto', async () => {
                await expect(taskService.validateTitle('título válido')).resolves.not.toThrow();
            });
        })

        it('título con exactamente 3 caracteres', async () => {
            allure.label('feature', 'Validación Tareas');
            allure.label('story', 'TSK-01');
            allure.severity('critical');
            allure.link('https://github.com/GitGitGitCian10/taskflow-testing/issues/5', 'ISSUE-05');
            allure.description('Verifica límite inferior de 3 caracteres exactos.');

            await allure.step('Validar límite inferior', async () => {
                await expect(taskService.validateTitle('abc')).resolves.not.toThrow();
            });
        })

        it('título con exactamente 100 caracteres', async () => {
            await expect(taskService.validateTitle('a'.repeat(100))).resolves.not.toThrow()
        })
    })
})
