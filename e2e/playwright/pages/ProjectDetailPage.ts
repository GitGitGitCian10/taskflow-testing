import { Page, expect } from '@playwright/test'

export class ProjectDetailPage {
    constructor(private page: Page) { }

    async createTask(title: string, priority: string) {
        await this.page.getByTestId('create-task-btn').click()
        await this.page.getByTestId('task-title-input').fill(title)
        await this.page.locator('form select').selectOption(priority)
        await this.page.getByTestId('task-submit').click()
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
