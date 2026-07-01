/* eslint-disable playwright/no-conditional-in-test -- conditional assertions guard optional response fields (e.g. masked card number only present when returned) */
import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { ExpectUtil } from "@core/utils/expectUtil";
import { logger } from "@core/utils/loggingUtil/logger";
import orderData from "@testdata/json/requests/order/createOrder.json";
import paymentSchema from "@testdata/json/expectedSchemas/paymentSchema.json";

// ─── Payment Methods CRUD ─────────────────────────────────────────────────────

test.describe('Payment API — Payment Methods CRUD', {
    tag: ['@Payment', '@PaymentMethods', '@CRUD', '@API']
}, () => {

    const validCard = {
        type: 'credit_card',
        cardNumber: '4111111111111111',
        expiryDate: '12/2028',
        cvv: '123',
        cardholderName: 'John Doe'
    };

    // ─── READ ────────────────────────────────────────────────────────────────
    test('[GET] Get payment methods — returns 200 with list', {
        tag: ['@Smoke', '@GetPaymentMethods', '@Read']
    }, async ({ paymentController }) => {
        logger.info('Test: Get all saved payment methods for authenticated user');

        const response = await paymentController.getPaymentMethods();
        const body = await response.json();

        logger.info(`Get payment methods status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);

        // Each saved method should have an ID and type — never expose full card number
        for (const method of body.data) {
            expect(method.methodId).toBeTruthy();
            expect(method.type).toBeTruthy();
            if (method.cardNumber) {
                // If the field exists, it must be masked (last 4 digits only)
                expect(method.cardNumber).toMatch(/^\*+\d{4}$/);
            }
        }
        logger.info(`Retrieved ${body.data.length} payment methods`);
    });

    test('[GET] Get payment methods — unauthenticated returns 401', {
        tag: ['@Negative', '@GetPaymentMethods', '@Authorization']
    }, async ({ paymentController }) => {
        logger.info('Test: Get payment methods without authentication');

        const response = await paymentController['request'].get(
            `${paymentController['BASE_URL']}/payments/methods`,
            { headers: { Authorization: '' } }
        );

        logger.info(`Unauthenticated payment methods status: ${response.status()}`);
        expect(response.status()).toBeGreaterThanOrEqual(401);
    });

    // ─── CREATE ──────────────────────────────────────────────────────────────
    test('[POST] Add payment method — valid credit card returns 201', {
        tag: ['@Smoke', '@AddPaymentMethod', '@Create']
    }, async ({ paymentController }) => {
        logger.info('Test: Add a valid credit card payment method');

        const response = await paymentController.addPaymentMethod(validCard);
        const body = await response.json();

        logger.info(`Add payment method status: ${response.status()}`);
        expect(response.status()).toBe(201);
        expect(body.success).toBe(true);
        expect(body.data.methodId).toBeTruthy();
        expect(body.data.type).toBe('credit_card');
        // Full card number must NOT be stored/returned — only last 4
        if (body.data.cardNumber) {
            expect(body.data.cardNumber).toMatch(/^\*+\d{4}$/);
        }
        logger.info(`Payment method added: methodId=${body.data.methodId}`);
    });

    test('[POST] Add payment method — expired card returns 400', {
        tag: ['@Negative', '@AddPaymentMethod']
    }, async ({ paymentController }) => {
        logger.info('Test: Add expired credit card');

        const response = await paymentController.addPaymentMethod({
            type: 'credit_card',
            cardNumber: '4111111111111111',
            expiryDate: '01/2020', // Clearly in the past
            cvv: '123',
            cardholderName: 'John Doe'
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/expir|date|invalid/i);
    });

    test('[POST] Add payment method — missing cardNumber returns 400', {
        tag: ['@Negative', '@AddPaymentMethod']
    }, async ({ paymentController }) => {
        logger.info('Test: Add payment method with missing cardNumber');

        const response = await paymentController.addPaymentMethod({
            type: 'credit_card',
            expiryDate: '12/2028',
            cvv: '123',
            cardholderName: 'John Doe'
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/card|number|required/i);
    });

    test('[POST] Add payment method — non-numeric card number returns 400', {
        tag: ['@Negative', '@AddPaymentMethod']
    }, async ({ paymentController }) => {
        logger.info('Test: Add payment method with alphabetical card number');

        const response = await paymentController.addPaymentMethod({
            type: 'credit_card',
            cardNumber: 'ABCD-EFGH-IJKL-MNOP',
            expiryDate: '12/2028',
            cvv: '123',
            cardholderName: 'John Doe'
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/card|number|invalid|numeric/i);
    });

    // ─── DELETE ──────────────────────────────────────────────────────────────
    test('[DELETE] Delete payment method — existing method returns 200', {
        tag: ['@Smoke', '@DeletePaymentMethod', '@Delete']
    }, async ({ paymentController }) => {
        logger.info('Test: Delete an existing payment method');

        // First, add a method to delete
        const addResponse = await paymentController.addPaymentMethod(validCard);
        const addBody = await addResponse.json();
        const methodId = addBody.data.methodId;
        logger.info(`Created methodId=${methodId} for delete test`);

        const response = await paymentController.deletePaymentMethod(methodId);
        const body = await response.json();

        logger.info(`Delete payment method status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);

        // Verify it's gone — subsequent GET list should not contain it
        const listResponse = await paymentController.getPaymentMethods();
        const listBody = await listResponse.json();
        const deleted = listBody.data.find((m: { methodId: string }) => m.methodId === methodId);
        expect(deleted).toBeUndefined();
        logger.info(`Payment method ${methodId} confirmed deleted ✓`);
    });

    test('[DELETE] Delete non-existent payment method returns 404', {
        tag: ['@Negative', '@DeletePaymentMethod']
    }, async ({ paymentController }) => {
        logger.info('Test: Delete payment method with non-existent ID');

        const response = await paymentController.deletePaymentMethod('PM-DOES-NOT-EXIST-99999');
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|payment method/i);
    });
});

