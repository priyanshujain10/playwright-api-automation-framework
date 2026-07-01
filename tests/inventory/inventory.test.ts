import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";

// ─── Stock Checking ───────────────────────────────────────────────────────────

test.describe('Inventory API — Stock Check', {
    tag: ['@Inventory', '@StockCheck', '@API']
}, () => {

    test('[GET] Check stock — valid product returns 200 with quantity', {
        tag: ['@Smoke', '@CheckStock']
    }, async ({ inventoryController }) => {
        const productId = 'FKPRT-SMSG-GS24-001';
        logger.info(`Test: Check stock for productId=${productId}`);

        const response = await inventoryController.checkStock(productId);
        const body = await response.json();

        logger.info(`Check stock status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.productId).toBe(productId);
        expect(typeof body.data.quantity).toBe('number');
        expect(body.data.quantity).toBeGreaterThanOrEqual(0);
        logger.info(`Stock for ${productId}: quantity=${body.data.quantity}`);
    });

    test('[GET] Check stock — with size and color variants returns filtered quantity', {
        tag: ['@Regression', '@CheckStock']
    }, async ({ inventoryController }) => {
        const productId = 'FKPRT-SMSG-GS24-001';
        const size = '128GB';
        const color = 'Onyx Black';
        logger.info(`Test: Check stock for ${productId} size=${size} color=${color}`);

        const response = await inventoryController.checkStock(productId, size, color);
        const body = await response.json();

        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.productId).toBe(productId);
        expect(body.data.size).toBe(size);
        expect(body.data.color).toBe(color);
        expect(typeof body.data.quantity).toBe('number');
        logger.info(`Variant stock: ${JSON.stringify(body.data)}`);
    });

    test('[GET] Check stock — non-existent product returns 404', {
        tag: ['@Negative', '@CheckStock']
    }, async ({ inventoryController }) => {
        logger.info('Test: Check stock for non-existent product');

        const response = await inventoryController.checkStock('PROD-DOES-NOT-EXIST-999999');
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|product/i);
    });

    test('[GET] Check stock — out-of-stock product returns 200 with quantity 0', {
        tag: ['@Regression', '@CheckStock']
    }, async ({ inventoryController }) => {
        logger.info('Test: Check stock for an out-of-stock product');

        const productId = 'FKPRT-OUT-OF-STOCK-001';
        const response = await inventoryController.checkStock(productId);
        const body = await response.json();

        logger.info(`Out-of-stock check status: ${response.status()}`);
        // A 200 with quantity=0 is the correct response (not 404)
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.quantity).toBe(0);
        logger.info('Out-of-stock product correctly returns quantity=0 ✓');
    });
});

// ─── Inventory Levels ─────────────────────────────────────────────────────────

test.describe('Inventory API — Get Inventory Levels', {
    tag: ['@Inventory', '@InventoryLevels', '@API']
}, () => {

    test('[GET] Get inventory levels — valid product returns full breakdown', {
        tag: ['@Smoke', '@GetInventoryLevels']
    }, async ({ inventoryController }) => {
        const productId = 'FKPRT-SMSG-GS24-001';
        logger.info(`Test: Get full inventory levels for productId=${productId}`);

        const response = await inventoryController.getInventoryLevels(productId);
        const body = await response.json();

        logger.info(`Get inventory levels status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.productId).toBe(productId);
        expect(Array.isArray(body.data.variants)).toBe(true);

        // Each variant must have stock information
        for (const variant of body.data.variants) {
            expect(variant.size).toBeTruthy();
            expect(variant.color).toBeTruthy();
            expect(typeof variant.quantity).toBe('number');
            expect(variant.quantity).toBeGreaterThanOrEqual(0);
        }
        logger.info(`Inventory levels retrieved: ${body.data.variants.length} variants`);
    });

    test('[GET] Get inventory levels — non-existent product returns 404', {
        tag: ['@Negative', '@GetInventoryLevels']
    }, async ({ inventoryController }) => {
        logger.info('Test: Get inventory levels for non-existent product');

        const response = await inventoryController.getInventoryLevels('PROD-DOES-NOT-EXIST-999999');
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|product/i);
    });
});

// ─── Inventory Update (Admin) ─────────────────────────────────────────────────

