import { Locator, Page } from "@playwright/test";
import { Base } from "@src/core/base/base";

export class LoginPage extends Base {
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;

    constructor(page: Page) {
        super(page);
        this.usernameInput = page.locator('#username');
        this.passwordInput = page.locator('#password');
        this.loginButton = page.locator('#login-button');
    }

    /**
     * Logs in a user with the provided username and password.
     * @param username username
     * @param password password
     */
    async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}