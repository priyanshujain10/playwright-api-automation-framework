import { APIRequestContext, APIResponse } from "@playwright/test";
import { APIBase } from "@core/base/apiBase";

/**
 * Controller for managing payment operations via API.
 * Handles payment methods, processing payments, refunds, and payment status tracking.
 * @extends APIBase
 */
export class PaymentController extends APIBase {
    private readonly PAYMENT_ENDPOINT = `${this.BASE_URL}/payments`;
    private readonly PAYMENT_METHODS_ENDPOINT = `${this.BASE_URL}/payments/methods`;

    constructor(request: APIRequestContext) {
        super(request);
    }

    /**
     * Retrieves all saved payment methods for the current user.
     * @returns A promise that resolves to the API response containing the list of payment methods.
     */
    async getPaymentMethods(): Promise<APIResponse> {
        return await this.get(this.PAYMENT_METHODS_ENDPOINT);
    }

    /**
     * Adds a new payment method for the current user.
     * @param paymentData - The payment method details to add.
     * @param paymentData.type - The type of payment method (e.g., 'credit_card').
     * @param paymentData.cardNumber - The card number (for card payments).
     * @param paymentData.expiryDate - The card expiry date (for card payments).
     * @param paymentData.cvv - The card CVV (for card payments).
     * @param paymentData.cardholderName - The cardholder name (for card payments).
     * @returns A promise that resolves to the API response confirming the payment method addition.
     */
    async addPaymentMethod(paymentData: {
        type: string;
        cardNumber?: string;
        expiryDate?: string;
        cvv?: string;
        cardholderName?: string;
    }): Promise<APIResponse> {
        return await this.post(this.PAYMENT_METHODS_ENDPOINT, { data: paymentData });
    }

    /**
     * Deletes a saved payment method for the current user.
     * @param methodId - The unique identifier of the payment method to delete.
     * @returns A promise that resolves to the API response confirming the payment method deletion.
     */
    async deletePaymentMethod(methodId: string): Promise<APIResponse> {
        return await this.delete(`${this.PAYMENT_METHODS_ENDPOINT}/${methodId}`);
    }

    /**
     * Processes a payment for an order using a saved payment method.
     * @param paymentData - The payment processing details.
     * @param paymentData.orderId - The unique identifier of the order to pay for.
     * @param paymentData.paymentMethodId - The unique identifier of the payment method to use.
     * @param paymentData.amount - The amount to charge.
     * @returns A promise that resolves to the API response containing the payment confirmation.
     */
    async processPayment(paymentData: {
        orderId: string;
        paymentMethodId: string;
        amount: number;
    }): Promise<APIResponse> {
        return await this.post(this.PAYMENT_ENDPOINT, { data: paymentData });
    }

    /**
     * Retrieves the current status of a specific payment.
     * @param paymentId - The unique identifier of the payment.
     * @returns A promise that resolves to the API response containing the payment status.
     */
    async getPaymentStatus(paymentId: string): Promise<APIResponse> {
        return await this.get(`${this.PAYMENT_ENDPOINT}/${paymentId}/status`);
    }

    /**
     * Processes a refund for a completed payment, optionally for a partial amount.
     * @param paymentId - The unique identifier of the payment to refund.
     * @param amount - Optional partial refund amount. If not provided, full refund is processed.
     * @returns A promise that resolves to the API response containing the refund confirmation.
     */
    async refundPayment(paymentId: string, amount?: number): Promise<APIResponse> {
        return await this.post(`${this.PAYMENT_ENDPOINT}/${paymentId}/refund`, {
            data: { amount }
        });
    }
}