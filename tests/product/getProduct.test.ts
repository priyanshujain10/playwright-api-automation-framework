import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { ExpectUtil } from "@core/utils/expectUtil";
import { logger } from "@core/utils/loggingUtil/logger";
import productSchema from "@testdata/json/expectedSchemas/productSchema.json";

test.describe('Product API - GET Operations', { tag: ["@Product", "@GET", "@API"] }, () => {
    
    test('[GET] Verify get all products returns 200', { 
        tag: ["@Smoke", "@API", "@GetAllProducts"] 
    }, async ({ productController }) => {
        logger.info('Test: Get all products');
        
        const response = await productController.getAllProducts();
        const responseBody = await response.json();
        
        logger.info(`Response status: ${response.status()}`);
        logger.info(`Response body: ${JSON.stringify(responseBody, null, 2)}`);
        
        // Assertions
        expect(response.status(), 'Status should be 200').toBe(200);
        expect(responseBody.success, 'Response should be successful').toBe(true);
        expect(responseBody.data).toBeInstanceOf(Array);
        expect(responseBody.data.length).toBeGreaterThan(0);
    });

    test('[GET] Verify get product by ID returns correct data', {
        tag: ["@Smoke", "@API", "@GetProductById"]
    }, async ({ productController }) => {
        const productId = "FKPRT-SMSG-GS24-001";
        logger.info(`Test: Get product by ID: ${productId}`);
        
        const response = await productController.getProductById(productId);
        const responseBody = await response.json();
        
        // Assertions
        expect(response.status(), 'Status should be 200').toBe(200);
        expect(responseBody.success, 'Response should be successful').toBe(true);
        
        // Validate schema
        ExpectUtil.expectToMatchSchema(
            responseBody.data,
            productSchema,
            'Product response should match schema'
        );
        
        // Validate specific fields
        expect(responseBody.data.id).toBe(productId);
        expect(responseBody.data.name).toBeTruthy();
        expect(responseBody.data.price).toBeGreaterThan(0);
    });

    test('[GET] Verify get product with invalid ID returns 404', {
        tag: ["@Negative", "@API", "@GetProductById"]
    }, async ({ productController }) => {
        const invalidId = "INVALID-ID-12345";
        logger.info(`Test: Get product with invalid ID: ${invalidId}`);
        
        const response = await productController.getProductById(invalidId);
        const responseBody = await response.json();
        
        // Assertions
        expect(response.status(), 'Status should be 404').toBe(404);
        expect(responseBody.success, 'Response should indicate failure').toBe(false);
        expect(responseBody.error).toBeTruthy();
        expect(responseBody.error.message).toContain('not found');
    });

    test('[GET] Verify search products by category', {
        tag: ["@Regression", "@API", "@SearchProducts"]
    }, async ({ productController }) => {
        const searchParams = {
            category: "Smartphones",
            minPrice: 20000,
            maxPrice: 100000,
            inStock: true
        };
        
        logger.info(`Test: Search products with params: ${JSON.stringify(searchParams)}`);
        
        const response = await productController.searchProducts(searchParams);
        const responseBody = await response.json();
        
        // Assertions
        expect(response.status(), 'Status should be 200').toBe(200);
        expect(responseBody.data).toBeInstanceOf(Array);
        
        // Validate all returned products match criteria
        for (const product of responseBody.data) {
            expect(product.category).toBe(searchParams.category);
            expect(product.price).toBeGreaterThanOrEqual(searchParams.minPrice);
            expect(product.price).toBeLessThanOrEqual(searchParams.maxPrice);
            expect(product.variants.some((v: unknown) => (v as { quantity: number }).quantity > 0)).toBe(true);
        }
    });

    test('[GET] Verify pagination works correctly', {
        tag: ["@Regression", "@API", "@Pagination"]
    }, async ({ productController }) => {
        const page = 1;
        const pageSize = 10;
        
        logger.info(`Test: Get products with pagination - page: ${page}, pageSize: ${pageSize}`);
        
        const response = await productController.getAllProducts({ page, pageSize });
        const responseBody = await response.json();
        
        // Assertions
        expect(response.status(), 'Status should be 200').toBe(200);
        expect(responseBody.data).toBeInstanceOf(Array);
        expect(responseBody.data.length).toBeLessThanOrEqual(pageSize);
        expect(responseBody.pagination).toBeTruthy();
        expect(responseBody.pagination.currentPage).toBe(page);
        expect(responseBody.pagination.pageSize).toBe(pageSize);
        expect(responseBody.pagination.totalItems).toBeGreaterThan(0);
    });
});