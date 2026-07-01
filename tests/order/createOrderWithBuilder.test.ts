import { test, expect } from "@applications/controllers/helper/controller.fixture";
import { OrderRequestBuilder } from "@applications/testDataBuilders/orderRequestBuilder";
import { CartItemBuilder } from "@applications/testDataBuilders/cartItemBuilder";
import { TestReporter } from "@core/reporting/testReporter";
import { WinstonReportingAdapter } from "@core/reporting/winstonReportingAdapter";

// Demonstrates the builder pattern for scenario-specific payloads (a
// shipping address in a different state) and the DIP-based TestReporter,
// as alternatives to the hand-written JSON fixture used by createOrder.test.ts.
const reporter = new TestReporter([new WinstonReportingAdapter()]);

test.describe('Order API - Create Order with Test Data Builders', { tag: ["@Order", "@POST", "@API"] }, () => {

    test('[POST] Verify create order with a custom shipping address built via OrderRequestBuilder', {
        tag: ["@Regression", "@API", "@CreateOrder"]
    }, async ({ orderController, cartController, productController }) => {
        const productsResponse = await productController.getAllProducts({ pageSize: 1 });
        const productsBody = await productsResponse.json();
        const product = productsBody.data[0];

        await cartController.clearCart();
        await cartController.addToCart(
            new CartItemBuilder()
                .withProductId(product.id)
                .withQuantity(1)
                .withSize(product.variants[0].size)
                .withColor(product.variants[0].color)
                .build()
        );

        const orderRequest = new OrderRequestBuilder()
            .withShippingAddress({ city: "Mumbai", state: "Maharashtra", zipCode: "400001" })
            .withShippingMethod("express")
            .build();

        await reporter.log('Creating order with builder-generated payload', { orderRequest });

        // OrderRequestBuilder returns typed Address objects; createOrder accepts the
        // looser Record<string, unknown> shape used across all controllers for payloads.
        const response = await orderController.createOrder(orderRequest as unknown as Parameters<typeof orderController.createOrder>[0]);
        const responseBody = await response.json();

        expect(response.status(), 'Status should be 200').toBe(200);
        expect(responseBody.data.shippingAddress.city).toBe('Mumbai');

        await cartController.clearCart();
    });
});