// ─── Payment Processing ───────────────────────────────────────────────────────

test.describe('Payment API — Process Payment', {
    tag: ['@Payment', '@ProcessPayment', '@API']
}, () => {

    let orderId: string;

    test.beforeEach(async ({ cartController, productController, orderController }) => {
        // Setup: prepare cart and create an order to pay for
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

        const orderResponse = await orderController.createOrder(orderData);
        const orderBody = await orderResponse.json();
        orderId = orderBody.data.orderId;
        logger.info(`Test setup: orderId=${orderId}`);
    });

    test.afterEach(async ({ cartController }) => {
        // Cleanup: clear cart after each test
        await cartController.clearCart();
        logger.info('Test cleanup: cart cleared');
    });

    test('[POST] Process payment — valid order and method returns 200 with schema', {
        tag: ['@Smoke', '@ProcessPayment', '@SchemaValidation']
    }, async ({ paymentController, orderController }) => {
        logger.info(`Test: Process payment for orderId=${orderId}`);

        // Get order total
        const orderResponse = await orderController.getOrderById(orderId);
        const orderBody = await orderResponse.json();
        const amount = orderBody.data.totalAmount;

        const response = await paymentController.processPayment({
            orderId,
            paymentMethodId: 'PM-001',
            amount
        });
        const body = await response.json();

        logger.info(`Process payment status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.paymentId).toBeTruthy();
        expect(body.data.status).toMatch(/completed|processing/);
        expect(body.data.amount).toBe(amount);

        // Contract / schema validation
        ExpectUtil.expectToMatchSchema(body.data, paymentSchema, 'Payment response must match schema');
        logger.info(`Payment processed: paymentId=${body.data.paymentId}`);
    });

    test('[POST] Process payment — amount mismatch returns 400', {
        tag: ['@Negative', '@ProcessPayment']
    }, async ({ paymentController, orderController }) => {
        logger.info(`Test: Process payment with incorrect amount for orderId=${orderId}`);

        // Get order total
        const orderResponse = await orderController.getOrderById(orderId);
        const orderBody = await orderResponse.json();
        const correctAmount = orderBody.data.totalAmount;

        // Attempt to pay a significantly lower amount
        const response = await paymentController.processPayment({
            orderId,
            paymentMethodId: 'PM-001',
            amount: correctAmount - 100 // Under-paying
        });
        const body = await response.json();

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/amount|mismatch|invalid/i);
    });

    test('[POST] Process payment — non-existent orderId returns 404', {
        tag: ['@Negative', '@ProcessPayment']
    }, async ({ paymentController }) => {
        logger.info('Test: Process payment with non-existent orderId');

        const response = await paymentController.processPayment({
            orderId: 'ORD-DOES-NOT-EXIST-999999',
            paymentMethodId: 'PM-001',
            amount: 99.99
        });
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/order|not found/i);
    });

    test('[POST] Process payment — zero amount returns 400', {
        tag: ['@Negative', '@ProcessPayment']
    }, async ({ paymentController }) => {
        logger.info('Test: Process payment with zero amount');

        const response = await paymentController.processPayment({
            orderId,
            paymentMethodId: 'PM-001',
            amount: 0
        });
        const body = await response.json();

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/amount|zero|invalid/i);
    });
});

// ─── Payment Status ───────────────────────────────────────────────────────────

test.describe('Payment API — Payment Status', {
    tag: ['@Payment', '@PaymentStatus', '@API']
}, () => {

    test('[GET] Get payment status — existing payment returns 200', {
        tag: ['@Smoke', '@GetPaymentStatus']
    }, async ({ paymentController }) => {
        logger.info('Test: Get status for an existing payment');

        const paymentId = 'PAY-12345';
        const response = await paymentController.getPaymentStatus(paymentId);
        const body = await response.json();

        logger.info(`Get payment status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.paymentId).toBe(paymentId);
        expect(body.data.status).toMatch(/pending|processing|completed|failed|refunded/);
    });

    test('[GET] Get payment status — non-existent payment returns 404', {
        tag: ['@Negative', '@GetPaymentStatus']
    }, async ({ paymentController }) => {
        logger.info('Test: Get status for a non-existent paymentId');

        const response = await paymentController.getPaymentStatus('PAY-DOES-NOT-EXIST-999999');
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|payment/i);
    });
});

