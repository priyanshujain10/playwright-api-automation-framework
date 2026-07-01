import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";

/**
 * Idempotency Tests
 *
 * Principle: An operation is idempotent if applying it multiple times produces
 *            the same result as applying it once.
 *
 * HTTP Idempotency:
 *   - GET   : always idempotent — same response for same resource
 *   - PUT   : idempotent — repeated PUT with same body leaves server state unchanged
 *   - DELETE: idempotent — deleting an already-deleted resource returns 404, state is stable
 *   - POST  : NOT inherently idempotent — repeated POSTs create duplicate resources
 *             (idempotency keys can make individual POST operations idempotent)
 *
 * Test matrix:
 *   IDEM-GET-01 : GET /products/:id called twice returns identical response bodies
 *   IDEM-GET-02 : GET /products with same params returns stable result set
 *   IDEM-PUT-01 : PUT /products/:id called twice with same payload — second call same as first
 *   IDEM-PUT-02 : PUT /users/profile called twice — result identical on both calls
 *   IDEM-DEL-01 : DELETE /cart — clearing an already-empty cart returns same success state
 *   IDEM-DEL-02 : DELETE non-existent resource consistently returns 404 on every attempt
 *   IDEM-CART-01: Adding the same cart item twice uses idempotency key — no duplicates
 */

// ─── GET Idempotency ──────────────────────────────────────────────────────────

test.describe('Idempotency — GET requests', {
    tag: ['@Idempotency', '@IDEM', '@GET', '@API']
}, () => {

    // IDEM-GET-01: Repeated GET for same product returns identical responses
    test('[IDEM-GET-01] GET /products/:id is idempotent — same body on every call', {
        tag: ['@Smoke', '@FKT-GET-01']
    }, async ({ productController }) => {
        const productId = 'FKPRT-SMSG-GS24-001';
        logger.info(`IDEM-GET-01: Calling GET /products/${productId} three times`);

        const [r1, r2, r3] = await Promise.all([
            productController.getProductById(productId),
            productController.getProductById(productId),
            productController.getProductById(productId)
        ]);

        const [b1, b2, b3] = await Promise.all([r1.json(), r2.json(), r3.json()]);

        // All calls must return 200
        expect(r1.status()).toBe(200);
        expect(r2.status()).toBe(200);
        expect(r3.status()).toBe(200);

        // Core identifying fields must be identical across calls
        expect(b1.data.id).toBe(b2.data.id);
        expect(b2.data.id).toBe(b3.data.id);
        expect(b1.data.sku).toBe(b2.data.sku);
        expect(b1.data.price).toBe(b2.data.price);

        logger.info(`IDEM-GET-01: All 3 GET calls returned id=${b1.data.id} ✓`);
    });

    // IDEM-GET-02: Repeated GET with same query params returns stable result set
    test('[IDEM-GET-02] GET /products with same params returns stable result set', {
        tag: ['@Regression', '@FKT-GET-02']
    }, async ({ productController }) => {
        const params = { page: 1, pageSize: 5, sort: 'price_asc' };
        logger.info(`IDEM-GET-02: Calling GET /products with params=${JSON.stringify(params)} twice`);

        const r1 = await productController.getAllProducts(params);
        const r2 = await productController.getAllProducts(params);

        const b1 = await r1.json();
        const b2 = await r2.json();

        expect(r1.status()).toBe(200);
        expect(r2.status()).toBe(200);

        // Result count must be the same
        expect(b1.data.length).toBe(b2.data.length);

        // Product IDs in results must be in the same order
        const ids1 = b1.data.map((p: { id: string }) => p.id);
        const ids2 = b2.data.map((p: { id: string }) => p.id);
        expect(ids1).toEqual(ids2);

        logger.info(`IDEM-GET-02: Both calls returned ${ids1.length} products in identical order ✓`);
    });

    // IDEM-GET-03: GET user profile is idempotent — repeated reads don't mutate state
    test('[IDEM-GET-03] GET /users/profile is idempotent — no side effects from reading', {
        tag: ['@Smoke', '@FKT-GET-03']
    }, async ({ userController }) => {
        logger.info('IDEM-GET-03: GET profile should have zero side effects when called N times');

        const r1 = await userController.getProfile();
        const b1 = await r1.json();

        const r2 = await userController.getProfile();
        const b2 = await r2.json();

        expect(r1.status()).toBe(200);
        expect(r2.status()).toBe(200);

        // Core immutable fields must be identical
        expect(b1.data.id).toBe(b2.data.id);
        expect(b1.data.email).toBe(b2.data.email);

        logger.info(`IDEM-GET-03: Profile id=${b1.data.id} stable across two reads ✓`);
    });
});

