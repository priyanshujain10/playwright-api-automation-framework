import { test as baseTest } from "@playwright/test";
import { ProductController } from "../product.controller";
import { CartController } from "../cart.controller";
import { OrderController } from "../order.controller";
import { UserController } from "../user.controller";
import { PaymentController } from "../payment.controller";
import { InventoryController } from "../inventory.controller";
import { ExerciseProductsController } from "../uiApiSync/exerciseProducts.controller";

export type APIFixtures = {
    productController: ProductController;
    cartController: CartController;
    orderController: OrderController;
    userController: UserController;
    paymentController: PaymentController;
    inventoryController: InventoryController;
    exerciseProductsController: ExerciseProductsController;
};

export const test = baseTest.extend<APIFixtures>({
    productController: async ({ request }, use) => {
        await use(new ProductController(request));
    },
    cartController: async ({ request }, use) => {
        await use(new CartController(request));
    },
    orderController: async ({ request }, use) => {
        await use(new OrderController(request));
    },
    userController: async ({ request }, use) => {
        await use(new UserController(request));
    },
    paymentController: async ({ request }, use) => {
        await use(new PaymentController(request));
    },
    inventoryController: async ({ request }, use) => {
        await use(new InventoryController(request));
    },
    exerciseProductsController: async ({ request }, use) => {
        await use(new ExerciseProductsController(request));
    },
});

export { expect } from '@playwright/test';