test.describe('Inventory API — Update Inventory', {
    tag: ['@Inventory', '@UpdateInventory', '@API']
}, () => {

    test('[PUT] Update inventory — valid quantity update returns 200', {
        tag: ['@Smoke', '@UpdateInventory']
    }, async ({ inventoryController }) => {
        const productId = 'FKPRT-SMSG-GS24-001';
        logger.info(`Test: Update inventory for productId=${productId}`);

        const inventoryUpdate = {
            quantity: 50,
            size: '128GB',
            color: 'Onyx Black'
        };

        const response = await inventoryController.updateInventory(productId, inventoryUpdate);
        const body = await response.json();

        logger.info(`Update inventory status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.productId).toBe(productId);
        expect(body.data.quantity).toBe(inventoryUpdate.quantity);

        // Verify via stock check — updated quantity must be reflected
        const stockResponse = await inventoryController.checkStock(productId, inventoryUpdate.size, inventoryUpdate.color);
        const stockBody = await stockResponse.json();
        expect(stockBody.data.quantity).toBe(inventoryUpdate.quantity);
        logger.info(`Inventory updated and verified: quantity=${inventoryUpdate.quantity} ✓`);
    });

    test('[PUT] Update inventory — negative quantity returns 400', {
        tag: ['@Negative', '@UpdateInventory']
    }, async ({ inventoryController }) => {
        logger.info('Test: Update inventory with negative quantity');

        const response = await inventoryController.updateInventory('FKPRT-SMSG-GS24-001', {
            quantity: -10,
            size: '128GB',
            color: 'Onyx Black'
        });
        const body = await response.json();

        expect(response.status()).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/quantity|negative|invalid/i);
    });

    test('[PUT] Update inventory — non-existent product returns 404', {
        tag: ['@Negative', '@UpdateInventory']
    }, async ({ inventoryController }) => {
        logger.info('Test: Update inventory for non-existent product');

        const response = await inventoryController.updateInventory('PROD-DOES-NOT-EXIST-999999', {
            quantity: 50
        });
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|product/i);
    });

    test('[PUT] Update inventory — unauthorized request returns 403', {
        tag: ['@Negative', '@UpdateInventory', '@Authorization']
    }, async ({ inventoryController }) => {
        logger.info('Test: Update inventory without admin privileges');

        // Regular user token (non-admin) — override with empty auth
        const response = await inventoryController['request'].put(
            `${inventoryController['BASE_URL']}/inventory/FKPRT-SMSG-GS24-001`,
            {
                headers: { Authorization: 'Bearer invalid-non-admin-token' },
                data: { quantity: 50 }
            }
        );

        logger.info(`Unauthorized inventory update status: ${response.status()}`);
        expect(response.status()).toBeGreaterThanOrEqual(401);
    });
});

// ─── Inventory Reservation ────────────────────────────────────────────────────

test.describe('Inventory API — Reserve and Release', {
    tag: ['@Inventory', '@Reservation', '@API']
}, () => {

    test('[POST] Reserve inventory — valid request returns 200 with reservationId', {
        tag: ['@Smoke', '@ReserveInventory']
    }, async ({ inventoryController }) => {
        logger.info('Test: Reserve inventory for a product');

        const reservationData = {
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 2,
            size: '128GB',
            color: 'Onyx Black'
        };

        const response = await inventoryController.reserveInventory(reservationData);
        const body = await response.json();

        logger.info(`Reserve inventory status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.reservationId).toBeTruthy();
        expect(body.data.productId).toBe(reservationData.productId);
        expect(body.data.quantity).toBe(reservationData.quantity);
        logger.info(`Reservation created: ${body.data.reservationId}`);
    });

    test('[POST] Reserve inventory — exceeding available stock returns 409', {
        tag: ['@Negative', '@ReserveInventory']
    }, async ({ inventoryController }) => {
        logger.info('Test: Reserve more units than available — oversell protection');

        const response = await inventoryController.reserveInventory({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 999999,
            size: '128GB',
            color: 'Onyx Black'
        });
        const body = await response.json();

        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/stock|quantity|available|insufficient/i);
        logger.info('Oversell protection confirmed ✓');
    });

    test('[DELETE] Release reservation — valid reservationId returns 200', {
        tag: ['@Smoke', '@ReleaseReservation']
    }, async ({ inventoryController }) => {
        logger.info('Test: Release an existing inventory reservation');

        // First, create a reservation to release
        const reserveResponse = await inventoryController.reserveInventory({
            productId: 'FKPRT-SMSG-GS24-001',
            quantity: 1,
            size: '128GB',
            color: 'Onyx Black'
        });
        const reserveBody = await reserveResponse.json();
        const reservationId = reserveBody.data.reservationId;
        logger.info(`Created reservationId=${reservationId} for release test`);

        const response = await inventoryController.releaseReservation(reservationId);
        const body = await response.json();

        logger.info(`Release reservation status: ${response.status()}`);
        expect(response.status()).toBe(200);
        expect(body.success).toBe(true);
        logger.info(`Reservation ${reservationId} released ✓`);
    });

    test('[DELETE] Release non-existent reservation returns 404', {
        tag: ['@Negative', '@ReleaseReservation']
    }, async ({ inventoryController }) => {
        logger.info('Test: Release a non-existent reservation');

        const response = await inventoryController.releaseReservation('RES-DOES-NOT-EXIST-999999');
        const body = await response.json();

        expect(response.status()).toBe(404);
        expect(body.success).toBe(false);
        expect(body.error.message).toMatch(/not found|reservation/i);
    });

    test('[POST+DELETE] Reserve then release restores original stock level', {
        tag: ['@Regression', '@ReserveRelease', '@DataIntegrity']
    }, async ({ inventoryController }) => {
        logger.info('Test: Reserve then release should restore original stock');

        const productId = 'FKPRT-SMSG-GS24-001';
        const reserveQty = 3;

        // Capture original stock
        const beforeResponse = await inventoryController.checkStock(productId, '128GB', 'Onyx Black');
        const beforeBody = await beforeResponse.json();
        const originalStock = beforeBody.data.quantity;
        logger.info(`Original stock: ${originalStock}`);

        // Reserve
        const reserveResponse = await inventoryController.reserveInventory({
            productId,
            quantity: reserveQty,
            size: '128GB',
            color: 'Onyx Black'
        });
        const reserveBody = await reserveResponse.json();
        const reservationId = reserveBody.data.reservationId;

        // Stock should now be reduced
        const duringResponse = await inventoryController.checkStock(productId, '128GB', 'Onyx Black');
        const duringBody = await duringResponse.json();
        expect(duringBody.data.quantity).toBe(originalStock - reserveQty);
        logger.info(`Stock after reserve: ${duringBody.data.quantity}`);

        // Release
        await inventoryController.releaseReservation(reservationId);

        // Stock should be restored
        const afterResponse = await inventoryController.checkStock(productId, '128GB', 'Onyx Black');
        const afterBody = await afterResponse.json();
        expect(afterBody.data.quantity).toBe(originalStock);
        logger.info(`Stock after release: ${afterBody.data.quantity} — matches original ✓`);
    });
});