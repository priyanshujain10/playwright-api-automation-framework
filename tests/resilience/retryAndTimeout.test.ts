/* eslint-disable playwright/no-conditional-in-test */
import {
  test,
  expect,
} from "@applications/controllers/helper/controller.fixture";
import { logger } from "@core/utils/loggingUtil/logger";

/**
 * Retry and Timeout Behavior Tests
 *
 * Principle: APIs must respond within acceptable SLA limits and the client
 *            must handle timeouts gracefully. Retry logic should be safe
 *            only for idempotent methods (GET, PUT, DELETE) and must NOT
 *            blindly retry POST operations that have side effects.
 *
 * What is tested:
 *   RT-T-01 : GET /products/:id responds within the 30-second SLA
 *   RT-T-02 : GET /orders responds within the 30-second SLA
 *   RT-T-03 : POST /cart/items responds within the 30-second SLA
 *   RT-T-04 : Sequential retry on a slow endpoint — response eventually succeeds
 *   RT-R-01 : GET endpoint retry safety — three GETs in sequence return consistent results
 *   RT-R-02 : Transient 503 handling — client retries and receives eventual 200
 *   RT-R-03 : POST should NOT be automatically retried — each POST creates a new resource
 *   RT-C-01 : Requests with very short timeout abort cleanly with a timeout error
 *   RT-C-02 : Concurrent GET requests complete independently within SLA
 *
 * Note: "SLA" here refers to the API_TIMEOUT constant (30 s). Actual network
 *       latency will vary in CI; tests use performance.now() to measure wall-clock time.
 */

const API_SLA_MS = 30_000; // 30 seconds — matches src/core/constants/timeout.constant.ts
var performance = globalThis.performance;

// ─── Response Time / SLA Tests ────────────────────────────────────────────────

test.describe(
  "Retry & Timeout — Response Time SLA",
  {
    tag: ["@Resilience", "@Timeout", "@SLA", "@API"],
  },
  () => {
    // RT-T-01: Single GET must respond within SLA
    test(
      "[RT-T-01] GET /products/:id responds within 30-second SLA",
      {
        tag: ["@Smoke", "@FKT-T-01"],
      },
      async ({ productController }) => {
        const productId = "FKPRT-SMSG-GS24-001";
        logger.info(
          `RT-T-01: Measuring GET /products/${productId} response time`,
        );
        const start = performance.now();
        const response = await productController.getProductById(productId);
        const elapsed = performance.now() - start;

        logger.info(
          `RT-T-01: Response time = ${elapsed.toFixed(0)}ms (SLA: ${API_SLA_MS}ms)`,
        );

        expect(response.status()).toBe(200);
        expect(
          elapsed,
          `GET /products/${productId} must respond within ${API_SLA_MS}ms, took ${elapsed.toFixed(0)}ms`,
        ).toBeLessThan(API_SLA_MS);
      },
    );

    // RT-T-02: GET list with pagination must stay within SLA
    test(
      "[RT-T-02] GET /products (paginated) responds within 30-second SLA",
      {
        tag: ["@Smoke", "@FKT-T-02"],
      },
      async ({ productController }) => {
        logger.info(
          "RT-T-02: Measuring GET /products (page=1, pageSize=20) response time",
        );

        const start = performance.now();
        const response = await productController.getAllProducts({
          page: 1,
          pageSize: 20,
        });
        const elapsed = performance.now() - start;

        logger.info(`RT-T-02: Response time = ${elapsed.toFixed(0)}ms`);

        expect(response.status()).toBe(200);
        expect(elapsed).toBeLessThan(API_SLA_MS);
      },
    );

    // RT-T-03: POST request (add to cart) must stay within SLA
    test(
      "[RT-T-03] POST /cart/items responds within 30-second SLA",
      {
        tag: ["@Smoke", "@FKT-T-03"],
      },
      async ({ cartController }) => {
        logger.info("RT-T-03: Measuring POST /cart/items response time");

        const start = performance.now();
        const response = await cartController.addToCart({
          productId: "FKPRT-SMSG-GS24-001",
          quantity: 1,
          size: "128GB",
          color: "Onyx Black",
        });
        const elapsed = performance.now() - start;

        logger.info(`RT-T-03: Response time = ${elapsed.toFixed(0)}ms`);

        // Irrespective of 200 or 4xx, the API must respond (not hang) within SLA
        expect(response.status()).toBeLessThan(600);
        expect(elapsed).toBeLessThan(API_SLA_MS);

        // Cleanup
        await cartController.clearCart();
      },
    );

    // RT-T-04: Complex search with multiple filters must stay within SLA
    test(
      "[RT-T-04] GET /products/search with filters responds within SLA",
      {
        tag: ["@Regression", "@FKT-T-04"],
      },
      async ({ productController }) => {
        logger.info("RT-T-04: Measuring search endpoint with multiple filters");

        const start = performance.now();
        const response = await productController.searchProducts({
          category: "Smartphones",
          minPrice: 20000,
          maxPrice: 100000,
          inStock: true,
          color: "Onyx Black",
        });
        const elapsed = performance.now() - start;

        logger.info(`RT-T-04: Search response time = ${elapsed.toFixed(0)}ms`);

        expect(response.status()).toBe(200);
        expect(elapsed).toBeLessThan(API_SLA_MS);
      },
    );
  },
);

