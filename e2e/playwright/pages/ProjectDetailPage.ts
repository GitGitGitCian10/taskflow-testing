import { Page, expect } from '@playwright/test'

export class ProjectDetailPage {
    constructor(private page: Page) { }

    async createTask(title: string, priority: string) {
        const titleInput = this.page.getByTestId('task-title-input')
        if (!await titleInput.isVisible()) {
            await this.page.getByTestId('create-task-btn').click()
            await expect(titleInput).toBeVisible()
        }
        await titleInput.fill(title)
        await this.page.locator('form select').selectOption(priority)
        await this.page.getByTestId('task-submit').click()
        await expect(titleInput).toBeHidden()
    }

    async filterTasksByStatus(status: string) {
        await this.page.getByTestId('task-status-filter').selectOption(status)
    }

    async searchTasks(query: string) {
        await this.page.getByTestId('task-search-input').fill(query)
    }

    async openTaskDetail(title: string) {
        await this.page.getByTestId('task-list').getByText(title).click()
    }

    async expectTaskVisible(title: string) {
        await expect(this.page.getByTestId('task-list').getByText(title)).toBeVisible()
    }

    async expectTaskNotVisible(title: string) {
        await expect(this.page.getByTestId('task-list').getByText(title)).not.toBeVisible()
    }
}
