import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";
import orderData from "@testdata/json/requests/order/createOrder.json";

/**
 * Risk-Based Testing — End-to-End Checkout Flow
 *
 * Technique: Risk-Based Testing (RBT)
 * Principle: Allocate the most test effort to the scenarios with the highest
 *            Risk Score (Likelihood × Impact). P1 tests are the release gate.
 *
 * Risk Register (see 07-risk-based-testing.md):
 *   RBT-01 [P1, Score=6]: Payment charged but order not created
 *   RBT-02 [P1, Score=6]: Inventory oversell on concurrent last-unit purchase
 *   RBT-03 [P1, Score=3]: Refund processed for larger amount than original
 *   RBT-04 [P1, Score=3]: Auth token remains valid after logout
 *   RBT-05 [P1, Score=3]: Catalogue price differs from charged price
 *   RBT-06 [P2, Score=4]: Order status not updated after payment
 *   RBT-07 [P2, Score=4]: Coupon discount amount incorrect
 *   RBT-08 [P1, Score=3]: Tracking info returned for wrong order (data leak)
 *   RBT-09 [P2, Score=4]: Inventory not decremented after order placed
 *   RBT-10 [P3, Score=1]: Return accepted past the allowed window
 */

// ─── P1 Tests (Release Gate) ──────────────────────────────────────────────────

