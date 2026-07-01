import { test as baseTest } from "@playwright/test";
import { ProductsPage } from "./productsPage";

export type UiApiSyncFixtures = {
    productsPage: ProductsPage;
};

export const test = baseTest.extend<UiApiSyncFixtures>({
    productsPage: async ({ page }, use) => {
        await use(new ProductsPage(page));
    },
});

export { expect } from "@playwright/test";
