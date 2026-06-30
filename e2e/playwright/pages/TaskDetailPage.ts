import { Page, expect } from '@playwright/test'

export class TaskDetailPage {
    constructor(private page: Page) { }

    async transitionToStatus(status: string) {
        await this.page.getByTestId('task-status-select').filter({ hasText: status }).click()
    }

    async addComment(body: string) {
        await this.page.getByTestId('comment-input').fill(body)
        await this.page.getByTestId('comment-submit').click()
    }

    async expectCommentVisible(body: string) {
        await expect(this.page.getByTestId('comment-list').getByText(body)).toBeVisible()
    }

    async expectTaskTitle(title: string) {
        await expect(this.page.getByTestId('task-title')).toHaveText(title)
    }

    async goBackToProject(projectId: string) {
        await this.page.goto(`/projects/${projectId}`)
    }
}
