import { BasePage } from './BasePage'

export class AdminPage extends BasePage {
    async goto() {
        await this.page.goto('/admin/settings')
    }

    async toggleAuthSetting(settingName: string) {
        // Find checkbox by label text
        await this.page.getByLabel(new RegExp(settingName, 'i')).click()
    }

    async saveSettings() {
        await this.page.getByRole('button', { name: /save.*changes/i }).click()
        // Wait for success message
        await this.page.getByText(/settings saved successfully/i).waitFor()
    }

    async getHeading() {
        return this.page.getByRole('heading', { level: 1 })
    }
}
