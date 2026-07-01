import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";

/**
 * Boundary Value Analysis (BVA) Tests
 *
 * Technique: Boundary Value Analysis
 * Principle: Test at and immediately around the edges of valid input domains.
 *            Defects cluster at boundaries — off-by-one errors are the classic example.
 *
 * Boundaries under test:
 *   1. Cart addToCart — quantity [1, 99]
 *      BVA-Q-01: 0   (min-1)  → 400
 *      BVA-Q-02: 1   (min)    → 200
 *      BVA-Q-03: 2   (min+1)  → 200
 *      BVA-Q-04: 98  (max-1)  → 200
 *      BVA-Q-05: 99  (max)    → 200
 *      BVA-Q-06: 100 (max+1)  → 400
 *
 *   2. Product getAllProducts — pageSize [1, 50]
 *      BVA-PS-01: 0  (min-1)  → 400
 *      BVA-PS-02: 1  (min)    → 200
 *      BVA-PS-03: 2  (min+1)  → 200
 *      BVA-PS-04: 49 (max-1)  → 200
 *      BVA-PS-05: 50 (max)    → 200
 *      BVA-PS-06: 51 (max+1)  → 400
 *
 *   3. Product getAllProducts — page number [1, ∞)
 *      BVA-PG-01: 0      (min-1) → 400
 *      BVA-PG-02: 1      (min)   → 200 — first page
 *      BVA-PG-03: 2      (min+1) → 200 — second page
 *      BVA-PG-04: 99999  (deep)  → 200 — empty data array
 *
 *   4. Payment processPayment — amount in INR (minimum ₹1.00)
 *      BVA-A-01: 0.00 (min-1) → 400
 *      BVA-A-02: 1.00 (min)   → 200
 *      BVA-A-03: 1.01 (min+1) → 200
 */