test.describe('Risk-Based Testing — P1: Critical Risks (Release Gate)', {
    tag: ['@RBT', '@RiskBased', '@Smoke', '@P1', '@API']
}, () => {

    test.beforeEach(async ({ cartController, productController }) => {
        const res = await productController.getAllProducts({ pageSize: 1 });
        const body = await res.json();
        const product = body.data[0];

        await cartController.clearCart();
        await cartController.addToCart({
            productId: product.id,
            quantity: 1,
            size: product.variants[0].size,
            color: product.variants[0].color
        });
        logger.info('RBT setup: Cart ready');
    });

    test.afterEach(async ({ cartController }) => {
        await cartController.clearCart();
    });

    // ─── RBT-01 [Score=6]: Payment charged but order not created ─────────────
    // Risk: The payment gateway is called and succeeds, but the order creation
    // fails silently — customer is charged but has no order.
    test('[RBT-01] Payment success AND order creation are atomically linked', {
        tag: ['@FKT-01', '@Critical']
    }, async ({ orderController, paymentController }) => {
        logger.info('RBT-01: Verify payment and order creation atomicity');

        // Step 1: Create the order
        const orderResponse = await orderController.createOrder(orderData);
        const orderBody = await orderResponse.json();

        expect(orderResponse.status(), 'Order creation must succeed').toBe(200);
        expect(orderBody.data.orderId).toBeTruthy();

        const orderId = orderBody.data.orderId;
        logger.info(`RBT-01: Order created: ${orderId}`);

        // Step 2: Process payment for the order
        const paymentResponse = await paymentController.processPayment({
            orderId,
            paymentMethodId: 'PM-001',
            amount: orderBody.data.totalAmount
        });
        const paymentBody = await paymentResponse.json();

        expect(paymentResponse.status(), 'Payment must succeed').toBe(200);
        expect(paymentBody.success).toBe(true);
        const paymentId = paymentBody.data.paymentId;
        logger.info(`RBT-01: Payment processed: ${paymentId}`);

        // Step 3: Verify the order status reflects payment — the critical assertion
        const statusResponse = await orderController.getOrderStatus(orderId);
        const statusBody = await statusResponse.json();

        expect(statusResponse.status()).toBe(200);
        expect(
            statusBody.data.status,
            'Order must advance from pending after payment — if still pending, payment was not linked'
        ).not.toBe('pending');
        logger.info(`RBT-01: Order status after payment = ${statusBody.data.status} ✓`);
    });

    // ─── RBT-02 [Score=6]: Inventory oversell ────────────────────────────────
    // Risk: Two users simultaneously add the last unit to their carts.
    // The stock check passes for both; both complete purchase; stock goes negative.
    test('[RBT-02] Stock check is enforced — cannot add to cart beyond available stock', {
        tag: ['@FKT-02', '@Critical']
    }, async ({ cartController, inventoryController }) => {
        logger.info('RBT-02: Verify oversell protection at cart add time');

        const productId = 'FKPRT-LOW-STOCK-001'; // product with known stock of 1

        // Check current stock
        const stockResponse = await inventoryController.checkStock(productId);
        const stockBody = await stockResponse.json();
        logger.info(`RBT-02: Current stock for ${productId} = ${stockBody.data?.quantity}`);

        // Attempt to add more than available stock
        const cartResponse = await cartController.addToCart({
            productId,
            quantity: 9999,
            size: '128GB',
            color: 'Onyx Black'
        });

        expect(cartResponse.status()).toBeGreaterThanOrEqual(400);
        const cartBody = await cartResponse.json();
        expect(cartBody.success).toBe(false);
        expect(cartBody.error.message).toMatch(/stock|inventory|available|quantity/i);
        logger.info('RBT-02: Oversell protection confirmed ✓');
    });

    // ─── RBT-04 [Score=3]: Auth token remains valid after logout ─────────────
    // Risk: Session hijack — an attacker using a stolen token can continue
    // to act as the user even after the user logs out.
    test('[RBT-04] Auth token is invalidated after logout', {
        tag: ['@FKT-04', '@Security', '@Critical']
    }, async ({ userController }) => {
        logger.info('RBT-04: Verify token is invalidated on logout');

        // Step 1: Login and capture the token (indirectly — check profile works)
        const profileBefore = await userController.getProfile();
        expect(profileBefore.status(), 'Profile must be accessible while logged in').toBe(200);

        // Step 2: Logout
        const logoutResponse = await userController.logout();
        expect(logoutResponse.status(), 'Logout must succeed').toBe(200);
        logger.info('RBT-04: Logout completed');

        // Step 3: Attempt to access a protected resource after logout
        // The session/token stored in the Playwright context should now be invalid.
        const profileAfter = await userController.getProfile();
        logger.info(`RBT-04: Profile access after logout = ${profileAfter.status()}`);

        expect(
            profileAfter.status(),
            'Protected resource must be inaccessible after logout — 401 or 403 expected'
        ).toBeGreaterThanOrEqual(401);
    });

    // ─── RBT-05 [Score=3]: Catalogue price ≠ charged price ───────────────────
    // Risk: Product price in the catalogue is different from the amount actually
    // charged at checkout. Classic symptom of a caching or race condition bug.
    test('[RBT-05] Amount charged matches catalogue price for the ordered product', {
        tag: ['@FKT-05', '@Critical']
    }, async ({ productController, orderController, paymentController }) => {
        logger.info('RBT-05: Verify catalogue price equals charged price');

        // Get the product price from the catalogue
        const productResponse = await productController.getProductById('FKPRT-SMSG-GS24-001');
        const productBody = await productResponse.json();
        const cataloguePrice: number = productBody.data.price;
        logger.info(`RBT-05: Catalogue price = ${cataloguePrice}`);

        // Create order and read the order total
        const orderResponse = await orderController.createOrder(orderData);
        const orderBody = await orderResponse.json();
        expect(orderResponse.status()).toBe(200);

        const orderTotal: number = orderBody.data.totalAmount;
        logger.info(`RBT-05: Order total = ${orderTotal}`);

        // Process payment
        const paymentResponse = await paymentController.processPayment({
            orderId: orderBody.data.orderId,
            paymentMethodId: 'PM-001',
            amount: orderTotal
        });
        const paymentBody = await paymentResponse.json();

        expect(paymentResponse.status()).toBe(200);
        const chargedAmount: number = paymentBody.data.chargedAmount;
        logger.info(`RBT-05: Charged amount = ${chargedAmount}`);

        // The charged amount must match the order total (which must include catalogue price)
        expect(chargedAmount, 'Charged amount must equal the order total').toBe(orderTotal);
        expect(
            orderBody.data.subtotal,
            'Order subtotal must be consistent with catalogue price (allowing for qty=1)'
        ).toBeGreaterThanOrEqual(cataloguePrice);
    });

    // ─── RBT-08 [Score=3]: Tracking data returned for wrong order (data leak) ─
    // Risk: Broken Object Level Authorisation — user A can access user B's
    // order tracking by supplying a different orderId.
    test('[RBT-08] Order tracking endpoint enforces ownership — cannot read other users orders', {
        tag: ['@FKT-08', '@Security', '@Critical']
    }, async ({ orderController }) => {
        logger.info('RBT-08: Verify BOLA protection on order tracking endpoint');

        // This order ID belongs to a different user (pre-seeded test data)
        const otherUsersOrderId = 'ORD-OTHER-USER-001';

        const response = await orderController.getOrderTracking(otherUsersOrderId);
        logger.info(`RBT-08: status=${response.status()}`);

        // Must return 403 Forbidden or 404 Not Found — never the tracking data
        expect(response.status()).toBeGreaterThanOrEqual(400);
        const body = await response.json();
        expect(body.success).toBe(false);
        // Must not leak any tracking details belonging to another user
        expect(body.data).toBeFalsy();
    });
});

// ─── P2 Tests (Regression Suite) ─────────────────────────────────────────────

