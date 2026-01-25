import { APIRequestContext, APIResponse } from "@playwright/test";
import { APIBase } from "@core/base/apiBase";

/**
 * Controller for managing inventory operations via API.
 * Handles stock checking, inventory level retrieval, updates, and reservation management.
 * @extends APIBase
 */
export class InventoryController extends APIBase {
    private readonly INVENTORY_ENDPOINT = `${this.BASE_URL}/inventory`;

    constructor(request: APIRequestContext) {
        super(request);
    }

    /**
     * Checks the stock availability for a specific product, optionally filtered by size and color variants.
     * @param productId - The unique identifier of the product to check.
     * @param size - Optional size variant to check availability for.
     * @param color - Optional color variant to check availability for.
     * @returns A promise that resolves to the API response containing stock availability information.
     */
    async checkStock(productId: string, size?: string, color?: string): Promise<APIResponse> {
        const params: Record<string, unknown> = { productId };
        if (size) params.size = size;
        if (color) params.color = color;
        
        return await this.get(`${this.INVENTORY_ENDPOINT}/check?${new URLSearchParams(params as Record<string, string>)}`);
    }

    /**
     * Retrieves the current inventory levels for a specific product.
     * @param productId - The unique identifier of the product.
     * @returns A promise that resolves to the API response containing detailed inventory information.
     */
    async getInventoryLevels(productId: string): Promise<APIResponse> {
        return await this.get(`${this.INVENTORY_ENDPOINT}/${productId}`);
    }

    /**
     * Updates the inventory levels for a specific product. Requires admin privileges.
     * @param productId - The unique identifier of the product to update.
     * @param inventoryData - The inventory data to update.
     * @param inventoryData.quantity - The new quantity for the product.
     * @param inventoryData.size - Optional size variant to update.
     * @param inventoryData.color - Optional color variant to update.
     * @returns A promise that resolves to the API response confirming the inventory update.
     */
    async updateInventory(productId: string, inventoryData: {
        quantity: number;
        size?: string;
        color?: string;
    }): Promise<APIResponse> {
        return await this.put(`${this.INVENTORY_ENDPOINT}/${productId}`, { data: inventoryData });
    }

    /**
     * Reserves inventory for a specific product to prevent overselling during checkout.
     * @param reservationData - The reservation details.
     * @param reservationData.productId - The unique identifier of the product to reserve.
     * @param reservationData.quantity - The quantity to reserve.
     * @param reservationData.size - Optional size variant to reserve.
     * @param reservationData.color - Optional color variant to reserve.
     * @returns A promise that resolves to the API response containing the reservation confirmation.
     */
    async reserveInventory(reservationData: {
        productId: string;
        quantity: number;
        size?: string;
        color?: string;
    }): Promise<APIResponse> {
        return await this.post(`${this.INVENTORY_ENDPOINT}/reserve`, { data: reservationData });
    }

    /**
     * Releases a previously created inventory reservation.
     * @param reservationId - The unique identifier of the reservation to release.
     * @returns A promise that resolves to the API response confirming the reservation release.
     */
    async releaseReservation(reservationId: string): Promise<APIResponse> {
        return await this.delete(`${this.INVENTORY_ENDPOINT}/reserve/${reservationId}`);
    }
}