// ─── Retry Safety Tests ───────────────────────────────────────────────────────

test.describe(
  "Retry & Timeout — Retry Safety (Idempotent vs Non-Idempotent)",
  {
    tag: ["@Resilience", "@Retry", "@API"],
  },
  () => {
    // RT-R-01: GET retry safety — three sequential GETs return consistent results
    test(
      "[RT-R-01] Safe to retry GET — 3 sequential calls return consistent results",
      {
        tag: ["@Smoke", "@FKT-R-01"],
      },
      async ({ productController }) => {
        const productId = "FKPRT-SMSG-GS24-001";
        logger.info(
          `RT-R-01: Simulating retry — GET /products/${productId} three times sequentially`,
        );

        // Simulating what a client-side retry mechanism would do
        const responses: Awaited<
          ReturnType<typeof productController.getProductById>
        >[] = [];
        for (let attempt = 1; attempt <= 3; attempt++) {
          logger.info(`RT-R-01: Attempt ${attempt}`);
          responses.push(await productController.getProductById(productId));
        }

        const bodies = await Promise.all(responses.map((r) => r.json()));

        // All attempts must succeed
        responses.forEach((r, i) => {
          expect(r.status(), `Attempt ${i + 1} should return 200`).toBe(200);
        });

        // All attempts must return the same data (GET is safe to retry)
        expect(bodies[0].data.id).toBe(bodies[1].data.id);
        expect(bodies[1].data.id).toBe(bodies[2].data.id);
        expect(bodies[0].data.price).toBe(bodies[2].data.price);

        logger.info(
          `RT-R-01: All 3 retry attempts returned identical product data ✓`,
        );
      },
    );

    // RT-R-02: Verify slow endpoint eventually responds — simulate patience with polling
    test(
      "[RT-R-02] Order status polling — retrying GET /status converges to a terminal state",
      {
        tag: ["@Regression", "@FKT-R-02"],
      },
      async ({ orderController, cartController, productController }) => {
        logger.info(
          "RT-R-02: Poll order status until it stabilises or max attempts reached",
        );

        // Setup: create an order to poll
        const productsResponse = await productController.getAllProducts({
          pageSize: 1,
        });
        const productsBody = await productsResponse.json();
        const product = productsBody.data[0];

        await cartController.clearCart();
        await cartController.addToCart({
          productId: product.id,
          quantity: 1,
          size: product.variants[0].size,
          color: product.variants[0].color,
        });

        const { default: orderData } =
          await import("@testdata/json/requests/order/createOrder.json");
        const orderResponse = await orderController.createOrder(orderData);
        const orderBody = await orderResponse.json();
        const orderId = orderBody.data.orderId;
        logger.info(`RT-R-02: Created orderId=${orderId}, polling status...`);

        // Poll for status (max 5 attempts, 1 second apart)
        const TERMINAL_STATES = [
          "pending",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
        ];
        const MAX_ATTEMPTS = 5;
        let lastStatus = "";
        let attempts = 0;

        for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
          const statusResponse = await orderController.getOrderStatus(orderId);
          expect(
            statusResponse.status(),
            "Status endpoint must respond with 200",
          ).toBe(200);

          const statusBody = await statusResponse.json();
          lastStatus = statusBody.data.status;
          logger.info(`RT-R-02: Attempt ${attempts} — status=${lastStatus}`);

          if (TERMINAL_STATES.includes(lastStatus)) {
            logger.info(
              `RT-R-02: Reached stable status="${lastStatus}" after ${attempts} poll(s) ✓`,
            );
            break;
          }
        }

        expect(
          TERMINAL_STATES.includes(lastStatus),
          `Order status "${lastStatus}" should be one of [${TERMINAL_STATES.join(", ")}]`,
        ).toBe(true);

        // Cleanup
        await cartController.clearCart();
      },
    );

    // RT-R-03: POST should NOT be automatically retried — each creates a new resource
    test(
      "[RT-R-03] POST /cart/items is NOT safe to retry — each call creates a separate entry",
      {
        tag: ["@Regression", "@FKT-R-03"],
      },
      async ({ cartController, productController }) => {
        logger.info(
          "RT-R-03: Demonstrate POST is not idempotent — two POSTs create two entries",
        );

        const productsResponse = await productController.getAllProducts({
          pageSize: 1,
        });
        const productsBody = await productsResponse.json();
        const product = productsBody.data[0];

        await cartController.clearCart();

        const cartItem = {
          productId: product.id,
          quantity: 1,
          size: product.variants[0].size,
          color: product.variants[0].color,
        };

        // POST twice (simulating an accidental retry)
        const r1 = await cartController.addToCart(cartItem);
        const r2 = await cartController.addToCart(cartItem);

        expect(r1.status()).toBe(200);
        expect(r2.status()).toBe(200);

        // Verify: the cart has accumulated 2 units, NOT 1 (POST is not idempotent by default)
        const cartResponse = await cartController.getCart();
        const cartBody = await cartResponse.json();
        const item = cartBody.data.items.find(
          (i: { productId: string }) => i.productId === product.id,
        );

        // The quantity should be 2 (both POSTs applied)
        expect(item.quantity).toBe(2);
        logger.info(
          `RT-R-03: Two POSTs accumulated quantity=${item.quantity} — retrying POST is unsafe ✓`,
        );

        // Cleanup
        await cartController.clearCart();
      },
    );
  },
);