// ─── PUT Idempotency ──────────────────────────────────────────────────────────

test.describe('Idempotency — PUT requests', {
    tag: ['@Idempotency', '@IDEM', '@PUT', '@API']
}, () => {

    // IDEM-PUT-01: PUT product with same data twice — result is identical
    test('[IDEM-PUT-01] PUT /products/:id twice with same body produces same result', {
        tag: ['@Smoke', '@FKT-PUT-01']
    }, async ({ productController }) => {
        const productId = 'FKPRT-SMSG-GS24-001';
        const updatePayload = {
            name: 'Idempotency Test Product',
            price: 99.99,
            description: 'Updated for idempotency test'
        };
        logger.info(`IDEM-PUT-01: PUT /products/${productId} twice with same payload`);

        const r1 = await productController.updateProduct(productId, updatePayload);
        const b1 = await r1.json();

        const r2 = await productController.updateProduct(productId, updatePayload);
        const b2 = await r2.json();

        // Both calls must succeed
        expect(r1.status()).toBe(200);
        expect(r2.status()).toBe(200);

        // Both must return the same state — PUT is idempotent
        expect(b1.data.name).toBe(b2.data.name);
        expect(b1.data.price).toBe(b2.data.price);
        expect(b1.data.id).toBe(b2.data.id);

        logger.info(`IDEM-PUT-01: Both PUT calls returned identical product state ✓`);
    });

    // IDEM-PUT-02: PUT user profile twice with same body — no duplicate mutations
    test('[IDEM-PUT-02] PUT /users/profile twice with same data — second call mirrors first', {
        tag: ['@Regression', '@FKT-PUT-02']
    }, async ({ userController }) => {
        const profileUpdate = {
            firstName: 'IdempotentFirst',
            lastName: 'IdempotentLast'
        };
        logger.info('IDEM-PUT-02: PUT profile twice with same payload');

        const r1 = await userController.updateProfile(profileUpdate);
        const b1 = await r1.json();

        const r2 = await userController.updateProfile(profileUpdate);
        const b2 = await r2.json();

        expect(r1.status()).toBe(200);
        expect(r2.status()).toBe(200);

        // Final state must be identical — PUT should be idempotent
        expect(b1.data.firstName).toBe(b2.data.firstName);
        expect(b1.data.lastName).toBe(b2.data.lastName);
        expect(b1.data.id).toBe(b2.data.id);

        logger.info(`IDEM-PUT-02: Profile state identical after two PUT calls ✓`);
    });

    // IDEM-PUT-03: PUT cart item quantity — repeated puts set same quantity, not accumulate
    test('[IDEM-PUT-03] PUT /cart/items/:id — repeated PUT sets, does not accumulate quantity', {
        tag: ['@Smoke', '@FKT-PUT-03']
    }, async ({ cartController, productController }) => {
        logger.info('IDEM-PUT-03: Verify PUT cart item quantity is a SET, not an increment');

        // Setup: add a product to cart
        const productsResponse = await productController.getAllProducts({ pageSize: 1 });
        const productsBody = await productsResponse.json();
        const product = productsBody.data[0];

        const addResponse = await cartController.addToCart({
            productId: product.id,
            quantity: 1,
            size: product.variants[0].size,
            color: product.variants[0].color
        });
        const addBody = await addResponse.json();
        const itemId = addBody.data.itemId;
        logger.info(`Added itemId=${itemId} to cart`);

        // PUT quantity = 5 twice
        const targetQuantity = 5;
        await cartController.updateCartItem(itemId, targetQuantity);
        await cartController.updateCartItem(itemId, targetQuantity);

        // Verify: quantity should be 5, NOT 10
        const cartResponse = await cartController.getCart();
        const cartBody = await cartResponse.json();
        const item = cartBody.data.items.find((i: { itemId: string }) => i.itemId === itemId);

        expect(item.quantity).toBe(targetQuantity);
        logger.info(`IDEM-PUT-03: Quantity is ${item.quantity} (not 10) — PUT is idempotent ✓`);

        // Cleanup
        await cartController.clearCart();
    });
});