// ─── Refunds ─────────────────────────────────────────────────────────────────

test.describe('Payment API — Refunds', {
    tag: ['@Payment', '@Refund', '@API']
}, () => {

    test('[POST] Refund payment — full refund returns 200', {
        tag: ['@Smoke', '@Refund']
    }, async ({ paymentController }) => {
        logger.info('Test: Process full refund for a completed payment');

        const paymentId = 'PAY-COMPLETED-001';
        const response = await paymentController.refundPayment(paymentId);
        const body = await response.json();

        logger.info(`Full refund status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.refundId).toBeTruthy();
        expect(body.data.status).toMatch(/refunded|processing/);
    });

    test('[POST] Refund payment — partial refund returns 200', {
        tag: ['@Regression', '@Refund']
    }, async ({ paymentController }) => {
        logger.info('Test: Process partial refund');

        const paymentId = 'PAY-COMPLETED-002';
        const partialAmount = 25.00;
        const response = await paymentController.refundPayment(paymentId, partialAmount);
        const body = await response.json();

        logger.info(`Partial refund status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.refundAmount).toBe(partialAmount);
        expect(body.data.status).toMatch(/partially_refunded|refunded|processing/);
    });

    test('[POST] Refund payment — refund amount exceeds original returns 400', {
        tag: ['@Negative', '@Refund']
    }, async ({ paymentController }) => {
        logger.info('Test: Refund with amount exceeding original payment — classic error guessing');

        // Attempting to refund more than was originally charged
        const paymentId = 'PAY-COMPLETED-001';
        const response = await paymentController.refundPayment(paymentId, 99999.99);
        const body = await response.json();

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/exceed|amount|original|refund/i);
    });

    test('[POST] Refund payment — refund already-refunded payment returns 409', {
        tag: ['@Negative', '@Refund']
    }, async ({ paymentController }) => {
        logger.info('Test: Double refund attempt — should be rejected');

        const paymentId = 'PAY-ALREADY-REFUNDED-001';
        const response = await paymentController.refundPayment(paymentId);
        const body = await response.json();

        expect(response.status()).toBe(409);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/already refunded|duplicate|conflict/i);
    });

    test('[POST] Refund non-existent payment returns 404', {
        tag: ['@Negative', '@Refund']
    }, async ({ paymentController }) => {
        logger.info('Test: Refund with non-existent paymentId');

        const response = await paymentController.refundPayment('PAY-DOES-NOT-EXIST-999999');
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|payment/i);
    });
});