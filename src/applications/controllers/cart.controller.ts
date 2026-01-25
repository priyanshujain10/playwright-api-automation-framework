import { APIRequestContext, APIResponse } from "@playwright/test";
import { APIBase } from "@core/base/apiBase";

/**
 * Controller for managing shopping cart operations via API.
 * Provides methods to interact with cart endpoints including adding items,
 * updating quantities, applying coupons, and managing cart contents.
 * @extends APIBase
 */
export class CartController extends APIBase {
    private readonly CART_ENDPOINT = `${this.BASE_URL}/cart`;
    private readonly CART_ITEMS_ENDPOINT = `${this.BASE_URL}/cart/items`;

    constructor(request: APIRequestContext) {
        super(request);
    }

    /**
     * Retrieves the current user's shopping cart details.
     * @returns A promise that resolves to the API response containing cart information including items, quantities, and totals.
     */
    async getCart(): Promise<APIResponse> {
        return await this.get(this.CART_ENDPOINT);
    }

    /**
     * Adds an item to the user's shopping cart.
     * @param itemData - The item details to add to the cart.
     * @param itemData.productId - The unique identifier of the product.
     * @param itemData.quantity - The quantity of the product to add.
     * @param itemData.size - Optional size variant of the product.
     * @param itemData.color - Optional color variant of the product.
     * @returns A promise that resolves to the API response confirming the item addition.
     */
    async addToCart(itemData: { 
        productId: string; 
        quantity: number; 
        size?: string; 
        color?: string;
    }): Promise<APIResponse> {
        return await this.post(this.CART_ITEMS_ENDPOINT, { data: itemData });
    }

    /**
     * Updates the quantity of a specific item in the cart.
     * @param itemId - The unique identifier of the cart item to update.
     * @param quantity - The new quantity for the cart item.
     * @returns A promise that resolves to the API response confirming the update.
     */
    async updateCartItem(itemId: string, quantity: number): Promise<APIResponse> {
        return await this.put(`${this.CART_ITEMS_ENDPOINT}/${itemId}`, { 
            data: { quantity } 
        });
    }

    /**
     * Removes a specific item from the user's shopping cart.
     * @param itemId - The unique identifier of the cart item to remove.
     * @returns A promise that resolves to the API response confirming the removal.
     */
    async removeFromCart(itemId: string): Promise<APIResponse> {
        return await this.delete(`${this.CART_ITEMS_ENDPOINT}/${itemId}`);
    }

    /**
     * Clears all items from the user's shopping cart.
     * @returns A promise that resolves to the API response confirming the cart has been cleared.
     */
    async clearCart(): Promise<APIResponse> {
        return await this.delete(this.CART_ENDPOINT);
    }

    /**
     * Applies a coupon code to the user's cart for discounts.
     * @param couponCode - The coupon code to apply to the cart.
     * @returns A promise that resolves to the API response confirming the coupon application.
     */
    async applyCoupon(couponCode: string): Promise<APIResponse> {
        return await this.post(`${this.CART_ENDPOINT}/coupon`, { 
            data: { code: couponCode } 
        });
    }

    /**
     * Removes the applied coupon from the user's cart.
     * @returns A promise that resolves to the API response confirming the coupon removal.
     */
    async removeCoupon(): Promise<APIResponse> {
        return await this.delete(`${this.CART_ENDPOINT}/coupon`);
    }

    /**
     * Retrieves the calculated totals for the user's cart including subtotal, tax, discounts, and total amount.
     * @returns A promise that resolves to the API response containing cart totals information.
     */
    async getCartTotals(): Promise<APIResponse> {
        return await this.get(`${this.CART_ENDPOINT}/totals`);
    }
}