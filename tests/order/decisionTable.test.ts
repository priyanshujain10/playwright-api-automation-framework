import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";
import orderData from "@testdata/json/requests/order/createOrder.json";

/**
 * Decision Table Tests — Order Creation
 *
 * Technique: Decision Table Testing
 * Principle: Each column in the table represents a unique rule — a complete
 *            combination of conditions. Every rule must be tested exactly once.
 *
 * Conditions:
 *   C1 — Cart has items        (Yes / No)
 *   C2 — Payment method valid  (Yes / No)
 *   C3 — Shipping address complete (Yes / No)
 *
 * Rules (collapsed to 4 distinct outcomes):
 *   R1: C1=Y, C2=Y, C3=Y  →  200 Order created
 *   R2: C1=N, C2=any, C3=any  →  400 Cart empty
 *   R3: C1=Y, C2=N, C3=any  →  400 Invalid payment
 *   R4: C1=Y, C2=Y, C3=N  →  400 Invalid address
 */

const validOrder = {
    ...orderData,
    paymentMethod: 'UPI',
    shippingMethod: 'standard'
};

const invalidPaymentOrder = {
    ...orderData,
    paymentMethod: 'INVALID_PAYMENT_METHOD_XYZ',
    shippingMethod: 'standard'
};

const incompleteAddressOrder = {
    shippingAddress: {
        // Missing required fields: no city, state, zipCode
        firstName: 'Rahul',
        lastName: 'Sharma',
        addressLine1: 'Flat 4B, Prestige Towers',
        country: 'IN'
    },
    billingAddress: {
        firstName: 'Rahul',
        lastName: 'Sharma',
        addressLine1: 'Flat 4B, Prestige Towers',
        city: 'Bengaluru',
        state: 'Karnataka',
        zipCode: '560001',
        country: 'IN'
    },
    paymentMethod: 'UPI',
    shippingMethod: 'standard'
};

test.describe('Decision Table — Order Creation', {
    tag: ['@DecisionTable', '@DT', '@Order', '@API']
}, () => {

    test.beforeEach(async ({ cartController, productController }) => {
        // Shared setup: ensure a product is in the cart
        const productsResponse = await productController.getAllProducts({ pageSize: 1 });
        const productsBody = await productsResponse.json();
        const product = productsBody.data[0];

        await cartController.clearCart();
        await cartController.addToCart({
            productId: product.id,
            quantity: 1,
            size: product.variants[0].size,
            color: product.variants[0].color
        });
        logger.info('DT setup: Cart populated with 1 product');
    });

    test.afterEach(async ({ cartController }) => {
        await cartController.clearCart();
        logger.info('DT cleanup: Cart cleared');
    });

    // ─── Rule R1: C1=Y, C2=Y, C3=Y → 200 ────────────────────────────────────
    test('[DT-R1] Cart=Y, ValidPayment=Y, ValidAddress=Y → 200 order created', {
        tag: ['@Smoke', '@FKT-R1']
    }, async ({ orderController }) => {
        logger.info('DT-R1: All conditions TRUE — happy path');

        const response = await orderController.createOrder(validOrder);
        const body = await response.json();

        logger.info(`DT-R1 status: ${response.status()}`);
        expect(response.status(), 'R1 must return 200').toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.orderId).toBeTruthy();
        expect(body.data.status).toBe('pending');
    });

    // ─── Rule R2: C1=N (cart empty), C2=Y, C3=Y → 400 ───────────────────────
    test('[DT-R2] Cart=N, ValidPayment=Y, ValidAddress=Y → 400 cart empty', {
        tag: ['@Negative', '@FKT-R2']
    }, async ({ orderController, cartController }) => {
        logger.info('DT-R2: C1=N dominant condition — empty cart');

        // Override beforeEach by clearing the cart again
        await cartController.clearCart();

        const response = await orderController.createOrder(validOrder);
        const body = await response.json();

        logger.info(`DT-R2 status: ${response.status()}`);
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/empty|cart/i);
    });

    // ─── Rule R3: C1=Y, C2=N, C3=Y → 400 invalid payment ────────────────────
    test('[DT-R3] Cart=Y, ValidPayment=N, ValidAddress=Y → 400 invalid payment', {
        tag: ['@Negative', '@FKT-R3']
    }, async ({ orderController }) => {
        logger.info('DT-R3: C2=N — invalid payment method');

        const response = await orderController.createOrder(invalidPaymentOrder);
        const body = await response.json();

        logger.info(`DT-R3 status: ${response.status()}`);
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/payment|method/i);
    });

    // ─── Rule R4: C1=Y, C2=Y, C3=N → 400 invalid address ────────────────────
    test('[DT-R4] Cart=Y, ValidPayment=Y, ValidAddress=N → 400 invalid address', {
        tag: ['@Negative', '@FKT-R4']
    }, async ({ orderController }) => {
        logger.info('DT-R4: C3=N — incomplete shipping address');

        const response = await orderController.createOrder(incompleteAddressOrder as Parameters<typeof orderController.createOrder>[0]);
        const body = await response.json();

        logger.info(`DT-R4 status: ${response.status()}`);
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/address|shipping|zip|city|state/i);
    });

    // ─── Rule R5: C1=N, C2=N, C3=Y → 400 — cart error takes precedence ──────
    test('[DT-R5] Cart=N, ValidPayment=N, ValidAddress=Y → 400 cart error dominates', {
        tag: ['@Negative', '@FKT-R5']
    }, async ({ orderController, cartController }) => {
        logger.info('DT-R5: C1=N dominates over C2=N — empty cart error');

        await cartController.clearCart();

        const response = await orderController.createOrder(invalidPaymentOrder);
        const body = await response.json();

        logger.info(`DT-R5 status: ${response.status()}`);
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        // Cart error should dominate; message should reference cart, not payment
        expect(body.error.message).toMatch(/empty|cart/i);
    });
});
