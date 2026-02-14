import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
    async goto() {
        await this.page.goto('/login')
    }

    async login(username: string, password: string) {
        await this.page.getByPlaceholder('Username').fill(username)
        await this.page.getByPlaceholder('Password').fill(password)
        await this.page.getByRole('button', { name: /log in/i }).click()
        await this.waitForNavigation('/dashboard')
    }

    async expectErrorMessage(message: string) {
        await this.page.waitForSelector(`text=${message}`)
    }
}
