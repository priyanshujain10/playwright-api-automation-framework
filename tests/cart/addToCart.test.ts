import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";
import addToCartData from "@testdata/json/requests/cart/addToCart.json";

test.describe('Cart API - Add to Cart Operations', { tag: ["@Cart", "@POST", "@API"] }, () => {
    
    test('[POST] Verify add item to cart returns 200', {
        tag: ["@Smoke", "@API", "@AddToCart"]
    }, async ({ cartController, productController }) => {
        logger.info('Test: Add item to cart');
        
        // First, get a valid product
        const productsResponse = await productController.getProductById(addToCartData.productId);
        const productsBody = await productsResponse.json();
        const product = productsBody.data;
        
        // Add product to cart
        const cartItem = {
            productId: product.id,
            quantity: 2,
            size: product.variants[0].size,
            color: product.variants[0].color
        };
        
        const response = await cartController.addToCart(cartItem);
        const responseBody = await response.json();
        
        logger.info(`Response: ${JSON.stringify(responseBody, null, 2)}`);
        
        // Assertions
        expect(response.status(), 'Status should be 200').toBe(200);
        expect(responseBody.success, 'Response should be successful').toBe(true);
        expect(responseBody.data.productId).toBe(cartItem.productId);
        expect(responseBody.data.quantity).toBe(cartItem.quantity);
    });

    test('[POST] Verify add same item twice increases quantity', {
        tag: ["@Regression", "@API", "@AddToCart"]
    }, async ({ cartController, productController }) => {
        logger.info('Test: Add same item twice');
        
        // Get a valid product
        const productsResponse = await productController.getAllProducts({ pageSize: 1 });
        const productsBody = await productsResponse.json();
        const product = productsBody.data[0];
        
        const cartItem = {
            productId: product.id,
            quantity: 1,
            size: product.variants[0].size,
            color: product.variants[0].color
        };
        
        // Add item first time
        await cartController.addToCart(cartItem);
        
        // Add same item second time
        await cartController.addToCart(cartItem);
        
        // Get cart to verify
        const cartResponse = await cartController.getCart();
        const cartBody = await cartResponse.json();
        
        // Find the item in cart
        const addedItem = cartBody.data.items.find((item: { productId: string }) => 
            item.productId === cartItem.productId
        );
        
        // Assertions
        expect(addedItem).toBeTruthy();
        expect(addedItem.quantity).toBe(2); // Should be combined
    });

    test('[POST] Verify add item with insufficient stock returns error', {
        tag: ["@Negative", "@API", "@AddToCart"]
    }, async ({ cartController }) => {
        logger.info('Test: Add item with insufficient stock');
        
        const cartItem = {
            productId: "FKPRT-SMSG-GS24-001",
            quantity: 99999, // Unrealistic quantity
            size: "128GB",
            color: "Onyx Black"
        };
        
        const response = await cartController.addToCart(cartItem);
        const responseBody = await response.json();
        
        // Assertions
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(responseBody.success, 'Response should indicate failure').toBe(false);
        expect(responseBody.error.message).toContain('stock');
    });

    test('[POST] Verify add invalid product returns 404', {
        tag: ["@Negative", "@API", "@AddToCart"]
    }, async ({ cartController }) => {
        logger.info('Test: Add invalid product to cart');
        
        const cartItem = {
            productId: "INVALID-PRODUCT-ID",
            quantity: 1,
            size: "128GB",
            color: "Onyx Black"
        };
        
        const response = await cartController.addToCart(cartItem);
        const responseBody = await response.json();
        
        // Assertions
        expect(response.status(), 'Status should be 404').toBe(404);
        expect(responseBody.success, 'Response should indicate failure').toBe(false);
    });
});