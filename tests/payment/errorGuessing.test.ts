import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";

/**
 * Error Guessing Tests — Payment & Cart APIs
 *
 * Technique: Error Guessing
 * Principle: Use domain knowledge and experience to anticipate where the system
 *            is most likely to behave incorrectly. These tests are NOT derived
 *            from a specification — they target common developer oversights.
 *
 * Guesses under test:
 *   EG-P-01: processPayment — amount = 0.00 (zero charge should be rejected)
 *   EG-P-02: processPayment — negative amount (−50.00)
 *   EG-P-03: processPayment — non-existent orderId
 *   EG-P-04: processPayment — non-existent paymentMethodId
 *   EG-P-05: addPaymentMethod — non-numeric card number ("abcd-efgh")
 *   EG-P-06: addPaymentMethod — expired card date
 *   EG-P-07: addPaymentMethod — missing required cardNumber field
 *   EG-P-08: refundPayment — refund amount exceeds original payment
 *   EG-P-09: refundPayment — double refund on same paymentId
 *   EG-C-01: applyCoupon — already-used coupon code
 *   EG-C-02: applyCoupon — SQL injection as coupon code
 *   EG-C-03: updateCartItem — item not in cart
 */

test.describe('Error Guessing — Payment Processing', {
    tag: ['@ErrorGuessing', '@EG', '@Payment', '@API', '@Negative']
}, () => {

    // EG-P-01: Zero amount — developers forget to validate non-zero before charging
    test('[EG-P-01] processPayment with amount=0.00 is rejected', {
        tag: ['@FKT-P-01', '@Smoke']
    }, async ({ paymentController }) => {
        logger.info('EG-P-01: Zero amount — should be rejected, not silently charged $0');

        const response = await paymentController.processPayment({
            orderId: 'ORD-12345',
            paymentMethodId: 'PM-001',
            amount: 0.00
        });

        const body = await response.json();
        logger.info(`EG-P-01: status=${response.status()} body=${JSON.stringify(body)}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/amount|zero|invalid/i);
    });

    // EG-P-02: Negative amount — sign inversion bug in refund/charge logic
    test('[EG-P-02] processPayment with negative amount is rejected', {
        tag: ['@FKT-P-02', '@Smoke']
    }, async ({ paymentController }) => {
        logger.info('EG-P-02: Negative amount — could cause credit to customer account');

        const response = await paymentController.processPayment({
            orderId: 'ORD-12345',
            paymentMethodId: 'PM-001',
            amount: -50.00
        });

        const body = await response.json();
        logger.info(`EG-P-02: status=${response.status()}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/amount|negative|invalid/i);
    });

    // EG-P-03: Non-existent orderId — missing FK validation
    test('[EG-P-03] processPayment with non-existent orderId returns 404', {
        tag: ['@FKT-P-03', '@Regression']
    }, async ({ paymentController }) => {
        logger.info('EG-P-03: Non-existent orderId — should 404, not 200');

        const response = await paymentController.processPayment({
            orderId: 'ORD-DOES-NOT-EXIST-999999',
            paymentMethodId: 'PM-001',
            amount: 99.99
        });

        const body = await response.json();
        logger.info(`EG-P-03: status=${response.status()}`);

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/order|not found/i);
    });

    // EG-P-04: Non-existent paymentMethodId — missing FK validation
    test('[EG-P-04] processPayment with non-existent paymentMethodId returns 404', {
        tag: ['@FKT-P-04', '@Regression']
    }, async ({ paymentController }) => {
        logger.info('EG-P-04: Non-existent paymentMethodId — should 404, not 200');

        const response = await paymentController.processPayment({
            orderId: 'ORD-12345',
            paymentMethodId: 'PM-DOES-NOT-EXIST-999999',
            amount: 99.99
        });

        const body = await response.json();
        logger.info(`EG-P-04: status=${response.status()}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/payment method|not found/i);
    });
});

test.describe('Error Guessing — Add Payment Method', {
    tag: ['@ErrorGuessing', '@EG', '@Payment', '@API', '@Negative']
}, () => {

    // EG-P-05: Non-numeric card number — input sanitisation missing
    test('[EG-P-05] addPaymentMethod with non-numeric card number is rejected', {
        tag: ['@FKT-P-05', '@Smoke']
    }, async ({ paymentController }) => {
        logger.info('EG-P-05: Non-numeric card number "abcd-efgh-ijkl-mnop"');

        const response = await paymentController.addPaymentMethod({
            type: 'credit_card',
            cardNumber: 'abcd-efgh-ijkl-mnop',
            expiryDate: '12/2028',
            cvv: '123',
            cardholderName: 'John Doe'
        });

        const body = await response.json();
        logger.info(`EG-P-05: status=${response.status()}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/card|number|invalid/i);
    });

    // EG-P-06: Expired card — date comparison bug (timezone, off-by-one in month)
    test('[EG-P-06] addPaymentMethod with expired card date is rejected', {
        tag: ['@FKT-P-06', '@Smoke']
    }, async ({ paymentController }) => {
        logger.info('EG-P-06: Expired card date "01/2020" (past)');

        const response = await paymentController.addPaymentMethod({
            type: 'credit_card',
            cardNumber: '4111111111111111',
            expiryDate: '01/2020', // Clearly in the past
            cvv: '123',
            cardholderName: 'John Doe'
        });

        const body = await response.json();
        logger.info(`EG-P-06: status=${response.status()}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/expir|date|invalid/i);
    });

    // EG-P-07: Missing cardNumber — developer omits null check
    test('[EG-P-07] addPaymentMethod without cardNumber is rejected', {
        tag: ['@FKT-P-07', '@Regression']
    }, async ({ paymentController }) => {
        logger.info('EG-P-07: Missing required cardNumber field');

        const response = await paymentController.addPaymentMethod({
            type: 'credit_card',
            // cardNumber intentionally omitted
            expiryDate: '12/2028',
            cvv: '123',
            cardholderName: 'John Doe'
        });

        const body = await response.json();
        logger.info(`EG-P-07: status=${response.status()}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/card|number|required/i);
    });
});

