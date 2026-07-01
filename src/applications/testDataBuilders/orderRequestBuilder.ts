import { Address } from "@applications/controllers/helper/interfaces/apiContracts.types";
import { RequestBuilder } from "./requestBuilder.interface";

export interface CreateOrderRequest {
    shippingAddress: Address;
    billingAddress: Address;
    paymentMethod: string;
    shippingMethod: string;
}

const DEFAULT_ADDRESS: Address = {
    firstName: "Rahul",
    lastName: "Sharma",
    addressLine1: "Flat 4B, Prestige Towers",
    addressLine2: "MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    zipCode: "560001",
    country: "IN",
    phone: "+91-98765-43210",
};

/**
 * Fluent builder for CreateOrderRequest payloads. Centralizes valid
 * defaults so individual tests only override the fields relevant to
 * their scenario instead of duplicating full JSON payloads.
 */
export class OrderRequestBuilder implements RequestBuilder<CreateOrderRequest> {
    private shippingAddress: Address = { ...DEFAULT_ADDRESS };
    private billingAddress: Address = { ...DEFAULT_ADDRESS };
    private paymentMethod = "UPI";
    private shippingMethod = "standard";

    withShippingAddress(address: Partial<Address>): this {
        this.shippingAddress = { ...this.shippingAddress, ...address };
        return this;
    }

    withBillingAddress(address: Partial<Address>): this {
        this.billingAddress = { ...this.billingAddress, ...address };
        return this;
    }

    withPaymentMethod(paymentMethod: string): this {
        this.paymentMethod = paymentMethod;
        return this;
    }

    withShippingMethod(shippingMethod: string): this {
        this.shippingMethod = shippingMethod;
        return this;
    }

    build(): CreateOrderRequest {
        return {
            shippingAddress: this.shippingAddress,
            billingAddress: this.billingAddress,
            paymentMethod: this.paymentMethod,
            shippingMethod: this.shippingMethod,
        };
    }
}
