import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";

/**
 * Equivalence Partitioning Tests
 *
 * Technique: Equivalence Partitioning (EP)
 * Principle: Divide inputs into classes where all values behave identically.
 *            Test one representative from each class.
 *
 * Partitions under test:
 *   1. Cart addToCart – quantity field
 *      EP-Q-01 (Valid)   → typical quantity (5)
 *      EP-Q-02 (Invalid) → zero (0)
 *      EP-Q-03 (Invalid) → negative (-1)
 *      EP-Q-04 (Invalid) → exceeds stock (99999)
 *
 *   2. Product search – category field
 *      EP-C-01 (Valid)   → known category ("Smartphones")
 *      EP-C-02 (Valid)   → known category ("Clothing")
 *      EP-C-03 (Invalid) → unknown category ("INVALID_CATEGORY_XYZ")
 *
 *   3. Product search – price range (INR)
 *      EP-P-01 (Valid)   → valid minPrice/maxPrice range (₹10,000–₹1,00,000)
 *      EP-P-02 (Invalid) → negative minPrice
 *      EP-P-03 (Invalid) → maxPrice < minPrice
 *      EP-P-04 (Valid)   → minPrice equals maxPrice (single-point range)
 */

test.describe('Equivalence Partitioning — Cart: quantity field', {
    tag: ['@EquivalencePartitioning', '@EP', '@Cart', '@API']
}, () => {

    // EP-Q-01 – Valid partition: typical in-range quantity
    test('[EP-Q-01] Valid quantity (5) returns 200', {
        tag: ['@Smoke', '@FKT-Q-01']
    }, async ({ cartController }) => {
        logger.info('EP-Q-01: Valid quantity representative = 5');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 5,
            size: '128GB',
            color: 'Onyx Black'
        });

        logger.info(`EP-Q-01 status: ${response.status()}`);
        expect(response.status(), 'Valid quantity should return 200').toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    // EP-Q-02 – Invalid partition: zero quantity
    test('[EP-Q-02] Zero quantity returns 400', {
        tag: ['@Negative', '@FKT-Q-02']
    }, async ({ cartController }) => {
        logger.info('EP-Q-02: Invalid quantity representative = 0');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 0,
            size: '128GB',
            color: 'Onyx Black'
        });

        logger.info(`EP-Q-02 status: ${response.status()}`);
        expect(response.status(), 'Zero quantity should be rejected').toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // EP-Q-03 – Invalid partition: negative quantity
    test('[EP-Q-03] Negative quantity (-1) returns 400', {
        tag: ['@Negative', '@FKT-Q-03']
    }, async ({ cartController }) => {
        logger.info('EP-Q-03: Invalid quantity representative = -1');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: -1,
            size: '128GB',
            color: 'Onyx Black'
        });

        logger.info(`EP-Q-03 status: ${response.status()}`);
        expect(response.status(), 'Negative quantity should be rejected').toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // EP-Q-04 – Invalid partition: quantity exceeds available stock
    test('[EP-Q-04] Quantity exceeding stock (99999) returns 400 or 409', {
        tag: ['@Negative', '@FKT-Q-04']
    }, async ({ cartController }) => {
        logger.info('EP-Q-04: Over-stock quantity representative = 99999');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 99999,
            size: '128GB',
            color: 'Onyx Black'
        });

        logger.info(`EP-Q-04 status: ${response.status()}`);
        expect(response.status(), 'Over-stock quantity should be rejected').toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/stock|inventory|quantity/i);
    });
});

test.describe('Equivalence Partitioning — Product Search: category field', {
    tag: ['@EquivalencePartitioning', '@EP', '@Product', '@API']
}, () => {

    // EP-C-01 – Valid partition: known active category
    test('[EP-C-01] Known category "Smartphones" returns results', {
        tag: ['@Smoke', '@FKT-C-01']
    }, async ({ productController }) => {
        logger.info('EP-C-01: Known category representative = "Smartphones"');

        const response = await productController.searchProducts({ category: 'Smartphones' });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);
    });

    // EP-C-02 – Valid partition: second known category
    test('[EP-C-02] Known category "Clothing" returns results', {
        tag: ['@Regression', '@FKT-C-02']
    }, async ({ productController }) => {
        logger.info('EP-C-02: Known category representative = "Clothing"');

        const response = await productController.searchProducts({ category: 'Clothing' });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
    });

    // EP-C-03 – Invalid partition: unknown category — expect empty result set, not an error
    test('[EP-C-03] Unknown category returns empty result set', {
        tag: ['@Negative', '@FKT-C-03']
    }, async ({ productController }) => {
        logger.info('EP-C-03: Unknown category representative = "INVALID_CATEGORY_XYZ"');

        const response = await productController.searchProducts({ category: 'INVALID_CATEGORY_XYZ' });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.data.length).toBe(0);
    });
});

test.describe('Equivalence Partitioning — Product Search: price range', {
    tag: ['@EquivalencePartitioning', '@EP', '@Product', '@API']
}, () => {

    // EP-P-01 – Valid partition: sensible minPrice/maxPrice (INR)
    test('[EP-P-01] Valid price range (₹10,000–₹1,00,000) returns results', {
        tag: ['@Smoke', '@FKT-P-01']
    }, async ({ productController }) => {
        logger.info('EP-P-01: Valid price range representative = minPrice:10000, maxPrice:100000 (INR)');

        const response = await productController.searchProducts({ minPrice: 10000, maxPrice: 100000 });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        body.data.forEach((p: { price: number }) => {
            expect(p.price).toBeGreaterThanOrEqual(10000);
            expect(p.price).toBeLessThanOrEqual(100000);
        });
    });

    // EP-P-02 – Invalid partition: negative minPrice
    test('[EP-P-02] Negative minPrice returns 400', {
        tag: ['@Negative', '@FKT-P-02']
    }, async ({ productController }) => {
        logger.info('EP-P-02: Negative minPrice representative = -1');

        const response = await productController.searchProducts({ minPrice: -1, maxPrice: 100000 });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // EP-P-03 – Invalid partition: maxPrice less than minPrice
    test('[EP-P-03] maxPrice < minPrice returns 400', {
        tag: ['@Negative', '@FKT-P-03']
    }, async ({ productController }) => {
        logger.info('EP-P-03: Inverted range representative = minPrice:100000, maxPrice:10000');

        const response = await productController.searchProducts({ minPrice: 100000, maxPrice: 10000 });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // EP-P-04 – Valid partition: minPrice equals maxPrice (single-point range)
    test('[EP-P-04] minPrice equals maxPrice returns exact-match products only', {
        tag: ['@Regression', '@FKT-P-04']
    }, async ({ productController }) => {
        logger.info('EP-P-04: Single-point range representative = minPrice:74999, maxPrice:74999 (Samsung Galaxy S24 price in INR)');

        const response = await productController.searchProducts({ minPrice: 74999, maxPrice: 74999 });

        expect(response.status()).toBe(200);
        const body = await response.json();
        body.data.forEach((p: { price: number }) => {
            expect(p.price).toBe(74999);
        });
    });
});