test.describe('Error Guessing — Refunds', {
    tag: ['@ErrorGuessing', '@EG', '@Payment', '@API', '@Negative']
}, () => {

    // EG-P-08: Refund amount > original payment — missing bounds check
    test('[EG-P-08] refundPayment with amount greater than original is rejected', {
        tag: ['@FKT-P-08', '@Regression']
    }, async ({ paymentController }) => {
        logger.info('EG-P-08: Refund exceeds original payment amount');

        // Using a known payment ID with a known original amount of $99.99
        const response = await paymentController.refundPayment('PAY-001', 99999.99);
        const body = await response.json();

        logger.info(`EG-P-08: status=${response.status()}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/amount|exceed|refund|invalid/i);
    });

    // EG-P-09: Double refund — idempotency key missing
    test('[EG-P-09] refundPayment called twice on same paymentId is rejected on second call', {
        tag: ['@FKT-P-09', '@Regression']
    }, async ({ paymentController }) => {
        logger.info('EG-P-09: Double refund — second call should be idempotent or rejected');

        const paymentId = 'PAY-REFUNDABLE-001';

        // First refund
        const firstResponse = await paymentController.refundPayment(paymentId);
        logger.info(`EG-P-09: First refund status=${firstResponse.status()}`);
        expect(firstResponse.status()).toBe(200);

        // Second refund on same payment — must not succeed again
        const secondResponse = await paymentController.refundPayment(paymentId);
        const secondBody = await secondResponse.json();

        logger.info(`EG-P-09: Second refund status=${secondResponse.status()}`);
        expect(secondResponse.status()).toBeGreaterThanOrEqual(400);
        expect(secondBody.success).toBe(false);
        expect(secondBody.error.message).toMatch(/already refunded|duplicate|idempotent/i);
    });
});

test.describe('Error Guessing — Cart Coupon & Item Operations', {
    tag: ['@ErrorGuessing', '@EG', '@Cart', '@API', '@Negative']
}, () => {

    // EG-C-01: Already-used coupon code — one-time coupons reusable if state not stored
    test('[EG-C-01] applyCoupon with already-used coupon code is rejected', {
        tag: ['@FKT-C-01', '@Regression']
    }, async ({ cartController }) => {
        logger.info('EG-C-01: Already-used coupon "USED10" should be rejected');

        const response = await cartController.applyCoupon('USED10');
        const body = await response.json();

        logger.info(`EG-C-01: status=${response.status()}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/coupon|used|expired|invalid/i);
    });

    // EG-C-02: SQL injection as coupon code — input not parameterised
    test('[EG-C-02] applyCoupon with SQL injection string is safely rejected', {
        tag: ['@FKT-C-02', '@Security', '@Smoke']
    }, async ({ cartController }) => {
        const injectionPayload = "' OR '1'='1'; DROP TABLE coupons; --";
        logger.info(`EG-C-02: SQL injection coupon payload: ${injectionPayload}`);

        const response = await cartController.applyCoupon(injectionPayload);
        const body = await response.json();

        logger.info(`EG-C-02: status=${response.status()}`);

        // Must not return 200 — the injection should be rejected or treated as invalid coupon
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        // Response must not leak SQL error messages (information disclosure)
        expect(JSON.stringify(body)).not.toMatch(/sql|syntax|mysql|postgres|ORA-/i);
    });

    // EG-C-03: Update quantity of an item not in cart — orphan update creates ghost item
    test('[EG-C-03] updateCartItem for non-existent cart item returns 404', {
        tag: ['@FKT-C-03', '@Regression']
    }, async ({ cartController }) => {
        logger.info('EG-C-03: Update quantity of item not in cart — should 404, not create item');

        const response = await cartController.updateCartItem('ITEM-DOES-NOT-EXIST-999', 5);
        const body = await response.json();

        logger.info(`EG-C-03: status=${response.status()}`);

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/item|not found|cart/i);
    });
});
