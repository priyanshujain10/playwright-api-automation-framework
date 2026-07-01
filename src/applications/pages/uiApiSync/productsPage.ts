import { Locator, Page } from "@playwright/test";
import { GotoOptions } from "@core/models/userDefinedTypes";
import { BasePage } from "../base.page";

/**
 * Page Object for the live product catalog page on automationexercise.com.
 * Backs the UI-API synergy demo in `tests/uiApiSync/` — selectors are tied
 * to the real DOM of the public site, not fabricated placeholders.
 *
 * Extends BasePage (LSP) so it is substitutable anywhere a BasePage is
 * expected, honoring the same goto() contract as every other page object.
 */
export class ProductsPage extends BasePage {
    private readonly url = "https://automationexercise.com/products";
    private readonly searchInput: Locator;
    private readonly searchButton: Locator;
    private readonly productCards: Locator;

    constructor(page: Page) {
        super(page);
        this.searchInput = page.locator("#search_product");
        this.searchButton = page.locator("#submit_search");
        this.productCards = page.locator(".productinfo.text-center");
    }

    async goto(options?: GotoOptions): Promise<void> {
        await this.page.goto(this.url, options);
    }

    /**
     * Searches the catalog by keyword and waits for the "Searched Products" results to render.
     * @param keyword - The search term entered into the product search box.
     */
    async searchProducts(keyword: string): Promise<void> {
        await this.searchInput.fill(keyword);
        await this.searchButton.click();
        await this.page.locator("h2.title", { hasText: "Searched Products" }).waitFor();
    }

    /**
     * Reads the visible product name/price pairs from the currently rendered result cards.
     * @returns The list of products currently displayed, as { name, price } pairs.
     */
    async getVisibleProducts(): Promise<{ name: string; price: string }[]> {
        const count = await this.productCards.count();
        const products: { name: string; price: string }[] = [];

        for (let i = 0; i < count; i++) {
            const card = this.productCards.nth(i);
            const name = (await card.locator("p").innerText()).trim();
            const price = (await card.locator("h2").innerText()).trim();
            products.push({ name, price });
        }

        return products;
    }
}
