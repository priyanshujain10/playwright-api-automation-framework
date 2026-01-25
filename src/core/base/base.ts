import { Page } from "@playwright/test";
import { GotoOptions } from "../models/userDefinedTypes";

export class Base {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateTo(url: string, options?: GotoOptions): Promise<void> {
        await this.page.goto(url, options);
    }
}