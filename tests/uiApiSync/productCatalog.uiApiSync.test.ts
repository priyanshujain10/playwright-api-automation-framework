import { test, expect } from "@src/core/fixtures/main.fixture";
import { logger } from "@core/utils/loggingUtil/logger";

/**
 * UI-API Synergy Demo — Product Catalog
 *
 * Purpose: demonstrate how an API call can act as the source of truth for a
 * UI assertion, instead of hardcoding expected UI text. This reduces
 * duplication between UI and API suites and removes a common source of
 * E2E flakiness: UI tests asserting against copy/data that silently drifts
 * from the backend.
 *
 * Target: automationexercise.com — a live, public site with both a real UI
 * (unlike this repo's other UI code, which was removed for pointing at a
 * fictional page) and a documented REST API (unlike this repo's Flipkart-
 * style controllers, which have no live backend to run against).
 *
 * Pattern demonstrated:
 *   1. Fetch product data directly from the API (ground truth).
 *   2. Drive the real browser to search for the same product.
 *   3. Assert the UI renders data matching the API response — not a
 *      hardcoded expected string.
 */
test.describe("Product Catalog — API-driven UI verification", {
    tag: ["@UiApiSync", "@API", "@UI"],
}, () => {

    test("[UI+API] Product search result rendered by the UI matches the live API response", {
        tag: ["@Smoke"],
    }, async ({ exerciseProductsController, productsPage }) => {
        const searchTerm = "Blue Top";

        logger.info(`Fetching ground-truth product data from the API for "${searchTerm}"`);
        const apiResponse = await exerciseProductsController.searchProduct(searchTerm);
        expect(apiResponse.status(), "searchProduct API should return 200").toBe(200);

        const apiBody = await apiResponse.json();
        expect(apiBody.responseCode).toBe(200);
        expect(Array.isArray(apiBody.products)).toBe(true);
        expect(apiBody.products.length, `API should return exactly one match for "${searchTerm}"`).toBe(1);

        const expectedProduct = apiBody.products[0];
        logger.info(`API ground truth: ${expectedProduct.name} — ${expectedProduct.price}`);

        await productsPage.goto();
        await productsPage.searchProducts(searchTerm);
        const visibleProducts = await productsPage.getVisibleProducts();

        logger.info(`UI rendered ${visibleProducts.length} product card(s) for "${searchTerm}"`);

        const matchInUi = visibleProducts.find(
            (product) => product.name === expectedProduct.name && product.price === expectedProduct.price
        );

        expect(
            matchInUi,
            `Expected the UI to render a product matching the API response (${expectedProduct.name}, ${expectedProduct.price})`
        ).toBeTruthy();
    });

    test("[UI+API] Every product the API returns for a keyword also appears in the UI results", {
        tag: ["@Regression"],
    }, async ({ exerciseProductsController, productsPage }) => {
        const searchTerm = "Dress";

        const apiResponse = await exerciseProductsController.searchProduct(searchTerm);
        expect(apiResponse.status()).toBe(200);
        const apiBody = await apiResponse.json();
        const apiProducts: { name: string; price: string }[] = apiBody.products;

        expect(apiProducts.length, `API should return at least one result for "${searchTerm}"`).toBeGreaterThan(0);

        await productsPage.goto();
        await productsPage.searchProducts(searchTerm);
        const visibleProducts = await productsPage.getVisibleProducts();

        for (const expectedProduct of apiProducts) {
            const matchInUi = visibleProducts.some(
                (product) => product.name === expectedProduct.name && product.price === expectedProduct.price
            );
            expect(matchInUi, `API product "${expectedProduct.name}" (${expectedProduct.price}) should be rendered in the UI`).toBe(true);
        }
    });
});