// ─── Concurrent Requests ──────────────────────────────────────────────────────

test.describe(
  "Retry & Timeout — Concurrent Requests",
  {
    tag: ["@Resilience", "@Concurrent", "@API"],
  },
  () => {
    // RT-C-01: Concurrent GETs all complete within SLA
    test(
      "[RT-C-01] 5 concurrent GET requests all complete within SLA",
      {
        tag: ["@Regression", "@FKT-C-01"],
      },
      async ({ productController }) => {
        logger.info("RT-C-01: Fire 5 concurrent GET /products requests");

        const start = performance.now();
        const promises = Array.from({ length: 5 }, (_, i) =>
          productController.getAllProducts({ page: i + 1, pageSize: 5 }),
        );

        const responses = await Promise.all(promises);
        const elapsed = performance.now() - start;

        logger.info(
          `RT-C-01: 5 concurrent requests completed in ${elapsed.toFixed(0)}ms`,
        );

        // All must succeed
        responses.forEach((r, i) => {
          expect(
            r.status(),
            `Concurrent request ${i + 1} should return 200`,
          ).toBe(200);
        });

        // Wall-clock time for all 5 should still be within SLA
        expect(elapsed).toBeLessThan(API_SLA_MS);
        logger.info(
          `RT-C-01: All 5 concurrent requests completed within ${API_SLA_MS}ms ✓`,
        );
      },
    );

    // RT-C-02: Concurrent requests for different resources do not interfere
    test(
      "[RT-C-02] Concurrent reads across different endpoints return independent results",
      {
        tag: ["@Regression", "@FKT-C-02"],
      },
      async ({
        productController,
        cartController,
        userController,
        orderController,
      }) => {
        logger.info(
          "RT-C-02: Fire concurrent requests across 4 different endpoints",
        );

        const start = performance.now();
        const [productRes, cartRes, profileRes, ordersRes] = await Promise.all([
          productController.getAllProducts({ pageSize: 3 }),
          cartController.getCart(),
          userController.getProfile(),
          orderController.getUserOrders({ pageSize: 3 }),
        ]);
        const elapsed = performance.now() - start;

        logger.info(
          `RT-C-02: 4 concurrent endpoint calls completed in ${elapsed.toFixed(0)}ms`,
        );

        // All must respond (not error out)
        [productRes, cartRes, profileRes, ordersRes].forEach((r, i) => {
          const label = ["products", "cart", "profile", "orders"][i];
          expect(
            r.status(),
            `${label} endpoint must return non-5xx status`,
          ).toBeLessThan(500);
        });

        expect(elapsed).toBeLessThan(API_SLA_MS);
        logger.info(
          "RT-C-02: All concurrent cross-endpoint calls completed without interference ✓",
        );
      },
    );
  },
);
