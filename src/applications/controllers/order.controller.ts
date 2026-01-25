import { APIRequestContext, APIResponse } from "@playwright/test";
import { APIBase } from "@core/base/apiBase";
import { RequestBuilderUtility } from "../controllers/helper/requestBuilder.utitlity";

/**
 * Controller for managing order operations via API.
 * Provides functionality for creating orders, retrieving order details,
 * managing order status, tracking, and handling returns.
 * @extends APIBase
 */
export class OrderController extends APIBase {
    private readonly ORDERS_ENDPOINT = `${this.BASE_URL}/orders`;
    private readonly ORDER_BY_ID_ENDPOINT = `${this.BASE_URL}/orders`;

    constructor(request: APIRequestContext) {
        super(request);
    }

    /**
     * Creates a new order with the provided shipping, billing, and payment details.
     * @param orderData - The order creation data.
     * @param orderData.shippingAddress - The shipping address for the order.
     * @param orderData.billingAddress - The billing address for the order.
     * @param orderData.paymentMethod - The payment method identifier.
     * @param orderData.shippingMethod - The shipping method identifier.
     * @returns A promise that resolves to the API response containing the created order details.
     */
    async createOrder(orderData: {
        shippingAddress: Record<string, unknown>;
        billingAddress: Record<string, unknown>;
        paymentMethod: string;
        shippingMethod: string;
    }): Promise<APIResponse> {
        return await this.post(this.ORDERS_ENDPOINT, { data: orderData });
    }

    /**
     * Retrieves detailed information for a specific order by its ID.
     * @param orderId - The unique identifier of the order to retrieve.
     * @returns A promise that resolves to the API response containing the order details.
     */
    async getOrderById(orderId: string): Promise<APIResponse> {
        return await this.get(`${this.ORDER_BY_ID_ENDPOINT}/${orderId}`);
    }

    /**
     * Retrieves a paginated list of orders for the current user, optionally filtered by status.
     * @param params - Optional query parameters for filtering and pagination.
     * @param params.page - The page number for pagination (default: 1).
     * @param params.pageSize - The number of orders per page.
     * @param params.status - Filter orders by status (e.g., 'pending', 'shipped').
     * @returns A promise that resolves to the API response containing the list of user orders.
     */
    async getUserOrders(params?: { 
        page?: number; 
        pageSize?: number; 
        status?: string;
    }): Promise<APIResponse> {
        const queryString = params ? `?${RequestBuilderUtility.buildQueryParams(params)}` : '';
        return await this.get(`${this.ORDERS_ENDPOINT}${queryString}`);
    }

    /**
     * Cancels an existing order with an optional cancellation reason.
     * @param orderId - The unique identifier of the order to cancel.
     * @param reason - Optional reason for cancelling the order.
     * @returns A promise that resolves to the API response confirming the order cancellation.
     */
    async cancelOrder(orderId: string, reason?: string): Promise<APIResponse> {
        return await this.post(`${this.ORDER_BY_ID_ENDPOINT}/${orderId}/cancel`, {
            data: { reason }
        });
    }

    /**
     * Retrieves the current status of a specific order.
     * @param orderId - The unique identifier of the order.
     * @returns A promise that resolves to the API response containing the order status.
     */
    async getOrderStatus(orderId: string): Promise<APIResponse> {
        return await this.get(`${this.ORDER_BY_ID_ENDPOINT}/${orderId}/status`);
    }

    /**
     * Retrieves tracking information for a shipped order.
     * @param orderId - The unique identifier of the order.
     * @returns A promise that resolves to the API response containing tracking details.
     */
    async getOrderTracking(orderId: string): Promise<APIResponse> {
        return await this.get(`${this.ORDER_BY_ID_ENDPOINT}/${orderId}/tracking`);
    }

    /**
     * Initiates a return request for items from an order.
     * @param orderId - The unique identifier of the order.
     * @param returnData - The return request details.
     * @param returnData.items - Array of items to return with their quantities and reasons.
     * @returns A promise that resolves to the API response containing the return request confirmation.
     */
    async requestReturn(orderId: string, returnData: {
        items: Array<{ itemId: string; quantity: number; reason: string }>;
    }): Promise<APIResponse> {
        return await this.post(`${this.ORDER_BY_ID_ENDPOINT}/${orderId}/return`, {
            data: returnData
        });
    }
}