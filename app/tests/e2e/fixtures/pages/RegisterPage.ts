import { BasePage } from './BasePage'

export class RegisterPage extends BasePage {
    async goto() {
        await this.page.goto('/register')
    }

    async register(email: string, password: string, username?: string) {
        await this.page.getByPlaceholder('Email').fill(email)
        if (username) {
            await this.page.getByPlaceholder('Username').fill(username)
        }
        await this.page.getByPlaceholder('Password').fill(password)
        await this.page.getByRole('button', { name: /sign up/i }).click()
        await this.waitForNavigation('/dashboard')
    }
}
