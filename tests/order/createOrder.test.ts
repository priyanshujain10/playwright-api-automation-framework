import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";
import orderData from "@testdata/json/requests/order/createOrder.json";

test.describe('Order API - Create Order Operations', { tag: ["@Order", "@POST", "@API"] }, () => {
    
    test.beforeEach(async ({ cartController, productController }) => {
        // Setup: Add item to cart before each test
        const productsResponse = await productController.getAllProducts({ pageSize: 1 });
        const productsBody = await productsResponse.json();
        const product = productsBody.data[0];
        
        await cartController.clearCart(); // Clear cart first
        
        await cartController.addToCart({
            productId: product.id,
            quantity: 1,
            size: product.variants[0].size,
            color: product.variants[0].color
        });
        
        logger.info('Setup: Cart prepared with test product');
    });

    test('[POST] Verify create order with valid data returns 200', {
        tag: ["@Smoke", "@API", "@CreateOrder"]
    }, async ({ orderController }) => {
        logger.info('Test: Create order with valid data');
        
        const response = await orderController.createOrder(orderData);
        const responseBody = await response.json();
        
        logger.info(`Order created: ${JSON.stringify(responseBody, null, 2)}`);
        
        // Assertions
        expect(response.status(), 'Status should be 200').toBe(200);
        expect(responseBody.success, 'Response should be successful').toBe(true);
        expect(responseBody.data.orderId).toBeTruthy();
        expect(responseBody.data.status).toBe('pending');
        expect(responseBody.data.totalAmount).toBeGreaterThan(0);
    });

    test('[POST] Verify create order with empty cart returns error', {
        tag: ["@Negative", "@API", "@CreateOrder"]
    }, async ({ orderController, cartController }) => {
        logger.info('Test: Create order with empty cart');
        
        // Clear cart
        await cartController.clearCart();
        
        const response = await orderController.createOrder(orderData);
        const responseBody = await response.json();
        
        // Assertions
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(responseBody.success, 'Response should indicate failure').toBe(false);
        expect(responseBody.error.message).toContain('empty');
    });

    test('[POST] Verify order totals calculation is correct', {
        tag: ["@Regression", "@API", "@CreateOrder"]
    }, async ({ orderController, cartController }) => {
        logger.info('Test: Verify order totals calculation');
        
        // Get cart totals before order
        const cartTotalsResponse = await cartController.getCartTotals();
        const cartTotals = await cartTotalsResponse.json();
        
        // Create order
        const response = await orderController.createOrder(orderData);
        const responseBody = await response.json();
        
        // Assertions
        expect(response.status(), 'Status should be 200').toBe(200);
        expect(responseBody.data.subtotal).toBe(cartTotals.data.subtotal);
        expect(responseBody.data.tax).toBeGreaterThan(0);
        expect(responseBody.data.shipping).toBeGreaterThanOrEqual(0);
        
        const expectedTotal = responseBody.data.subtotal + 
                            responseBody.data.tax + 
                            responseBody.data.shipping;
        expect(responseBody.data.totalAmount).toBe(expectedTotal);
    });

    test.afterEach(async ({ cartController }) => {
        // Cleanup: Clear cart after each test
        await cartController.clearCart();
        logger.info('Cleanup: Cart cleared');
    });
});