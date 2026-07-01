import { Page } from "@playwright/test";
import { GotoOptions } from "@core/models/userDefinedTypes";

/**
 * Liskov Substitution Principle (LSP) contract for page objects:
 * any subclass must be navigable via goto() with the same signature and
 * without adding stricter preconditions, so callers (fixtures, tests) can
 * treat every page object polymorphically as a BasePage.
 */
export abstract class BasePage {
    protected readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    abstract goto(options?: GotoOptions): Promise<void>;

    /**
     * Shared readiness check available to every page object without
     * forcing each subclass to re-implement network-idle waiting.
     */
    async waitForLoad(): Promise<void> {
        await this.page.waitForLoadState("networkidle");
    }
}
