import { RequestBuilder } from "./requestBuilder.interface";

export interface AddToCartRequest {
    productId: string;
    quantity: number;
    size?: string;
    color?: string;
}

/**
 * Fluent builder for AddToCartRequest payloads used by CartController.addToCart.
 * Keeps CartController.addToCart's own signature untouched (LSP-safe) while
 * giving tests a readable way to assemble edge-case payloads (e.g. zero
 * quantity, missing size) without hand-rolling object literals per test.
 */
export class CartItemBuilder implements RequestBuilder<AddToCartRequest> {
    private productId = "";
    private quantity = 1;
    private size?: string;
    private color?: string;

    withProductId(productId: string): this {
        this.productId = productId;
        return this;
    }

    withQuantity(quantity: number): this {
        this.quantity = quantity;
        return this;
    }

    withSize(size: string): this {
        this.size = size;
        return this;
    }

    withColor(color: string): this {
        this.color = color;
        return this;
    }

    build(): AddToCartRequest {
        return {
            productId: this.productId,
            quantity: this.quantity,
            ...(this.size !== undefined && { size: this.size }),
            ...(this.color !== undefined && { color: this.color }),
        };
    }
}