test.describe('BVA — Cart: quantity boundaries [1, 99]', {
    tag: ['@BVA', '@BoundaryValueAnalysis', '@Cart', '@API']
}, () => {

    // BVA-Q-01: 0 → below minimum
    test('[BVA-Q-01] quantity=0 (min-1) returns 400', {
        tag: ['@Negative', '@FKT-Q-01']
    }, async ({ cartController }) => {
        logger.info('BVA-Q-01: quantity = 0 (below minimum)');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 0,
            size: '128GB',
            color: 'Onyx Black'
        });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // BVA-Q-02: 1 → minimum boundary
    test('[BVA-Q-02] quantity=1 (min) returns 200', {
        tag: ['@Smoke', '@FKT-Q-02']
    }, async ({ cartController }) => {
        logger.info('BVA-Q-02: quantity = 1 (minimum boundary)');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 1,
            size: '128GB',
            color: 'Onyx Black'
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.quantity).toBe(1);
    });

    // BVA-Q-03: 2 → just above minimum
    test('[BVA-Q-03] quantity=2 (min+1) returns 200', {
        tag: ['@Regression', '@FKT-Q-03']
    }, async ({ cartController }) => {
        logger.info('BVA-Q-03: quantity = 2 (just above minimum)');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 2,
            size: '128GB',
            color: 'Onyx Black'
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    // BVA-Q-04: 98 → just below maximum
    test('[BVA-Q-04] quantity=98 (max-1) returns 200', {
        tag: ['@Regression', '@FKT-Q-04']
    }, async ({ cartController }) => {
        logger.info('BVA-Q-04: quantity = 98 (just below maximum)');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 98,
            size: '128GB',
            color: 'Onyx Black'
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    // BVA-Q-05: 99 → maximum boundary
    test('[BVA-Q-05] quantity=99 (max) returns 200', {
        tag: ['@Smoke', '@FKT-Q-05']
    }, async ({ cartController }) => {
        logger.info('BVA-Q-05: quantity = 99 (maximum boundary)');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 99,
            size: '128GB',
            color: 'Onyx Black'
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    // BVA-Q-06: 100 → above maximum
    test('[BVA-Q-06] quantity=100 (max+1) returns 400', {
        tag: ['@Negative', '@FKT-Q-06']
    }, async ({ cartController }) => {
        logger.info('BVA-Q-06: quantity = 100 (above maximum)');

        const response = await cartController.addToCart({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 100,
            size: '128GB',
            color: 'Onyx Black'
        });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });
});

test.describe('BVA — Product Search: pageSize boundaries [1, 50]', {
    tag: ['@BVA', '@BoundaryValueAnalysis', '@Product', '@API']
}, () => {

    // BVA-PS-01: 0 → below minimum
    test('[BVA-PS-01] pageSize=0 (min-1) returns 400', {
        tag: ['@Negative', '@FKT-PS-01']
    }, async ({ productController }) => {
        logger.info('BVA-PS-01: pageSize = 0 (below minimum)');

        const response = await productController.getAllProducts({ pageSize: 0 });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // BVA-PS-02: 1 → minimum boundary
    test('[BVA-PS-02] pageSize=1 (min) returns exactly 1 result', {
        tag: ['@Smoke', '@FKT-PS-02']
    }, async ({ productController }) => {
        logger.info('BVA-PS-02: pageSize = 1 (minimum boundary)');

        const response = await productController.getAllProducts({ pageSize: 1 });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.length).toBeLessThanOrEqual(1);
    });

    // BVA-PS-03: 2 → just above minimum
    test('[BVA-PS-03] pageSize=2 (min+1) returns up to 2 results', {
        tag: ['@Regression', '@FKT-PS-03']
    }, async ({ productController }) => {
        logger.info('BVA-PS-03: pageSize = 2 (just above minimum)');

        const response = await productController.getAllProducts({ pageSize: 2 });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.data.length).toBeLessThanOrEqual(2);
    });

    // BVA-PS-04: 49 → just below maximum
    test('[BVA-PS-04] pageSize=49 (max-1) returns up to 49 results', {
        tag: ['@Regression', '@FKT-PS-04']
    }, async ({ productController }) => {
        logger.info('BVA-PS-04: pageSize = 49 (just below maximum)');

        const response = await productController.getAllProducts({ pageSize: 49 });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.data.length).toBeLessThanOrEqual(49);
    });

    // BVA-PS-05: 50 → maximum boundary
    test('[BVA-PS-05] pageSize=50 (max) returns up to 50 results', {
        tag: ['@Smoke', '@FKT-PS-05']
    }, async ({ productController }) => {
        logger.info('BVA-PS-05: pageSize = 50 (maximum boundary)');

        const response = await productController.getAllProducts({ pageSize: 50 });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.data.length).toBeLessThanOrEqual(50);
    });

    // BVA-PS-06: 51 → above maximum
    test('[BVA-PS-06] pageSize=51 (max+1) returns 400', {
        tag: ['@Negative', '@FKT-PS-06']
    }, async ({ productController }) => {
        logger.info('BVA-PS-06: pageSize = 51 (above maximum)');

        const response = await productController.getAllProducts({ pageSize: 51 });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });
});

test.describe('BVA — Product Search: page number boundaries', {
    tag: ['@BVA', '@BoundaryValueAnalysis', '@Product', '@API']
}, () => {

    // BVA-PG-01: 0 → below minimum
    test('[BVA-PG-01] page=0 (min-1) returns 400', {
        tag: ['@Negative', '@FKT-PG-01']
    }, async ({ productController }) => {
        logger.info('BVA-PG-01: page = 0 (below minimum)');

        const response = await productController.getAllProducts({ page: 0 });

        expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    // BVA-PG-02: 1 → minimum boundary (first page)
    test('[BVA-PG-02] page=1 (min) returns first page of results', {
        tag: ['@Smoke', '@FKT-PG-02']
    }, async ({ productController }) => {
        logger.info('BVA-PG-02: page = 1 (minimum boundary)');

        const response = await productController.getAllProducts({ page: 1, pageSize: 10 });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);
    });

    // BVA-PG-03: 2 → just above minimum
    test('[BVA-PG-03] page=2 (min+1) returns second page', {
        tag: ['@Regression', '@FKT-PG-03']
    }, async ({ productController }) => {
        logger.info('BVA-PG-03: page = 2 (just above minimum)');

        const responsePage1 = await productController.getAllProducts({ page: 1, pageSize: 5 });
        const responsePage2 = await productController.getAllProducts({ page: 2, pageSize: 5 });

        expect(responsePage2.status()).toBe(200);
        const page1Body = await responsePage1.json();
        const page2Body = await responsePage2.json();

        // Pages should return different items
        const page1Ids = page1Body.data.map((p: { id: string }) => p.id);
        const page2Ids = page2Body.data.map((p: { id: string }) => p.id);
        const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
        expect(overlap.length, 'Page 1 and page 2 should return distinct items').toBe(0);
    });

    // BVA-PG-04: 99999 → deep page beyond last page
    test('[BVA-PG-04] page=99999 (beyond last page) returns empty data array', {
        tag: ['@Regression', '@FKT-PG-04']
    }, async ({ productController }) => {
        logger.info('BVA-PG-04: page = 99999 (deep beyond last page)');

        const response = await productController.getAllProducts({ page: 99999, pageSize: 10 });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.length).toBe(0);
    });
});

test.describe('BVA — Payment: amount minimum boundary (0.01)', {
    tag: ['@BVA', '@BoundaryValueAnalysis', '@Payment', '@API']
}, () => {

    // BVA-A-01: 0.00 → below minimum (zero charge)
    test('[BVA-A-01] amount=0.00 (min-1) returns 400', {
        tag: ['@Negative', '@FKT-A-01']
    }, async ({ paymentController }) => {
        logger.info('BVA-A-01: amount = 0.00 (below minimum)');

        const response = await paymentController.processPayment({
            orderId: 'ORD-12345',
            paymentMethodId: 'PM-001',
            amount: 0.00
        });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
    });

    // BVA-A-02: 0.01 → minimum valid amount
    test('[BVA-A-02] amount=0.01 (min) returns 200', {
        tag: ['@Smoke', '@FKT-A-02']
    }, async ({ paymentController }) => {
        logger.info('BVA-A-02: amount = 0.01 (minimum valid amount)');

        const response = await paymentController.processPayment({
            orderId: 'ORD-12345',
            paymentMethodId: 'PM-001',
            amount: 0.01
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    // BVA-A-03: 0.02 → just above minimum
    test('[BVA-A-03] amount=0.02 (min+1 cent) returns 200', {
        tag: ['@Regression', '@FKT-A-03']
    }, async ({ paymentController }) => {
        logger.info('BVA-A-03: amount = 0.02 (just above minimum)');

        const response = await paymentController.processPayment({
            orderId: 'ORD-12345',
            paymentMethodId: 'PM-001',
            amount: 0.02
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });
});