test.describe('Risk-Based Testing — P2: Medium Risks (Regression)', {
    tag: ['@RBT', '@RiskBased', '@Regression', '@P2', '@API']
}, () => {

    test.beforeEach(async ({ cartController, productController }) => {
        const res = await productController.getAllProducts({ pageSize: 1 });
        const body = await res.json();
        const product = body.data[0];

        await cartController.clearCart();
        await cartController.addToCart({
            productId: product.id,
            quantity: 1,
            size: product.variants[0].size,
            color: product.variants[0].color
        });
    });

    test.afterEach(async ({ cartController }) => {
        await cartController.clearCart();
    });

    // ─── RBT-07 [Score=4]: Coupon discount amount incorrect ──────────────────
    // Risk: The coupon is applied, but the discount value is calculated incorrectly
    // — customer is charged the wrong amount.
    test('[RBT-07] Applied coupon discount is mathematically correct', {
        tag: ['@FKT-07']
    }, async ({ cartController }) => {
        logger.info('RBT-07: Verify coupon discount calculation correctness');

        // Get cart totals before coupon
        const beforeResponse = await cartController.getCartTotals();
        const beforeBody = await beforeResponse.json();
        const subtotalBefore: number = beforeBody.data.subtotal;
        logger.info(`RBT-07: Subtotal before coupon = ${subtotalBefore}`);

        // Apply a known 10% discount coupon
        const couponResponse = await cartController.applyCoupon('SAVE10');
        expect(couponResponse.status()).toBe(200);

        // Get cart totals after coupon
        const afterResponse = await cartController.getCartTotals();
        const afterBody = await afterResponse.json();
        const subtotalAfter: number = afterBody.data.subtotal;
        const discountApplied: number = afterBody.data.discount;
        logger.info(`RBT-07: Subtotal after coupon = ${subtotalAfter}, discount = ${discountApplied}`);

        // Verify discount = 10% of original subtotal (within floating point tolerance)
        const expectedDiscount = subtotalBefore * 0.10;
        expect(discountApplied).toBeCloseTo(expectedDiscount, 2);
        expect(subtotalAfter).toBeCloseTo(subtotalBefore - discountApplied, 2);
        logger.info('RBT-07: Coupon discount calculation verified ✓');
    });

    // ─── RBT-09 [Score=4]: Inventory not decremented after order placed ───────
    // Risk: Order is created successfully, but the inventory record is not
    // decremented — the product appears in stock for the next buyer.
    test('[RBT-09] Inventory is decremented after a successful order placement', {
        tag: ['@FKT-09']
    }, async ({ orderController, inventoryController }) => {
        logger.info('RBT-09: Verify inventory decrements after order creation');

        const productId = 'FKPRT-SMSG-GS24-001';

        // Read inventory before order
        const inventoryBefore = await inventoryController.getInventoryLevels(productId);
        const beforeBody = await inventoryBefore.json();
        const quantityBefore: number = beforeBody.data.totalQuantity;
        logger.info(`RBT-09: Inventory before order = ${quantityBefore}`);

        // Place order
        const orderResponse = await orderController.createOrder(orderData);
        expect(orderResponse.status()).toBe(200);
        const orderedQty = 1;
        logger.info('RBT-09: Order placed for qty=1');

        // Read inventory after order
        const inventoryAfter = await inventoryController.getInventoryLevels(productId);
        const afterBody = await inventoryAfter.json();
        const quantityAfter: number = afterBody.data.totalQuantity;
        logger.info(`RBT-09: Inventory after order = ${quantityAfter}`);

        expect(
            quantityAfter,
            'Inventory must decrease by the ordered quantity after order is placed'
        ).toBe(quantityBefore - orderedQty);
    });
});

// ─── P3 Tests (Low Risk — Weekly Regression) ─────────────────────────────────

test.describe('Risk-Based Testing — P3: Low Risks (Weekly Regression)', {
    tag: ['@RBT', '@RiskBased', '@P3', '@API']
}, () => {

    // ─── RBT-10 [Score=1]: Return accepted past the allowed window ────────────
    test('[RBT-10] Return request rejected when past the return window', {
        tag: ['@FKT-10']
    }, async ({ orderController }) => {
        logger.info('RBT-10: Verify return is rejected past the allowed return window');

        // Pre-seeded order that is older than the return window (e.g., 30 days)
        const oldOrderId = 'ORD-EXPIRED-RETURN-001';

        const response = await orderController.requestReturn(oldOrderId, {
            items: [{ itemId: 'ITEM-001', quantity: 1, reason: 'Changed mind' }]
        });
        const body = await response.json();

        logger.info(`RBT-10: status=${response.status()}`);

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/window|expired|return|days/i);
        logger.info('RBT-10: Return window enforcement confirmed ✓');
    });
});