// ─── DELETE Idempotency ───────────────────────────────────────────────────────

test.describe('Idempotency — DELETE requests', {
    tag: ['@Idempotency', '@IDEM', '@DELETE', '@API']
}, () => {

    // IDEM-DEL-01: Clear already-empty cart — consistent result
    test('[IDEM-DEL-01] DELETE /cart on already-empty cart returns consistent success', {
        tag: ['@Smoke', '@FKT-DEL-01']
    }, async ({ cartController }) => {
        logger.info('IDEM-DEL-01: Clear already-empty cart — should be consistent');

        // Ensure cart is empty first
        await cartController.clearCart();

        // Clear again — should not fail
        const r2 = await cartController.clearCart();
        const b2 = await r2.json();

        // An idempotent DELETE on an already-empty cart should succeed or return a stable state
        expect(r2.status()).toBeLessThan(500);
        expect(b2.success).toBe(true);

        logger.info(`IDEM-DEL-01: Second clear-cart returned ${r2.status()} ✓`);
    });

    // IDEM-DEL-02: DELETE non-existent resource is consistently 404
    test('[IDEM-DEL-02] DELETE non-existent resource consistently returns 404', {
        tag: ['@Regression', '@FKT-DEL-02']
    }, async ({ productController }) => {
        const productId = 'PROD-PERMANENTLY-GONE-999999';
        logger.info(`IDEM-DEL-02: DELETE /products/${productId} twice — both should be 404`);

        const r1 = await productController.deleteProduct(productId);
        const r2 = await productController.deleteProduct(productId);

        // Both must return 404 — system state is the same (resource does not exist)
        expect(r1.status()).toBe(404);
        expect(r2.status()).toBe(404);

        const b1 = await r1.json();
        const b2 = await r2.json();
        expect(b1.success).toBe(false);
        expect(b2.success).toBe(false);

        logger.info('IDEM-DEL-02: Both DELETE calls returned 404 consistently ✓');
    });

    // IDEM-DEL-03: Delete address then attempt to delete again — consistent 404
    test('[IDEM-DEL-03] DELETE /addresses/:id twice — second call returns 404 consistently', {
        tag: ['@Regression', '@FKT-DEL-03']
    }, async ({ userController }) => {
        logger.info('IDEM-DEL-03: Verify DELETE address is stable after resource is gone');

        // Create an address to delete
        const addResponse = await userController.addAddress({
            firstName: 'Idempotency',
            lastName: 'Test',
            addressLine1: '789 Test Avenue',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            country: 'US'
        });
        const addBody = await addResponse.json();
        const addressId = addBody.data.addressId;
        logger.info(`Created addressId=${addressId}`);

        // First delete — should succeed
        const r1 = await userController.deleteAddress(addressId);
        expect(r1.status()).toBe(200);
        logger.info(`First DELETE: ${r1.status()}`);

        // Second delete — should consistently return 404
        const r2 = await userController.deleteAddress(addressId);
        expect(r2.status()).toBe(404);
        logger.info(`Second DELETE: ${r2.status()} — consistent 404 ✓`);
    });
});
